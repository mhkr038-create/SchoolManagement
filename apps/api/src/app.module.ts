import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { SchoolsModule } from './modules/schools/schools.module';
import { UsersModule } from './modules/users/users.module';
import { RbacModule } from './modules/rbac/rbac.module';
import { AcademicsModule } from './modules/academics/academics.module';
import { StudentsModule } from './modules/students/students.module';
import { AdmissionsModule } from './modules/admissions/admissions.module';
import { AttendanceModule } from './modules/attendance/attendance.module';
import { ExaminationsModule } from './modules/examinations/examinations.module';
import { FeesModule } from './modules/fees/fees.module';
import { TimetableModule } from './modules/timetable/timetable.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration]
    }),
    DatabaseModule,
    AuthModule,
    SchoolsModule,
    UsersModule,
    RbacModule,
    AcademicsModule,
    StudentsModule,
    AdmissionsModule,
    AttendanceModule,
    ExaminationsModule,
    FeesModule,
    TimetableModule
  ]
})
export class AppModule {}

