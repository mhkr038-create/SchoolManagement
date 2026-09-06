export default () => ({
  port: parseInt(process.env.PORT || '4000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  database: {
    url: process.env.DATABASE_URL
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10)
  },
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'dev-super-secret-access-key-change-in-production-min-32-chars',
    accessExpiration: process.env.JWT_ACCESS_EXPIRATION || '15m',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev-super-secret-refresh-key-change-in-production-min-32-chars',
    refreshExpiration: process.env.JWT_REFRESH_EXPIRATION || '7d'
  },
  cors: {
    origin: process.env.WEB_URL || 'http://localhost:5173'
  }
});
