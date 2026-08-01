import {
  Controller,
  Body,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AdminService } from './admin.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.admin)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  /** List all users (admin only) */
  @Get('users')
  @HttpCode(HttpStatus.OK)
  async listUsers() {
    const users = await this.adminService.listUsers();
    return { success: true, data: users };
  }

  /** Get single user by ID */
  @Get('users/:id')
  @HttpCode(HttpStatus.OK)
  async getUser(@Param('id', ParseUUIDPipe) id: string) {
    const user = await this.adminService.getUser(id);
    if (!user) throw new NotFoundException('User not found');
    return { success: true, data: user };
  }

  /** Update account role or lifecycle status. */
  @Patch('users/:id')
  @HttpCode(HttpStatus.OK)
  async updateUser(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: { user: { id: string } },
    @Body() body: UpdateUserDto,
  ) {
    const user = await this.adminService.updateUser(id, req.user.id, body);
    return { success: true, data: user };
  }

  /** Delete a user account */
  @Delete('users/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteUser(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: { user: { id: string } },
  ) {
    await this.adminService.deleteUser(id, req.user.id);
  }
}
