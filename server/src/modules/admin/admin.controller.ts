import {
  Controller,
  Body,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { ErrorCode } from '@core/common/exceptions/error-code.enum';
import { InterviewAIException } from '@core/common/exceptions/interview-ai.exception';
import { Roles, CurrentUser } from '@core/common/decorators';
import { AdminService } from './admin.service';
import { UpdateUserDto } from './dto/update-user.dto';
import {
  ApiCookieAuth,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { ApiCommonErrors } from '@core/common/swagger/api-error-responses.decorator';

@Controller('admin')
@Roles(UserRole.admin)
@ApiTags('Admin')
@ApiCookieAuth('cookieAuth')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  /** List all users (admin only) */
  @Get('users')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List users (admin only)' })
  @ApiOkResponse({ description: 'User list.' })
  @ApiCommonErrors(HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN)
  async listUsers() {
    const users = await this.adminService.listUsers();
    return { success: true, data: users };
  }

  /** Get single user by ID */
  @Get('users/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a user (admin only)' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'User.' })
  @ApiCommonErrors(
    HttpStatus.BAD_REQUEST,
    HttpStatus.UNAUTHORIZED,
    HttpStatus.FORBIDDEN,
    HttpStatus.NOT_FOUND,
  )
  async getUser(@Param('id', ParseUUIDPipe) id: string) {
    const user = await this.adminService.getUser(id);
    if (!user) {
      throw new InterviewAIException(
        ErrorCode.USER_NOT_FOUND,
        HttpStatus.NOT_FOUND,
        'User not found',
      );
    }
    return { success: true, data: user };
  }

  /** Update account role or lifecycle status. */
  @Patch('users/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update account role or lifecycle status (admin only)',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'Updated user.' })
  @ApiCommonErrors(
    HttpStatus.BAD_REQUEST,
    HttpStatus.UNAUTHORIZED,
    HttpStatus.FORBIDDEN,
    HttpStatus.NOT_FOUND,
  )
  async updateUser(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') currentUserId: string,
    @Body() body: UpdateUserDto,
  ) {
    const user = await this.adminService.updateUser(id, currentUserId, body);
    return { success: true, data: user };
  }

  /** Delete a user account */
  @Delete('users/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a user account (admin only)' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiNoContentResponse({ description: 'User deleted.' })
  @ApiCommonErrors(
    HttpStatus.BAD_REQUEST,
    HttpStatus.UNAUTHORIZED,
    HttpStatus.FORBIDDEN,
    HttpStatus.NOT_FOUND,
  )
  async deleteUser(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') currentUserId: string,
  ) {
    await this.adminService.deleteUser(id, currentUserId);
  }
}
