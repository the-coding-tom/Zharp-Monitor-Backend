export class CreateSessionData {
  userId: number;
  token: string;
  expiresAt: Date;
  rememberMe?: boolean;
  userAgent?: string;
  ipAddress?: string;
}

