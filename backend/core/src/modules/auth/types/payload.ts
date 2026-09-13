export type TokenType = 'access' | 'refresh';

export interface Payload {
  sub: number;
  email: string;
  type: 'access';
  iat?: number;
  exp?: number;
}

export interface RefreshPayload {
  sub: number;
  email: string;
  jti: string;
  type: 'refresh';
  iat?: number;
  exp?: number;
}
