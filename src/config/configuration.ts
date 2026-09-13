const DEV_ACCESS_SECRET = 'dev-access-secret-change-me';
const DEV_REFRESH_SECRET = 'dev-refresh-secret-change-me';

export default () => {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const accessSecret = process.env.JWT_ACCESS_SECRET || DEV_ACCESS_SECRET;
  const refreshSecret = process.env.JWT_REFRESH_SECRET || DEV_REFRESH_SECRET;

  if (
    nodeEnv === 'production' &&
    (accessSecret === DEV_ACCESS_SECRET || refreshSecret === DEV_REFRESH_SECRET)
  ) {
    throw new Error(
      'JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be set to strong random values in production. Refusing to start with the development default secrets.',
    );
  }

  if (nodeEnv !== 'production' && (accessSecret === DEV_ACCESS_SECRET || refreshSecret === DEV_REFRESH_SECRET)) {
    // eslint-disable-next-line no-console
    console.warn(
      '[config] Using development JWT secrets. Set JWT_ACCESS_SECRET/JWT_REFRESH_SECRET for anything beyond local dev.',
    );
  }

  return {
    nodeEnv,
    port: parseInt(process.env.PORT || '3000', 10),
    database: {
      url: process.env.DATABASE_URL,
    },
    jwt: {
      accessSecret,
      refreshSecret,
      accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
      refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    },
    clientPublicUrl: process.env.CLIENT_PUBLIC_URL || 'http://localhost:3000/p',
    corsOrigin: process.env.CORS_ORIGIN || '*',
    rateLimit: {
      ttl: parseInt(process.env.RATE_LIMIT_TTL || '60', 10),
      limit: parseInt(process.env.RATE_LIMIT_LIMIT || '100', 10),
    },
  };
};
