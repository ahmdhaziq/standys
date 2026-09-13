import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UserService } from '../user/user.service';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { ValidateUser } from './types/validate';
import { AuthRepository } from './auth.repository';
import { jwtConstants } from './constants';
import { RefreshPayload } from './types/payload';
import { createHash, randomUUID, timingSafeEqual } from 'node:crypto';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly authRepository: AuthRepository,
  ) {}

  async register(dto: RegisterDto) {
    const existingUser = await this.userService.getUserByEmail(dto.email);
    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    return this.userService.createUser({
      name: dto.name,
      email: dto.email,
      password: hashedPassword,
    });
  }

  async validateUser(
    email: string,
    password: string,
  ): Promise<ValidateUser | null> {
    const user = await this.userService.getUserByEmail(email);
    if (user && (await bcrypt.compare(password, user.password))) {
      return { id: user.id, email: user.email };
    }
    return null;
  }

  private hashRefreshToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private sameTokenHash(left: string, right: string): boolean {
    const leftBuffer = Buffer.from(left);
    const rightBuffer = Buffer.from(right);
    return (
      leftBuffer.length === rightBuffer.length &&
      timingSafeEqual(leftBuffer, rightBuffer)
    );
  }

  private issueAccessToken(user: ValidateUser): string {
    return this.jwtService.sign(
      { email: user.email, sub: user.id, type: 'access' },
      {
        secret: jwtConstants.accessSecret,
        expiresIn: jwtConstants.accessExpiresIn,
      },
    );
  }

  private issueRefreshToken(user: ValidateUser, jti: string): string {
    return this.jwtService.sign(
      { email: user.email, sub: user.id, jti, type: 'refresh' },
      {
        secret: jwtConstants.refreshSecret,
        expiresIn: jwtConstants.refreshExpiresIn,
      },
    );
  }

  async login(user: ValidateUser) {
    const jti = randomUUID();
    const refreshToken = this.issueRefreshToken(user, jti);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await this.authRepository.createRefreshSession({
      userId: user.id,
      jti,
      tokenHash: this.hashRefreshToken(refreshToken),
      expiresAt,
    });

    return {
      status: 'success',
      data: {
        access_token: this.issueAccessToken(user),
        refresh_token: refreshToken,
      },
      meta: null,
    };
  }

  async validateRefreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify<RefreshPayload>(refreshToken, {
        secret: jwtConstants.refreshSecret,
      });

      if (payload.type !== 'refresh' || !payload.jti) {
        throw new Error('Invalid refresh token type');
      }

      const session = await this.authRepository.findRefreshSessionByJti(
        payload.jti,
      );
      const isActive =
        session &&
        session.user_id === payload.sub &&
        session.revoked_at === null &&
        session.expires_at.getTime() > Date.now() &&
        this.sameTokenHash(
          session.token_hash,
          this.hashRefreshToken(refreshToken),
        );

      if (!isActive) {
        throw new Error('Inactive refresh token');
      }

      return {
        status: 'success',
        data: {
          access_token: this.issueAccessToken({
            id: payload.sub,
            email: payload.email,
          }),
        },
        meta: null,
      };
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(refreshToken: string) {
    try {
      const payload = this.jwtService.verify<RefreshPayload>(refreshToken, {
        secret: jwtConstants.refreshSecret,
        ignoreExpiration: true,
      });
      if (payload.type === 'refresh' && payload.jti) {
        await this.authRepository.revokeRefreshSession(payload.jti);
      }
    } catch {
      // Logout is intentionally idempotent and does not disclose token state.
    }

    return { status: 'success', data: null, meta: null };
  }
}
