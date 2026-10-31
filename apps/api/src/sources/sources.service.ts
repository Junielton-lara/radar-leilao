import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { slugify } from '../common/utils/slug.util';
import { CreateSourceDto } from './dto/create-source.dto';
import { UpdateSourceDto } from './dto/update-source.dto';

@Injectable()
export class SourcesService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.source.findMany({ orderBy: [{ priority: 'desc' }, { name: 'asc' }] });
  }

  async findById(id: string) {
    const row = await this.prisma.source.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Fonte não encontrada');
    return row;
  }

  async create(dto: CreateSourceDto) {
    const slug = dto.slug?.trim() || slugify(dto.name);
    try {
      return await this.prisma.source.create({
        data: {
          name: dto.name,
          slug,
          url: dto.url,
          sourceType: dto.sourceType,
          category: dto.category,
          geographicScope: dto.geographicScope,
          priority: dto.priority ?? 50,
          frequencyMinutes: dto.frequencyMinutes ?? 1440,
          status: dto.status ?? 'active',
          configJson: (dto.configJson as Prisma.InputJsonValue) ?? undefined,
        },
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException('Slug de fonte já existe');
      }
      throw e;
    }
  }

  async update(id: string, dto: UpdateSourceDto) {
    await this.findById(id);
    return this.prisma.source.update({
      where: { id },
      data: {
        name: dto.name,
        slug: dto.slug,
        url: dto.url,
        sourceType: dto.sourceType,
        category: dto.category,
        geographicScope: dto.geographicScope,
        priority: dto.priority,
        frequencyMinutes: dto.frequencyMinutes,
        status: dto.status,
        configJson: dto.configJson as Prisma.InputJsonValue | undefined,
      },
    });
  }

  async remove(id: string) {
    await this.findById(id);
    await this.prisma.source.delete({ where: { id } });
    return { ok: true };
  }

  async markRun(id: string, successRate?: number) {
    return this.prisma.source.update({
      where: { id },
      data: {
        lastRunAt: new Date(),
        successRate: successRate ?? undefined,
      },
    });
  }
}
