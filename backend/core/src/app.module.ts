import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { ConfigModule } from '@nestjs/config';
import { DailyTasksModule } from './modules/daily-tasks/daily-tasks.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AuthModule,
    TasksModule,
    UserModule,
    DailyTasksModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
