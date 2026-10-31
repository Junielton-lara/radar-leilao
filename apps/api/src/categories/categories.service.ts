import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async listTree() {
    const categories = await this.prisma.auctionCategory.findMany({
      orderBy: { name: 'asc' },
    });
    const byParent = new Map<string | null, typeof categories>();
    for (const cat of categories) {
      const key = cat.parentId;
      const list = byParent.get(key) ?? [];
      list.push(cat);
      byParent.set(key, list);
    }

    const build = (parentId: string | null): unknown[] =>
      (byParent.get(parentId) ?? []).map((cat) => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        parentId: cat.parentId,
        color: cat.color,
        icon: cat.icon,
        children: build(cat.id),
      }));

    return build(null);
  }

  listFlat() {
    return this.prisma.auctionCategory.findMany({ orderBy: { name: 'asc' } });
  }
}
