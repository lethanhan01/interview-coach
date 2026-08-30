import { AccountStatus, UserRole } from '@prisma/client';
import { AdminService } from './admin.service';
import { createMockPrismaService } from '@core/test-utils/mock-factories';

describe('AdminService', () => {
  const target = {
    id: 'target',
    role: UserRole.candidate,
    status: AccountStatus.active,
  };
  let prisma: ReturnType<typeof createMockPrismaService>;
  let service: AdminService;

  beforeEach(() => {
    prisma = createMockPrismaService();
    service = new AdminService(prisma as never);
  });

  it('rejects self-management before changing an account', async () => {
    await expect(
      service.updateUser('admin', 'admin', { status: AccountStatus.locked }),
    ).rejects.toThrow('Administrators cannot manage their own account');
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('protects the last active administrator', async () => {
    prisma.user.findUnique.mockResolvedValue({
      ...target,
      role: UserRole.admin,
    });
    prisma.user.count.mockResolvedValue(1);

    await expect(service.deleteUser('target', 'other-admin')).rejects.toThrow(
      'The last active administrator cannot be managed',
    );
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('invalidates existing sessions when an admin changes account access', async () => {
    prisma.user.findUnique.mockResolvedValue(target);
    prisma.user.update.mockResolvedValue({
      ...target,
      status: AccountStatus.locked,
    });

    await service.updateUser('target', 'admin', {
      status: AccountStatus.locked,
    });

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'target' },
      data: {
        status: AccountStatus.locked,
        tokenVersion: { increment: 1 },
      },
      select: { id: true, email: true, role: true, status: true },
    });
  });

  it('soft-deletes accounts and invalidates their sessions', async () => {
    prisma.user.findUnique.mockResolvedValue(target);

    await service.deleteUser('target', 'admin');

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'target' },
      data: {
        status: AccountStatus.deleted,
        tokenVersion: { increment: 1 },
      },
    });
  });
});
