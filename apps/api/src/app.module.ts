import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AdminModule } from './admin/admin.module';
import { AiEngineModule } from './ai-engine/ai-engine.module';
import { AlertsModule } from './alerts/alerts.module';
import { AuctionsModule } from './auctions/auctions.module';
import { AuthModule } from './auth/auth.module';
import { CategoriesModule } from './categories/categories.module';
import { CompaniesModule } from './companies/companies.module';
import { DiscoveryModule } from './discovery/discovery.module';
import { DocumentsModule } from './documents/documents.module';
import { FavoritesModule } from './favorites/favorites.module';
import { GeolocationModule } from './geolocation/geolocation.module';
import { HealthModule } from './health/health.module';
import { JobsModule } from './jobs/jobs.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PrismaModule } from './prisma/prisma.module';
import { RadarModule } from './radar/radar.module';
import { ReportsModule } from './reports/reports.module';
import { SettingsModule } from './settings/settings.module';
import { SourcesModule } from './sources/sources.module';
import { TavilyModule } from './tavily/tavily.module';
import { UsersModule } from './users/users.module';
import { VerificationModule } from './verification/verification.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([
      {
        ttl: 60_000,
        limit: 120,
      },
    ]),
    PrismaModule,
    JobsModule,
    HealthModule,
    AuthModule,
    UsersModule,
    CompaniesModule,
    CategoriesModule,
    AuctionsModule,
    RadarModule,
    SettingsModule,
    SourcesModule,
    TavilyModule,
    DiscoveryModule,
    DocumentsModule,
    AiEngineModule,
    VerificationModule,
    GeolocationModule,
    NotificationsModule,
    FavoritesModule,
    AlertsModule,
    ReportsModule,
    AdminModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class AppModule {}
