export default (): Record<string, any> => ({
  // Server
  NODE_ENV: process.env.NODE_ENV || 'development',
  APP_NAME: process.env.APP_NAME || 'PanPal',

  // Admin
  ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'admin@gmail.com',
  ADMIN_USERNAME: process.env.ADMIN_USERNAME || 'admin',
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'admin123',

  // PostgreSQL
  DATABASE_URL: process.env.DATABASE_URL,

  // Redis
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  REDIS_PASSWORD: process.env.REDIS_PASSWORD,

  // Token
  JWT_AT_SECRET: process.env.JWT_AT_SECRET || 'secret',
  JWT_AT_EXPIRED: process.env.JWT_AT_EXPIRED || '30m',
  JWT_RT_SECRET: process.env.JWT_RT_SECRET || 'secret',
  JWT_RT_EXPIRED: process.env.JWT_RT_EXPIRED || '1d',

  // Email Service
  NODEMAILER_USER: process.env.NODEMAILER_USER,
  NODEMAILER_PASS: process.env.NODEMAILER_PASS,
  SUPPORT_EMAIL: process.env.SUPPORT_EMAIL || 'admin@gmail.com',

  // Google OAuth
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  GOOGLE_CALLBACK_URL:
    process.env.GOOGLE_CALLBACK_URL ||
    'http://localhost:3000/api/v1/auth/google/callback',

  // Frontend
  FE_REDIRECT_URL: process.env.FE_REDIRECT_URL || 'http://localhost:3000',
});
