import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Database Seed with Two School Branches...');

  // 1. Seed or Update Branch 1: Main Campus
  let mainSchool = await prisma.school.findFirst({
    where: {
      OR: [{ code: 'REMPS-MAIN' }, { code: 'REMPS-2026' }]
    }
  });

  if (mainSchool) {
    mainSchool = await prisma.school.update({
      where: { id: mainSchool.id },
      data: {
        code: 'REMPS-MAIN',
        name: 'Rainbow English Medium Primary School — Main Campus',
        domain: 'main.rainbowschool.edu',
        email: 'main.campus@rainbowschool.edu',
        phone: '+91-98765-43210',
        address: 'Main Road Campus, Rainbow English Medium Primary School Area',
        currency: 'INR',
        timezone: 'Asia/Kolkata',
        status: 'ACTIVE'
      }
    });
  } else {
    mainSchool = await prisma.school.create({
      data: {
        code: 'REMPS-MAIN',
        name: 'Rainbow English Medium Primary School — Main Campus',
        domain: 'main.rainbowschool.edu',
        email: 'main.campus@rainbowschool.edu',
        phone: '+91-98765-43210',
        address: 'Main Road Campus, Rainbow English Medium Primary School Area',
        currency: 'INR',
        timezone: 'Asia/Kolkata',
        status: 'ACTIVE'
      }
    });
  }
  console.log(`✅ Branch 1 Ensured: ${mainSchool.name} (${mainSchool.code})`);

  // 2. Seed Branch 2: City Campus
  const citySchool = await prisma.school.upsert({
    where: { code: 'REMPS-CITY' },
    update: {
      name: 'Rainbow English Medium Primary School — City Campus',
      domain: 'city.rainbowschool.edu',
      email: 'city.campus@rainbowschool.edu',
      phone: '+91-98765-66778',
      address: 'City Center Urban Wing, Rainbow English Medium Primary School',
      currency: 'INR',
      timezone: 'Asia/Kolkata',
      status: 'ACTIVE'
    },
    create: {
      code: 'REMPS-CITY',
      name: 'Rainbow English Medium Primary School — City Campus',
      domain: 'city.rainbowschool.edu',
      email: 'city.campus@rainbowschool.edu',
      phone: '+91-98765-66778',
      address: 'City Center Urban Wing, Rainbow English Medium Primary School',
      currency: 'INR',
      timezone: 'Asia/Kolkata',
      status: 'ACTIVE'
    }
  });
  console.log(`✅ Branch 2 Ensured: ${citySchool.name} (${citySchool.code})`);

  // 3. Seed Granular Permissions (System-wide)
  const permissionsList = [
    // School & Users
    { code: 'school.settings.view', module: 'Organization', name: 'View School Settings' },
    { code: 'school.settings.edit', module: 'Organization', name: 'Edit School Settings' },
    { code: 'users.view', module: 'Users', name: 'View Users' },
    { code: 'users.create', module: 'Users', name: 'Create Users' },
    { code: 'users.edit', module: 'Users', name: 'Edit Users' },
    { code: 'users.delete', module: 'Users', name: 'Delete Users' },
    { code: 'roles.manage', module: 'RBAC', name: 'Manage Roles & Permissions' },

    // Academics
    { code: 'academics.view', module: 'Academics', name: 'View Academics' },
    { code: 'academics.manage', module: 'Academics', name: 'Manage Academics' },

    // Admissions
    { code: 'admissions.view', module: 'Admissions', name: 'View Admissions' },
    { code: 'admissions.create', module: 'Admissions', name: 'Create Admission Applications' },
    { code: 'admissions.approve', module: 'Admissions', name: 'Approve Admission Applications' },

    // Students
    { code: 'students.view', module: 'Students', name: 'View Students' },
    { code: 'students.create', module: 'Students', name: 'Create Students' },
    { code: 'students.edit', module: 'Students', name: 'Edit Students' },
    { code: 'students.delete', module: 'Students', name: 'Delete / Archive Students' },

    // Attendance
    { code: 'attendance.view', module: 'Attendance', name: 'View Attendance' },
    { code: 'attendance.mark', module: 'Attendance', name: 'Mark Class Attendance' },
    { code: 'attendance.lock', module: 'Attendance', name: 'Lock / Freeze Attendance' },
    { code: 'attendance.correct', module: 'Attendance', name: 'Correct Past Attendance' },

    // Examinations & Marks
    { code: 'exams.view', module: 'Examinations', name: 'View Exams & Schedules' },
    { code: 'exams.manage', module: 'Examinations', name: 'Manage Exams & Schedules' },
    { code: 'marks.enter', module: 'Marks', name: 'Enter Student Marks' },
    { code: 'marks.lock', module: 'Marks', name: 'Lock & Approve Marks' },
    { code: 'report_cards.generate', module: 'Marks', name: 'Generate Report Cards' },

    // Fees & Finance
    { code: 'fees.view', module: 'Fees', name: 'View Fee Structures & Invoices' },
    { code: 'fees.manage', module: 'Fees', name: 'Manage Fee Templates' },
    { code: 'fees.collect', module: 'Fees', name: 'Collect Payments & Issue Receipts' },
    { code: 'fees.refund', module: 'Fees', name: 'Issue Refunds' },
    { code: 'fees.reports', module: 'Fees', name: 'View Financial Reports' },

    // Timetable & Assignments
    { code: 'timetable.view', module: 'Timetable', name: 'View Timetable' },
    { code: 'timetable.manage', module: 'Timetable', name: 'Manage Timetable & Rooms' },
    { code: 'assignments.view', module: 'Assignments', name: 'View Assignments' },
    { code: 'assignments.manage', module: 'Assignments', name: 'Manage Assignments' },
    { code: 'assignments.submit', module: 'Assignments', name: 'Submit Homework' },

    // Communication & Reports
    { code: 'announcements.view', module: 'Communication', name: 'View Announcements' },
    { code: 'announcements.manage', module: 'Communication', name: 'Publish Announcements' },
    { code: 'audit_logs.view', module: 'Audits', name: 'View Audit Logs' },
    { code: 'reports.view', module: 'Reports', name: 'View Operational Reports' },
    { code: 'reports.export', module: 'Reports', name: 'Export Data to Excel / PDF' }
  ];

  for (const perm of permissionsList) {
    await prisma.permission.upsert({
      where: { code: perm.code },
      update: { name: perm.name, module: perm.module },
      create: perm
    });
  }
  console.log(`✅ Seeded ${permissionsList.length} granular permissions.`);

  const allPermissions = await prisma.permission.findMany();
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('AdminPassword123!', salt);

  // Helper to setup a school branch with standard roles, academics, and subjects
  async function setupSchoolBranch(school: typeof mainSchool) {
    // A. Seed Roles
    const rolesToCreate = [
      {
        name: 'SUPER_ADMIN',
        description: 'Full system access across all school operations',
        isSystemRole: true,
        permissions: allPermissions.map((p) => p.id)
      },
      {
        name: 'SCHOOL_ADMIN',
        description: 'School-level administrator with full management rights',
        isSystemRole: true,
        permissions: allPermissions.map((p) => p.id)
      },
      {
        name: 'TEACHER',
        description: 'Teaching staff with attendance, marks, and assignment rights',
        isSystemRole: true,
        permissions: allPermissions
          .filter((p) =>
            [
              'attendance.view',
              'attendance.mark',
              'exams.view',
              'marks.enter',
              'timetable.view',
              'assignments.view',
              'assignments.manage',
              'announcements.view',
              'students.view'
            ].includes(p.code)
          )
          .map((p) => p.id)
      },
      {
        name: 'ACCOUNTANT',
        description: 'Finance and bursar staff managing fees and invoices',
        isSystemRole: true,
        permissions: allPermissions
          .filter((p) => p.code.startsWith('fees.') || p.code.startsWith('reports.'))
          .map((p) => p.id)
      }
    ];

    for (const r of rolesToCreate) {
      const role = await prisma.role.upsert({
        where: {
          uq_roles_school_name: {
            schoolId: school.id,
            name: r.name
          }
        },
        update: { description: r.description },
        create: {
          schoolId: school.id,
          name: r.name,
          description: r.description,
          isSystemRole: r.isSystemRole
        }
      });

      await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
      await prisma.rolePermission.createMany({
        data: r.permissions.map((pId) => ({
          roleId: role.id,
          permissionId: pId
        }))
      });
    }

    // B. Seed Academic Year
    const academicYear = await prisma.academicYear.upsert({
      where: {
        uq_academic_years_name: {
          schoolId: school.id,
          name: '2026-2027'
        }
      },
      update: {},
      create: {
        schoolId: school.id,
        name: '2026-2027',
        startDate: new Date('2026-09-01'),
        endDate: new Date('2027-06-30'),
        isCurrent: true
      }
    });

    // C. Seed Primary Classes & Sections
    const classesData = [
      { name: 'Nursery', code: 'NUR', displayOrder: 1 },
      { name: 'LKG', code: 'LKG', displayOrder: 2 },
      { name: 'UKG', code: 'UKG', displayOrder: 3 },
      { name: 'Class 1', code: 'CLS-1', displayOrder: 4 },
      { name: 'Class 2', code: 'CLS-2', displayOrder: 5 },
      { name: 'Class 3', code: 'CLS-3', displayOrder: 6 },
      { name: 'Class 4', code: 'CLS-4', displayOrder: 7 },
      { name: 'Class 5', code: 'CLS-5', displayOrder: 8 }
    ];

    const classMap = new Map<string, any>();
    for (const c of classesData) {
      const cls = await prisma.class.upsert({
        where: {
          uq_classes_name: {
            schoolId: school.id,
            name: c.name
          }
        },
        update: { displayOrder: c.displayOrder, code: c.code },
        create: {
          schoolId: school.id,
          name: c.name,
          code: c.code,
          displayOrder: c.displayOrder
        }
      });

      classMap.set(c.name, cls);

      for (const secName of ['A', 'B']) {
        await prisma.section.upsert({
          where: {
            uq_sections_class_name: {
              classId: cls.id,
              name: secName
            }
          },
          update: {},
          create: {
            schoolId: school.id,
            classId: cls.id,
            name: secName,
            capacity: 40
          }
        });
      }
    }

    // D. Seed Core Curriculum Subjects
    const subjectsData = [
      { name: 'English Language', code: `ENG-${school.code}`, type: 'THEORY' },
      { name: 'Mathematics', code: `MATH-${school.code}`, type: 'THEORY' },
      { name: 'Environmental Studies (EVS)', code: `EVS-${school.code}`, type: 'THEORY' },
      { name: 'General Science', code: `SCI-${school.code}`, type: 'THEORY' },
      { name: 'Social Studies', code: `SST-${school.code}`, type: 'THEORY' },
      { name: 'Second Language / Hindi', code: `HIN-${school.code}`, type: 'THEORY' },
      { name: 'Computer Basics', code: `COMP-${school.code}`, type: 'PRACTICAL' },
      { name: 'Art & Craft', code: `ART-${school.code}`, type: 'ACTIVITY' },
      { name: 'Physical Education', code: `PE-${school.code}`, type: 'ACTIVITY' }
    ];

    for (const s of subjectsData) {
      await prisma.subject.upsert({
        where: {
          uq_subjects_code: {
            schoolId: school.id,
            code: s.code
          }
        },
        update: { name: s.name, type: s.type },
        create: {
          schoolId: school.id,
          name: s.name,
          code: s.code,
          type: s.type
        }
      });
    }

    return { academicYear, classMap };
  }

  // 4. Setup Both Branches
  console.log('⚙️ Configuring Main Campus structure...');
  const mainSetup = await setupSchoolBranch(mainSchool);

  console.log('⚙️ Configuring City Campus structure...');
  const citySetup = await setupSchoolBranch(citySchool);

  // 5. Create or Update Super Admin User (Anchored to Main Campus with universal system rights)
  const adminRole = await prisma.role.findFirst({
    where: { schoolId: mainSchool.id, name: 'SUPER_ADMIN' }
  });

  const adminUser = await prisma.user.upsert({
    where: {
      uq_users_school_email: {
        schoolId: mainSchool.id,
        email: 'admin@schoolerp.com'
      }
    },
    update: { passwordHash },
    create: {
      schoolId: mainSchool.id,
      email: 'admin@schoolerp.com',
      passwordHash,
      firstName: 'System',
      lastName: 'Administrator',
      phone: '+1-555-0100',
      userType: 'SUPER_ADMIN',
      status: 'ACTIVE'
    }
  });

  if (adminRole) {
    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: adminUser.id,
          roleId: adminRole.id
        }
      },
      update: {},
      create: {
        userId: adminUser.id,
        roleId: adminRole.id
      }
    });
  }

  console.log(`✅ Default Super Admin active: admin@schoolerp.com / AdminPassword123!`);

  // 6. Seed Demo Teachers
  // Main Campus Teacher: Govind Reddy
  const mainTeacherRole = await prisma.role.findFirst({
    where: { schoolId: mainSchool.id, name: 'TEACHER' }
  });

  // Rename existing Priya Sharma if present
  const existingPriya = await prisma.user.findFirst({
    where: { schoolId: mainSchool.id, email: 'teacher.priya@rainbowschool.edu' }
  });
  if (existingPriya) {
    await prisma.user.update({
      where: { id: existingPriya.id },
      data: {
        email: 'teacher.govind@rainbowschool.edu',
        firstName: 'Govind',
        lastName: 'Reddy'
      }
    });
  }

  const mainTeacher = await prisma.user.upsert({
    where: {
      uq_users_school_email: {
        schoolId: mainSchool.id,
        email: 'teacher.govind@rainbowschool.edu'
      }
    },
    update: {
      firstName: 'Govind',
      lastName: 'Reddy'
    },
    create: {
      schoolId: mainSchool.id,
      email: 'teacher.govind@rainbowschool.edu',
      passwordHash,
      firstName: 'Govind',
      lastName: 'Reddy',
      phone: '+91-98765-11223',
      userType: 'TEACHER',
      status: 'ACTIVE'
    }
  });

  if (mainTeacherRole) {
    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: mainTeacher.id,
          roleId: mainTeacherRole.id
        }
      },
      update: {},
      create: {
        userId: mainTeacher.id,
        roleId: mainTeacherRole.id
      }
    });
  }

  // City Campus Teacher: Rajesh Kumar
  const cityTeacherRole = await prisma.role.findFirst({
    where: { schoolId: citySchool.id, name: 'TEACHER' }
  });

  const cityTeacher = await prisma.user.upsert({
    where: {
      uq_users_school_email: {
        schoolId: citySchool.id,
        email: 'teacher.rajesh@rainbowschool.edu'
      }
    },
    update: {},
    create: {
      schoolId: citySchool.id,
      email: 'teacher.rajesh@rainbowschool.edu',
      passwordHash,
      firstName: 'Rajesh',
      lastName: 'Kumar',
      phone: '+91-98765-99887',
      userType: 'TEACHER',
      status: 'ACTIVE'
    }
  });

  if (cityTeacherRole) {
    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: cityTeacher.id,
          roleId: cityTeacherRole.id
        }
      },
      update: {},
      create: {
        userId: cityTeacher.id,
        roleId: cityTeacherRole.id
      }
    });
  }

  console.log(`✅ Teachers seeded for both campuses.`);

  // 7. Seed Sample Students for City Campus (Class 1-A)
  const cityClass1 = citySetup.classMap.get('Class 1');
  const citySectionA = await prisma.section.findFirst({
    where: { classId: cityClass1.id, name: 'A' }
  });

  if (cityClass1 && citySectionA) {
    const cityStudents = [
      {
        admissionNo: 'REMPS-CITY-0001',
        firstName: 'Reyansh',
        lastName: 'Mehta',
        gender: 'MALE',
        dob: new Date('2020-03-12'),
        parentName: 'Alok Mehta',
        parentPhone: '+91-98765-88101',
        rollNo: 1
      },
      {
        admissionNo: 'REMPS-CITY-0002',
        firstName: 'Sara',
        lastName: 'Ali',
        gender: 'FEMALE',
        dob: new Date('2020-06-18'),
        parentName: 'Imran Ali',
        parentPhone: '+91-98765-88102',
        rollNo: 2
      },
      {
        admissionNo: 'REMPS-CITY-0003',
        firstName: 'Kabir',
        lastName: 'Singh',
        gender: 'MALE',
        dob: new Date('2020-09-25'),
        parentName: 'Harpreet Singh',
        parentPhone: '+91-98765-88103',
        rollNo: 3
      }
    ];

    for (const s of cityStudents) {
      const student = await prisma.student.upsert({
        where: {
          uq_student_admission_no: {
            schoolId: citySchool.id,
            admissionNumber: s.admissionNo
          }
        },
        update: {},
        create: {
          schoolId: citySchool.id,
          admissionNumber: s.admissionNo,
          firstName: s.firstName,
          lastName: s.lastName,
          gender: s.gender,
          dateOfBirth: s.dob,
          bloodGroup: 'B+',
          phone: s.parentPhone,
          admissionDate: new Date('2026-04-01'),
          status: 'ACTIVE'
        }
      });

      const guardian = await prisma.guardian.create({
        data: {
          schoolId: citySchool.id,
          firstName: s.parentName.split(' ')[0],
          lastName: s.parentName.split(' ')[1] || 'Parent',
          relationship: 'FATHER',
          phone: s.parentPhone,
          occupation: 'Business'
        }
      });

      await prisma.studentGuardian.create({
        data: {
          studentId: student.id,
          guardianId: guardian.id,
          isPrimary: true,
          canPickup: true
        }
      });

      await prisma.studentEnrollment.upsert({
        where: {
          uq_student_enrollment: {
            schoolId: citySchool.id,
            studentId: student.id,
            academicYearId: citySetup.academicYear.id
          }
        },
        update: { rollNumber: s.rollNo },
        create: {
          schoolId: citySchool.id,
          studentId: student.id,
          academicYearId: citySetup.academicYear.id,
          classId: cityClass1.id,
          sectionId: citySectionA.id,
          rollNumber: s.rollNo,
          status: 'ENROLLED'
        }
      });
    }
    console.log(`✅ Sample students seeded in City Campus Class 1-A.`);
  }

  // 8. Seed Standard Grading System for Both Branches
  const gradingScales = [
    { name: 'A+', minPercentage: 90, maxPercentage: 100, gradePoint: 10.0, remarks: 'Outstanding' },
    { name: 'A', minPercentage: 80, maxPercentage: 89.99, gradePoint: 9.0, remarks: 'Excellent' },
    { name: 'B', minPercentage: 70, maxPercentage: 79.99, gradePoint: 8.0, remarks: 'Very Good' },
    { name: 'C', minPercentage: 60, maxPercentage: 69.99, gradePoint: 7.0, remarks: 'Good' },
    { name: 'D', minPercentage: 50, maxPercentage: 59.99, gradePoint: 6.0, remarks: 'Satisfactory' },
    { name: 'E', minPercentage: 35, maxPercentage: 49.99, gradePoint: 4.0, remarks: 'Needs Improvement' },
    { name: 'F', minPercentage: 0, maxPercentage: 34.99, gradePoint: 0.0, remarks: 'Fail' }
  ];

  for (const school of [mainSchool, citySchool]) {
    let gs = await prisma.gradingSystem.findFirst({
      where: { schoolId: school.id, isDefault: true }
    });
    if (!gs) {
      gs = await prisma.gradingSystem.create({
        data: {
          schoolId: school.id,
          name: 'Primary Standard 7-Point Grading Scale',
          type: 'PERCENTAGE',
          isDefault: true,
          gradeScales: {
            create: gradingScales
          }
        }
      });
    }
  }
  console.log('✅ Standard Grading Systems ensured for both branches.');

  // 9. Seed Midterm Examination & Schedules for Main Campus
  const mainClass1 = mainSetup.classMap.get('Class 1');
  const mainSectionA = await prisma.section.findFirst({
    where: { classId: mainClass1.id, name: 'A' }
  });

  if (mainClass1 && mainSectionA) {
    let mainExam = await prisma.examination.findFirst({
      where: {
        schoolId: mainSchool.id,
        name: 'Term 1 Midterm Assessment 2026'
      }
    });

    if (!mainExam) {
      mainExam = await prisma.examination.create({
        data: {
          schoolId: mainSchool.id,
          academicYearId: mainSetup.academicYear.id,
          name: 'Term 1 Midterm Assessment 2026',
          startDate: new Date('2026-10-10'),
          endDate: new Date('2026-10-20'),
          isPublished: true
        }
      });
    }

    // Class 1 Subjects
    const subjects = await prisma.subject.findMany({
      where: {
        schoolId: mainSchool.id,
        name: { in: ['English Language', 'Mathematics', 'Environmental Studies (EVS)'] }
      }
    });

    const papers = [
      { name: 'English Language', date: '2026-10-10', start: '09:30 AM', end: '11:30 AM' },
      { name: 'Mathematics', date: '2026-10-12', start: '09:30 AM', end: '11:30 AM' },
      { name: 'Environmental Studies (EVS)', date: '2026-10-14', start: '09:30 AM', end: '11:30 AM' }
    ];

    const schedulesMap = new Map<string, any>();
    for (const p of papers) {
      const subj = subjects.find((s) => s.name === p.name);
      if (subj) {
        const sched = await prisma.examSchedule.upsert({
          where: {
            uq_exam_schedule: {
              examinationId: mainExam.id,
              classId: mainClass1.id,
              subjectId: subj.id
            }
          },
          update: {},
          create: {
            examinationId: mainExam.id,
            classId: mainClass1.id,
            subjectId: subj.id,
            examDate: new Date(p.date),
            startTime: p.start,
            endTime: p.end,
            maxMarks: 100,
            passingMarks: 35
          }
        });
        schedulesMap.set(p.name, sched);
      }
    }

    // Seed sample marks for enrolled Class 1-A students
    const enrollments = await prisma.studentEnrollment.findMany({
      where: {
        schoolId: mainSchool.id,
        classId: mainClass1.id,
        sectionId: mainSectionA.id
      }
    });

    // Score patterns: [English, Math, EVS]
    const scoreProfiles: Record<number, number[]> = {
      1: [94, 98, 92], // Aarav Sharma (Top ranker)
      2: [88, 85, 90], // Diya Patel
      3: [72, 68, 75], // Rohan Gupta
      4: [82, 80, 85]  // Ananya Reddy
    };

    for (const enr of enrollments) {
      const scores = scoreProfiles[enr.rollNumber || 1] || [75, 75, 75];
      const paperNames = ['English Language', 'Mathematics', 'Environmental Studies (EVS)'];
      for (let i = 0; i < paperNames.length; i++) {
        const sched = schedulesMap.get(paperNames[i]);
        if (sched) {
          await prisma.studentMark.upsert({
            where: {
              uq_student_exam_mark: {
                examScheduleId: sched.id,
                studentId: enr.studentId
              }
            },
            update: {
              marksObtained: scores[i],
              isAbsent: false,
              remarks: scores[i] >= 90 ? 'Outstanding grasp of concepts' : 'Good performance',
              enteredBy: mainTeacher.id
            },
            create: {
              schoolId: mainSchool.id,
              examScheduleId: sched.id,
              studentId: enr.studentId,
              marksObtained: scores[i],
              isAbsent: false,
              remarks: scores[i] >= 90 ? 'Outstanding grasp of concepts' : 'Good performance',
              enteredBy: mainTeacher.id,
              isLocked: false
            }
          });
        }
      }
    }
    console.log('✅ Exam schedules and sample marks seeded for Main Campus Class 1-A.');
  }

  // 10. Seed Midterm Examination & Schedules for City Campus
  if (cityClass1 && citySectionA) {
    let cityExam = await prisma.examination.findFirst({
      where: {
        schoolId: citySchool.id,
        name: 'Term 1 Midterm Assessment 2026'
      }
    });

    if (!cityExam) {
      cityExam = await prisma.examination.create({
        data: {
          schoolId: citySchool.id,
          academicYearId: citySetup.academicYear.id,
          name: 'Term 1 Midterm Assessment 2026',
          startDate: new Date('2026-10-10'),
          endDate: new Date('2026-10-20'),
          isPublished: true
        }
      });
    }

    const citySubjects = await prisma.subject.findMany({
      where: {
        schoolId: citySchool.id,
        name: { in: ['English Language', 'Mathematics', 'Environmental Studies (EVS)'] }
      }
    });

    const citySchedulesMap = new Map<string, any>();
    for (const p of [
      { name: 'English Language', date: '2026-10-10', start: '09:30 AM', end: '11:30 AM' },
      { name: 'Mathematics', date: '2026-10-12', start: '09:30 AM', end: '11:30 AM' },
      { name: 'Environmental Studies (EVS)', date: '2026-10-14', start: '09:30 AM', end: '11:30 AM' }
    ]) {
      const subj = citySubjects.find((s) => s.name === p.name);
      if (subj) {
        const sched = await prisma.examSchedule.upsert({
          where: {
            uq_exam_schedule: {
              examinationId: cityExam.id,
              classId: cityClass1.id,
              subjectId: subj.id
            }
          },
          update: {},
          create: {
            examinationId: cityExam.id,
            classId: cityClass1.id,
            subjectId: subj.id,
            examDate: new Date(p.date),
            startTime: p.start,
            endTime: p.end,
            maxMarks: 100,
            passingMarks: 35
          }
        });
        citySchedulesMap.set(p.name, sched);
      }
    }

    const cityEnrollments = await prisma.studentEnrollment.findMany({
      where: {
        schoolId: citySchool.id,
        classId: cityClass1.id,
        sectionId: citySectionA.id
      }
    });

    const cityScoreProfiles: Record<number, number[]> = {
      1: [91, 95, 89], // Reyansh Mehta
      2: [86, 90, 92], // Sara Ali
      3: [78, 82, 80]  // Kabir Singh
    };

    for (const enr of cityEnrollments) {
      const scores = cityScoreProfiles[enr.rollNumber || 1] || [80, 80, 80];
      const paperNames = ['English Language', 'Mathematics', 'Environmental Studies (EVS)'];
      for (let i = 0; i < paperNames.length; i++) {
        const sched = citySchedulesMap.get(paperNames[i]);
        if (sched) {
          await prisma.studentMark.upsert({
            where: {
              uq_student_exam_mark: {
                examScheduleId: sched.id,
                studentId: enr.studentId
              }
            },
            update: {
              marksObtained: scores[i],
              isAbsent: false,
              remarks: 'Consistently engaged',
              enteredBy: cityTeacher.id
            },
            create: {
              schoolId: citySchool.id,
              examScheduleId: sched.id,
              studentId: enr.studentId,
              marksObtained: scores[i],
              isAbsent: false,
              remarks: 'Consistently engaged',
              enteredBy: cityTeacher.id,
              isLocked: false
            }
          });
        }
      }
    }
    console.log('✅ Exam schedules and sample marks seeded for City Campus Class 1-A.');
  }

  console.log('✨ Seed completed with Two Branches and Examinations successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
