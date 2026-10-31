import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  list(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async markRead(userId: string, id: string) {
    await this.prisma.notification.updateMany({
      where: { id, userId },
      data: { readAt: new Date() },
    });
    return { ok: true };
  }

  create(input: {
    userId: string;
    title: string;
    body?: string;
    type: string;
    metaJson?: object;
  }) {
    return this.prisma.notification.create({
      data: {
        userId: input.userId,
        title: input.title,
        body: input.body,
        type: input.type,
        metaJson: input.metaJson,
      },
    });
  }

  async processAlertJob(data: Record<string, unknown>) {
    const userId = data.userId ? String(data.userId) : null;
    if (!userId) return { ok: false, message: 'userId ausente' };
    await this.create({
      userId,
      title: String(data.title ?? 'Alerta LanceX'),
      body: data.body ? String(data.body) : undefined,
      type: String(data.type ?? 'alert'),
      metaJson: data.metaJson as object | undefined,
    });
    return { ok: true };
  }
}
