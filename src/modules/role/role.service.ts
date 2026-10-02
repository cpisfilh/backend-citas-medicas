import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateRoleDto } from './dto/create-role.dto.js';
import { UpdateRoleDto } from './dto/update-role.dto.js';
import { PrismaService } from '../../database/database.service.js';

@Injectable()
export class RoleService {
  constructor(private readonly prisma: PrismaService) {}

  create(createRoleDto: CreateRoleDto) {
    const { permissionCodes, ...roleData } = createRoleDto;

    return this.prisma.$transaction(async (tx) => {
      const permissionIds = await this.getPermissionIds(tx, permissionCodes);

      return tx.role.create({
        data: {
          ...roleData,
          permissions: permissionIds.length
            ? { create: permissionIds.map((permissionId) => ({ permissionId })) }
            : undefined,
        },
        select: this.roleSelect,
      });
    });
  }

  findAll() {
    return this.prisma.role.findMany({
      orderBy: { code: 'asc' },
      select: this.roleSelect,
    });
  }

  async findOne(id: string) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      select: this.roleSelect,
    });

    if (!role) {
      throw new NotFoundException(`Role with id "${id}" not found`);
    }

    return role;
  }

  async update(id: string, updateRoleDto: UpdateRoleDto) {
    await this.findOne(id);
    const { permissionCodes, ...roleData } = updateRoleDto;

    return this.prisma.$transaction(async (tx) => {
      const permissionIds = await this.getPermissionIds(tx, permissionCodes);

      await tx.role.update({
        where: { id },
        data: roleData,
      });

      if (permissionCodes !== undefined) {
        await tx.rolePermission.deleteMany({ where: { roleId: id } });
        if (permissionIds.length) {
          await tx.rolePermission.createMany({
            data: permissionIds.map((permissionId) => ({ roleId: id, permissionId })),
          });
        }
      }

      return tx.role.findUniqueOrThrow({
        where: { id },
        select: this.roleSelect,
      });
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    try {
      await this.prisma.role.delete({ where: { id } });
    } catch {
      throw new BadRequestException('Role cannot be deleted while it has users assigned');
    }

    return { message: 'Role deleted successfully' };
  }

  private readonly roleSelect = {
    id: true,
    code: true,
    name: true,
    description: true,
    createdAt: true,
    updatedAt: true,
    permissions: {
      select: {
        permission: {
          select: {
            id: true,
            code: true,
            name: true,
            description: true,
          },
        },
      },
    },
  } as const;

  private async getPermissionIds(
    tx: Parameters<Parameters<PrismaService['$transaction']>[0]>[0],
    permissionCodes?: string[],
  ) {
    if (permissionCodes === undefined || permissionCodes.length === 0) {
      return [];
    }

    const permissions = await tx.permission.findMany({
      where: { code: { in: [...new Set(permissionCodes)] } },
      select: { id: true, code: true },
    });

    if (permissions.length !== new Set(permissionCodes).size) {
      const foundCodes = new Set(permissions.map((permission) => permission.code));
      const missingCodes = [...new Set(permissionCodes)].filter((code) => !foundCodes.has(code));
      throw new BadRequestException(`Unknown permission codes: ${missingCodes.join(', ')}`);
    }

    return permissions.map((permission) => permission.id);
  }
}
