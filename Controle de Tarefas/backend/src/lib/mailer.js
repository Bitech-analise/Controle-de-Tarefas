import nodemailer from 'nodemailer'
import env from '../config/env.js'

let transporter = null

export const isMailerConfigured = () =>
  Boolean(env.smtpHost && env.smtpUser && env.smtpPass && env.smtpFrom)

const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.smtpHost,
      port: env.smtpPort,
      secure: env.smtpSecure || env.smtpPort === 465,
      auth: {
        user: env.smtpUser,
        pass: env.smtpPass,
      },
    })
  }

  return transporter
}

export const sendTaskEmail = async ({ to, subject, text, attachment }) => {
  if (!isMailerConfigured()) {
    throw new Error('MAILER_NOT_CONFIGURED')
  }

  const info = await getTransporter().sendMail({
    from: env.smtpFrom,
    to,
    subject,
    text,
    attachments: [
      {
        filename: attachment.name,
        content: attachment.buffer,
        contentType: attachment.type || 'application/octet-stream',
      },
    ],
  })

  return info
}
