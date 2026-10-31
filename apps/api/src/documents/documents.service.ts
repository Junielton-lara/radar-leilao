import { Injectable, NotFoundException } from '@nestjs/common';
import { createHash } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { assertSafePublicUrl } from '../common/utils/url-safety.util';

@Injectable()
export class DocumentsService {
  constructor(private readonly prisma: PrismaService) {}

  listByAuction(auctionId: string) {
    return this.prisma.auctionDocument.findMany({
      where: { auctionId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        documentType: true,
        title: true,
        originalUrl: true,
        fileHash: true,
        publicationDate: true,
        createdAt: true,
        extractedText: true,
      },
    });
  }

  async processQueued(input: { documentId: string }) {
    const doc = await this.prisma.auctionDocument.findUnique({
      where: { id: input.documentId },
    });
    if (!doc?.originalUrl) {
      return { ok: false, message: 'Documento sem URL' };
    }
    const updated = await this.registerRemote({
      auctionId: doc.auctionId,
      documentType: doc.documentType,
      title: doc.title,
      originalUrl: doc.originalUrl,
    });
    await this.prisma.auctionDocument.delete({ where: { id: doc.id } }).catch(() => undefined);
    return { ok: true, documentId: updated.id };
  }

  async registerRemote(input: {
    auctionId: string;
    documentType: string;
    title: string;
    originalUrl: string;
  }) {
    const auction = await this.prisma.auction.findUnique({
      where: { id: input.auctionId },
    });
    if (!auction) throw new NotFoundException('Oportunidade não encontrada');

    const url = await assertSafePublicUrl(input.originalUrl);
    let extractedText: string | null = null;
    let fileHash: string | null = null;

    try {
      const res = await fetch(url.toString(), {
        redirect: 'follow',
        signal: AbortSignal.timeout(15000),
      });
      if (res.ok) {
        const buf = Buffer.from(await res.arrayBuffer());
        fileHash = createHash('sha256').update(buf).digest('hex');
        const contentType = res.headers.get('content-type') ?? '';
        if (contentType.includes('pdf') || url.pathname.endsWith('.pdf')) {
          try {
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            const pdfParse = require('pdf-parse') as (
              b: Buffer,
            ) => Promise<{ text: string }>;
            const parsed = await pdfParse(buf);
            extractedText = parsed.text?.slice(0, 200_000) ?? null;
          } catch {
            extractedText = null;
          }
        } else if (contentType.includes('text')) {
          extractedText = buf.toString('utf8').slice(0, 200_000);
        }
      }
    } catch {
      // keep metadata even if download fails
    }

    return this.prisma.auctionDocument.create({
      data: {
        auctionId: input.auctionId,
        documentType: input.documentType,
        title: input.title,
        originalUrl: url.toString(),
        fileHash,
        extractedText,
      },
    });
  }
}
