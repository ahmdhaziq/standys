import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  const authService = {
    register: jest.fn(),
    login: jest.fn(),
    validateRefreshToken: jest.fn(),
    logout: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('delegates refresh validation using the DTO token', async () => {
    authService.validateRefreshToken.mockResolvedValue({ status: 'success' });

    await controller.refresh({ refresh_token: 'refresh-token' });

    expect(authService.validateRefreshToken).toHaveBeenCalledWith(
      'refresh-token',
    );
  });

  it('delegates login and logout to AuthService', async () => {
    await controller.login({ user: { id: 1, email: 'user@example.com' } });
    await controller.logout({ refresh_token: 'refresh-token' });

    expect(authService.login).toHaveBeenCalledWith({
      id: 1,
      email: 'user@example.com',
    });
    expect(authService.logout).toHaveBeenCalledWith('refresh-token');
  });
});
