import { ConflictException, Injectable } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt/dist/jwt.service';
import { ValidateUser } from './types/validate';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
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
      const result: ValidateUser = {
        id: user.id,
        email: user.email,
      };
      return result;
    }
    return null;
  }

  async login(user: ValidateUser): Promise<any> {
    const payload = { email: user.email, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
