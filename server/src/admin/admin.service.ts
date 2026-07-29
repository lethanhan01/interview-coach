import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async listUsers(includeDeleted = false) {
    return this.prisma.user.findMany({
      where: includeDeleted ? {} : { status: { not: 'deleted' } },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getUser(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        profile: {
          select: { fullName: true },
        },
      },
    });
  }

  async toggleUserStatus(id: string, actorId: string) {
    await this.assertAdminCanManage(id, actorId);
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    const newStatus = user.status === 'active' ? 'locked' : 'active';
    return this.prisma.user.update({
      where: { id },
      data: { status: newStatus },
      select: { id: true, email: true, role: true, status: true },
    });
  }

  async deleteUser(id: string, actorId: string) {
    await this.assertAdminCanManage(id, actorId);
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user || user.status === 'deleted') throw new NotFoundException('User not found');
    await this.prisma.user.update({ where: { id }, data: { status: 'deleted' } });
  }

  private async assertAdminCanManage(id: string, actorId: string): Promise<void> {
    if (id === actorId) {
      throw new BadRequestException('Administrators cannot manage their own account');
    }
    const target = await this.prisma.user.findUnique({ where: { id } });
    if (!target) throw new NotFoundException('User not found');
    if (target.role === UserRole.admin) {
      const adminCount = await this.prisma.user.count({
        where: { role: UserRole.admin, status: { not: 'deleted' } },
      });
      if (adminCount <= 1) {
        throw new BadRequestException('The last active administrator cannot be managed');
      }
    }
  }
}
