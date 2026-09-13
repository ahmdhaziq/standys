/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthRepository } from './auth.repository';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';

describe('AuthService', () => {
  let service: AuthService;
  const userService = {
    getUserByEmail: jest.fn(),
    createUser: jest.fn(),
  };
  const jwtService = {
    sign: jest.fn((payload: { type: string }) =>
      payload.type === 'refresh' ? 'refresh-token' : 'access-token',
    ),
    verify: jest.fn(),
  };
  const authRepository = {
    createRefreshSession: jest.fn(),
    findRefreshSessionByJti: jest.fn(),
    revokeRefreshSession: jest.fn(),
  };

  beforeAll(() => {
    process.env.JWT_ACCESS_SECRET = 'test-access-secret';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserService, useValue: userService },
        { provide: JwtService, useValue: jwtService },
        { provide: AuthRepository, useValue: authRepository },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('issues access and refresh tokens and persists only refresh metadata on login', async () => {
    const user = { id: 7, email: 'user@example.com' };

    const result = await service.login(user);

    expect(result.data).toEqual({
      access_token: 'access-token',
      refresh_token: 'refresh-token',
    });
    expect(authRepository.createRefreshSession).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: user.id,
        tokenHash: expect.any(String),
        expiresAt: expect.any(Date),
        jti: expect.any(String),
      }),
    );
    expect(jwtService.sign).toHaveBeenCalledTimes(2);
  });

  it('validates an active refresh token and issues a new access token', async () => {
    jwtService.verify.mockReturnValue({
      sub: 7,
      email: 'user@example.com',
      jti: 'session-id',
      type: 'refresh',
    });
    authRepository.findRefreshSessionByJti.mockResolvedValue({
      user_id: 7,
      token_hash: 'invalid-for-this-test',
      expires_at: new Date(Date.now() + 60_000),
      revoked_at: null,
    });

    const loginResult = await service.login({
      id: 7,
      email: 'user@example.com',
    });
    const storedHash = authRepository.createRefreshSession.mock.calls[0][0]
      .tokenHash as string;
    authRepository.findRefreshSessionByJti.mockResolvedValue({
      user_id: 7,
      token_hash: storedHash,
      expires_at: new Date(Date.now() + 60_000),
      revoked_at: null,
    });

    const result = await service.validateRefreshToken(
      loginResult.data.refresh_token,
    );

    expect(result.data.access_token).toBe('access-token');
  });

  it('rejects an inactive refresh token without exposing validation details', async () => {
    jwtService.verify.mockReturnValue({
      sub: 7,
      email: 'user@example.com',
      jti: 'session-id',
      type: 'refresh',
    });
    authRepository.findRefreshSessionByJti.mockResolvedValue(null);

    await expect(service.validateRefreshToken('invalid-token')).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it.each([
    ['expired', new Date(Date.now() - 60_000), null],
    ['revoked', new Date(Date.now() + 60_000), new Date()],
  ])('rejects a %s refresh session', async (_name, expiresAt, revokedAt) => {
    jwtService.verify.mockReturnValue({
      sub: 7,
      email: 'user@example.com',
      jti: 'session-id',
      type: 'refresh',
    });
    authRepository.findRefreshSessionByJti.mockResolvedValue({
      user_id: 7,
      token_hash: 'hash',
      expires_at: expiresAt,
      revoked_at: revokedAt,
    });

    await expect(service.validateRefreshToken('refresh-token')).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('revokes a valid refresh session during logout', async () => {
    jwtService.verify.mockReturnValue({
      sub: 7,
      email: 'user@example.com',
      jti: 'session-id',
      type: 'refresh',
    });

    await service.logout('refresh-token');

    expect(authRepository.revokeRefreshSession).toHaveBeenCalledWith(
      'session-id',
    );
  });
});
