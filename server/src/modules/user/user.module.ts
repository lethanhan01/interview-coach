import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { UserFacade } from './contracts/user-facade.service';
import { USER_FACADE_TOKEN } from './contracts/user.facade.interface';

@Module({
  controllers: [UserController],
  providers: [
    UserService,
    UserFacade,
    {
      provide: USER_FACADE_TOKEN,
      useExisting: UserFacade,
    },
  ],
  exports: [USER_FACADE_TOKEN, UserFacade, UserService],
})
export class UserModule {}
