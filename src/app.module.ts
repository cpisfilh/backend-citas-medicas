import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from './modules/user/user.module.js';
import { AuthModule } from './modules/auth/auth.module.js';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), UserModule, AuthModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
