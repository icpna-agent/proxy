import { Inject, Injectable, Logger, ForbiddenException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { firstValueFrom } from 'rxjs';
import type { Meta } from '../interfaces/meta.interface';
import { PhoneConfig } from '../interfaces/proxy-config.interface';
import { VerifyWebhookQueryDto } from './dto/query/verify-webhook.dto';
import { PhoneConfigBodyDto } from './dto/body/phone-config.dto';
import { ReceiveWebhookResponseDto } from './dto/response/receive-webhook.dto';
import { SetConfigResponseDto } from './dto/response/set-config.dto';
import { GetAllConfigsResponseDto } from './dto/response/get-all-configs.dto';
import { GetConfigResponseDto } from './dto/response/get-config.dto';
import { DeleteConfigResponseDto } from './dto/response/delete-config.dto';

@Injectable()
export class ProxyService {
  private readonly logger = new Logger(ProxyService.name);

  constructor(
    private readonly httpService: HttpService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  private get configCacheKey(): string {
    return process.env.PROXY_CONFIG_CACHE_KEY;
  }

  async getAllConfigs(): Promise<Record<string, PhoneConfig>> {
    const configs = await this.cacheManager.get<Record<string, PhoneConfig>>(
      this.configCacheKey,
    );
    return configs ?? {};
  }

  async getPhoneConfig(
    phoneNumberId: string,
  ): Promise<PhoneConfig | undefined> {
    const allConfigs = await this.getAllConfigs();
    return allConfigs[phoneNumberId];
  }

  async setPhoneConfig(
    phoneNumberId: string,
    config: PhoneConfig,
  ): Promise<void> {
    const allConfigs = await this.getAllConfigs();
    allConfigs[phoneNumberId] = config;
    await this.cacheManager.set(this.configCacheKey, allConfigs, 0);
    this.logger.log(
      `Config guardada para phone_number_id: ${phoneNumberId} → prod: ${config.url_webhook_prod}, dev_users: ${config.dev_users.length}`,
    );
  }

  async deletePhoneConfig(phoneNumberId: string): Promise<boolean> {
    const allConfigs = await this.getAllConfigs();
    if (!allConfigs[phoneNumberId]) return false;
    delete allConfigs[phoneNumberId];
    await this.cacheManager.set(this.configCacheKey, allConfigs, 0);
    this.logger.log(`Config eliminada para phone_number_id: ${phoneNumberId}`);
    return true;
  }

  // Meta
  verifyWebhook(query: VerifyWebhookQueryDto): string {
    const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

    if (
      query['hub.mode'] === 'subscribe' &&
      query['hub.verify_token'] === VERIFY_TOKEN
    ) {
      this.logger.log('✅ Webhook verificado correctamente');
      return query['hub.challenge'];
    }

    this.logger.warn('❌ Verificación de webhook fallida');
    throw new ForbiddenException('Forbidden');
  }

  receiveWebhook(payload: Meta): ReceiveWebhookResponseDto {
    this.forwardWebhook(payload).catch((err) => {
      this.logger.error('Error en forwardWebhook:', err);
    });

    return { status: 'received' };
  }

  async setConfig(
    phoneNumberId: string,
    config: PhoneConfigBodyDto,
  ): Promise<SetConfigResponseDto> {
    await this.setPhoneConfig(phoneNumberId, config);
    return {
      message: `Configuración guardada para ${phoneNumberId}`,
      config,
    };
  }

  async getAllConfigsResponse(): Promise<GetAllConfigsResponseDto> {
    const configs = await this.getAllConfigs();
    return { configs };
  }

  async getConfigResponse(
    phoneNumberId: string,
  ): Promise<GetConfigResponseDto> {
    const config = await this.getPhoneConfig(phoneNumberId);
    if (!config) {
      return {
        message: `No hay configuración para ${phoneNumberId}`,
        config: null,
      };
    }
    return { config };
  }

  async deleteConfigResponse(
    phoneNumberId: string,
  ): Promise<DeleteConfigResponseDto> {
    const deleted = await this.deletePhoneConfig(phoneNumberId);
    return {
      message: deleted
        ? `Configuración eliminada para ${phoneNumberId}`
        : `No se encontró configuración para ${phoneNumberId}`,
      deleted,
    };
  }

  async forwardWebhook(payload: Meta): Promise<{
    forwarded: boolean;
    destination: string;
    type: 'dev' | 'prod' | 'none';
  }> {
    const hasMessage = payload.entry?.some((entry) =>
      entry.changes?.some((change) => Boolean(change.value?.messages?.length)),
    );

    if (!hasMessage) {
      this.logger.log('Webhook sin mensajes entrantes, ignorando');
      return { forwarded: false, destination: '', type: 'none' };
    }

    // Extraer info del payload
    const entry = payload.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;

    const phoneNumberId = value?.metadata?.phone_number_id;

    if (!phoneNumberId) {
      this.logger.warn('Payload sin phone_number_id, ignorando');
      return { forwarded: false, destination: '', type: 'none' };
    }

    // Buscar configuración en caché
    const config = await this.getPhoneConfig(phoneNumberId);

    if (!config) {
      this.logger.warn(
        `No hay configuración para phone_number_id: ${phoneNumberId}`,
      );
      return { forwarded: false, destination: '', type: 'none' };
    }

    // Determinar si el remitente es un usuario de desarrollo
    const senderNumber = value?.messages?.[0]?.from;

    let targetUrl = config.url_webhook_prod;
    let routeType: 'dev' | 'prod' = 'prod';

    if (senderNumber) {
      const devUser = config.dev_users.find(
        (u) => u.phone_number === senderNumber,
      );
      if (devUser) {
        targetUrl = devUser.url_webhook;
        routeType = 'dev';
        this.logger.log(
          `🔧 DEV match: ${senderNumber} → ${devUser.url_webhook}`,
        );
      }
    }

    // Reenviar el payload original completo
    try {
      await firstValueFrom(
        this.httpService.post(targetUrl, payload, {
          headers: { 'Content-Type': 'application/json' },
          timeout: 10000,
        }),
      );
      return { forwarded: true, destination: targetUrl, type: routeType };
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : 'Unknown error';
      return { forwarded: false, destination: targetUrl, type: routeType };
    }
  }
}
