export interface DevUser {
  phone_number: string;  // 51999999999
  url_webhook: string; // https://webhook.dev/flow
}

export interface PhoneConfig {
  agent_name?: string;
  url_webhook_prod: string; // https://webhook.prod/flow
  dev_users: DevUser[];
}

export type ProxyConfigMap = Record<string, PhoneConfig>;
