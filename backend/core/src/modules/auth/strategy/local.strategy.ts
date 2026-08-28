import { Injectable } from '@nestjs/common';
import { Strategy } from 'passport-local';
import { AuthService } from '../auth.service';
import { PassportStrategy } from '@nestjs/passport';
import { ValidateUser } from '../types/validate';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super({
      usernameField: 'email',
    });
  }

  async validate(
    email: string,
    password: string,
  ): Promise<ValidateUser | null> {
    const auth = await this.authService.validateUser(email, password);
    if (!auth) {
      throw new Error('Invalid credentials');
    }
    return auth;
  }
}
