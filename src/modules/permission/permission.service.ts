import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreatePermissionDto } from './dto/create-permission.dto.js';
import { UpdatePermissionDto } from './dto/update-permission.dto.js';
import { PrismaService } from '../../database/database.service.js';

@Injectable()
export class PermissionService {
  constructor(private readonly prisma: PrismaService) {}

  create(createPermissionDto: CreatePermissionDto) {
    return this.prisma.permission.create({
      data: createPermissionDto,
      select: this.permissionSelect,
    });
  }

  findAll() {
    return this.prisma.permission.findMany({
      orderBy: { code: 'asc' },
      select: this.permissionSelect,
    });
  }

  async findOne(id: string) {
    const permission = await this.prisma.permission.findUnique({
      where: { id },
      select: this.permissionSelect,
    });

    if (!permission) {
      throw new NotFoundException(`Permission with id "${id}" not found`);
    }

    return permission;
  }

  async update(id: string, updatePermissionDto: UpdatePermissionDto) {
    await this.findOne(id);

    return this.prisma.permission.update({
      where: { id },
      data: updatePermissionDto,
      select: this.permissionSelect,
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    try {
      await this.prisma.permission.delete({ where: { id } });
    } catch {
      throw new ConflictException('Permission could not be deleted');
    }

    return { message: 'Permission deleted successfully' };
  }

  private readonly permissionSelect = {
    id: true,
    code: true,
    name: true,
    description: true,
    createdAt: true,
    updatedAt: true,
  } as const;
}
