import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { UserRepository } from './user.repository';
import { PrismaModule } from 'src/infrastructure/prisma/prisma.module';

@Module({
  providers: [UserService, UserRepository],
  controllers: [UserController],
  exports: [UserService],
  imports: [PrismaModule],
})
export class UserModule {}
