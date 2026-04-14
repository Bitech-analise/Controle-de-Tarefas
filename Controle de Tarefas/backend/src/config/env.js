import 'dotenv/config'

const requiredVars = ['DATABASE_URL', 'JWT_SECRET']

for (const key of requiredVars) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`)
  }
}

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 4000),
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '12h',
  allowedOrigin: process.env.ALLOWED_ORIGIN || '*',
  smtpHost: process.env.SMTP_HOST || '',
  smtpPort: Number(process.env.SMTP_PORT || 587),
  smtpSecure: String(process.env.SMTP_SECURE || 'false').toLowerCase() === 'true',
  smtpAuthType: String(process.env.SMTP_AUTH_TYPE || 'password').toLowerCase(),
  smtpUser: process.env.SMTP_USER || '',
  smtpPass: process.env.SMTP_PASS || '',
  smtpClientId: process.env.SMTP_CLIENT_ID || '',
  smtpClientSecret: process.env.SMTP_CLIENT_SECRET || '',
  smtpRefreshToken: process.env.SMTP_REFRESH_TOKEN || '',
  smtpAccessToken: process.env.SMTP_ACCESS_TOKEN || '',
  smtpFrom: process.env.SMTP_FROM || '',
}

export default env
