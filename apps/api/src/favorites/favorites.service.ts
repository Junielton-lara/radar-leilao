import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FavoritesService {
  constructor(private readonly prisma: PrismaService) {}

  list(userId: string) {
    return this.prisma.userFavorite.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        auction: {
          select: {
            id: true,
            title: true,
            slug: true,
            state: true,
            city: true,
            minimumBid: true,
            endDate: true,
            verificationStatus: true,
            category: { select: { id: true, name: true, slug: true } },
          },
        },
      },
    });
  }

  async add(userId: string, auctionId: string) {
    const auction = await this.prisma.auction.findUnique({
      where: { id: auctionId },
      select: { id: true },
    });
    if (!auction) throw new NotFoundException('Oportunidade não encontrada');
    try {
      return await this.prisma.userFavorite.create({
        data: { userId, auctionId },
        include: {
          auction: {
            select: {
              id: true,
              title: true,
              state: true,
              city: true,
              verificationStatus: true,
            },
          },
        },
      });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new ConflictException('Já está nos favoritos');
      }
      throw e;
    }
  }

  async remove(userId: string, auctionId: string) {
    const result = await this.prisma.userFavorite.deleteMany({
      where: { userId, auctionId },
    });
    if (result.count === 0) {
      throw new NotFoundException('Favorito não encontrado');
    }
    return { ok: true };
  }
}
