import nodemailer from 'nodemailer'
import env from '../config/env.js'

export const SMTP_AUTH_TYPES = Object.freeze({
  PASSWORD: 'password',
  OAUTH2: 'oauth2',
})

const parseBoolean = (value, fallback = false) => {
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value !== 0
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    if (['1', 'true', 'yes', 'on'].includes(normalized)) return true
    if (['0', 'false', 'no', 'off'].includes(normalized)) return false
  }
  return fallback
}

const parsePort = (value, fallback = 587) => {
  const numeric = Number(value)
  if (Number.isFinite(numeric) && numeric > 0) {
    return Math.trunc(numeric)
  }
  return fallback
}

const normalizeAuthType = (value, fallback = SMTP_AUTH_TYPES.PASSWORD) => {
  const normalized = String(value || '')
    .trim()
    .toLowerCase()
  if (normalized === SMTP_AUTH_TYPES.OAUTH2) return SMTP_AUTH_TYPES.OAUTH2
  if (normalized === SMTP_AUTH_TYPES.PASSWORD) return SMTP_AUTH_TYPES.PASSWORD
  return fallback
}

const normalizeText = (value) => String(value || '').trim()

export const getEnvSmtpConfig = () =>
  normalizeSmtpConfig({
    host: env.smtpHost,
    port: env.smtpPort,
    secure: env.smtpSecure,
    authType: env.smtpAuthType,
    user: env.smtpUser,
    pass: env.smtpPass,
    clientId: env.smtpClientId,
    clientSecret: env.smtpClientSecret,
    refreshToken: env.smtpRefreshToken,
    accessToken: env.smtpAccessToken,
    from: env.smtpFrom,
  })

export const normalizeSmtpConfig = (rawConfig = {}) => {
  const authType = normalizeAuthType(rawConfig?.authType)
  const defaultHost = authType === SMTP_AUTH_TYPES.OAUTH2 ? 'smtp.gmail.com' : ''
  const host = normalizeText(rawConfig?.host || defaultHost)
  const port = parsePort(rawConfig?.port, 587)
  const secure = parseBoolean(rawConfig?.secure, port === 465)

  return {
    provider: normalizeText(rawConfig?.provider || 'custom'),
    host,
    port,
    secure,
    authType,
    user: normalizeText(rawConfig?.user),
    pass: normalizeText(rawConfig?.pass),
    clientId: normalizeText(rawConfig?.clientId),
    clientSecret: normalizeText(rawConfig?.clientSecret),
    refreshToken: normalizeText(rawConfig?.refreshToken),
    accessToken: normalizeText(rawConfig?.accessToken),
    from: normalizeText(rawConfig?.from),
  }
}

export const isSmtpConfigReady = (smtpConfig) => {
  const normalized = normalizeSmtpConfig(smtpConfig)
  if (!normalized.host || !normalized.from || !normalized.user) return false

  if (normalized.authType === SMTP_AUTH_TYPES.OAUTH2) {
    return Boolean(
      normalized.clientId && normalized.clientSecret && normalized.refreshToken,
    )
  }

  return Boolean(normalized.pass)
}

const getTransportOptions = (smtpConfig) => {
  const normalized = normalizeSmtpConfig(smtpConfig)
  const auth =
    normalized.authType === SMTP_AUTH_TYPES.OAUTH2
      ? {
          type: 'OAuth2',
          user: normalized.user,
          clientId: normalized.clientId,
          clientSecret: normalized.clientSecret,
          refreshToken: normalized.refreshToken,
          ...(normalized.accessToken ? { accessToken: normalized.accessToken } : {}),
        }
      : {
          user: normalized.user,
          pass: normalized.pass,
        }

  return {
    host: normalized.host,
    port: normalized.port,
    secure: normalized.secure || normalized.port === 465,
    auth,
  }
}

const createTransporter = (smtpConfig) => nodemailer.createTransport(getTransportOptions(smtpConfig))

export const verifySmtpConnection = async ({ smtpConfig }) => {
  const normalized = normalizeSmtpConfig(smtpConfig)
  if (!isSmtpConfigReady(normalized)) {
    throw new Error('MAILER_NOT_CONFIGURED')
  }

  const transporter = createTransporter(normalized)
  await transporter.verify()
}

export const sendTaskEmail = async ({ smtpConfig, to, subject, text, attachment = null }) => {
  const normalized = normalizeSmtpConfig(smtpConfig || getEnvSmtpConfig())
  if (!isSmtpConfigReady(normalized)) {
    throw new Error('MAILER_NOT_CONFIGURED')
  }

  const transporter = createTransporter(normalized)
  const info = await transporter.sendMail({
    from: normalized.from,
    to,
    subject,
    text,
    attachments: attachment
      ? [
          {
            filename: attachment.name,
            content: attachment.buffer,
            contentType: attachment.type || 'application/octet-stream',
          },
        ]
      : [],
  })

  return info
}
