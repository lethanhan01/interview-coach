import { Injectable } from '@nestjs/common';
import { UserService } from '../user.service';
import {
  IUserFacade,
  UserAccountDto,
  UpdateUserAccountDto,
} from './user.facade.interface';

@Injectable()
export class UserFacade implements IUserFacade {
  constructor(private readonly userService: UserService) {}

  getUserAccount(userId: string): Promise<UserAccountDto> {
    return this.userService.getAccount(userId);
  }

  updateUserAccount(
    userId: string,
    dto: UpdateUserAccountDto,
  ): Promise<UserAccountDto> {
    return this.userService.updateAccount(userId, dto);
  }
}
