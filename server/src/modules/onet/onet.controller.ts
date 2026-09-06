import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { ApiCommonErrors } from '@core/common/swagger/api-error-responses.decorator';
import { OnetService } from './onet.service';
import { SearchOnetOccupationsDto } from './dto/search-onet-occupations.dto';
import { GetOnetTechParamDto } from './dto/get-onet-tech-param.dto';

@Controller('onet')
@ApiTags('O*NET')
@ApiCookieAuth('cookieAuth')
export class OnetController {
  constructor(private readonly onetService: OnetService) {}

  @Get('occupations')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Search O*NET occupations by title or keyword' })
  @ApiOkResponse({ description: 'List of matching O*NET occupations' })
  @ApiCommonErrors(401)
  async searchOccupations(@Query() dto: SearchOnetOccupationsDto) {
    return this.onetService.searchOccupations(dto.query, dto.limit ?? 10);
  }

  @Get('occupations/:socCode/tech')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get tools and technology for an O*NET SOC code' })
  @ApiParam({ name: 'socCode', example: '15-1252.00' })
  @ApiOkResponse({ description: 'Tools and technology list' })
  @ApiCommonErrors(400, 401)
  async getToolsAndTechnology(@Param() params: GetOnetTechParamDto) {
    return this.onetService.getToolsAndTechnology(params.socCode);
  }
}
