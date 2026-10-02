import { Injectable, NotFoundException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { PrismaService } from '../../database/database.service.js';


@Injectable()
export class UserService {
  private readonly publicUserSelect = {
    id: true,
    email: true,
    createdAt: true,
    updatedAt: true,
    role: {
      select: {
        id: true,
        code: true,
        name: true,
      },
    },
  } as const;

  constructor(private readonly prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    const password = await this.hashPassword(createUserDto.password);

    return this.prisma.user.create({
      data: {
        email: createUserDto.email,
        password,
        role: {
          connect: { code: 'user' },
        },
      },
      select: this.publicUserSelect,
    });
  }

  findAll() {
    return this.prisma.user.findMany({
      select: this.publicUserSelect,
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: this.publicUserSelect,
    });

    if (!user) {
      throw new NotFoundException(`User with id "${id}" not found`);
    }

    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    await this.findOne(id);

    const data: {
      email?: string;
      password?: string;
      role?: { connect: { code: string } };
    } = {};

    if (updateUserDto.email !== undefined) {
      data.email = updateUserDto.email;
    }

    if (updateUserDto.password !== undefined) {
      data.password = await this.hashPassword(updateUserDto.password);
    }

    if (updateUserDto.roleCode !== undefined) {
      data.role = { connect: { code: updateUserDto.roleCode } };
    }

    return this.prisma.user.update({
      where: { id },
      data,
      select: this.publicUserSelect,
    });
  }

  async remove(id: string) {
    const result = await this.prisma.user.deleteMany({
      where: { id },
    });

    if (result.count === 0) {
      throw new NotFoundException(`User with id "${id}" not found`);
    }

    return { message: 'User deleted successfully' };
  }

  private hashPassword(password: string) {
    return argon2.hash(password);
  }
}
