import { PhoneConfigBodyDto } from '../body/phone-config.dto';

export class SetConfigResponseDto {
  message: string;
  config: PhoneConfigBodyDto;
}
