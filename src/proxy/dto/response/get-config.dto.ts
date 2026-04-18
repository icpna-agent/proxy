import { PhoneConfigBodyDto } from '../body/phone-config.dto';

export class GetConfigResponseDto {
  message?: string;
  config: PhoneConfigBodyDto | null;
}
