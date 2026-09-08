import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { UserManagementController } from './user-management.controller';
import { UserManagementService } from './user-management.service';
import { UserFacade } from './contracts/user-facade.service';
import { USER_FACADE_TOKEN } from './contracts/user.facade.interface';

@Module({
  controllers: [UserController, UserManagementController],
  providers: [
    UserService,
    UserManagementService,
    UserFacade,
    {
      provide: USER_FACADE_TOKEN,
      useExisting: UserFacade,
    },
  ],
  exports: [USER_FACADE_TOKEN, UserFacade, UserService, UserManagementService],
})
export class UserModule {}
