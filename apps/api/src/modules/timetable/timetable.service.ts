import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { CreateTimetableEntryDto } from './dto/create-timetable-entry.dto';
import { BatchTimetableDto } from './dto/batch-timetable.dto';

@Injectable()
export class TimetableService {
  constructor(private prisma: PrismaService) {}

  // -------------------------------------------------------------
  // 1. ROOMS MANAGEMENT
  // -------------------------------------------------------------
  async listRooms(schoolId: string) {
    const where: any = {};
    if (schoolId && schoolId !== 'ALL') {
      where.schoolId = schoolId;
    }
    return this.prisma.room.findMany({
      where,
      orderBy: { name: 'asc' }
    });
  }

  async createRoom(schoolId: string, dto: CreateRoomDto) {
    return this.prisma.room.create({
      data: {
        schoolId,
        name: dto.name,
        capacity: dto.capacity || 40
      }
    });
  }

  async deleteRoom(schoolId: string, id: string) {
    const inUse = await this.prisma.timetableEntry.count({ where: { roomId: id } });
    if (inUse > 0) {
      throw new BadRequestException('Cannot delete room: it is referenced in active timetable entries');
    }
    return this.prisma.room.delete({ where: { id } });
  }

  // -------------------------------------------------------------
  // 2. CONFLICT CHECK ENGINE
  // -------------------------------------------------------------
  async checkConflicts(
    schoolId: string,
    params: {
      entryId?: string;
      academicYearId: string;
      dayOfWeek: number;
      startTime: string;
      endTime: string;
      teacherId: string;
      roomId?: string;
      sectionId: string;
    }
  ) {
    // Find all entries on the same day for this academic year
    const sameDayEntries = await this.prisma.timetableEntry.findMany({
      where: {
        schoolId: schoolId !== 'ALL' ? schoolId : undefined,
        academicYearId: params.academicYearId,
        dayOfWeek: params.dayOfWeek,
        id: params.entryId ? { not: params.entryId } : undefined
      },
      include: {
        class: { select: { id: true, name: true, code: true } },
        section: { select: { id: true, name: true } },
        subject: { select: { id: true, name: true, code: true } },
        teacher: { select: { id: true, firstName: true, lastName: true, email: true } },
        room: { select: { id: true, name: true } }
      }
    });

    // Helper: test time overlap (A starts before B ends, and A ends after B starts)
    const isOverlapping = (startA: string, endA: string, startB: string, endB: string) => {
      return startA < endB && endA > startB;
    };

    for (const entry of sameDayEntries) {
      if (!isOverlapping(params.startTime, params.endTime, entry.startTime, entry.endTime)) {
        continue;
      }

      // 1. Check Section conflict
      if (entry.sectionId === params.sectionId) {
        return {
          hasConflict: true,
          type: 'SECTION_CONFLICT',
          message: `This section already has ${entry.subject?.name} scheduled from ${entry.startTime} to ${entry.endTime}`,
          conflictingEntry: entry
        };
      }

      // 2. Check Teacher conflict
      if (entry.teacherId === params.teacherId) {
        const teacherName = `${entry.teacher?.firstName || ''} ${entry.teacher?.lastName || ''}`.trim();
        return {
          hasConflict: true,
          type: 'TEACHER_CONFLICT',
          message: `Teacher ${teacherName} is already assigned to ${entry.class?.name} (${entry.section?.name}) for ${entry.subject?.name} from ${entry.startTime} to ${entry.endTime}`,
          conflictingEntry: entry
        };
      }

      // 3. Check Room conflict (if room specified)
      if (params.roomId && entry.roomId === params.roomId) {
        return {
          hasConflict: true,
          type: 'ROOM_CONFLICT',
          message: `Room "${entry.room?.name || 'Assigned Room'}" is already occupied by ${entry.class?.name} (${entry.section?.name}) from ${entry.startTime} to ${entry.endTime}`,
          conflictingEntry: entry
        };
      }
    }

    return { hasConflict: false };
  }

  // -------------------------------------------------------------
  // 3. TIMETABLE ENTRIES
  // -------------------------------------------------------------
  async getSectionTimetable(schoolId: string, sectionId: string, academicYearId?: string) {
    const where: any = { sectionId };
    if (schoolId && schoolId !== 'ALL') {
      where.schoolId = schoolId;
    }
    if (academicYearId) {
      where.academicYearId = academicYearId;
    }

    return this.prisma.timetableEntry.findMany({
      where,
      include: {
        class: { select: { id: true, name: true, code: true } },
        section: { select: { id: true, name: true } },
        subject: { select: { id: true, name: true, code: true } },
        teacher: { select: { id: true, firstName: true, lastName: true, email: true } },
        room: { select: { id: true, name: true, capacity: true } }
      },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }]
    });
  }

  async getTeacherTimetable(schoolId: string, teacherId: string, academicYearId?: string) {
    const where: any = { teacherId };
    if (schoolId && schoolId !== 'ALL') {
      where.schoolId = schoolId;
    }
    if (academicYearId) {
      where.academicYearId = academicYearId;
    }

    return this.prisma.timetableEntry.findMany({
      where,
      include: {
        class: { select: { id: true, name: true, code: true } },
        section: { select: { id: true, name: true } },
        subject: { select: { id: true, name: true, code: true } },
        room: { select: { id: true, name: true } }
      },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }]
    });
  }

  async createEntry(schoolId: string, dto: CreateTimetableEntryDto) {
    if (dto.startTime >= dto.endTime) {
      throw new BadRequestException('Start time must be strictly before end time');
    }

    const conflict = await this.checkConflicts(schoolId, {
      academicYearId: dto.academicYearId,
      dayOfWeek: dto.dayOfWeek,
      startTime: dto.startTime,
      endTime: dto.endTime,
      teacherId: dto.teacherId,
      roomId: dto.roomId,
      sectionId: dto.sectionId
    });

    if (conflict.hasConflict) {
      throw new BadRequestException(conflict.message);
    }

    return this.prisma.timetableEntry.create({
      data: {
        schoolId,
        academicYearId: dto.academicYearId,
        classId: dto.classId,
        sectionId: dto.sectionId,
        subjectId: dto.subjectId,
        teacherId: dto.teacherId,
        roomId: dto.roomId || null,
        dayOfWeek: dto.dayOfWeek,
        startTime: dto.startTime,
        endTime: dto.endTime
      },
      include: {
        class: true,
        section: true,
        subject: true,
        teacher: { select: { id: true, firstName: true, lastName: true, email: true } },
        room: true
      }
    });
  }

  async updateEntry(schoolId: string, id: string, dto: CreateTimetableEntryDto) {
    const existing = await this.prisma.timetableEntry.findFirst({
      where: { id, ...(schoolId !== 'ALL' ? { schoolId } : {}) }
    });

    if (!existing) {
      throw new NotFoundException('Timetable entry not found');
    }

    if (dto.startTime >= dto.endTime) {
      throw new BadRequestException('Start time must be strictly before end time');
    }

    const conflict = await this.checkConflicts(schoolId, {
      entryId: id,
      academicYearId: dto.academicYearId,
      dayOfWeek: dto.dayOfWeek,
      startTime: dto.startTime,
      endTime: dto.endTime,
      teacherId: dto.teacherId,
      roomId: dto.roomId,
      sectionId: dto.sectionId
    });

    if (conflict.hasConflict) {
      throw new BadRequestException(conflict.message);
    }

    return this.prisma.timetableEntry.update({
      where: { id },
      data: {
        academicYearId: dto.academicYearId,
        classId: dto.classId,
        sectionId: dto.sectionId,
        subjectId: dto.subjectId,
        teacherId: dto.teacherId,
        roomId: dto.roomId || null,
        dayOfWeek: dto.dayOfWeek,
        startTime: dto.startTime,
        endTime: dto.endTime
      },
      include: {
        class: true,
        section: true,
        subject: true,
        teacher: { select: { id: true, firstName: true, lastName: true, email: true } },
        room: true
      }
    });
  }

  async deleteEntry(schoolId: string, id: string) {
    const existing = await this.prisma.timetableEntry.findFirst({
      where: { id, ...(schoolId !== 'ALL' ? { schoolId } : {}) }
    });

    if (!existing) {
      throw new NotFoundException('Timetable entry not found');
    }

    return this.prisma.timetableEntry.delete({ where: { id } });
  }

  async saveBatch(schoolId: string, dto: BatchTimetableDto) {
    // Validate each entry for self-conflicts and database conflicts
    for (let i = 0; i < dto.entries.length; i++) {
      const e = dto.entries[i];
      if (e.startTime >= e.endTime) {
        throw new BadRequestException(`Slot ${i + 1}: Start time must be before end time`);
      }
    }

    return this.prisma.$transaction(async (tx) => {
      // Remove old entries for this section and academic year
      await tx.timetableEntry.deleteMany({
        where: {
          schoolId,
          academicYearId: dto.academicYearId,
          sectionId: dto.sectionId
        }
      });

      // Insert new entries
      if (dto.entries.length > 0) {
        await tx.timetableEntry.createMany({
          data: dto.entries.map(e => ({
            schoolId,
            academicYearId: dto.academicYearId,
            classId: dto.classId,
            sectionId: dto.sectionId,
            subjectId: e.subjectId,
            teacherId: e.teacherId,
            roomId: e.roomId || null,
            dayOfWeek: e.dayOfWeek,
            startTime: e.startTime,
            endTime: e.endTime
          }))
        });
      }

      return tx.timetableEntry.findMany({
        where: {
          schoolId,
          academicYearId: dto.academicYearId,
          sectionId: dto.sectionId
        },
        include: {
          subject: true,
          teacher: { select: { id: true, firstName: true, lastName: true } },
          room: true
        },
        orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }]
      });
    });
  }
}