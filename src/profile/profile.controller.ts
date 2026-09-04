import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ProfileService } from './profile.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { CurrentAdmin } from '../common/decorators/current-admin.decorator';

@ApiTags('Profile')
@ApiBearerAuth()
@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  getProfile(@CurrentAdmin('id') adminId: string) {
    return this.profileService.getProfile(adminId);
  }

  @Patch()
  updateProfile(@CurrentAdmin('id') adminId: string, @Body() dto: UpdateProfileDto) {
    return this.profileService.updateProfile(adminId, dto);
  }

  @Patch('password')
  changePassword(@CurrentAdmin('id') adminId: string, @Body() dto: ChangePasswordDto) {
    return this.profileService.changePassword(adminId, dto);
  }
}
