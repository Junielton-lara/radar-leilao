import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpsertAlertDto } from './dto/upsert-alert.dto';

@Injectable()
export class AlertsService {
  constructor(private readonly prisma: PrismaService) {}

  list(userId: string) {
    return this.prisma.alert.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });
  }

  create(userId: string, dto: UpsertAlertDto) {
    return this.prisma.alert.create({
      data: {
        userId,
        name: dto.name.trim(),
        configJson: dto.configJson as Prisma.InputJsonValue,
        active: dto.active ?? true,
      },
    });
  }

  async update(userId: string, id: string, dto: Partial<UpsertAlertDto>) {
    await this.ensureOwned(userId, id);
    return this.prisma.alert.update({
      where: { id },
      data: {
        name: dto.name?.trim(),
        configJson: dto.configJson as Prisma.InputJsonValue | undefined,
        active: dto.active,
      },
    });
  }

  async remove(userId: string, id: string) {
    await this.ensureOwned(userId, id);
    await this.prisma.alert.delete({ where: { id } });
    return { ok: true };
  }

  private async ensureOwned(userId: string, id: string) {
    const row = await this.prisma.alert.findFirst({ where: { id, userId } });
    if (!row) throw new NotFoundException('Alerta não encontrado');
    return row;
  }
}
