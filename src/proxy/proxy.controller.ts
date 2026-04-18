import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ProxyService } from './proxy.service';
import type { Meta } from '../interfaces/meta.interface';
import { VerifyWebhookQueryDto } from './dto/query/verify-webhook.dto';
import { PhoneConfigBodyDto } from './dto/body/phone-config.dto';
import { PhoneNumberParamsDto } from './dto/param/phone-number-params.dto';
import { ReceiveWebhookResponseDto } from './dto/response/receive-webhook.dto';
import { SetConfigResponseDto } from './dto/response/set-config.dto';
import { GetAllConfigsResponseDto } from './dto/response/get-all-configs.dto';
import { GetConfigResponseDto } from './dto/response/get-config.dto';
import { DeleteConfigResponseDto } from './dto/response/delete-config.dto';

@Controller('proxy')
export class ProxyController {
  constructor(private readonly proxyService: ProxyService) {}

  @Get('webhook')
  verifyWebhook(@Query() query: VerifyWebhookQueryDto): string {
    return this.proxyService.verifyWebhook(query);
  }

  @Post('webhook')
  @HttpCode(200)
  receiveWebhook(@Body() payload: Meta): ReceiveWebhookResponseDto {
    return this.proxyService.receiveWebhook(payload);
  }

  @Get('config')
  getAllConfigs(): Promise<GetAllConfigsResponseDto> {
    return this.proxyService.getAllConfigsResponse();
  }

  @Get('config/:phoneNumberId')
  getConfig(@Param() params: PhoneNumberParamsDto): Promise<GetConfigResponseDto> {
    return this.proxyService.getConfigResponse(params.phoneNumberId);
  }

  @Post('config/:phoneNumberId')
  setConfig(@Param() params: PhoneNumberParamsDto, @Body() body: PhoneConfigBodyDto): Promise<SetConfigResponseDto> {
    return this.proxyService.setConfig(params.phoneNumberId, body);
  }

  @Delete('config/:phoneNumberId')
  deleteConfig(@Param() params: PhoneNumberParamsDto): Promise<DeleteConfigResponseDto> {
    return this.proxyService.deleteConfigResponse(params.phoneNumberId);
  }
}