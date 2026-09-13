/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/unbound-method */
import { AuthRepository } from './auth.repository';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';

describe('AuthRepository', () => {
  const prisma = {
    refresh_sessions: {
      create: jest.fn(),
      findUnique: jest.fn(),
      updateMany: jest.fn(),
    },
  } as unknown as PrismaService;
  const repository = new AuthRepository(prisma);

  beforeEach(() => jest.clearAllMocks());

  it('creates a refresh session without accepting a raw token field', async () => {
    await repository.createRefreshSession({
      userId: 1,
      jti: 'session-id',
      tokenHash: 'hash',
      expiresAt: new Date('2026-09-20T00:00:00.000Z'),
    });

    expect(prisma.refresh_sessions.create).toHaveBeenCalledWith({
      data: {
        user_id: 1,
        jti: 'session-id',
        token_hash: 'hash',
        expires_at: new Date('2026-09-20T00:00:00.000Z'),
      },
    });
  });

  it('finds and revokes only the requested active session', async () => {
    await repository.findRefreshSessionByJti('session-id');
    await repository.revokeRefreshSession('session-id');

    expect(prisma.refresh_sessions.findUnique).toHaveBeenCalledWith({
      where: { jti: 'session-id' },
    });
    expect(prisma.refresh_sessions.updateMany).toHaveBeenCalledWith({
      where: { jti: 'session-id', revoked_at: null },
      data: { revoked_at: expect.any(Date) },
    });
  });
});
