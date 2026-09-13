function requiredSecret(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not set`);
  }
  return value;
}

export const jwtConstants = {
  get accessSecret(): string {
    return requiredSecret('JWT_ACCESS_SECRET');
  },
  get refreshSecret(): string {
    return requiredSecret('JWT_REFRESH_SECRET');
  },
  accessExpiresIn: '15m' as const,
  refreshExpiresIn: '7d' as const,
};
