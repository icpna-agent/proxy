export interface Meta {
  object?: string;
  entry?: Array<{
    id?: string;
    changes?: Array<{
      value?: {
        messaging_product?: string;
        metadata?: {
          display_phone_number?: string;
          phone_number_id?: string;
        };
        contacts?: Array<{
          profile?: {
            name?: string;
          };
          wa_id?: string;
        }>;
        messages?: Array<{
          context?: {
            from?: string;
            id?: string;
          };
          from?: string;
          id?: string;
          timestamp?: string;
          type?: 'image' | 'reaction' | 'sticker' | 'document' | 'text';
          image?: {
            caption?: string;
            mime_type?: string;
            sha256?: string;
            id?: string;
          };
          reaction?: {
            message_id?: string;
            emoji?: string;
          };
          sticker?: {
            mime_type: string;
            sha256: string;
            id: string;
            animated: boolean;
          };
          document?: {
            caption?: string;
            filename?: string;
            mime_type?: string;
            sha256?: string;
            id?: string;
          };
          text?: {
            body?: string;
          };
        }>;
        statuses?: Array<{
          id?: string;
          status?: string;
          timestamp?: string;
          recipient_id?: string;
          conversation?: {
            id?: string;
            expiration_timestamp?: string;
            origin?: {
              type?: string;
            };
          };
          pricing?: {
            billable?: boolean;
            pricing_model?: string;
            category?: string;
            type?: string;
          };
        }>;
      };
      field?: string;
    }>;
  }>;
}
