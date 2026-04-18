export class DevUserDto {
  phone_number: string;
  url_webhook: string;
}

export class PhoneConfigBodyDto {
  agent_name?: string;
  url_webhook_prod: string;
  dev_users: DevUserDto[];
}
