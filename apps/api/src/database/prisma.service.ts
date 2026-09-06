import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { seedDatabase } from './seed';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error']
    });
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Connected to PostgreSQL Database.');
    // Run initial seed if database has 0 schools
    this.autoSeedIfEmpty().catch((err) => {
      this.logger.error('Failed to run automatic seeding:', err);
    });
  }

  async autoSeedIfEmpty() {
    try {
      const schoolCount = await this.school.count();
      if (schoolCount === 0) {
        this.logger.log('🌱 Fresh database detected (0 schools). Running automated seeding...');
        await seedDatabase(this);
        this.logger.log('✅ Automated seeding complete! Super Admin & Campuses ready.');
      } else {
        this.logger.log(`Database already seeded (${schoolCount} campus(es) found).`);
      }
    } catch (e: any) {
      this.logger.warn(`Could not verify auto-seed status: ${e.message}`);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}

