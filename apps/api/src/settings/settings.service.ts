import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  decryptCredential,
  encryptCredential,
  maskSecret,
} from '../common/crypto/credentials.crypto';
import { PrismaService } from '../prisma/prisma.service';
import { AiEngineService } from '../ai-engine/ai-engine.service';
import { TavilyService } from '../tavily/tavily.service';
import { UpsertIntegrationDto } from './dto/upsert-integration.dto';

@Injectable()
export class SettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tavily: TavilyService,
    private readonly ai: AiEngineService,
  ) {}

  async product() {
    const setting = await this.prisma.systemSetting.findUnique({
      where: { key: 'product' },
    });
    return (
      setting?.valueJson ?? {
        name: 'LanceX',
        subtitle: 'Radar Inteligente de Leilões',
        byline: 'by +Gestor',
      }
    );
  }

  async integrationsStatus() {
    const rows = await this.prisma.integrationSetting.findMany({
      select: {
        provider: true,
        active: true,
        configJson: true,
        credentialsEnc: true,
        updatedAt: true,
      },
    });
    return rows.map((r) => {
      const cfg = (r.configJson ?? {}) as Record<string, unknown>;
      let maskedKey: string | null = null;
      if (r.credentialsEnc) {
        try {
          maskedKey = maskSecret(decryptCredential(r.credentialsEnc));
        } catch {
          maskedKey = '****';
        }
      }
      return {
        provider: r.provider,
        active: r.active,
        configured: Boolean(
          r.credentialsEnc ||
            (typeof cfg.configured === 'boolean' ? cfg.configured : false),
        ),
        apiKeyMasked: maskedKey,
        dailyLimit: typeof cfg.dailyLimit === 'number' ? cfg.dailyLimit : 0,
        monthlyLimit: typeof cfg.monthlyLimit === 'number' ? cfg.monthlyLimit : 0,
        baseUrl: typeof cfg.baseUrl === 'string' ? cfg.baseUrl : undefined,
        model: typeof cfg.model === 'string' ? cfg.model : undefined,
        note: typeof cfg.note === 'string' ? cfg.note : null,
        updatedAt: r.updatedAt.toISOString(),
      };
    });
  }

  private normalizeProvider(provider: string): string {
    const p = provider.trim().toLowerCase();
    if (p === 'openai' || p === 'anthropic' || p === 'llm') return 'ai';
    return p;
  }

  async upsertIntegration(dto: UpsertIntegrationDto) {
    const provider = this.normalizeProvider(dto.provider);
    const existing = await this.prisma.integrationSetting.findUnique({
      where: { provider },
    });
    const prev = (existing?.configJson ?? {}) as Record<string, unknown>;
    const configJson: Record<string, unknown> = {
      ...prev,
      ...(dto.extraConfig ?? {}),
      configured: Boolean(dto.apiKey || existing?.credentialsEnc),
      dailyLimit: dto.dailyLimit ?? prev.dailyLimit ?? 0,
      monthlyLimit: dto.monthlyLimit ?? prev.monthlyLimit ?? 0,
      disabledByLimit: false,
      note:
        dto.note?.trim() ||
        (typeof prev.note === 'string' ? prev.note : null) ||
        `Configurado via admin em ${new Date().toISOString()}`,
    };
    if (dto.baseUrl !== undefined) configJson.baseUrl = dto.baseUrl;
    if (dto.model !== undefined) configJson.model = dto.model;

    const data: Prisma.IntegrationSettingUpdateInput = {
      active: dto.active ?? existing?.active ?? false,
      configJson: configJson as Prisma.InputJsonValue,
    };

    if (dto.apiKey) {
      data.credentialsEnc = encryptCredential(dto.apiKey);
      configJson.configured = true;
      data.configJson = configJson as Prisma.InputJsonValue;
    }

    const row = existing
      ? await this.prisma.integrationSetting.update({
          where: { provider },
          data,
        })
      : await this.prisma.integrationSetting.create({
          data: {
            provider,
            active: dto.active ?? false,
            credentialsEnc: dto.apiKey
              ? encryptCredential(dto.apiKey)
              : undefined,
            configJson: configJson as Prisma.InputJsonValue,
          },
        });

    // Never return full key
    return {
      provider: row.provider,
      active: row.active,
      configured: Boolean(row.credentialsEnc),
      apiKeyMasked: dto.apiKey
        ? maskSecret(dto.apiKey)
        : maskSecret(
            row.credentialsEnc
              ? (() => {
                  try {
                    return decryptCredential(row.credentialsEnc);
                  } catch {
                    return null;
                  }
                })()
              : null,
          ),
      dailyLimit: configJson.dailyLimit,
      monthlyLimit: configJson.monthlyLimit,
      baseUrl: configJson.baseUrl,
      model: configJson.model,
      note: configJson.note ?? null,
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async getIntegration(provider: string) {
    const rows = await this.integrationsStatus();
    const normalized = this.normalizeProvider(provider);
    const hit = rows.find((r) => r.provider === normalized);
    if (!hit) throw new NotFoundException('Integração não encontrada');
    return hit;
  }

  async testIntegration(provider: string) {
    const p = this.normalizeProvider(provider);
    if (p === 'tavily') {
      return this.tavily.testConnection();
    }
    if (p === 'ai') {
      return this.ai.testConnection();
    }
    throw new NotFoundException('Provider não suportado para teste');
  }
}
