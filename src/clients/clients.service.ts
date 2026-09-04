import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ClientStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { QueryClientDto } from './dto/query-client.dto';
import { buildPaginationMeta } from '../common/dto/pagination.dto';

@Injectable()
export class ClientsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateClientDto) {
    return this.prisma.client.create({ data: dto });
  }

  async findAll(query: QueryClientDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const where: Prisma.ClientWhereInput = {
      status: query.status,
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' } },
              { companyName: { contains: query.search, mode: 'insensitive' } },
              { email: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.client.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [query.sortBy || 'createdAt']: query.sortOrder || 'desc' },
        include: { _count: { select: { projects: true } } },
      }),
      this.prisma.client.count({ where }),
    ]);

    return { items, meta: buildPaginationMeta(page, limit, total) };
  }

  async findOne(id: string) {
    const client = await this.prisma.client.findUnique({
      where: { id },
      include: {
        projects: {
          select: {
            id: true,
            name: true,
            projectCode: true,
            status: true,
            health: true,
            progressPercentage: true,
          },
        },
        _count: { select: { projects: true } },
      },
    });
    if (!client) {
      throw new NotFoundException('Client not found.');
    }
    return client;
  }

  async update(id: string, dto: UpdateClientDto) {
    await this.ensureExists(id);
    return this.prisma.client.update({ where: { id }, data: dto });
  }

  async archive(id: string) {
    await this.ensureExists(id);
    return this.prisma.client.update({
      where: { id },
      data: { status: ClientStatus.ARCHIVED, archivedAt: new Date() },
    });
  }

  async remove(id: string) {
    const client = await this.prisma.client.findUnique({
      where: { id },
      include: { _count: { select: { projects: true } } },
    });
    if (!client) {
      throw new NotFoundException('Client not found.');
    }

    if (client._count.projects > 0) {
      throw new ConflictException(
        'This client has project history and cannot be permanently deleted. Archive the client instead.',
      );
    }

    await this.prisma.client.delete({ where: { id } });
    return { message: 'Client deleted.' };
  }

  private async ensureExists(id: string) {
    const client = await this.prisma.client.findUnique({ where: { id } });
    if (!client) {
      throw new NotFoundException('Client not found.');
    }
    return client;
  }
}
