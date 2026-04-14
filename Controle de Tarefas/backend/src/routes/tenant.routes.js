import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import prisma from '../lib/prisma.js'
import env from '../config/env.js'
import {
  isSmtpConfigReady,
  normalizeSmtpConfig,
  sendTaskEmail,
  verifySmtpConnection,
} from '../lib/mailer.js'
import { requireAuth, requireRole, resolveTenantFromAuth } from '../middlewares/auth.js'
import { validateBody, validateQuery } from '../middlewares/validate.js'

const router = Router()

router.use(requireAuth)

function getTenantId(req) {
  const tenantIdFromQuery = typeof req.query.tenantId === 'string' ? req.query.tenantId : null
  return resolveTenantFromAuth(req, tenantIdFromQuery)
}

const listClientsQuerySchema = z.object({
  q: z.string().optional().default(''),
  status: z.enum(['ACTIVE', 'INACTIVE', 'ALL']).optional().default('ALL'),
  tenantId: z.string().optional(),
})

const upsertClientSchema = z.object({
  name: z.string().min(2),
  alias: z.string().optional().nullable(),
  documentType: z.string().optional().nullable(),
  documentNumber: z.string().optional().nullable(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional().default('ACTIVE'),
  contact: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal('')),
  groups: z.array(z.string()).optional().default([]),
  visibility: z.string().optional().nullable(),
  uf: z.string().optional().nullable(),
  taxation: z.array(z.string()).optional().default([]),
  checklist: z.array(z.string()).optional().default([]),
  initialCompetence: z.string().optional().nullable(),
})

const listTasksQuerySchema = z.object({
  q: z.string().optional().default(''),
  type: z.enum(['TASK', 'SOLICITATION', 'ALL']).optional().default('ALL'),
  status: z.enum(['UPCOMING', 'OPEN', 'IN_PROGRESS', 'PENDING', 'DONE', 'DISMISSED', 'CANCELLED', 'OVERDUE', 'ALL']).optional().default('ALL'),
  tenantId: z.string().optional(),
})

const tenantStateBodySchema = z.object({
  state: z.object({}).passthrough(),
})

const tenantBrandingBodySchema = z.object({
  branding: z.object({}).passthrough(),
})

const tenantSmtpBodySchema = z.object({
  smtp: z.object({}).passthrough(),
})

const tenantSmtpTestBodySchema = z.object({
  smtp: z.object({}).passthrough().optional(),
  testTo: z.string().email().optional().or(z.literal('')),
})

const tenantSmtpGoogleAuthUrlBodySchema = z.object({
  smtp: z.object({}).passthrough().optional(),
  redirectUri: z.string().url(),
})

const tenantSmtpGoogleExchangeBodySchema = z.object({
  smtp: z.object({}).passthrough().optional(),
  code: z.string().min(1),
  state: z.string().min(1),
  redirectUri: z.string().url(),
})

const sendTaskEmailSchema = z.object({
  to: z.string().email(),
  subject: z.string().min(3),
  message: z.string().optional().default(''),
  taskId: z.union([z.string(), z.number()]).optional(),
  taskSource: z.enum(['task', 'solicitation']).optional().default('task'),
  notificationType: z.enum(['default', 'portal-document']).optional().default('default'),
  clientName: z.string().optional().default(''),
  attachment: z.object({
    name: z.string().min(1),
    type: z.string().optional().default('application/octet-stream'),
    contentBase64: z.string().min(1),
  }).optional(),
})

const MAX_DOCS_ATTACHMENT_SIZE_BYTES = 25 * 1024 * 1024
const GOOGLE_OAUTH_SCOPE = 'https://mail.google.com/'
const GOOGLE_OAUTH_STATE_TYPE = 'tenant-smtp-google-oauth'
const APP_TIMEZONE = 'America/Sao_Paulo'

const docsSolicitationCreateSchema = z.object({
  departamento: z.string().min(1),
  processo: z.string().optional().default(''),
  etapa: z.string().optional().default('Aberta'),
  assunto: z.string().min(1),
  clientIds: z.array(z.string().min(1)).optional().default([]),
  actionDate: z.string().min(1),
  metaDate: z.string().min(1),
  dueDate: z.string().min(1),
  andamento: z.string().min(1),
  responsavel: z.string().optional().default(''),
  attachments: z
    .array(
      z.object({
        name: z.string().min(1),
        size: z.number().int().nonnegative().max(MAX_DOCS_ATTACHMENT_SIZE_BYTES).optional().default(0),
        type: z.string().optional().default('application/octet-stream'),
        contentBase64: z.string().min(1),
      }),
    )
    .optional()
    .default([]),
})

const portalDocumentDownloadSchema = z.object({
  documentKey: z.string().min(1),
})

const tenantUserCreateSchema = z.object({
  name: z.string().min(2),
  username: z
    .string()
    .trim()
    .min(3)
    .max(60)
    .regex(/^[a-z0-9._-]+$/i, 'Username invalido. Use letras, numeros, ponto, underline ou hifen.')
    .optional(),
  email: z.string().email(),
  password: z.string().min(4),
  clientIds: z.array(z.string()).optional().default([]),
  role: z.enum(['TENANT_ADMIN', 'TENANT_USER']).optional().default('TENANT_USER'),
  isActive: z.boolean().optional().default(true),
})

const tenantUserUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  username: z
    .string()
    .trim()
    .min(3)
    .max(60)
    .regex(/^[a-z0-9._-]+$/i, 'Username invalido. Use letras, numeros, ponto, underline ou hifen.')
    .optional(),
  email: z.string().email().optional(),
  password: z.string().min(4).optional(),
  clientIds: z.array(z.string()).optional(),
  role: z.enum(['TENANT_ADMIN', 'TENANT_USER']).optional(),
  isActive: z.boolean().optional(),
})

const getDefaultTenantSmtpSettings = () => ({
  provider: 'gmail',
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  authType: 'oauth2',
  user: '',
  pass: '',
  clientId: '',
  clientSecret: '',
  refreshToken: '',
  accessToken: '',
  from: '',
})

const normalizeTenantSmtpSettings = (rawSettings) => {
  const defaults = getDefaultTenantSmtpSettings()
  const normalized = normalizeSmtpConfig({
    ...defaults,
    ...(rawSettings && typeof rawSettings === 'object' ? rawSettings : {}),
  })

  return {
    provider: 'gmail',
    host: String(normalized.host || defaults.host),
    port: Number(normalized.port || defaults.port),
    secure: Boolean(normalized.secure),
    authType: String(normalized.authType || defaults.authType),
    user: String(normalized.user || ''),
    pass: String(normalized.pass || ''),
    clientId: String(normalized.clientId || ''),
    clientSecret: String(normalized.clientSecret || ''),
    refreshToken: String(normalized.refreshToken || ''),
    accessToken: String(normalized.accessToken || ''),
    from: String(normalized.from || ''),
  }
}

const getSmtpValidationMessage = (smtpSettings, options = {}) => {
  const requireAuthTokens = options?.requireAuthTokens !== false
  const requireOAuthClientCredentials = options?.requireOAuthClientCredentials !== false
  const settings = normalizeTenantSmtpSettings(smtpSettings)
  if (!settings.host) return 'Informe o host SMTP.'
  if (!settings.from) return 'Informe o e-mail remetente (SMTP_FROM).'
  if (!settings.user) return 'Informe o usuario SMTP (e-mail do Gmail).'
  if (settings.authType === 'oauth2') {
    const oauthClientId = String(settings.clientId || env.smtpClientId || '').trim()
    const oauthClientSecret = String(settings.clientSecret || env.smtpClientSecret || '').trim()
    if (requireOAuthClientCredentials && (!oauthClientId || !oauthClientSecret)) {
      return 'OAuth do Gmail nao configurado no servidor (SMTP_CLIENT_ID / SMTP_CLIENT_SECRET).'
    }
    if (requireAuthTokens && !settings.refreshToken) {
      return 'Conecte com o Google para gerar o Refresh Token OAuth2.'
    }
    return ''
  }
  if (!settings.pass) return 'No modo senha, preencha a senha SMTP.'
  return ''
}

const mergeSmtpSettingsPreservingSecrets = (baseSettings, incomingSettings) => {
  const base = normalizeTenantSmtpSettings(baseSettings)
  const incoming = normalizeTenantSmtpSettings(incomingSettings)
  const keepWhenEmpty = (incomingValue, baseValue) =>
    String(incomingValue || '').trim() ? incomingValue : baseValue

  return normalizeTenantSmtpSettings({
    ...base,
    ...incoming,
    clientId: keepWhenEmpty(incoming.clientId, base.clientId),
    clientSecret: keepWhenEmpty(incoming.clientSecret, base.clientSecret),
    refreshToken: keepWhenEmpty(incoming.refreshToken, base.refreshToken),
    accessToken: keepWhenEmpty(incoming.accessToken, base.accessToken),
    pass: incoming.authType === 'password' ? keepWhenEmpty(incoming.pass, base.pass) : incoming.pass,
  })
}

const getSmtpRuntimeErrorMessage = (error) => {
  const rawMessage = String(error?.message || '').trim()
  if (!rawMessage) return 'Falha ao validar SMTP.'

  if (rawMessage === 'MAILER_NOT_CONFIGURED') {
    return 'SMTP nao configurado corretamente para envio.'
  }

  return rawMessage
}

const getDocumentNotificationGreeting = () => {
  const hourText = new Intl.DateTimeFormat('pt-BR', {
    timeZone: APP_TIMEZONE,
    hour: '2-digit',
    hourCycle: 'h23',
  }).format(new Date())
  const hour = Number.parseInt(hourText, 10)

  if (!Number.isFinite(hour)) {
    return 'Ola'
  }

  if (hour >= 5 && hour < 12) return 'Bom dia'
  if (hour >= 12 && hour < 18) return 'Boa tarde'
  return 'Boa noite'
}

const buildPortalDocumentNotificationMessage = (clientName) => {
  const greeting = getDocumentNotificationGreeting()
  const normalizedClientName = String(clientName || '').trim() || 'Cliente'

  return `${greeting}, ${normalizedClientName}.

Gostariamos de informar que o documento se encontra no portal do cliente para que possa ser efetuada a baixa do mesmo, qualquer duvida estamos a disposicao, abracos.`
}

const getEmptyTenantState = () => ({
  schemaVersion: 1,
  users: [],
  clients: [],
  tasksRows: [],
  taskBlueprints: [],
  solicitationRecords: [],
  taskActionLogs: [],
  docsReceivedDownloads: [],
  smtpSettings: getDefaultTenantSmtpSettings(),
})

const getTenantStateRecord = async (tenantId) =>
  prisma.tenantState.findUnique({
    where: { tenantId },
    select: { data: true, updatedAt: true },
  })

const getTenantStateData = (stateRecord) =>
  stateRecord?.data && typeof stateRecord.data === 'object' ? stateRecord.data : getEmptyTenantState()

const getStoredTenantSmtpSettings = (stateData) =>
  normalizeTenantSmtpSettings(stateData?.smtpSettings)

const getEffectiveTenantSmtpSettings = (stateData) => {
  const stored = getStoredTenantSmtpSettings(stateData)
  const effective = normalizeTenantSmtpSettings({
    ...stored,
    clientId: String(stored.clientId || '').trim() || String(env.smtpClientId || '').trim(),
    clientSecret:
      String(stored.clientSecret || '').trim() || String(env.smtpClientSecret || '').trim(),
  })

  return {
    settings: effective,
    source:
      String(stored.clientId || '').trim() && String(stored.clientSecret || '').trim()
        ? 'tenant'
        : 'server',
  }
}

const normalizeGoogleRedirectUri = (value) => {
  const raw = String(value || '').trim()
  if (!raw) return ''
  let parsedUrl
  try {
    parsedUrl = new URL(raw)
  } catch {
    return ''
  }
  if (!['http:', 'https:'].includes(parsedUrl.protocol)) return ''
  return parsedUrl.toString()
}

const buildGoogleOAuthStateToken = ({ tenantId, userId, redirectUri }) =>
  jwt.sign(
    {
      type: GOOGLE_OAUTH_STATE_TYPE,
      tenantId: String(tenantId || '').trim(),
      userId: String(userId || '').trim(),
      redirectUri: String(redirectUri || '').trim(),
    },
    env.jwtSecret,
    { expiresIn: '10m' },
  )

const requestGoogleOAuthToken = async ({
  code,
  clientId,
  clientSecret,
  redirectUri,
}) => {
  const payload = new URLSearchParams({
    code: String(code || '').trim(),
    client_id: String(clientId || '').trim(),
    client_secret: String(clientSecret || '').trim(),
    redirect_uri: String(redirectUri || '').trim(),
    grant_type: 'authorization_code',
  })

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: payload.toString(),
  })

  let data = null
  try {
    data = await response.json()
  } catch {
    data = null
  }

  if (!response.ok) {
    const description =
      String(data?.error_description || data?.error || '').trim() ||
      'Nao foi possivel autenticar no Google.'
    const error = new Error(description)
    error.status = response.status
    throw error
  }

  return data || {}
}

const fetchGoogleAccountEmail = async (accessToken) => {
  const token = String(accessToken || '').trim()
  if (!token) return ''

  try {
    const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    if (!response.ok) return ''
    const data = await response.json()
    return String(data?.email || '').trim().toLowerCase()
  } catch {
    return ''
  }
}

const normalizeLookupText = (value) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()

const isOpenStatusLabel = (value) => {
  const normalized = normalizeLookupText(value).replace(/\s+/g, ' ')
  return normalized.includes('abert')
}

const normalizeClientDocument = (client) =>
  String(client?.inscricao || client?.documentNumber || '')
    .trim()

const normalizeClientsFromState = (stateData) => {
  const source = Array.isArray(stateData?.clients) ? stateData.clients : []
  return source
    .map((client) => ({
      id: String(client?.id || '').trim(),
      nome: String(client?.nome || client?.name || '').trim(),
      status: String(client?.status || '').trim() || 'Ativo',
      inscricao: normalizeClientDocument(client),
      email: String(client?.email || '').trim(),
    }))
    .filter((client) => client.id && client.nome)
}

const findClientByUserIdentity = (clients, authUser) => {
  const source = Array.isArray(clients) ? clients : []
  if (!source.length) return null

  const normalizedUserEmail = normalizeLookupText(authUser?.email || '')
  if (normalizedUserEmail) {
    const byEmail = source.find(
      (client) => normalizeLookupText(client?.email || '') === normalizedUserEmail,
    )
    if (byEmail) return byEmail
  }

  const normalizedUserName = normalizeLookupText(authUser?.name || '')
  if (!normalizedUserName) return null

  const byExactName = source.find((client) => normalizeLookupText(client?.nome || '') === normalizedUserName)
  if (byExactName) return byExactName

  if (normalizedUserName.length < 5) return null

  return (
    source.find((client) => {
      const normalizedClientName = normalizeLookupText(client?.nome || '')
      if (!normalizedClientName) return false
      return (
        normalizedClientName.includes(normalizedUserName) ||
        normalizedUserName.includes(normalizedClientName)
      )
    }) || null
  )
}

const getNextSolicitationId = (records) =>
  records.reduce((maxId, record) => {
    const numericId = Number(record?.id)
    return Number.isFinite(numericId) ? Math.max(maxId, numericId) : maxId
  }, 0) + 1

const normalizeDisplayDate = (value) => {
  const text = String(value || '').trim()
  if (!text) return ''
  const isoMatch = text.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (isoMatch) {
    const [, year, month, day] = isoMatch
    return `${day}/${month}/${year}`
  }
  const brMatch = text.match(/^(\d{2})\/(\d{2})\/(\d{4})/)
  if (brMatch) {
    const [, day, month, year] = brMatch
    return `${day}/${month}/${year}`
  }
  return text
}

const getDateFromTaggedList = (dates, tag) => {
  const source = Array.isArray(dates) ? dates : []
  const prefix = `${String(tag || '').trim().toUpperCase()}:`
  const entry = source.find((item) =>
    String(item || '')
      .trim()
      .toUpperCase()
      .startsWith(prefix),
  )
  if (!entry) return ''
  return normalizeDisplayDate(String(entry).slice(prefix.length).trim())
}

const getCompetenceFromActionDate = (actionDate) => {
  const normalized = normalizeDisplayDate(actionDate)
  const match = normalized.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (!match) return ''
  const [, , month, year] = match
  return `${month}/${year}`
}

const getPortalDocumentDownloadsByKey = (stateData, authUser) => {
  const source = Array.isArray(stateData?.docsReceivedDownloads) ? stateData.docsReceivedDownloads : []
  const authUserId = String(authUser?.id || '').trim()
  const authUserEmail = normalizeLookupText(authUser?.email || '')
  const map = new Map()

  for (const entry of source) {
    const key = String(entry?.key || '').trim()
    const downloadedAt = String(entry?.downloadedAt || '').trim()
    const entryUserId = String(entry?.userId || '').trim()
    const entryUserEmail = normalizeLookupText(entry?.userEmail || '')
    if (!key || !downloadedAt) continue

    const sameUserById = Boolean(authUserId && entryUserId && authUserId === entryUserId)
    const sameUserByEmail = Boolean(authUserEmail && entryUserEmail && authUserEmail === entryUserEmail)
    if (!sameUserById && !sameUserByEmail) continue
    map.set(key, downloadedAt)
  }

  return map
}

const getLatestActionActorByRecord = ({ stateData, source, recordId, fallback = '' }) => {
  const normalizedSource = String(source || '').trim()
  const normalizedRecordId = String(recordId || '').trim()
  const normalizedFallback = String(fallback || '').trim()
  if (!normalizedSource || !normalizedRecordId) return normalizedFallback

  const logs = Array.isArray(stateData?.taskActionLogs) ? stateData.taskActionLogs : []
  for (const log of logs) {
    const logSource = String(log?.taskSource || '').trim()
    const logRecordId = String(log?.taskId || '').trim()
    if (logSource !== normalizedSource || logRecordId !== normalizedRecordId) continue

    const actor = String(log?.actor || '').trim()
    if (actor) return actor
  }

  return normalizedFallback
}

const buildPortalDocumentKey = ({ source, recordId, attachmentId, attachmentName, index }) =>
  `${String(source || '').trim()}::${String(recordId || '').trim()}::${String(attachmentId || '').trim() || index}::${String(attachmentName || '').trim()}`

const buildPortalDocumentsFromState = ({
  stateData,
  visibleClients,
  isTenantRestrictedUser,
  authUser,
}) => {
  const visibleClientIds = new Set((Array.isArray(visibleClients) ? visibleClients : []).map((client) => client.id))
  const visibleClientNames = new Set(
    (Array.isArray(visibleClients) ? visibleClients : [])
      .map((client) => normalizeLookupText(client?.nome || ''))
      .filter(Boolean),
  )
  const authUserId = String(authUser?.id || '').trim()
  const authUserEmail = normalizeLookupText(authUser?.email || '')
  const downloadsByKey = getPortalDocumentDownloadsByKey(stateData, authUser)

  const isRecordVisible = ({ clientId, clientName, createdByUserId = '', createdByUserEmail = '' }) => {
    if (!isTenantRestrictedUser) return true
    const normalizedClientId = String(clientId || '').trim()
    const normalizedClientName = normalizeLookupText(clientName || '')
    const normalizedCreatedByUserId = String(createdByUserId || '').trim()
    const normalizedCreatedByUserEmail = normalizeLookupText(createdByUserEmail || '')

    if (normalizedClientId && visibleClientIds.has(normalizedClientId)) return true
    if (normalizedClientName && visibleClientNames.has(normalizedClientName)) return true
    if (normalizedCreatedByUserId && authUserId && normalizedCreatedByUserId === authUserId) return true
    if (normalizedCreatedByUserEmail && authUserEmail && normalizedCreatedByUserEmail === authUserEmail) return true
    return false
  }

  const documents = []
  const appendDocumentRows = ({ rows, source }) => {
    for (const row of rows) {
      const rowId = String(row?.id || '').trim()
      const attachments = Array.isArray(row?.attachments) ? row.attachments : []
      const clientId = String(row?.clientId || '').trim()
      const clientName =
        source === 'solicitation'
          ? String(row?.clientName || '').trim()
          : String(row?.client || row?.clientName || '').trim()
      if (!attachments.length || !isRecordVisible({ clientId, clientName })) continue

      for (let index = 0; index < attachments.length; index += 1) {
        const attachment = attachments[index]
        const docsSharedAt = String(attachment?.docsSharedAt || '').trim()
        if (!docsSharedAt) continue

        const attachmentName = String(attachment?.name || '').trim()
        const contentBase64 = String(attachment?.contentBase64 || '').trim()
        if (!attachmentName && !contentBase64) continue

        const actionDate =
          source === 'solicitation'
            ? normalizeDisplayDate(row?.actionDate || '')
            : getDateFromTaggedList(row?.dates, 'A')
        const metaDate =
          source === 'solicitation'
            ? normalizeDisplayDate(row?.metaDate || '')
            : getDateFromTaggedList(row?.dates, 'M')
        const dueDate =
          source === 'solicitation'
            ? normalizeDisplayDate(row?.dueDate || '')
            : getDateFromTaggedList(row?.dates, 'V')
        const nome =
          source === 'solicitation'
            ? String(row?.assunto || row?.processo || 'Solicitacao').trim()
            : String(row?.subject || '').trim()
        const responsavelByAction = getLatestActionActorByRecord({
          stateData,
          source,
          recordId: rowId,
          fallback: '',
        })
        const responsavel =
          source === 'solicitation'
            ? responsavelByAction || String(row?.responsavel || '').trim()
            : responsavelByAction ||
              String(attachment?.docsSharedBy || '').trim() ||
              String(row?.owner || '').trim() ||
              String(row?.responsavel || '').trim()
        const departamento =
          source === 'solicitation'
            ? String(row?.departamento || '').trim()
            : String(row?.dept || '').trim()
        const conclusionDate =
          source === 'solicitation'
            ? normalizeDisplayDate(row?.conclusionDate || row?.deliveryDate || '')
            : normalizeDisplayDate(row?.conclusionDate || '')

        const documentKey = buildPortalDocumentKey({
          source,
          recordId: rowId,
          attachmentId: String(attachment?.id || '').trim(),
          attachmentName,
          index,
        })
        const downloadedAt = String(downloadsByKey.get(documentKey) || '').trim()

        documents.push({
          documentKey,
          source,
          taskId: rowId,
          attachmentId: String(attachment?.id || '').trim(),
          attachmentName: attachmentName || `anexo-${index + 1}`,
          attachmentSize: Number(attachment?.size || 0),
          attachmentType: String(attachment?.type || 'application/octet-stream'),
          contentBase64,
          status: downloadedAt ? 'Arquivo baixado' : 'Disponivel',
          downloadedAt,
          departamento,
          nome,
          competencia: String(row?.competence || '').trim() || getCompetenceFromActionDate(actionDate),
          cliente: clientName || 'Cliente nao informado',
          actionDate,
          metaDate,
          dueDate,
          conclusionDate,
          responsavel,
        })
      }
    }
  }

  appendDocumentRows({
    rows: Array.isArray(stateData?.tasksRows) ? stateData.tasksRows : [],
    source: 'task',
  })
  appendDocumentRows({
    rows: Array.isArray(stateData?.solicitationRecords) ? stateData.solicitationRecords : [],
    source: 'solicitation',
  })

  return documents.sort((a, b) => {
    const aId = Number(a?.taskId || 0)
    const bId = Number(b?.taskId || 0)
    if (Number.isFinite(aId) && Number.isFinite(bId) && aId !== bId) return bId - aId
    if (String(a?.source || '') !== String(b?.source || '')) {
      return String(a?.source || '').localeCompare(String(b?.source || ''))
    }
    return String(a?.attachmentName || '').localeCompare(String(b?.attachmentName || ''), 'pt-BR')
  })
}

router.get('/users', async (req, res, next) => {
  try {
    const tenantId = getTenantId(req)
    if (!tenantId) {
      return res.status(400).json({ message: 'tenantId ÃƒÆ’Ã‚Â© obrigatÃƒÆ’Ã‚Â³rio para este usuÃƒÆ’Ã‚Â¡rio.' })
    }

    const users = await prisma.tenantUser.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
        isActive: true,
        clientIds: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return res.json(users)
  } catch (error) {
    return next(error)
  }
})

router.post(
  '/users',
  requireRole('TENANT_ADMIN', 'SUPER_ADMIN'),
  validateBody(tenantUserCreateSchema),
  async (req, res, next) => {
    try {
      const tenantId = getTenantId(req)
      if (!tenantId) {
        return res.status(400).json({ message: 'tenantId ÃƒÆ’Ã‚Â© obrigatÃƒÆ’Ã‚Â³rio para este usuÃƒÆ’Ã‚Â¡rio.' })
      }

      const email = String(req.body.email || '')
        .trim()
        .toLowerCase()
      const username = String(req.body.username || '')
        .trim()
        .toLowerCase()
      const name = String(req.body.name || '').trim()
      const password = String(req.body.password || '').trim()
      const role = req.body.role || 'TENANT_USER'
      const isActive = req.body.isActive !== false
      const candidateClientIds = Array.isArray(req.body.clientIds) ? req.body.clientIds : []

      if (!name || !email || !password) {
        return res.status(400).json({ message: 'Informe nome, e-mail e senha para cadastrar o usuario.' })
      }

      const emailInUse = await prisma.tenantUser.findUnique({ where: { email } })
      if (emailInUse) {
        return res.status(409).json({ message: 'Ja existe um usuario com esse e-mail.' })
      }

      if (username) {
        const usernameInUse = await prisma.tenantUser.findFirst({ where: { username } })
        if (usernameInUse) {
          return res.status(409).json({ message: 'Ja existe um usuario com esse username.' })
        }
      }

      const clientIds = Array.from(
        new Set(
          candidateClientIds
            .map((clientId) => String(clientId || '').trim())
            .filter(Boolean),
        ),
      )

      const created = await prisma.tenantUser.create({
        data: {
          tenantId,
          name,
          username: username || null,
          email,
          passwordHash: await bcrypt.hash(password, 10),
          role,
          isActive,
          clientIds,
        },
        select: {
          id: true,
          name: true,
          username: true,
          email: true,
          role: true,
          isActive: true,
          clientIds: true,
          createdAt: true,
          updatedAt: true,
        },
      })

      return res.status(201).json(created)
    } catch (error) {
      return next(error)
    }
  },
)

router.patch(
  '/users/:userId',
  requireRole('TENANT_ADMIN', 'SUPER_ADMIN'),
  validateBody(tenantUserUpdateSchema),
  async (req, res, next) => {
    try {
      const tenantId = getTenantId(req)
      if (!tenantId) {
        return res.status(400).json({ message: 'tenantId ÃƒÆ’Ã‚Â© obrigatÃƒÆ’Ã‚Â³rio para este usuÃƒÆ’Ã‚Â¡rio.' })
      }

      const target = await prisma.tenantUser.findFirst({
        where: { id: req.params.userId, tenantId },
      })

      if (!target) {
        return res.status(404).json({ message: 'UsuÃƒÆ’Ã‚Â¡rio nÃƒÆ’Ã‚Â£o encontrado para este tenant.' })
      }

      const nextEmail = req.body.email
        ? String(req.body.email || '')
            .trim()
            .toLowerCase()
        : undefined
      const hasUsernameField = Object.prototype.hasOwnProperty.call(req.body, 'username')
      const nextUsername = hasUsernameField
        ? String(req.body.username || '')
            .trim()
            .toLowerCase()
        : undefined

      if (nextEmail && nextEmail !== target.email) {
        const emailInUse = await prisma.tenantUser.findUnique({ where: { email: nextEmail } })
        if (emailInUse) {
          return res.status(409).json({ message: 'Ja existe um usuario com esse e-mail.' })
        }
      }

      if (nextUsername && nextUsername !== String(target.username || '').trim().toLowerCase()) {
        const usernameInUse = await prisma.tenantUser.findFirst({ where: { username: nextUsername } })
        if (usernameInUse) {
          return res.status(409).json({ message: 'Ja existe um usuario com esse username.' })
        }
      }

      let nextClientIds
      if (Array.isArray(req.body.clientIds)) {
        nextClientIds = Array.from(
          new Set(
            req.body.clientIds
              .map((clientId) => String(clientId || '').trim())
              .filter(Boolean),
          ),
        )
      }

      const updated = await prisma.tenantUser.update({
        where: { id: target.id },
        data: {
          ...(req.body.name ? { name: req.body.name.trim() } : {}),
          ...(nextEmail ? { email: nextEmail } : {}),
          ...(hasUsernameField ? { username: nextUsername || null } : {}),
          ...(req.body.password ? { passwordHash: await bcrypt.hash(req.body.password, 10) } : {}),
          ...(nextClientIds ? { clientIds: nextClientIds } : {}),
          ...(typeof req.body.isActive === 'boolean' ? { isActive: req.body.isActive } : {}),
          ...(req.body.role ? { role: req.body.role } : {}),
        },
        select: {
          id: true,
          name: true,
          username: true,
          email: true,
          role: true,
          isActive: true,
          clientIds: true,
          createdAt: true,
          updatedAt: true,
        },
      })

      return res.json(updated)
    } catch (error) {
      return next(error)
    }
  },
)

router.delete(
  '/users/:userId',
  requireRole('TENANT_ADMIN', 'SUPER_ADMIN'),
  async (req, res, next) => {
    try {
      const tenantId = getTenantId(req)
      if (!tenantId) {
        return res.status(400).json({ message: 'tenantId ÃƒÆ’Ã‚Â© obrigatÃƒÆ’Ã‚Â³rio para este usuÃƒÆ’Ã‚Â¡rio.' })
      }

      const target = await prisma.tenantUser.findFirst({
        where: { id: req.params.userId, tenantId },
      })

      if (!target) {
        return res.status(404).json({ message: 'UsuÃƒÆ’Ã‚Â¡rio nÃƒÆ’Ã‚Â£o encontrado para este tenant.' })
      }

      if (req.auth?.sub === target.id) {
        return res.status(400).json({ message: 'NÃƒÆ’Ã‚Â£o ÃƒÆ’Ã‚Â© permitido excluir o usuÃƒÆ’Ã‚Â¡rio atualmente logado.' })
      }

      await prisma.tenantUser.delete({
        where: { id: target.id },
      })

      return res.status(204).send()
    } catch (error) {
      return next(error)
    }
  },
)

router.get('/summary', async (req, res, next) => {
  try {
    const tenantId = getTenantId(req)
    if (!tenantId) {
      return res.status(400).json({ message: 'tenantId ÃƒÆ’Ã‚Â© obrigatÃƒÆ’Ã‚Â³rio para este usuÃƒÆ’Ã‚Â¡rio.' })
    }

    const [clientsTotal, clientsActive, tasksTotal, tasksOpen] = await Promise.all([
      prisma.client.count({ where: { tenantId } }),
      prisma.client.count({ where: { tenantId, status: 'ACTIVE' } }),
      prisma.task.count({ where: { tenantId } }),
      prisma.task.count({ where: { tenantId, status: { in: ['OPEN', 'IN_PROGRESS', 'PENDING', 'UPCOMING'] } } }),
    ])

    return res.json({
      tenantId,
      clientsTotal,
      clientsActive,
      tasksTotal,
      tasksOpen,
    })
  } catch (error) {
    return next(error)
  }
})

router.get('/state', async (req, res, next) => {
  try {
    const tenantId = getTenantId(req)
    if (!tenantId) {
      return res.status(400).json({ message: 'tenantId ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â© obrigatÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³rio para este usuÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡rio.' })
    }

    const state = await prisma.tenantState.findUnique({
      where: { tenantId },
      select: { data: true, updatedAt: true },
    })

    return res.json({
      state: state?.data || getEmptyTenantState(),
      updatedAt: state?.updatedAt || null,
    })
  } catch (error) {
    return next(error)
  }
})

router.put('/state', validateBody(tenantStateBodySchema), async (req, res, next) => {
  try {
    const tenantId = getTenantId(req)
    if (!tenantId) {
      return res.status(400).json({ message: 'tenantId obrigatorio para este usuario.' })
    }

    const currentStateRecord = await prisma.tenantState.findUnique({
      where: { tenantId },
      select: { data: true },
    })
    const currentState =
      currentStateRecord?.data && typeof currentStateRecord.data === 'object'
        ? currentStateRecord.data
        : getEmptyTenantState()

    const incomingState =
      req.body?.state && typeof req.body.state === 'object' ? req.body.state : getEmptyTenantState()

    let stateToPersist = {
      ...incomingState,
      docsReceivedDownloads: Array.isArray(incomingState?.docsReceivedDownloads)
        ? incomingState.docsReceivedDownloads
        : Array.isArray(currentState?.docsReceivedDownloads)
          ? currentState.docsReceivedDownloads
          : [],
      // Branding e salvo apenas pela rota /tenant/branding.
      // Isso evita que autosave com estado antigo apague a logo.
      branding:
        currentState?.branding && typeof currentState.branding === 'object'
          ? currentState.branding
          : incomingState?.branding && typeof incomingState.branding === 'object'
            ? incomingState.branding
            : {},
      // SMTP e salvo apenas pela rota /tenant/smtp.
      // Isso evita que autosave com estado antigo apague credenciais.
      smtpSettings:
        currentState?.smtpSettings && typeof currentState.smtpSettings === 'object'
          ? currentState.smtpSettings
          : incomingState?.smtpSettings && typeof incomingState.smtpSettings === 'object'
            ? incomingState.smtpSettings
            : getDefaultTenantSmtpSettings(),
    }

    if (req.auth?.role === 'TENANT_USER') {
      const currentTasksRows = Array.isArray(currentState?.tasksRows) ? currentState.tasksRows : []
      const incomingTasksRows = Array.isArray(stateToPersist?.tasksRows) ? stateToPersist.tasksRows : []
      const currentTaskIds = new Set(currentTasksRows.map((task) => String(task?.id ?? '')))
      const canPersistTaskRowsWithoutCreateOrDelete =
        incomingTasksRows.length === currentTasksRows.length &&
        incomingTasksRows.every((task) => currentTaskIds.has(String(task?.id ?? '')))

      stateToPersist = {
        ...stateToPersist,
        users: Array.isArray(currentState?.users) ? currentState.users : [],
        clients: Array.isArray(currentState?.clients) ? currentState.clients : [],
        taskBlueprints: Array.isArray(currentState?.taskBlueprints) ? currentState.taskBlueprints : [],
        tasksRows: canPersistTaskRowsWithoutCreateOrDelete ? incomingTasksRows : currentTasksRows,
      }
    }

    const persisted = await prisma.tenantState.upsert({
      where: { tenantId },
      update: { data: stateToPersist },
      create: {
        tenantId,
        data: stateToPersist,
      },
      select: { updatedAt: true },
    })

    return res.json({ ok: true, updatedAt: persisted.updatedAt })
  } catch (error) {
    return next(error)
  }
})

router.put(
  '/branding',
  requireRole('TENANT_ADMIN', 'SUPER_ADMIN'),
  validateBody(tenantBrandingBodySchema),
  async (req, res, next) => {
    try {
      const tenantId = getTenantId(req)
      if (!tenantId) {
        return res.status(400).json({ message: 'tenantId ÃƒÂ© obrigatÃƒÂ³rio para este usuÃƒÂ¡rio.' })
      }

      const currentStateRecord = await prisma.tenantState.findUnique({
        where: { tenantId },
        select: { data: true },
      })

      const currentState =
        currentStateRecord?.data && typeof currentStateRecord.data === 'object'
          ? currentStateRecord.data
          : getEmptyTenantState()

      const brandingSource =
        req.body?.branding && typeof req.body.branding === 'object' ? req.body.branding : {}
      const nextBranding = {
        logoDataUrl:
          typeof brandingSource.logoDataUrl === 'string' ? brandingSource.logoDataUrl : '',
        logoName: typeof brandingSource.logoName === 'string' ? brandingSource.logoName : '',
      }

      const stateToPersist = {
        ...currentState,
        schemaVersion:
          typeof currentState.schemaVersion === 'number' ? currentState.schemaVersion : 1,
        branding: nextBranding,
      }

      const persisted = await prisma.tenantState.upsert({
        where: { tenantId },
        update: { data: stateToPersist },
        create: {
          tenantId,
          data: stateToPersist,
        },
        select: { updatedAt: true },
      })

      return res.json({ ok: true, updatedAt: persisted.updatedAt, branding: nextBranding })
    } catch (error) {
      return next(error)
    }
  },
)

router.get('/smtp', requireRole('TENANT_ADMIN', 'SUPER_ADMIN'), async (req, res, next) => {
  try {
    const tenantId = getTenantId(req)
    if (!tenantId) {
      return res.status(400).json({ message: 'tenantId ÃƒÂ© obrigatÃƒÂ³rio para este usuÃƒÂ¡rio.' })
    }

    const stateRecord = await getTenantStateRecord(tenantId)
    const stateData = getTenantStateData(stateRecord)
    const storedSettings = getStoredTenantSmtpSettings(stateData)
    const effectiveSettings = getEffectiveTenantSmtpSettings(stateData)

    return res.json({
      smtp: storedSettings,
      tenantConfigured: isSmtpConfigReady(storedSettings),
      activeConfigured: isSmtpConfigReady(effectiveSettings.settings),
      activeSource: effectiveSettings.source,
    })
  } catch (error) {
    return next(error)
  }
})

router.put(
  '/smtp',
  requireRole('TENANT_ADMIN', 'SUPER_ADMIN'),
  validateBody(tenantSmtpBodySchema),
  async (req, res, next) => {
    try {
      const tenantId = getTenantId(req)
      if (!tenantId) {
        return res.status(400).json({ message: 'tenantId ÃƒÂ© obrigatÃƒÂ³rio para este usuÃƒÂ¡rio.' })
      }

      const currentStateRecord = await prisma.tenantState.findUnique({
        where: { tenantId },
        select: { data: true },
      })
      const currentState =
        currentStateRecord?.data && typeof currentStateRecord.data === 'object'
          ? currentStateRecord.data
          : getEmptyTenantState()

      const currentStoredSmtpSettings = getStoredTenantSmtpSettings(currentState)
      const nextSmtpSettings = mergeSmtpSettingsPreservingSecrets(
        currentStoredSmtpSettings,
        req.body?.smtp,
      )
      const validationMessage = getSmtpValidationMessage(nextSmtpSettings, {
        requireAuthTokens: false,
      })
      if (validationMessage) {
        return res.status(400).json({ message: validationMessage })
      }

      const stateToPersist = {
        ...currentState,
        schemaVersion: typeof currentState?.schemaVersion === 'number' ? currentState.schemaVersion : 1,
        smtpSettings: nextSmtpSettings,
      }

      const persisted = await prisma.tenantState.upsert({
        where: { tenantId },
        update: { data: stateToPersist },
        create: {
          tenantId,
          data: stateToPersist,
        },
        select: { updatedAt: true },
      })

      return res.json({
        ok: true,
        message: 'SMTP configurado com sucesso.',
        updatedAt: persisted.updatedAt,
        smtp: nextSmtpSettings,
      })
    } catch (error) {
      return next(error)
    }
  },
)

router.post(
  '/smtp/google/auth-url',
  requireRole('TENANT_ADMIN', 'SUPER_ADMIN'),
  validateBody(tenantSmtpGoogleAuthUrlBodySchema),
  async (req, res, next) => {
    try {
      const tenantId = getTenantId(req)
      if (!tenantId) {
        return res.status(400).json({ message: 'tenantId Ã© obrigatÃ³rio para este usuÃ¡rio.' })
      }

      const redirectUri = normalizeGoogleRedirectUri(req.body?.redirectUri)
      if (!redirectUri) {
        return res.status(400).json({ message: 'Redirect URI invalida para autenticacao Google.' })
      }

      const stateRecord = await getTenantStateRecord(tenantId)
      const stateData = getTenantStateData(stateRecord)
      const mergedSettings = mergeSmtpSettingsPreservingSecrets(
        getEffectiveTenantSmtpSettings(stateData).settings,
        req.body?.smtp,
      )
      const oauthClientId = String(mergedSettings.clientId || env.smtpClientId || '').trim()
      const oauthClientSecret = String(
        mergedSettings.clientSecret || env.smtpClientSecret || '',
      ).trim()

      if (!oauthClientId || !oauthClientSecret) {
        return res.status(400).json({
          message:
            'OAuth do Gmail nao configurado no servidor. Defina SMTP_CLIENT_ID e SMTP_CLIENT_SECRET.',
        })
      }

      const stateToken = buildGoogleOAuthStateToken({
        tenantId,
        userId: req.auth?.sub,
        redirectUri,
      })

      const params = new URLSearchParams({
        response_type: 'code',
        client_id: oauthClientId,
        redirect_uri: redirectUri,
        scope: GOOGLE_OAUTH_SCOPE,
        access_type: 'offline',
        prompt: 'consent',
        include_granted_scopes: 'true',
        state: stateToken,
      })

      return res.json({
        ok: true,
        authUrl: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
      })
    } catch (error) {
      return next(error)
    }
  },
)

router.post(
  '/smtp/google/exchange',
  requireRole('TENANT_ADMIN', 'SUPER_ADMIN'),
  validateBody(tenantSmtpGoogleExchangeBodySchema),
  async (req, res, next) => {
    try {
      const tenantId = getTenantId(req)
      if (!tenantId) {
        return res.status(400).json({ message: 'tenantId Ã© obrigatÃ³rio para este usuÃ¡rio.' })
      }

      const redirectUri = normalizeGoogleRedirectUri(req.body?.redirectUri)
      if (!redirectUri) {
        return res.status(400).json({ message: 'Redirect URI invalida para autenticacao Google.' })
      }

      let decodedState = null
      try {
        decodedState = jwt.verify(String(req.body?.state || ''), env.jwtSecret)
      } catch {
        return res.status(400).json({ message: 'Token de autenticacao Google invalido ou expirado.' })
      }

      if (
        decodedState?.type !== GOOGLE_OAUTH_STATE_TYPE ||
        String(decodedState?.tenantId || '').trim() !== String(tenantId || '').trim() ||
        String(decodedState?.userId || '').trim() !== String(req.auth?.sub || '').trim() ||
        String(decodedState?.redirectUri || '').trim() !== redirectUri
      ) {
        return res.status(403).json({ message: 'Sessao de autenticacao Google nao corresponde ao usuario atual.' })
      }

      const currentStateRecord = await prisma.tenantState.findUnique({
        where: { tenantId },
        select: { data: true },
      })
      const currentState =
        currentStateRecord?.data && typeof currentStateRecord.data === 'object'
          ? currentStateRecord.data
          : getEmptyTenantState()

      const mergedSettings = mergeSmtpSettingsPreservingSecrets(
        getStoredTenantSmtpSettings(currentState),
        req.body?.smtp,
      )
      const oauthClientId = String(mergedSettings.clientId || env.smtpClientId || '').trim()
      const oauthClientSecret = String(
        mergedSettings.clientSecret || env.smtpClientSecret || '',
      ).trim()

      if (!oauthClientId || !oauthClientSecret) {
        return res.status(400).json({
          message:
            'OAuth do Gmail nao configurado no servidor. Defina SMTP_CLIENT_ID e SMTP_CLIENT_SECRET.',
        })
      }

      const tokenData = await requestGoogleOAuthToken({
        code: req.body?.code,
        clientId: oauthClientId,
        clientSecret: oauthClientSecret,
        redirectUri,
      })

      const refreshToken =
        String(tokenData?.refresh_token || '').trim() || String(mergedSettings.refreshToken || '').trim()
      if (!refreshToken) {
        return res.status(400).json({
          message:
            'Google nao retornou refresh token. Revogue o acesso anterior e tente novamente com consentimento.',
        })
      }

      const accessToken = String(tokenData?.access_token || '').trim()
      const connectedEmail = await fetchGoogleAccountEmail(accessToken)

      const nextSmtpSettings = normalizeTenantSmtpSettings({
        ...mergedSettings,
        provider: 'gmail',
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        authType: 'oauth2',
        refreshToken,
        accessToken,
        user: connectedEmail || mergedSettings.user,
        from: mergedSettings.from || connectedEmail || mergedSettings.user,
      })
      const verificationSmtpSettings = normalizeTenantSmtpSettings({
        ...nextSmtpSettings,
        clientId: oauthClientId,
        clientSecret: oauthClientSecret,
      })

      const validationMessage = getSmtpValidationMessage(verificationSmtpSettings)
      if (validationMessage) {
        return res.status(400).json({ message: validationMessage })
      }

      await verifySmtpConnection({ smtpConfig: verificationSmtpSettings })

      const stateToPersist = {
        ...currentState,
        schemaVersion: typeof currentState?.schemaVersion === 'number' ? currentState.schemaVersion : 1,
        smtpSettings: nextSmtpSettings,
      }

      const persisted = await prisma.tenantState.upsert({
        where: { tenantId },
        update: { data: stateToPersist },
        create: {
          tenantId,
          data: stateToPersist,
        },
        select: { updatedAt: true },
      })

      return res.json({
        ok: true,
        message: 'Conta Gmail autenticada com sucesso.',
        updatedAt: persisted.updatedAt,
        connectedEmail: connectedEmail || nextSmtpSettings.user,
        smtp: nextSmtpSettings,
      })
    } catch (error) {
      return next(error)
    }
  },
)

router.post(
  '/smtp/test',
  requireRole('TENANT_ADMIN', 'SUPER_ADMIN'),
  validateBody(tenantSmtpTestBodySchema),
  async (req, res) => {
    try {
      const tenantId = getTenantId(req)
      if (!tenantId) {
        return res.status(400).json({ message: 'tenantId ÃƒÂ© obrigatÃƒÂ³rio para este usuÃƒÂ¡rio.' })
      }

      const stateRecord = await getTenantStateRecord(tenantId)
      const stateData = getTenantStateData(stateRecord)
      const effectiveSettings = getEffectiveTenantSmtpSettings(stateData)
      const mergedForTest = mergeSmtpSettingsPreservingSecrets(
        effectiveSettings.settings,
        req.body?.smtp,
      )

      const validationMessage = getSmtpValidationMessage(mergedForTest)
      if (validationMessage) {
        return res.status(400).json({ message: validationMessage })
      }

      await verifySmtpConnection({ smtpConfig: mergedForTest })

      const testTo = String(req.body?.testTo || '').trim()
      if (testTo) {
        await sendTaskEmail({
          smtpConfig: mergedForTest,
          to: testTo,
          subject: 'Teste SMTP - Hive Tarefas',
          text: 'Sua configuracao SMTP foi validada com sucesso no Hive Tarefas.',
        })
        return res.json({
          ok: true,
          message: `Conexao validada e e-mail de teste enviado para ${testTo}.`,
        })
      }

      return res.json({
        ok: true,
        message: 'Conexao SMTP validada com sucesso.',
      })
    } catch (error) {
      return res.status(400).json({ message: getSmtpRuntimeErrorMessage(error) })
    }
  },
)

router.get('/portal/bootstrap', async (req, res, next) => {
  try {
    const tenantId = getTenantId(req)
    if (!tenantId) {
      return res.status(400).json({ message: 'tenantId ÃƒÂ© obrigatÃƒÂ³rio para este usuÃƒÂ¡rio.' })
    }

    const authUser = await prisma.tenantUser.findFirst({
      where: { id: req.auth?.sub, tenantId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        clientIds: true,
      },
    })

    if (!authUser) {
      return res.status(403).json({ message: 'UsuÃƒÂ¡rio sem acesso ao tenant informado.' })
    }

    const stateRecord = await getTenantStateRecord(tenantId)
    const stateData = getTenantStateData(stateRecord)
    const stateClients = normalizeClientsFromState(stateData)
    const stateSolicitations = Array.isArray(stateData?.solicitationRecords)
      ? stateData.solicitationRecords
      : []

    const isTenantRestrictedUser = authUser.role === 'TENANT_USER'
    const allowedClientIds = new Set(
      (Array.isArray(authUser.clientIds) ? authUser.clientIds : [])
        .map((clientId) => String(clientId || '').trim())
        .filter(Boolean),
    )
    const fallbackClientByIdentity = findClientByUserIdentity(stateClients, authUser)
    const effectiveAllowedClientIds =
      isTenantRestrictedUser && allowedClientIds.size === 0 && fallbackClientByIdentity?.id
        ? new Set([String(fallbackClientByIdentity.id).trim()])
        : allowedClientIds

    const visibleClients = isTenantRestrictedUser
      ? stateClients.filter((client) => effectiveAllowedClientIds.has(client.id))
      : stateClients

    const visibleClientIds = new Set(visibleClients.map((client) => client.id))
    const visibleSolicitations = stateSolicitations
      .filter((record) => {
        if (!isTenantRestrictedUser) return true
        const recordClientId = String(record?.clientId || '').trim()
        if (recordClientId) return visibleClientIds.has(recordClientId)

        const createdByUserId = String(record?.createdByUserId || '').trim()
        const createdByUserEmail = normalizeLookupText(record?.createdByUserEmail || '')
        const authUserId = String(authUser?.id || '').trim()
        const authUserEmail = normalizeLookupText(authUser?.email || '')
        if (createdByUserId && authUserId && createdByUserId === authUserId) return true
        if (createdByUserEmail && authUserEmail && createdByUserEmail === authUserEmail) return true

        const recordClientName = normalizeLookupText(record?.clientName || '')
        const fallbackClientName = normalizeLookupText(fallbackClientByIdentity?.nome || '')
        return Boolean(recordClientName && fallbackClientName && recordClientName === fallbackClientName)
      })
      .map((record) => {
        const recordClientId = String(record?.clientId || '').trim()
        const linkedClient = visibleClients.find((client) => client.id === recordClientId)
        const resolvedResponsible = getLatestActionActorByRecord({
          stateData,
          source: 'solicitation',
          recordId: record?.id,
          fallback: String(record?.responsavel || '').trim() || 'A definir',
        })
        return {
          ...record,
          clientId: recordClientId || record?.clientId || '',
          clientName:
            String(record?.clientName || '').trim() || linkedClient?.nome || 'Cliente nÃƒÂ£o informado',
          responsavel: resolvedResponsible,
        }
      })
      .sort((a, b) => Number(b?.id || 0) - Number(a?.id || 0))

    const visibleDocuments = buildPortalDocumentsFromState({
      stateData,
      visibleClients,
      isTenantRestrictedUser,
      authUser,
    }).map((documentRow) => {
      const { contentBase64, ...meta } = documentRow
      return {
        ...meta,
        hasContent: Boolean(String(contentBase64 || '').trim()),
      }
    })

    return res.json({
      user: {
        id: authUser.id,
        name: authUser.name,
        email: authUser.email,
        role: authUser.role,
        clientIds: Array.isArray(authUser.clientIds) ? authUser.clientIds : [],
      },
      clients: visibleClients,
      solicitations: visibleSolicitations,
      documents: visibleDocuments,
      updatedAt: stateRecord?.updatedAt || null,
    })
  } catch (error) {
    return next(error)
  }
})

router.post(
  '/portal/documents/download',
  validateBody(portalDocumentDownloadSchema),
  async (req, res, next) => {
    try {
      const tenantId = getTenantId(req)
      if (!tenantId) {
        return res.status(400).json({ message: 'tenantId e obrigatorio para este usuario.' })
      }

      const authUser = await prisma.tenantUser.findFirst({
        where: { id: req.auth?.sub, tenantId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          clientIds: true,
        },
      })

      if (!authUser) {
        return res.status(403).json({ message: 'Usuario sem acesso ao tenant informado.' })
      }

      const stateRecord = await getTenantStateRecord(tenantId)
      const stateData = getTenantStateData(stateRecord)
      const stateClients = normalizeClientsFromState(stateData)

      const isTenantRestrictedUser = authUser.role === 'TENANT_USER'
      const allowedClientIds = new Set(
        (Array.isArray(authUser.clientIds) ? authUser.clientIds : [])
          .map((clientId) => String(clientId || '').trim())
          .filter(Boolean),
      )
      const fallbackClientByIdentity = findClientByUserIdentity(stateClients, authUser)
      const effectiveAllowedClientIds =
        isTenantRestrictedUser && allowedClientIds.size === 0 && fallbackClientByIdentity?.id
          ? new Set([String(fallbackClientByIdentity.id).trim()])
          : allowedClientIds

      const visibleClients = isTenantRestrictedUser
        ? stateClients.filter((client) => effectiveAllowedClientIds.has(client.id))
        : stateClients

      const portalDocuments = buildPortalDocumentsFromState({
        stateData,
        visibleClients,
        isTenantRestrictedUser,
        authUser,
      })

      const documentKey = String(req.body?.documentKey || '').trim()
      const targetDocument = portalDocuments.find((item) => String(item?.documentKey || '').trim() === documentKey)
      if (!targetDocument) {
        return res.status(404).json({ message: 'Documento nao encontrado para este usuario.' })
      }

      const contentBase64 = String(targetDocument?.contentBase64 || '').trim()
      if (!contentBase64) {
        return res.status(400).json({ message: 'O anexo selecionado nao possui conteudo para download.' })
      }

      const downloadedAt = new Date().toISOString()
      const currentDownloads = Array.isArray(stateData?.docsReceivedDownloads)
        ? stateData.docsReceivedDownloads
        : []
      const authUserId = String(authUser.id || '').trim()
      const authUserEmail = String(authUser.email || '').trim()
      const authUserEmailNormalized = normalizeLookupText(authUserEmail)

      const nextDownloads = [
        ...currentDownloads.filter((entry) => {
          const sameKey = String(entry?.key || '').trim() === documentKey
          const sameUserById = String(entry?.userId || '').trim() === authUserId
          const sameUserByEmail =
            Boolean(authUserEmailNormalized) &&
            normalizeLookupText(String(entry?.userEmail || '').trim()) === authUserEmailNormalized
          return !(sameKey && (sameUserById || sameUserByEmail))
        }),
        {
          key: documentKey,
          userId: authUserId,
          userEmail: authUserEmail,
          downloadedAt,
        },
      ]

      const stateToPersist = {
        ...stateData,
        schemaVersion: typeof stateData?.schemaVersion === 'number' ? stateData.schemaVersion : 1,
        docsReceivedDownloads: nextDownloads,
      }

      await prisma.tenantState.upsert({
        where: { tenantId },
        update: { data: stateToPersist },
        create: {
          tenantId,
          data: stateToPersist,
        },
      })

      return res.json({
        ok: true,
        downloadedAt,
        file: {
          name: String(targetDocument.attachmentName || 'documento'),
          type: String(targetDocument.attachmentType || 'application/octet-stream'),
          size: Number(targetDocument.attachmentSize || 0),
          contentBase64,
        },
      })
    } catch (error) {
      return next(error)
    }
  },
)

router.post(
  '/portal/solicitations',
  validateBody(docsSolicitationCreateSchema),
  async (req, res, next) => {
    try {
      const tenantId = getTenantId(req)
      if (!tenantId) {
        return res.status(400).json({ message: 'tenantId ÃƒÂ© obrigatÃƒÂ³rio para este usuÃƒÂ¡rio.' })
      }

      const authUser = await prisma.tenantUser.findFirst({
        where: { id: req.auth?.sub, tenantId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          clientIds: true,
        },
      })

      if (!authUser) {
        return res.status(403).json({ message: 'UsuÃƒÂ¡rio sem acesso ao tenant informado.' })
      }

      const stateRecord = await getTenantStateRecord(tenantId)
      const stateData = getTenantStateData(stateRecord)
      const stateClients = normalizeClientsFromState(stateData)
      const currentSolicitationRecords = Array.isArray(stateData?.solicitationRecords)
        ? stateData.solicitationRecords
        : []

      const isTenantRestrictedUser = authUser.role === 'TENANT_USER'
      const allowedClientIds = new Set(
        (Array.isArray(authUser.clientIds) ? authUser.clientIds : [])
          .map((clientId) => String(clientId || '').trim())
          .filter(Boolean),
      )

      const requestedClientIds = Array.from(
        new Set(
          (Array.isArray(req.body.clientIds) ? req.body.clientIds : [])
            .map((clientId) => String(clientId || '').trim())
            .filter(Boolean),
        ),
      )

      const fallbackClientByIdentity = findClientByUserIdentity(stateClients, authUser)
      const allowedClientIdsList = Array.from(allowedClientIds)
      const defaultClientId =
        requestedClientIds.length > 0
          ? ''
          : isTenantRestrictedUser && allowedClientIdsList.length > 0
            ? fallbackClientByIdentity?.id && allowedClientIds.has(String(fallbackClientByIdentity.id).trim())
              ? String(fallbackClientByIdentity.id).trim()
              : String(allowedClientIdsList[0] || '').trim()
            : String(fallbackClientByIdentity?.id || '').trim()
      const effectiveClientIds = requestedClientIds.length > 0 ? requestedClientIds : [defaultClientId].filter(Boolean)

      let targetClients = stateClients.filter((client) => {
        if (!effectiveClientIds.includes(client.id)) return false
        if (!isTenantRestrictedUser) return true
        if (allowedClientIds.size > 0) return allowedClientIds.has(client.id)
        return true
      })

      if (!targetClients.length) {
        if (requestedClientIds.length > 0) {
          return res.status(400).json({
            message: 'Nenhum cliente vÃƒÂ¡lido encontrado para criar a solicitaÃƒÂ§ÃƒÂ£o.',
          })
        }
        targetClients = [
          {
            id: '',
            nome: String(authUser.name || '').trim() || 'Cliente nÃƒÂ£o informado',
            status: 'Ativo',
            inscricao: '',
            email: String(authUser.email || '').trim(),
          },
        ]
      }

      let nextId = getNextSolicitationId(currentSolicitationRecords)
      const departamento = String(req.body.departamento || '').trim()
      const processo = String(req.body.processo || '').trim()
      const etapa = String(req.body.etapa || '').trim() || 'Aberta'
      const assunto = String(req.body.assunto || '').trim()
      const actionDate = String(req.body.actionDate || '').trim()
      const metaDate = String(req.body.metaDate || '').trim()
      const dueDate = String(req.body.dueDate || '').trim()
      const andamento = String(req.body.andamento || '').trim()
      const responsavel = String(req.body.responsavel || '').trim() || String(authUser.name || '').trim()
      const createdAt = new Date().toISOString()
      const incomingAttachments = Array.isArray(req.body.attachments) ? req.body.attachments : []
      const normalizedIncomingAttachments = []

      for (const attachment of incomingAttachments) {
        const attachmentName = String(attachment?.name || 'anexo')
        const attachmentType = String(attachment?.type || 'application/octet-stream')
        const contentBase64 = String(attachment?.contentBase64 || '').trim()
        let decodedSize = 0
        try {
          decodedSize = Buffer.byteLength(contentBase64, 'base64')
        } catch {
          return res.status(400).json({ message: `Anexo invÃƒÂ¡lido: ${attachmentName}.` })
        }

        if (!decodedSize) {
          return res.status(400).json({ message: `Anexo vazio: ${attachmentName}.` })
        }

        if (decodedSize > MAX_DOCS_ATTACHMENT_SIZE_BYTES) {
          return res
            .status(400)
            .json({ message: `O anexo ${attachmentName} excede 25MB. Limite por documento: 25MB.` })
        }

        normalizedIncomingAttachments.push({
          name: attachmentName,
          type: attachmentType,
          size: decodedSize,
          contentBase64,
        })
      }

      const newRecords = targetClients.map((client) => {
        const recordId = nextId
        const recordAttachments = normalizedIncomingAttachments.map((attachment, index) => ({
          id: `${recordId}-${index}-${String(attachment.name || 'anexo')}`,
          name: String(attachment.name || 'anexo'),
          size: Number(attachment.size || 0),
          type: String(attachment.type || 'application/octet-stream'),
          contentBase64: String(attachment.contentBase64 || ''),
        }))
        const record = {
          id: recordId,
          departamento,
          processo,
          etapa,
          assunto,
          clientId: String(client.id || '').trim(),
          clientName:
            String(client.nome || '').trim() || String(authUser.name || '').trim() || 'Cliente nÃƒÂ£o informado',
          actionDate,
          metaDate,
          dueDate,
          andamento,
          responsavel,
          convidados: '',
          attachments: recordAttachments,
          notifyOpen: false,
          notifyEnd: false,
          notifyGuests: false,
          replicateSubtasks: false,
          iAmResponsible: false,
          iAmAuthorizer: false,
          allowDepartmentVisibility: true,
          status: '',
          tag: 'success',
          deliveryDate: '',
          conclusionDate: '',
          baixaAt: '',
          baixaAction: '',
          justification: '',
          emailSentAt: '',
          emailSentTo: '',
          createdAt,
          createdByUserId: String(authUser.id || '').trim(),
          createdByUserEmail: String(authUser.email || '').trim(),
          source: 'hive-docs',
        }
        nextId += 1
        return record
      })

      const stateToPersist = {
        ...stateData,
        schemaVersion: typeof stateData?.schemaVersion === 'number' ? stateData.schemaVersion : 1,
        solicitationRecords: [...newRecords, ...currentSolicitationRecords],
      }

      const persisted = await prisma.tenantState.upsert({
        where: { tenantId },
        update: { data: stateToPersist },
        create: {
          tenantId,
          data: stateToPersist,
        },
        select: { updatedAt: true },
      })

      return res.status(201).json({
        ok: true,
        records: newRecords,
        updatedAt: persisted.updatedAt,
      })
    } catch (error) {
      return next(error)
    }
  },
)

router.put(
  '/portal/solicitations/:id',
  validateBody(docsSolicitationCreateSchema),
  async (req, res, next) => {
    try {
      const tenantId = getTenantId(req)
      if (!tenantId) {
        return res.status(400).json({ message: 'tenantId ÃƒÂ© obrigatÃƒÂ³rio para este usuÃƒÂ¡rio.' })
      }

      const authUser = await prisma.tenantUser.findFirst({
        where: { id: req.auth?.sub, tenantId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          clientIds: true,
        },
      })

      if (!authUser) {
        return res.status(403).json({ message: 'UsuÃƒÂ¡rio sem acesso ao tenant informado.' })
      }

      const targetId = String(req.params?.id || '').trim()
      if (!targetId) {
        return res.status(400).json({ message: 'ID da solicitaÃƒÂ§ÃƒÂ£o invÃƒÂ¡lido.' })
      }

      const stateRecord = await getTenantStateRecord(tenantId)
      const stateData = getTenantStateData(stateRecord)
      const stateClients = normalizeClientsFromState(stateData)
      const currentSolicitationRecords = Array.isArray(stateData?.solicitationRecords)
        ? stateData.solicitationRecords
        : []

      const targetIndex = currentSolicitationRecords.findIndex(
        (record) => String(record?.id || '').trim() === targetId,
      )
      if (targetIndex < 0) {
        return res.status(404).json({ message: 'SolicitaÃƒÂ§ÃƒÂ£o nÃƒÂ£o encontrada.' })
      }

      const targetRecord = currentSolicitationRecords[targetIndex]
      const isTenantRestrictedUser = authUser.role === 'TENANT_USER'
      const allowedClientIds = new Set(
        (Array.isArray(authUser.clientIds) ? authUser.clientIds : [])
          .map((clientId) => String(clientId || '').trim())
          .filter(Boolean),
      )
      const fallbackClientByIdentity = findClientByUserIdentity(stateClients, authUser)

      const canAccessRecord = (() => {
        if (!isTenantRestrictedUser) return true

        const recordClientId = String(targetRecord?.clientId || '').trim()
        const recordClientName = normalizeLookupText(targetRecord?.clientName || '')
        const createdByUserId = String(targetRecord?.createdByUserId || '').trim()
        const createdByUserEmail = normalizeLookupText(targetRecord?.createdByUserEmail || '')
        const authUserId = String(authUser?.id || '').trim()
        const authUserEmail = normalizeLookupText(authUser?.email || '')
        const fallbackClientId = String(fallbackClientByIdentity?.id || '').trim()
        const fallbackClientName = normalizeLookupText(fallbackClientByIdentity?.nome || '')

        if (recordClientId && allowedClientIds.size > 0) {
          return allowedClientIds.has(recordClientId)
        }
        if (recordClientId && fallbackClientId && recordClientId === fallbackClientId) return true
        if (createdByUserId && authUserId && createdByUserId === authUserId) return true
        if (createdByUserEmail && authUserEmail && createdByUserEmail === authUserEmail) return true
        if (recordClientName && fallbackClientName && recordClientName === fallbackClientName) return true
        return false
      })()

      if (!canAccessRecord) {
        return res.status(403).json({ message: 'Sem permissÃƒÂ£o para editar esta solicitaÃƒÂ§ÃƒÂ£o.' })
      }

      const currentStatusLabel = String(
        targetRecord?.status || targetRecord?.etapa || 'Aberta',
      ).trim()
      if (!isOpenStatusLabel(currentStatusLabel)) {
        return res.status(409).json({
          message:
            'Esta solicitaÃƒÂ§ÃƒÂ£o nÃƒÂ£o estÃƒÂ¡ mais aberta e nÃƒÂ£o pode ser editada no HIVE DOCS.',
        })
      }

      const departamento = String(req.body.departamento || '').trim()
      const processo = String(req.body.processo || '').trim()
      const etapa = String(req.body.etapa || '').trim() || String(targetRecord?.etapa || 'Aberta').trim()
      const assunto = String(req.body.assunto || '').trim()
      const actionDate = String(req.body.actionDate || '').trim()
      const metaDate = String(req.body.metaDate || '').trim()
      const dueDate = String(req.body.dueDate || '').trim()
      const andamento = String(req.body.andamento || '').trim()
      const responsavel =
        String(req.body.responsavel || '').trim() || String(targetRecord?.responsavel || '').trim()

      const incomingAttachments = Array.isArray(req.body.attachments) ? req.body.attachments : []
      const normalizedIncomingAttachments = []

      for (const attachment of incomingAttachments) {
        const attachmentName = String(attachment?.name || 'anexo')
        const attachmentType = String(attachment?.type || 'application/octet-stream')
        const contentBase64 = String(attachment?.contentBase64 || '').trim()
        let decodedSize = 0
        try {
          decodedSize = Buffer.byteLength(contentBase64, 'base64')
        } catch {
          return res.status(400).json({ message: `Anexo invÃƒÂ¡lido: ${attachmentName}.` })
        }

        if (!decodedSize) {
          return res.status(400).json({ message: `Anexo vazio: ${attachmentName}.` })
        }

        if (decodedSize > MAX_DOCS_ATTACHMENT_SIZE_BYTES) {
          return res
            .status(400)
            .json({ message: `O anexo ${attachmentName} excede 25MB. Limite por documento: 25MB.` })
        }

        normalizedIncomingAttachments.push({
          name: attachmentName,
          type: attachmentType,
          size: decodedSize,
          contentBase64,
        })
      }

      const updatedAt = new Date().toISOString()
      const updatedRecord = {
        ...targetRecord,
        departamento,
        processo,
        etapa,
        assunto,
        actionDate,
        metaDate,
        dueDate,
        andamento,
        responsavel,
        attachments: normalizedIncomingAttachments.map((attachment, index) => ({
          id: `${targetId}-${index}-${String(attachment.name || 'anexo')}`,
          name: String(attachment.name || 'anexo'),
          size: Number(attachment.size || 0),
          type: String(attachment.type || 'application/octet-stream'),
          contentBase64: String(attachment.contentBase64 || ''),
        })),
        updatedAt,
        updatedByUserId: String(authUser.id || '').trim(),
        updatedByUserEmail: String(authUser.email || '').trim(),
      }

      const nextSolicitationRecords = [...currentSolicitationRecords]
      nextSolicitationRecords[targetIndex] = updatedRecord

      const stateToPersist = {
        ...stateData,
        schemaVersion: typeof stateData?.schemaVersion === 'number' ? stateData.schemaVersion : 1,
        solicitationRecords: nextSolicitationRecords,
      }

      const persisted = await prisma.tenantState.upsert({
        where: { tenantId },
        update: { data: stateToPersist },
        create: {
          tenantId,
          data: stateToPersist,
        },
        select: { updatedAt: true },
      })

      return res.json({
        ok: true,
        record: updatedRecord,
        updatedAt: persisted.updatedAt,
      })
    } catch (error) {
      return next(error)
    }
  },
)

router.post('/send-task-email', validateBody(sendTaskEmailSchema), async (req, res, next) => {
  try {
    const tenantId = getTenantId(req)
    if (!tenantId) {
      return res.status(400).json({ message: 'tenantId ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â© obrigatÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³rio para este usuÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡rio.' })
    }

    const stateRecord = await getTenantStateRecord(tenantId)
    const stateData = getTenantStateData(stateRecord)
    const effectiveSmtp = getEffectiveTenantSmtpSettings(stateData).settings
    const validationMessage = getSmtpValidationMessage(effectiveSmtp)
    if (validationMessage) {
      return res.status(400).json({
        message: `SMTP nao configurado corretamente. ${validationMessage}`,
      })
    }

    let attachmentBuffer = null
    if (req.body.attachment?.contentBase64) {
      try {
        attachmentBuffer = Buffer.from(req.body.attachment.contentBase64, 'base64')
      } catch {
        return res.status(400).json({ message: 'Anexo invÃƒÆ’Ã‚Â¡lido para envio por e-mail.' })
      }

      if (!attachmentBuffer?.length) {
        return res.status(400).json({ message: 'Anexo vazio para envio por e-mail.' })
      }
    }

    const emailText =
      req.body.notificationType === 'portal-document'
        ? buildPortalDocumentNotificationMessage(req.body.clientName)
        : [
            `Encaminhamento automÃƒÆ’Ã‚Â¡tico da Hive Tarefas.`,
            req.body.taskId
              ? `ReferÃƒÆ’Ã‚Âªncia: ${req.body.taskSource || 'task'} #${req.body.taskId}`
              : '',
            req.body.message || '',
          ]
            .filter(Boolean)
            .join('\n\n')

    let info = null
    try {
      info = await sendTaskEmail({
        smtpConfig: effectiveSmtp,
        to: req.body.to,
        subject: req.body.subject,
        text: emailText,
        attachment:
          req.body.attachment && attachmentBuffer
            ? {
                name: req.body.attachment.name,
                type: req.body.attachment.type,
                buffer: attachmentBuffer,
              }
            : null,
      })
    } catch (smtpError) {
      return res.status(400).json({ message: getSmtpRuntimeErrorMessage(smtpError) })
    }

    return res.json({
      ok: true,
      messageId: info?.messageId || null,
      sentAt: new Date().toISOString(),
    })
  } catch (error) {
    return next(error)
  }
})

router.get('/clients', validateQuery(listClientsQuerySchema), async (req, res, next) => {
  try {
    const tenantId = getTenantId(req)
    if (!tenantId) {
      return res.status(400).json({ message: 'tenantId ÃƒÆ’Ã‚Â© obrigatÃƒÆ’Ã‚Â³rio para este usuÃƒÆ’Ã‚Â¡rio.' })
    }

    const query = req.query.q.trim()
    const statusFilter = req.query.status

    const clients = await prisma.client.findMany({
      where: {
        tenantId,
        AND: [
          statusFilter !== 'ALL' ? { status: statusFilter } : {},
          query
            ? {
                OR: [
                  { name: { contains: query, mode: 'insensitive' } },
                  { alias: { contains: query, mode: 'insensitive' } },
                  { documentNumber: { contains: query, mode: 'insensitive' } },
                ],
              }
            : {},
        ],
      },
      orderBy: { createdAt: 'desc' },
    })

    return res.json(clients)
  } catch (error) {
    return next(error)
  }
})

router.post('/clients', requireRole('TENANT_ADMIN', 'SUPER_ADMIN'), validateBody(upsertClientSchema), async (req, res, next) => {
  try {
    const tenantId = resolveTenantFromAuth(req)
    if (!tenantId) {
      return res.status(400).json({ message: 'tenantId ÃƒÆ’Ã‚Â© obrigatÃƒÆ’Ã‚Â³rio para este usuÃƒÆ’Ã‚Â¡rio.' })
    }

    const client = await prisma.client.create({
      data: {
        tenantId,
        ...req.body,
        name: req.body.name.trim(),
        alias: req.body.alias?.trim() || null,
        email: req.body.email?.trim() || null,
      },
    })

    return res.status(201).json(client)
  } catch (error) {
    return next(error)
  }
})

router.get('/tasks', validateQuery(listTasksQuerySchema), async (req, res, next) => {
  try {
    const tenantId = getTenantId(req)
    if (!tenantId) {
      return res.status(400).json({ message: 'tenantId ÃƒÆ’Ã‚Â© obrigatÃƒÆ’Ã‚Â³rio para este usuÃƒÆ’Ã‚Â¡rio.' })
    }

    const query = req.query.q.trim()
    const typeFilter = req.query.type
    const statusFilter = req.query.status

    const tasks = await prisma.task.findMany({
      where: {
        tenantId,
        AND: [
          typeFilter !== 'ALL' ? { type: typeFilter } : {},
          statusFilter !== 'ALL' ? { status: statusFilter } : {},
          query
            ? {
                OR: [
                  { title: { contains: query, mode: 'insensitive' } },
                  { department: { contains: query, mode: 'insensitive' } },
                  { competence: { contains: query, mode: 'insensitive' } },
                  { client: { name: { contains: query, mode: 'insensitive' } } },
                ],
              }
            : {},
        ],
      },
      include: {
        client: { select: { id: true, name: true, documentNumber: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return res.json(tasks)
  } catch (error) {
    return next(error)
  }
})

export default router


