export const USER_FACADE_TOKEN = Symbol('IUserFacade');

export interface UserAccountDto {
  id: string;
  email: string;
  firstname: string | null;
  lastname: string | null;
  role: string;
  status: string;
  createdAt: Date;
}

export interface UpdateUserAccountDto {
  firstname?: string;
  lastname?: string;
}

export interface IUserFacade {
  getUserAccount(userId: string): Promise<UserAccountDto>;
  updateUserAccount(
    userId: string,
    dto: UpdateUserAccountDto,
  ): Promise<UserAccountDto>;
}
