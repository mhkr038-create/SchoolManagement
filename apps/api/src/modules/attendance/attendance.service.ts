import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { BatchAttendanceDto } from './dto/batch-attendance.dto';
import { LockAttendanceDto } from './dto/lock-attendance.dto';
import { CorrectAttendanceDto } from './dto/correct-attendance.dto';
import {
  AttendanceSheetResponse,
  AttendanceRecordItem,
  MonthlyAttendanceReportResponse,
  MonthlyStudentAttendance,
  AttendanceStatus
} from '@school/types';

function parseDateOnly(dateStr: string): Date {
  const parts = dateStr.split('-');
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  return new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
}

@Injectable()
export class AttendanceService {
  constructor(private prisma: PrismaService) {}

  /**
   * Fetch daily attendance sheet for a class, section, and date
   */
  async getAttendanceSheet(
    schoolId: string,
    classId: string,
    sectionId: string,
    dateStr: string
  ): Promise<AttendanceSheetResponse> {
    const targetDate = parseDateOnly(dateStr);

    const [targetClass, targetSection, activeYear] = await Promise.all([
      this.prisma.class.findFirst({ where: { id: classId, schoolId } }),
      this.prisma.section.findFirst({ where: { id: sectionId, schoolId } }),
      this.prisma.academicYear.findFirst({ where: { schoolId, isCurrent: true } })
    ]);

    if (!targetClass) {
      throw new NotFoundException('Class not found');
    }
    if (!targetSection) {
      throw new NotFoundException('Section not found');
    }
    if (!activeYear) {
      throw new BadRequestException('No active academic year found for this school');
    }

    // Get all actively enrolled students in this class and section
    const enrollments = await this.prisma.studentEnrollment.findMany({
      where: {
        schoolId,
        classId,
        sectionId,
        academicYearId: activeYear.id,
        status: 'ENROLLED',
        student: {
          deletedAt: null,
          status: 'ACTIVE'
        }
      },
      include: {
        student: true
      },
      orderBy: [
        { rollNumber: 'asc' },
        { student: { firstName: 'asc' } }
      ]
    });

    // Fetch existing attendance records for this date
    const existingRecords = await this.prisma.attendanceRecord.findMany({
      where: {
        schoolId,
        classId,
        sectionId,
        date: targetDate
      }
    });

    const recordMap = new Map<string, (typeof existingRecords)[0]>();
    let isSheetLocked = false;
    let sheetLockedAt: string | null = null;

    for (const rec of existingRecords) {
      recordMap.set(rec.studentId, rec);
      if (rec.isLocked) {
        isSheetLocked = true;
        sheetLockedAt = rec.lockedAt ? rec.lockedAt.toISOString() : null;
      }
    }

    let presentCount = 0;
    let absentCount = 0;
    let lateCount = 0;
    let halfDayCount = 0;
    let excusedCount = 0;

    const items: AttendanceRecordItem[] = enrollments.map((enr) => {
      const rec = recordMap.get(enr.studentId);
      const status = (rec?.status as AttendanceStatus) || 'PENDING';

      if (status === 'PRESENT') presentCount++;
      else if (status === 'ABSENT') absentCount++;
      else if (status === 'LATE') lateCount++;
      else if (status === 'HALF_DAY') halfDayCount++;
      else if (status === 'EXCUSED_LEAVE') excusedCount++;

      return {
        id: rec?.id,
        studentId: enr.student.id,
        studentName: `${enr.student.firstName} ${enr.student.lastName}`,
        admissionNumber: enr.student.admissionNumber,
        rollNumber: enr.rollNumber,
        status,
        remarks: rec?.remarks || '',
        isLocked: rec?.isLocked || false
      };
    });

    const totalStudents = enrollments.length;
    const totalMarked = presentCount + absentCount + lateCount + halfDayCount + excusedCount;
    const attendancePercentage =
      totalMarked > 0
        ? Math.round(((presentCount + lateCount + halfDayCount * 0.5) / totalMarked) * 1000) / 10
        : 0;

    return {
      classId: targetClass.id,
      className: targetClass.name,
      sectionId: targetSection.id,
      sectionName: targetSection.name,
      date: dateStr,
      isLocked: isSheetLocked,
      lockedAt: sheetLockedAt,
      summary: {
        totalStudents,
        presentCount,
        absentCount,
        lateCount,
        halfDayCount,
        excusedCount,
        attendancePercentage
      },
      records: items
    };
  }

  /**
   * Batch mark daily attendance for a class and section
   */
  async batchMarkAttendance(
    schoolId: string,
    markerUserId: string,
    dto: BatchAttendanceDto
  ) {
    const targetDate = parseDateOnly(dto.date);

    const activeYear = await this.prisma.academicYear.findFirst({
      where: { schoolId, isCurrent: true }
    });
    if (!activeYear) {
      throw new BadRequestException('Active academic year not found');
    }

    // Verify lock state: if any record for this date is already locked, prevent standard editing
    const lockedRecord = await this.prisma.attendanceRecord.findFirst({
      where: {
        schoolId,
        classId: dto.classId,
        sectionId: dto.sectionId,
        date: targetDate,
        isLocked: true
      }
    });

    if (lockedRecord) {
      throw new ForbiddenException(
        'Attendance for this date and section has been locked by administration. Modifications require administrative correction privileges.'
      );
    }

    // Process batch upsert in an atomic transaction
    return this.prisma.$transaction(async (tx) => {
      const absentStudents: string[] = [];

      for (const item of dto.records) {
        if (item.status === 'ABSENT') {
          absentStudents.push(item.studentId);
        }

        await tx.attendanceRecord.upsert({
          where: {
            uq_student_attendance_date: {
              studentId: item.studentId,
              date: targetDate
            }
          },
          update: {
            status: item.status,
            remarks: item.remarks || null,
            markedBy: markerUserId,
            classId: dto.classId,
            sectionId: dto.sectionId,
            academicYearId: activeYear.id,
            updatedAt: new Date()
          },
          create: {
            schoolId,
            academicYearId: activeYear.id,
            classId: dto.classId,
            sectionId: dto.sectionId,
            studentId: item.studentId,
            date: targetDate,
            status: item.status,
            remarks: item.remarks || null,
            markedBy: markerUserId
          }
        });
      }

      // If any students were marked absent, log an alert/notification record
      if (absentStudents.length > 0) {
        for (const studentId of absentStudents) {
          const student = await tx.student.findUnique({
            where: { id: studentId },
            include: { guardians: { include: { guardian: true } } }
          });

          if (student && student.guardians.length > 0) {
            // Check if any guardian has a registered User account
            for (const sg of student.guardians) {
              if (sg.guardian.userId) {
                await tx.notification.create({
                  data: {
                    schoolId,
                    userId: sg.guardian.userId,
                    title: `Absence Notice: ${student.firstName} ${student.lastName}`,
                    message: `${student.firstName} has been marked absent today (${dto.date}). Please contact the school office if this is an error.`,
                    type: 'ATTENDANCE'
                  }
                });
              }
            }
          }
        }
      }

      return {
        success: true,
        count: dto.records.length,
        absentCount: absentStudents.length,
        message: 'Attendance recorded successfully'
      };
    });
  }

  /**
   * Lock daily attendance to prevent further edits by regular teachers
   */
  async lockAttendance(schoolId: string, userId: string, dto: LockAttendanceDto) {
    const targetDate = parseDateOnly(dto.date);

    const count = await this.prisma.attendanceRecord.count({
      where: {
        schoolId,
        classId: dto.classId,
        sectionId: dto.sectionId,
        date: targetDate
      }
    });

    if (count === 0) {
      throw new BadRequestException('No attendance records exist for this date to lock');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.attendanceRecord.updateMany({
        where: {
          schoolId,
          classId: dto.classId,
          sectionId: dto.sectionId,
          date: targetDate
        },
        data: {
          isLocked: true,
          lockedAt: new Date()
        }
      });

      // Audit log entry
      await tx.auditLog.create({
        data: {
          schoolId,
          userId,
          entityName: 'AttendanceRecord',
          entityId: `${dto.classId}_${dto.sectionId}_${dto.date}`,
          action: 'UPDATE',
          newValues: {
            action: 'LOCK_ATTENDANCE',
            classId: dto.classId,
            sectionId: dto.sectionId,
            date: dto.date,
            lockedRecordsCount: count
          }
        }
      });

      return {
        success: true,
        lockedCount: count,
        message: 'Attendance locked successfully. Further edits require administrative override.'
      };
    });
  }

  /**
   * Administrative single-record correction with audit logging
   */
  async correctAttendance(
    schoolId: string,
    userId: string,
    id: string,
    dto: CorrectAttendanceDto
  ) {
    const existing = await this.prisma.attendanceRecord.findFirst({
      where: { id, schoolId },
      include: { student: true }
    });

    if (!existing) {
      throw new NotFoundException('Attendance record not found');
    }

    const updated = await this.prisma.attendanceRecord.update({
      where: { id },
      data: {
        status: dto.status,
        remarks: dto.remarks
          ? `[Correction] ${dto.remarks}`
          : existing.remarks,
        updatedAt: new Date()
      }
    });

    // Record audit trail
    await this.prisma.auditLog.create({
      data: {
        schoolId,
        userId,
        entityName: 'AttendanceRecord',
        entityId: id,
        action: 'UPDATE',
        oldValues: { status: existing.status, remarks: existing.remarks },
        newValues: { status: dto.status, remarks: updated.remarks }
      }
    });

    return updated;
  }

  /**
   * Fetch 31-day Monthly Attendance Register and calculate attendance percentages
   */
  async getMonthlyReport(
    schoolId: string,
    classId: string,
    sectionId: string,
    month: number,
    year: number
  ): Promise<MonthlyAttendanceReportResponse> {
    const [targetClass, targetSection, activeYear] = await Promise.all([
      this.prisma.class.findFirst({ where: { id: classId, schoolId } }),
      this.prisma.section.findFirst({ where: { id: sectionId, schoolId } }),
      this.prisma.academicYear.findFirst({ where: { schoolId, isCurrent: true } })
    ]);

    if (!targetClass) {
      throw new NotFoundException('Class not found');
    }
    if (!targetSection) {
      throw new NotFoundException('Section not found');
    }
    if (!activeYear) {
      throw new BadRequestException('No active academic year found');
    }

    // Month dates
    const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
    const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
    const totalDaysInMonth = new Date(year, month, 0).getDate();

    // Fetch enrolled students
    const enrollments = await this.prisma.studentEnrollment.findMany({
      where: {
        schoolId,
        classId,
        sectionId,
        academicYearId: activeYear.id,
        status: 'ENROLLED',
        student: {
          deletedAt: null,
          status: 'ACTIVE'
        }
      },
      include: {
        student: true
      },
      orderBy: [
        { rollNumber: 'asc' },
        { student: { firstName: 'asc' } }
      ]
    });

    // Fetch all attendance records in this month
    const records = await this.prisma.attendanceRecord.findMany({
      where: {
        schoolId,
        classId,
        sectionId,
        date: {
          gte: startDate,
          lte: endDate
        }
      }
    });

    // Group records by studentId -> dayOfMonth -> status
    const studentRecordsMap = new Map<string, Map<number, string>>();
    const distinctDates = new Set<string>();

    for (const r of records) {
      const d = new Date(r.date);
      const dayNum = d.getUTCDate();
      distinctDates.add(`${d.getUTCFullYear()}-${d.getUTCMonth() + 1}-${dayNum}`);

      if (!studentRecordsMap.has(r.studentId)) {
        studentRecordsMap.set(r.studentId, new Map<number, string>());
      }
      studentRecordsMap.get(r.studentId)!.set(dayNum, r.status);
    }

    const students: MonthlyStudentAttendance[] = enrollments.map((enr) => {
      const dayMap = studentRecordsMap.get(enr.studentId) || new Map<number, string>();
      const days: Record<number, AttendanceStatus | '-'> = {};

      let presentCount = 0;
      let absentCount = 0;
      let lateCount = 0;
      let halfDayCount = 0;
      let excusedCount = 0;

      for (let day = 1; day <= totalDaysInMonth; day++) {
        const stat = dayMap.get(day);
        if (stat) {
          days[day] = stat as AttendanceStatus;
          if (stat === 'PRESENT') presentCount++;
          else if (stat === 'ABSENT') absentCount++;
          else if (stat === 'LATE') lateCount++;
          else if (stat === 'HALF_DAY') halfDayCount++;
          else if (stat === 'EXCUSED_LEAVE') excusedCount++;
        } else {
          days[day] = '-';
        }
      }

      const totalRecordedDays = presentCount + absentCount + lateCount + halfDayCount + excusedCount;
      const attendancePercentage =
        totalRecordedDays > 0
          ? Math.round(((presentCount + lateCount + halfDayCount * 0.5) / totalRecordedDays) * 1000) / 10
          : 0;

      const isLowAttendance = totalRecordedDays > 0 && attendancePercentage < 75.0;

      return {
        studentId: enr.student.id,
        studentName: `${enr.student.firstName} ${enr.student.lastName}`,
        admissionNumber: enr.student.admissionNumber,
        rollNumber: enr.rollNumber,
        days,
        presentCount,
        absentCount,
        lateCount,
        halfDayCount,
        excusedCount,
        totalRecordedDays,
        attendancePercentage,
        isLowAttendance
      };
    });

    return {
      classId: targetClass.id,
      className: targetClass.name,
      sectionId: targetSection.id,
      sectionName: targetSection.name,
      month,
      year,
      totalDaysInMonth,
      workingDaysRecorded: distinctDates.size,
      students
    };
  }
}
