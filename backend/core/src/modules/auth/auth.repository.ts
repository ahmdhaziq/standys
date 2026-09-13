import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';

@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createRefreshSession(data: {
    userId: number;
    jti: string;
    tokenHash: string;
    expiresAt: Date;
  }) {
    return this.prisma.refresh_sessions.create({
      data: {
        user_id: data.userId,
        jti: data.jti,
        token_hash: data.tokenHash,
        expires_at: data.expiresAt,
      },
    });
  }

  async findRefreshSessionByJti(jti: string) {
    return this.prisma.refresh_sessions.findUnique({
      where: { jti },
    });
  }

  async revokeRefreshSession(jti: string) {
    return this.prisma.refresh_sessions.updateMany({
      where: { jti, revoked_at: null },
      data: { revoked_at: new Date() },
    });
  }
}
