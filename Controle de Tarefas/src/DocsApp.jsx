import { useEffect, useMemo, useRef, useState } from 'react'
import './docs.css'

const API_BASE_URL = String(import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '')

const STORAGE_KEYS = {
  session: 'hive_docs_session',
  remember: 'hive_docs_remember',
  login: 'hive_docs_login',
  email: 'hive_docs_email',
}

const DOCS_SECTION = {
  SOLICITATIONS: 'solicitations',
  DOCUMENTS: 'documents',
}

const defaultDepartmentOptions = [
  'Dep. Pessoal',
  'Fiscal',
  'Contábil',
  'Sucesso do Cliente',
  'Cliente',
]

const defaultStageOptions = ['Aberta', 'Em andamento', 'Pendente', 'Finalizado']
const MAX_ATTACHMENT_SIZE_BYTES = 25 * 1024 * 1024
const FILTER_ALL_VALUE = 'Todos'

const SOLICITATION_DATE_FILTER_OPTIONS = [
  { value: 'actionDate', label: 'Ação' },
  { value: 'metaDate', label: 'Meta' },
  { value: 'dueDate', label: 'Vencimento' },
  { value: 'conclusionDate', label: 'Conclusão' },
]

const DOCUMENT_DATE_FILTER_OPTIONS = [
  { value: 'actionDate', label: 'Ação' },
  { value: 'metaDate', label: 'Meta' },
  { value: 'dueDate', label: 'Vencimento' },
  { value: 'conclusionDate', label: 'Conclusão' },
  { value: 'downloadedAt', label: 'Baixado em' },
]

const getTodayIsoLocal = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const parseIsoDateToBr = (value) => {
  const text = String(value || '').trim()
  const match = text.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!match) return text
  const [, year, month, day] = match
  return `${day}/${month}/${year}`
}

const getCompetenceFromIso = (isoDate) => {
  const text = String(isoDate || '').trim()
  const match = text.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!match) return ''
  const [, year, month] = match
  return `${month}/${year}`
}

const normalizeDateForFilter = (value) => {
  const text = String(value || '').trim()
  if (!text) return ''

  const isoMatch = text.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (isoMatch) return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`

  const brMatch = text.match(/^(\d{2})\/(\d{2})\/(\d{4})/)
  if (brMatch) return `${brMatch[3]}-${brMatch[2]}-${brMatch[1]}`

  const parsed = new Date(text)
  if (Number.isNaN(parsed.getTime())) return ''

  const year = parsed.getFullYear()
  const month = String(parsed.getMonth() + 1).padStart(2, '0')
  const day = String(parsed.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const toSortedUniqueOptions = (values) =>
  Array.from(new Set(values.filter(Boolean)))
    .map((item) => String(item).trim())
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }))

const getEmptyDocsFilters = (section) => ({
  status: FILTER_ALL_VALUE,
  department: FILTER_ALL_VALUE,
  client: FILTER_ALL_VALUE,
  name: FILTER_ALL_VALUE,
  competence: FILTER_ALL_VALUE,
  dateField: section === DOCS_SECTION.DOCUMENTS ? 'dueDate' : 'actionDate',
  startDate: '',
  endDate: '',
})

const parseIsoDateTimeToBr = (value) => {
  const text = String(value || '').trim()
  if (!text) return ''
  const parsed = new Date(text)
  if (Number.isNaN(parsed.getTime())) return text
  return parsed.toLocaleString('pt-BR')
}

const getStatusLabel = (record) =>
  String(record?.status || '').trim() || String(record?.etapa || '').trim() || 'Aberta'

const isFinalStatus = (value) => {
  const normalized = String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
  return ['finaliz', 'conclu', 'dispensad', 'encerrad'].some((keyword) => normalized.includes(keyword))
}

const isOpenSolicitationStatus = (value) =>
  String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .includes('abert')

const getStatusBadgeTone = (value) => {
  const normalized = String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()

  if (!normalized) return 'warn'
  if (normalized.includes('respondid')) return 'responded'
  if (normalized.includes('andamento')) return 'progress'
  if (normalized.includes('abert')) return 'danger'
  if (
    normalized.includes('disponivel') ||
    normalized.includes('baixad') ||
    normalized.includes('finaliz') ||
    normalized.includes('conclu')
  ) {
    return 'ok'
  }

  return 'warn'
}

const normalizeConversationMessages = (value) => {
  const source = Array.isArray(value) ? value : []
  return source
    .map((entry, index) => {
      const text = String(entry?.text || entry?.message || '').trim()
      if (!text) return null
      const authorType = String(entry?.authorType || '').trim() === 'client' ? 'client' : 'internal'
      const rawCreatedAt = String(entry?.createdAt || entry?.timestamp || '').trim()
      const normalizedCreatedAt =
        rawCreatedAt && !Number.isNaN(new Date(rawCreatedAt).getTime())
          ? new Date(rawCreatedAt).toISOString()
          : ''
      return {
        id: String(entry?.id || `docs-chat-${Date.now()}-${index}`),
        authorType,
        authorName: String(entry?.authorName || '').trim(),
        authorEmail: String(entry?.authorEmail || '').trim(),
        text,
        createdAt: normalizedCreatedAt,
      }
    })
    .filter(Boolean)
}

const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = String(reader.result || '')
      const base64 = result.includes(',') ? result.split(',')[1] : result
      resolve(base64 || '')
    }
    reader.onerror = () => reject(new Error('Não foi possível ler o arquivo.'))
    reader.readAsDataURL(file)
  })

const triggerBase64Download = ({ contentBase64, fileName, mimeType }) => {
  const base64 = String(contentBase64 || '').trim()
  if (!base64) return false
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }
  const blob = new Blob([bytes], { type: String(mimeType || 'application/octet-stream') })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = String(fileName || 'documento')
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  URL.revokeObjectURL(url)
  return true
}

const formatFileSize = (value) => {
  const size = Number(value || 0)
  if (!Number.isFinite(size) || size <= 0) return '0 B'
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

const getLatestDownloadedAtFromAttachments = (attachments) => {
  let latest = ''
  let latestTime = 0
  for (const attachment of Array.isArray(attachments) ? attachments : []) {
    const downloadedAt = String(attachment?.downloadedAt || '').trim()
    if (!downloadedAt) continue
    const time = Date.parse(downloadedAt)
    if (Number.isNaN(time)) continue
    if (!latest || time >= latestTime) {
      latest = downloadedAt
      latestTime = time
    }
  }
  return latest
}

const normalizePortalDocumentAttachments = (row) => {
  const source = Array.isArray(row?.attachments) ? row.attachments : []
  const normalized = source
    .map((attachment, index) => {
      const attachmentName = String(attachment?.attachmentName || attachment?.name || '').trim()
      const contentBase64 = String(attachment?.contentBase64 || '').trim()
      const hasContent = Boolean(
        attachment?.hasContent !== undefined ? attachment?.hasContent : contentBase64,
      )
      const attachmentKey =
        String(attachment?.attachmentKey || '').trim() ||
        `${String(row?.documentKey || '').trim() || String(row?.taskId || '').trim()}::${index}`
      return {
        attachmentKey,
        attachmentId: String(attachment?.attachmentId || attachment?.id || '').trim(),
        attachmentName: attachmentName || `anexo-${index + 1}`,
        attachmentSize: Number(attachment?.attachmentSize || attachment?.size || 0),
        attachmentType: String(
          attachment?.attachmentType || attachment?.type || 'application/octet-stream',
        ),
        downloadedAt: String(attachment?.downloadedAt || '').trim(),
        status: String(attachment?.status || '').trim(),
        hasContent,
        contentBase64,
      }
    })
    .filter((attachment) => attachment.attachmentName || attachment.hasContent)

  if (normalized.length) {
    return normalized.sort((a, b) =>
      String(a?.attachmentName || '').localeCompare(String(b?.attachmentName || ''), 'pt-BR'),
    )
  }

  const fallbackName = String(row?.attachmentName || '').trim()
  const fallbackContent = String(row?.contentBase64 || '').trim()
  const fallbackHasContent = Boolean(row?.hasContent || fallbackContent)
  if (!fallbackName && !fallbackHasContent) return []

  return [
    {
      attachmentKey: `${String(row?.documentKey || '').trim() || String(row?.taskId || '').trim()}::single`,
      attachmentId: String(row?.attachmentId || '').trim(),
      attachmentName: fallbackName || 'anexo',
      attachmentSize: Number(row?.attachmentSize || 0),
      attachmentType: String(row?.attachmentType || 'application/octet-stream'),
      downloadedAt: String(row?.downloadedAt || '').trim(),
      status: String(row?.status || '').trim(),
      hasContent: fallbackHasContent,
      contentBase64: fallbackContent,
    },
  ]
}

const normalizePortalDocumentRecord = (row) => {
  const attachments = normalizePortalDocumentAttachments(row)
  const latestDownloadedAtFromAttachments = getLatestDownloadedAtFromAttachments(attachments)
  const downloadedAt = String(row?.downloadedAt || '').trim() || latestDownloadedAtFromAttachments
  const hasContent = attachments.some((attachment) => Boolean(attachment?.hasContent))
  return {
    ...row,
    attachments,
    hasContent,
    downloadedAt,
    status: downloadedAt ? 'Arquivo baixado' : 'Disponível',
  }
}

const getEmptySolicitationForm = (responsavel = '') => {
  const today = getTodayIsoLocal()
  return {
    departamento: '',
    processo: '',
    etapa: 'Aberta',
    assunto: '',
    actionDate: today,
    metaDate: today,
    dueDate: today,
    andamento: '',
    responsavel,
    attachments: [],
  }
}

const getErrorMessage = async (response) => {
  try {
    const payload = await response.json()
    if (payload && typeof payload.message === 'string') {
      const detail =
        typeof payload.detail === 'string' && payload.detail.trim()
          ? ` (${payload.detail.trim()})`
          : ''
      return `${payload.message}${detail}`
    }
  } catch {
    // ignore parsing error
  }
  return `Falha na requisição (${response.status}).`
}

const apiRequest = async (path, { method = 'GET', token, body } = {}) => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })

  if (!response.ok) {
    const error = new Error(await getErrorMessage(response))
    error.status = response.status
    throw error
  }

  if (response.status === 204) return null
  return response.json()
}

function DocsApp() {
  const [session, setSession] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.session)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  })

  const [remember, setRemember] = useState(() => localStorage.getItem(STORAGE_KEYS.remember) === 'true')
  const [loginForm, setLoginForm] = useState(() => ({
    login: localStorage.getItem(STORAGE_KEYS.login) || localStorage.getItem(STORAGE_KEYS.email) || '',
    password: '',
  }))
  const [loginLoading, setLoginLoading] = useState(false)
  const [loginError, setLoginError] = useState('')

  const [user, setUser] = useState(null)
  const [solicitations, setSolicitations] = useState([])
  const [documents, setDocuments] = useState([])
  const [bootstrapLoading, setBootstrapLoading] = useState(false)
  const [bootstrapError, setBootstrapError] = useState('')
  const [documentsActionError, setDocumentsActionError] = useState('')
  const [downloadModalOpen, setDownloadModalOpen] = useState(false)
  const [downloadModalDocument, setDownloadModalDocument] = useState(null)
  const [downloadingAttachmentKey, setDownloadingAttachmentKey] = useState('')
  const [downloadingAllAttachments, setDownloadingAllAttachments] = useState(false)

  const [search, setSearch] = useState('')
  const [activeSection, setActiveSection] = useState(DOCS_SECTION.SOLICITATIONS)
  const [solicitationFilters, setSolicitationFilters] = useState(() =>
    getEmptyDocsFilters(DOCS_SECTION.SOLICITATIONS),
  )
  const [appliedSolicitationFilters, setAppliedSolicitationFilters] = useState(() =>
    getEmptyDocsFilters(DOCS_SECTION.SOLICITATIONS),
  )
  const [documentFilters, setDocumentFilters] = useState(() =>
    getEmptyDocsFilters(DOCS_SECTION.DOCUMENTS),
  )
  const [appliedDocumentFilters, setAppliedDocumentFilters] = useState(() =>
    getEmptyDocsFilters(DOCS_SECTION.DOCUMENTS),
  )
  const [solicitationOpen, setSolicitationOpen] = useState(false)
  const [solicitationForm, setSolicitationForm] = useState(getEmptySolicitationForm())
  const [editingSolicitationId, setEditingSolicitationId] = useState('')
  const [conversationOpen, setConversationOpen] = useState(false)
  const [conversationRecord, setConversationRecord] = useState(null)
  const [conversationReplyOpen, setConversationReplyOpen] = useState(false)
  const [conversationDraft, setConversationDraft] = useState('')
  const [conversationLoading, setConversationLoading] = useState(false)
  const [conversationError, setConversationError] = useState('')
  const [solicitationLoading, setSolicitationLoading] = useState(false)
  const [solicitationError, setSolicitationError] = useState('')
  const [solicitationActionError, setSolicitationActionError] = useState('')
  const [solicitationAttachmentDrafts, setSolicitationAttachmentDrafts] = useState([])
  const [solicitationAttachmentFeedback, setSolicitationAttachmentFeedback] = useState('')
  const solicitationAttachmentInputRef = useRef(null)

  const isSessionExpiredError = (error) => {
    const status = Number(error?.status || 0)
    if (status === 401 || status === 403) return true

    const message = String(error?.message || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')

    return (
      message.includes('token invalido') ||
      message.includes('token expirado') ||
      message.includes('jwt expired') ||
      message.includes('unauthorized') ||
      message.includes('nao autorizado') ||
      message.includes('sessao expirada')
    )
  }

  const expireCurrentSession = (message = 'Sessão expirada. Faça login novamente.') => {
    localStorage.removeItem(STORAGE_KEYS.session)
    setSession(null)
    setUser(null)
    setSolicitations([])
    setDocuments([])
    setBootstrapError('')
    setDocumentsActionError('')
    setDownloadModalOpen(false)
    setDownloadModalDocument(null)
    setDownloadingAttachmentKey('')
    setDownloadingAllAttachments(false)
    setActiveSection(DOCS_SECTION.SOLICITATIONS)
    setSolicitationOpen(false)
    setEditingSolicitationId('')
    setConversationOpen(false)
    setConversationRecord(null)
    setConversationReplyOpen(false)
    setConversationDraft('')
    setConversationError('')
    setSolicitationError('')
    setSolicitationActionError('')
    setSearch('')
    setSolicitationFilters(getEmptyDocsFilters(DOCS_SECTION.SOLICITATIONS))
    setAppliedSolicitationFilters(getEmptyDocsFilters(DOCS_SECTION.SOLICITATIONS))
    setDocumentFilters(getEmptyDocsFilters(DOCS_SECTION.DOCUMENTS))
    setAppliedDocumentFilters(getEmptyDocsFilters(DOCS_SECTION.DOCUMENTS))
    setLoginForm((prev) => ({ ...prev, password: '' }))
    setLoginError(message)
  }

  const handleTokenFailure = (error) => {
    if (!isSessionExpiredError(error)) return false
    expireCurrentSession()
    return true
  }

  const loadBootstrap = async (activeSession) => {
    if (!activeSession?.token) return
    setBootstrapLoading(true)
    setBootstrapError('')
    try {
      const payload = await apiRequest('/tenant/portal/bootstrap', {
        token: activeSession.token,
      })
      setUser(payload?.user || null)
      setSolicitations(
        Array.isArray(payload?.solicitations)
          ? payload.solicitations.map((record) => ({
              ...record,
              conversation: normalizeConversationMessages(record?.conversation),
            }))
          : [],
      )
      setDocuments(
        Array.isArray(payload?.documents)
          ? payload.documents.map((row) => normalizePortalDocumentRecord(row))
          : [],
      )
      setDocumentsActionError('')
      setSolicitationActionError('')
    } catch (error) {
      if (handleTokenFailure(error)) return
      setBootstrapError(error?.message || 'Não foi possível carregar dados do HIVE DOCS.')
    } finally {
      setBootstrapLoading(false)
    }
  }

  useEffect(() => {
    if (!session?.token) return
    loadBootstrap(session)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.token, activeSection])

  const handleSectionChange = (section) => {
    setActiveSection(section)
  }

  const handleActiveFilterChange = (field, value) => {
    if (activeSection === DOCS_SECTION.DOCUMENTS) {
      setDocumentFilters((prev) => ({ ...prev, [field]: value }))
      return
    }
    setSolicitationFilters((prev) => ({ ...prev, [field]: value }))
  }

  const applyActiveFilters = () => {
    if (activeSection === DOCS_SECTION.DOCUMENTS) {
      setAppliedDocumentFilters({ ...documentFilters })
      return
    }
    setAppliedSolicitationFilters({ ...solicitationFilters })
  }

  const clearActiveFilters = () => {
    if (activeSection === DOCS_SECTION.DOCUMENTS) {
      const next = getEmptyDocsFilters(DOCS_SECTION.DOCUMENTS)
      setDocumentFilters(next)
      setAppliedDocumentFilters(next)
      return
    }
    const next = getEmptyDocsFilters(DOCS_SECTION.SOLICITATIONS)
    setSolicitationFilters(next)
    setAppliedSolicitationFilters(next)
  }

  const handleLogin = async (event) => {
    event.preventDefault()
    const login = String(loginForm.login || '').trim().toLowerCase()
    const password = String(loginForm.password || '').trim()
    if (!login || !password) {
      setLoginError('Informe usuario/e-mail e senha para entrar.')
      return
    }

    setLoginLoading(true)
    setLoginError('')
    try {
      const auth = await apiRequest('/auth/login', {
        method: 'POST',
        body: { login, password },
      })

      const nextSession = {
        token: auth.token,
        user: auth.user,
      }

      localStorage.setItem(STORAGE_KEYS.session, JSON.stringify(nextSession))
      if (remember) {
        localStorage.setItem(STORAGE_KEYS.remember, 'true')
        localStorage.setItem(STORAGE_KEYS.login, login)
        localStorage.setItem(STORAGE_KEYS.email, login)
      } else {
        localStorage.removeItem(STORAGE_KEYS.remember)
        localStorage.removeItem(STORAGE_KEYS.login)
        localStorage.removeItem(STORAGE_KEYS.email)
      }

      setSession(nextSession)
      setLoginForm((prev) => ({ ...prev, password: '' }))
    } catch (error) {
      setLoginError(error?.message || 'Não foi possível autenticar no HIVE DOCS.')
    } finally {
      setLoginLoading(false)
    }
  }

  const handleLogout = () => {
    expireCurrentSession('')
  }

  const departmentOptions = useMemo(
    () =>
      Array.from(
        new Set([
          ...defaultDepartmentOptions,
          ...solicitations.map((record) => String(record?.departamento || '').trim()),
        ].filter(Boolean)),
      ),
    [solicitations],
  )

  const stageOptions = useMemo(
    () =>
      Array.from(
        new Set([
          ...defaultStageOptions,
          ...solicitations.map((record) => String(record?.etapa || '').trim()),
        ].filter(Boolean)),
      ),
    [solicitations],
  )

  const solicitationFilterOptions = useMemo(() => {
    const status = toSortedUniqueOptions(solicitations.map((record) => getStatusLabel(record)))
    const departments = toSortedUniqueOptions(
      solicitations.map((record) => String(record?.departamento || '').trim()),
    )
    const clients = toSortedUniqueOptions(
      solicitations.map((record) => String(record?.clientName || '').trim()),
    )
    const names = toSortedUniqueOptions(
      solicitations.map((record) => String(record?.assunto || '').trim()),
    )
    const competences = toSortedUniqueOptions(
      solicitations.map((record) => getCompetenceFromIso(record?.actionDate)),
    )

    return {
      status,
      departments,
      clients,
      names,
      competences,
    }
  }, [solicitations])

  const documentFilterOptions = useMemo(() => {
    const statuses = toSortedUniqueOptions(
      documents.map((row) => {
        const downloadedAt = String(row?.downloadedAt || '').trim()
        return downloadedAt ? 'Arquivo baixado' : 'Disponível'
      }),
    )
    const departments = toSortedUniqueOptions(
      documents.map((row) => String(row?.departamento || '').trim()),
    )
    const clients = toSortedUniqueOptions(documents.map((row) => String(row?.cliente || '').trim()))
    const names = toSortedUniqueOptions(
      documents.map((row) => String(row?.nome || '').trim()),
    )
    const competences = toSortedUniqueOptions(
      documents.map((row) => String(row?.competencia || '').trim()),
    )

    return {
      status: statuses,
      departments,
      clients,
      names,
      competences,
    }
  }, [documents])

  const activeFilters =
    activeSection === DOCS_SECTION.DOCUMENTS ? documentFilters : solicitationFilters
  const activeDateFilterOptions =
    activeSection === DOCS_SECTION.DOCUMENTS
      ? DOCUMENT_DATE_FILTER_OPTIONS
      : SOLICITATION_DATE_FILTER_OPTIONS
  const activeFilterOptions =
    activeSection === DOCS_SECTION.DOCUMENTS ? documentFilterOptions : solicitationFilterOptions

  const visibleSolicitations = useMemo(() => {
    const term = search.trim().toLowerCase()
    const records = [...solicitations].sort((a, b) => Number(b?.id || 0) - Number(a?.id || 0))
    return records.filter((record) => {
      const statusLabel = getStatusLabel(record)
      const department = String(record?.departamento || '').trim()
      const clientName = String(record?.clientName || '').trim()
      const taskName = String(record?.assunto || '').trim()
      const responsible = String(record?.responsavel || '').trim()
      const competence = getCompetenceFromIso(record?.actionDate)
      const filterDateField =
        String(appliedSolicitationFilters.dateField || '').trim() || 'actionDate'
      const dateReference = normalizeDateForFilter(record?.[filterDateField])

      const text = [
        record?.id,
        department,
        taskName,
        record?.processo,
        clientName,
        responsible,
        statusLabel,
      ]
        .join(' ')
        .toLowerCase()
      if (term && !text.includes(term)) return false

      if (
        appliedSolicitationFilters.status !== FILTER_ALL_VALUE &&
        statusLabel !== appliedSolicitationFilters.status
      ) {
        return false
      }

      if (
        appliedSolicitationFilters.department !== FILTER_ALL_VALUE &&
        department !== appliedSolicitationFilters.department
      ) {
        return false
      }

      if (
        appliedSolicitationFilters.client !== FILTER_ALL_VALUE &&
        clientName !== appliedSolicitationFilters.client
      ) {
        return false
      }

      if (
        appliedSolicitationFilters.name !== FILTER_ALL_VALUE &&
        taskName !== appliedSolicitationFilters.name
      ) {
        return false
      }

      if (
        appliedSolicitationFilters.competence !== FILTER_ALL_VALUE &&
        competence !== appliedSolicitationFilters.competence
      ) {
        return false
      }

      if (appliedSolicitationFilters.startDate) {
        if (!dateReference || dateReference < appliedSolicitationFilters.startDate) return false
      }

      if (appliedSolicitationFilters.endDate) {
        if (!dateReference || dateReference > appliedSolicitationFilters.endDate) return false
      }

      return true
    })
  }, [search, solicitations, appliedSolicitationFilters])

  const visibleDocuments = useMemo(() => {
    const term = search.trim().toLowerCase()
    const rows = [...documents].sort((a, b) => Number(b?.taskId || 0) - Number(a?.taskId || 0))
    return rows.filter((row) => {
      const downloadedAt = String(row?.downloadedAt || '').trim()
      const statusLabel = downloadedAt ? 'Arquivo baixado' : 'Disponível'
      const department = String(row?.departamento || '').trim()
      const taskName = String(row?.nome || '').trim()
      const clientName = String(row?.cliente || '').trim()
      const responsible = String(row?.responsavel || '').trim()
      const competence = String(row?.competencia || '').trim()
      const filterDateField = String(appliedDocumentFilters.dateField || '').trim() || 'dueDate'
      const dateReference = normalizeDateForFilter(row?.[filterDateField])

      const text = [
        row?.taskId,
        statusLabel,
        department,
        taskName,
        competence,
        clientName,
        row?.actionDate,
        row?.metaDate,
        row?.dueDate,
        row?.conclusionDate,
        responsible,
        ...(Array.isArray(row?.attachments)
          ? row.attachments.map((attachment) => String(attachment?.attachmentName || '').trim())
          : []),
      ]
        .join(' ')
        .toLowerCase()
      if (term && !text.includes(term)) return false

      if (appliedDocumentFilters.status !== FILTER_ALL_VALUE && statusLabel !== appliedDocumentFilters.status) {
        return false
      }

      if (
        appliedDocumentFilters.department !== FILTER_ALL_VALUE &&
        department !== appliedDocumentFilters.department
      ) {
        return false
      }

      if (appliedDocumentFilters.client !== FILTER_ALL_VALUE && clientName !== appliedDocumentFilters.client) {
        return false
      }

      if (
        appliedDocumentFilters.name !== FILTER_ALL_VALUE &&
        taskName !== appliedDocumentFilters.name
      ) {
        return false
      }

      if (
        appliedDocumentFilters.competence !== FILTER_ALL_VALUE &&
        competence !== appliedDocumentFilters.competence
      ) {
        return false
      }

      if (appliedDocumentFilters.startDate) {
        if (!dateReference || dateReference < appliedDocumentFilters.startDate) return false
      }

      if (appliedDocumentFilters.endDate) {
        if (!dateReference || dateReference > appliedDocumentFilters.endDate) return false
      }

      return true
    })
  }, [documents, search, appliedDocumentFilters])

  const solicitationTotalCount = solicitations.length
  const solicitationFinishedCount = solicitations.filter((record) => isFinalStatus(getStatusLabel(record))).length
  const solicitationOpenCount = Math.max(solicitationTotalCount - solicitationFinishedCount, 0)

  const documentTotalCount = documents.length
  const documentDownloadedCount = documents.filter(
    (row) =>
      String(row?.status || '').trim().toLowerCase() === 'arquivo baixado' ||
      String(row?.downloadedAt || '').trim(),
  ).length
  const documentPendingCount = Math.max(documentTotalCount - documentDownloadedCount, 0)

  const totalCount =
    activeSection === DOCS_SECTION.DOCUMENTS ? documentTotalCount : solicitationTotalCount
  const finishedCount =
    activeSection === DOCS_SECTION.DOCUMENTS
      ? documentDownloadedCount
      : solicitationFinishedCount
  const openCount =
    activeSection === DOCS_SECTION.DOCUMENTS ? documentPendingCount : solicitationOpenCount
  const conversationStatusLabel = getStatusLabel(conversationRecord)
  const conversationStatusTone = getStatusBadgeTone(conversationStatusLabel)
  const conversationIsFinal = isFinalStatus(conversationStatusLabel)
  const conversationMessages = normalizeConversationMessages(conversationRecord?.conversation)

  const openCreateSolicitation = () => {
    setEditingSolicitationId('')
    setSolicitationForm(getEmptySolicitationForm(String(user?.name || '').trim()))
    setSolicitationAttachmentDrafts([])
    setSolicitationAttachmentFeedback('')
    if (solicitationAttachmentInputRef.current) {
      solicitationAttachmentInputRef.current.value = ''
    }
    setSolicitationError('')
    setSolicitationActionError('')
    setSolicitationOpen(true)
  }

  const closeSolicitationModal = () => {
    setSolicitationOpen(false)
    setEditingSolicitationId('')
    setSolicitationError('')
    setSolicitationActionError('')
    setSolicitationAttachmentDrafts([])
    setSolicitationAttachmentFeedback('')
    if (solicitationAttachmentInputRef.current) {
      solicitationAttachmentInputRef.current.value = ''
    }
  }

  const closeConversationModal = () => {
    setConversationOpen(false)
    setConversationRecord(null)
    setConversationReplyOpen(false)
    setConversationDraft('')
    setConversationError('')
  }

  const openConversationModal = (record) => {
    if (!record) return
    setConversationRecord({
      ...record,
      conversation: normalizeConversationMessages(record?.conversation),
    })
    setConversationReplyOpen(false)
    setConversationDraft('')
    setConversationError('')
    setConversationOpen(true)
  }

  const openEditSolicitation = (record) => {
    const statusLabel = getStatusLabel(record)
    if (!isOpenSolicitationStatus(statusLabel)) {
      setSolicitationActionError(
        'Esta solicitação não pode mais ser editada porque não está com status aberto.',
      )
      return
    }

    const recordId = String(record?.id || '').trim()
    if (!recordId) return

    setSolicitationActionError('')
    setEditingSolicitationId(recordId)
    setSolicitationForm({
      departamento: String(record?.departamento || '').trim(),
      processo: String(record?.processo || '').trim(),
      etapa: String(record?.etapa || '').trim() || 'Aberta',
      assunto: String(record?.assunto || '').trim(),
      actionDate: String(record?.actionDate || '').trim(),
      metaDate: String(record?.metaDate || '').trim(),
      dueDate: String(record?.dueDate || '').trim(),
      andamento: String(record?.andamento || '').trim(),
      responsavel: String(record?.responsavel || user?.name || '').trim(),
      attachments: (Array.isArray(record?.attachments) ? record.attachments : []).map(
        (attachment, index) => ({
          id: String(attachment?.id || `${recordId}-${index}`),
          name: String(attachment?.name || 'anexo'),
          size: Number(attachment?.size || 0),
          type: String(attachment?.type || 'application/octet-stream'),
          contentBase64: String(attachment?.contentBase64 || ''),
        }),
      ),
    })
    setSolicitationAttachmentDrafts([])
    setSolicitationAttachmentFeedback('')
    if (solicitationAttachmentInputRef.current) {
      solicitationAttachmentInputRef.current.value = ''
    }
    setSolicitationError('')
    setSolicitationOpen(true)
  }

  const handleSolicitationRowClick = (record) => {
    const statusLabel = getStatusLabel(record)
    if (isOpenSolicitationStatus(statusLabel)) {
      openEditSolicitation(record)
      return
    }
    openConversationModal(record)
  }

  const handleConversationReplyToggle = () => {
    const statusLabel = getStatusLabel(conversationRecord)
    if (isFinalStatus(statusLabel)) {
      setConversationError('Solicitação finalizada não aceita novas respostas.')
      return
    }
    setConversationReplyOpen((prev) => !prev)
    setConversationError('')
  }

  const sendConversationReply = async () => {
    const recordId = String(conversationRecord?.id || '').trim()
    if (!recordId || !session?.token) return

    const message = String(conversationDraft || '').trim()
    if (!message) {
      setConversationError('Escreva uma resposta antes de enviar.')
      return
    }

    const statusLabel = getStatusLabel(conversationRecord)
    if (isFinalStatus(statusLabel)) {
      setConversationError('Solicitação finalizada não aceita novas respostas.')
      return
    }

    setConversationLoading(true)
    setConversationError('')
    try {
      const payload = await apiRequest(`/tenant/portal/solicitations/${encodeURIComponent(recordId)}/reply`, {
        method: 'POST',
        token: session.token,
        body: { message },
      })
      const updatedRecord = payload?.record || null
      if (updatedRecord) {
        const normalizedRecord = {
          ...updatedRecord,
          conversation: normalizeConversationMessages(updatedRecord?.conversation),
        }
        setSolicitations((prev) =>
          prev.map((item) =>
            String(item?.id || '').trim() === String(normalizedRecord?.id || '').trim()
              ? normalizedRecord
              : item,
          ),
        )
        setConversationRecord(normalizedRecord)
      }
      setConversationDraft('')
      setConversationReplyOpen(false)
    } catch (error) {
      if (handleTokenFailure(error)) return
      setConversationError(error?.message || 'Não foi possível enviar a resposta.')
    } finally {
      setConversationLoading(false)
    }
  }

  const closeDownloadModal = () => {
    setDownloadModalOpen(false)
    setDownloadModalDocument(null)
    setDownloadingAttachmentKey('')
    setDownloadingAllAttachments(false)
  }

  const openDownloadModal = (documentRow) => {
    if (!documentRow) return
    setDocumentsActionError('')
    setDownloadingAttachmentKey('')
    setDownloadingAllAttachments(false)
    setDownloadModalDocument(normalizePortalDocumentRecord(documentRow))
    setDownloadModalOpen(true)
  }

  const applyDownloadedAttachmentState = (row, targetAttachmentKey, downloadedAt) => {
    const documentKey = String(row?.documentKey || '').trim()
    const normalizedTargetAttachmentKey = String(targetAttachmentKey || '').trim()
    if (!documentKey || !normalizedTargetAttachmentKey) return normalizePortalDocumentRecord(row)
    const nextAttachments = (Array.isArray(row?.attachments) ? row.attachments : []).map((attachment) => {
      const currentAttachmentKey = String(attachment?.attachmentKey || '').trim()
      if (currentAttachmentKey !== normalizedTargetAttachmentKey) return attachment
      return {
        ...attachment,
        downloadedAt,
        status: 'Arquivo baixado',
      }
    })
    return normalizePortalDocumentRecord({
      ...row,
      attachments: nextAttachments,
    })
  }

  const handleDocumentAttachmentDownload = async (documentRow, attachment, options = {}) => {
    const suppressError = Boolean(options?.suppressError)
    const documentKey = String(documentRow?.documentKey || '').trim()
    const attachmentKey = String(attachment?.attachmentKey || '').trim()
    if (!documentKey || !attachmentKey || !session?.token) return false

    setDocumentsActionError('')
    setDownloadingAttachmentKey(attachmentKey)
    try {
      const payload = await apiRequest('/tenant/portal/documents/download', {
        method: 'POST',
        token: session.token,
        body: { documentKey, attachmentKey },
      })
      const file = payload?.file || {}
      const fileName = String(file?.name || attachment?.attachmentName || 'documento')
      const fileType = String(file?.type || attachment?.attachmentType || 'application/octet-stream')
      const fileContentBase64 = String(file?.contentBase64 || '').trim()
      const downloadedAt = String(payload?.downloadedAt || '').trim()
      const resolvedAttachmentKey =
        String(payload?.attachmentKey || '').trim() || String(attachment?.attachmentKey || '').trim()

      if (!fileContentBase64) {
        throw new Error('O arquivo selecionado não possui conteúdo para download.')
      }

      const downloaded = triggerBase64Download({
        contentBase64: fileContentBase64,
        fileName,
        mimeType: fileType,
      })
      if (!downloaded) {
        throw new Error('Não foi possível baixar o arquivo.')
      }

      setDocuments((prev) =>
        prev.map((item) => {
          const currentKey = String(item?.documentKey || '').trim()
          if (currentKey !== documentKey) return item
          return applyDownloadedAttachmentState(item, resolvedAttachmentKey, downloadedAt)
        }),
      )
      setDownloadModalDocument((prev) => {
        const currentKey = String(prev?.documentKey || '').trim()
        if (currentKey !== documentKey) return prev
        return applyDownloadedAttachmentState(prev, resolvedAttachmentKey, downloadedAt)
      })
      return true
    } catch (error) {
      if (handleTokenFailure(error)) return false
      if (!suppressError) {
        setDocumentsActionError(error?.message || 'Não foi possível baixar o documento.')
      }
      return false
    } finally {
      setDownloadingAttachmentKey('')
    }
  }

  const handleDocumentDownloadAll = async (documentRow) => {
    if (!documentRow || !session?.token) return
    const downloadables = (Array.isArray(documentRow?.attachments) ? documentRow.attachments : []).filter(
      (attachment) => Boolean(attachment?.hasContent),
    )
    if (!downloadables.length) {
      setDocumentsActionError('Não há anexos disponíveis para download neste documento.')
      return
    }

    setDownloadingAllAttachments(true)
    setDocumentsActionError('')
    let successCount = 0
    for (const attachment of downloadables) {
      const success = await handleDocumentAttachmentDownload(documentRow, attachment, { suppressError: true })
      if (success) successCount += 1
    }
    setDownloadingAllAttachments(false)

    if (successCount === downloadables.length) return
    if (successCount === 0) {
      setDocumentsActionError('Não foi possível baixar os anexos deste documento.')
      return
    }
    setDocumentsActionError(
      `Foram baixados ${successCount} de ${downloadables.length} anexos. Alguns arquivos falharam.`,
    )
  }

  const handleSolicitationAttachmentDraftChange = (event) => {
    const selectedFiles = Array.from(event.target.files || [])
    if (!selectedFiles.length) {
      setSolicitationAttachmentDrafts([])
      setSolicitationAttachmentFeedback('')
      return
    }

    const validFiles = []
    let oversizedCount = 0
    selectedFiles.forEach((file) => {
      if (Number(file.size || 0) > MAX_ATTACHMENT_SIZE_BYTES) {
        oversizedCount += 1
        return
      }
      validFiles.push(file)
    })

    setSolicitationAttachmentDrafts(validFiles)

    if (!validFiles.length && oversizedCount) {
      setSolicitationAttachmentFeedback(
        'Nenhum arquivo foi selecionado. Todos os arquivos excedem 25MB.',
      )
      if (solicitationAttachmentInputRef.current) {
        solicitationAttachmentInputRef.current.value = ''
      }
      return
    }

    if (oversizedCount) {
      setSolicitationAttachmentFeedback(
        `${validFiles.length} arquivo(s) selecionado(s). ${oversizedCount} ignorado(s) por exceder 25MB.`,
      )
      return
    }

    setSolicitationAttachmentFeedback(
      `${validFiles.length} arquivo(s) selecionado(s). Clique em Incluir para confirmar.`,
    )
  }

  const includeSolicitationAttachment = async () => {
    if (!solicitationAttachmentDrafts.length) {
      setSolicitationAttachmentFeedback('Selecione ao menos um arquivo antes de incluir.')
      return
    }

    const shouldInclude = window.confirm(
      `Confirmar inclusao de ${solicitationAttachmentDrafts.length} anexo(s)?`,
    )
    if (!shouldInclude) return

    try {
      const draftAttachments = await Promise.allSettled(
        solicitationAttachmentDrafts.map(async (draftFile, index) => {
          const contentBase64 = await fileToBase64(draftFile)
          if (!contentBase64) return null
          return {
            id: `${Date.now()}-${index}-${draftFile.name}`,
            name: draftFile.name,
            size: draftFile.size,
            type: draftFile.type || 'application/octet-stream',
            contentBase64,
          }
        }),
      )

      const validAttachments = draftAttachments
        .filter((result) => result.status === 'fulfilled' && result.value)
        .map((result) => result.value)
      const failedCount = solicitationAttachmentDrafts.length - validAttachments.length
      if (!validAttachments.length) {
        setSolicitationAttachmentFeedback('Não foi possível incluir os arquivos selecionados.')
        return
      }

      setSolicitationForm((prev) => ({
        ...prev,
        attachments: [...(Array.isArray(prev.attachments) ? prev.attachments : []), ...validAttachments],
      }))
      if (failedCount > 0) {
        setSolicitationAttachmentFeedback(
          `${validAttachments.length} anexo(s) incluído(s). ${failedCount} não puderam ser incluídos.`,
        )
      } else {
        setSolicitationAttachmentFeedback(`${validAttachments.length} anexo(s) incluído(s) com sucesso.`)
      }
      setSolicitationAttachmentDrafts([])
      if (solicitationAttachmentInputRef.current) {
        solicitationAttachmentInputRef.current.value = ''
      }
    } catch {
      setSolicitationAttachmentFeedback('Não foi possível incluir os arquivos selecionados.')
    }
  }

  const removeSolicitationAttachment = () => {
    if (!solicitationForm.attachments.length && !solicitationAttachmentDrafts.length) {
      setSolicitationAttachmentFeedback('Nenhum anexo para excluir.')
      return
    }

    const shouldRemove = window.confirm('Deseja excluir todos os anexos selecionados?')
    if (!shouldRemove) return

    setSolicitationForm((prev) => ({ ...prev, attachments: [] }))
    setSolicitationAttachmentDrafts([])
    if (solicitationAttachmentInputRef.current) {
      solicitationAttachmentInputRef.current.value = ''
    }
    setSolicitationAttachmentFeedback('Anexos removidos. Voce pode incluir novos arquivos.')
  }

  const saveSolicitation = async (event) => {
    event.preventDefault()
    const departamento = String(solicitationForm.departamento || '').trim()
    const assunto = String(solicitationForm.assunto || '').trim()
    const andamento = String(solicitationForm.andamento || '').trim()
    const responsavel = String(solicitationForm.responsavel || '').trim()

    if (!departamento) {
      setSolicitationError('Informe o departamento.')
      return
    }
    if (!assunto) {
      setSolicitationError('Informe o assunto da solicitação.')
      return
    }
    if (!solicitationForm.actionDate || !solicitationForm.metaDate || !solicitationForm.dueDate) {
      setSolicitationError('Preencha Ação, Meta e Prazo.')
      return
    }
    if (!andamento) {
      setSolicitationError('Informe os detalhes da solicitação.')
      return
    }
    if (!responsavel) {
      setSolicitationError('Informe o responsavel.')
      return
    }

    if (!session?.token) {
      setSolicitationError('Sessao expirada. Faca login novamente.')
      return
    }

    setSolicitationLoading(true)
    setSolicitationError('')
    try {
      const isEditing = Boolean(editingSolicitationId)
      const payload = await apiRequest(
        isEditing
          ? `/tenant/portal/solicitations/${encodeURIComponent(editingSolicitationId)}`
          : '/tenant/portal/solicitations',
        {
          method: isEditing ? 'PUT' : 'POST',
          token: session.token,
          body: {
            departamento,
            processo: String(solicitationForm.processo || '').trim(),
            etapa: String(solicitationForm.etapa || '').trim() || 'Aberta',
            assunto,
            clientIds: [],
            actionDate: solicitationForm.actionDate,
            metaDate: solicitationForm.metaDate,
            dueDate: solicitationForm.dueDate,
            andamento,
            responsavel,
            attachments: (Array.isArray(solicitationForm.attachments)
              ? solicitationForm.attachments
              : []
            ).map((attachment) => ({
              name: String(attachment.name || 'anexo'),
              size: Number(attachment.size || 0),
              type: String(attachment.type || 'application/octet-stream'),
              contentBase64: String(attachment.contentBase64 || ''),
            })),
          },
        },
      )

      if (isEditing) {
        const updatedRecord = payload?.record || null
        if (updatedRecord) {
          setSolicitations((prev) =>
            prev.map((item) =>
              String(item?.id || '').trim() === String(updatedRecord?.id || '').trim()
                ? updatedRecord
                : item,
            ),
          )
        }
      } else {
        const createdRecords = Array.isArray(payload?.records) ? payload.records : []
        setSolicitations((prev) => [...createdRecords, ...prev])
      }

      closeSolicitationModal()
      setSolicitationForm(getEmptySolicitationForm(String(user?.name || '').trim()))
    } catch (error) {
      if (handleTokenFailure(error)) return
      setSolicitationError(
        error?.message ||
          (editingSolicitationId
            ? 'Não foi possível editar a solicitação.'
            : 'Não foi possível criar a solicitação.'),
      )
    } finally {
      setSolicitationLoading(false)
    }
  }

  if (!session?.token) {
    return (
      <div className="docs-login-page">
        <section className="docs-login-card">
          <div className="docs-login-brand">
            <img src="/favicon.svg" alt="HIVE DOCS" />
            <div>
              <h1>HIVE DOCS</h1>
              <p>Portal de Solicitações</p>
            </div>
          </div>
          <h2>Bem-vindo de volta</h2>
          <p>Entre para abrir e acompanhar solicitações do seu cliente.</p>

          <form onSubmit={handleLogin} className="docs-login-form">
            <label>
              <span>Usuário / E-mail</span>
              <input
                type="text"
                value={loginForm.login}
                onChange={(event) => setLoginForm((prev) => ({ ...prev, login: event.target.value }))}
                placeholder="usuário ou cliente@empresa.com"
              />
            </label>
            <label>
              <span>Senha</span>
              <input
                type="password"
                value={loginForm.password}
                onChange={(event) => setLoginForm((prev) => ({ ...prev, password: event.target.value }))}
                placeholder="Digite sua senha"
              />
            </label>
            <label className="docs-login-remember">
              <input
                type="checkbox"
                checked={remember}
                onChange={(event) => setRemember(event.target.checked)}
              />
              <span className="docs-login-switch" aria-hidden="true" />
              <span className="docs-login-remember-text">Manter conectado</span>
            </label>
            <button type="submit" disabled={loginLoading}>
              {loginLoading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
          {loginError ? <p className="docs-feedback error">{loginError}</p> : null}
        </section>

        <section className="docs-login-hero">
          <span className="docs-hero-badge">HIVE DOCS</span>
          <h2>Abertura de solicitações em um painel dedicado ao cliente</h2>
          <p>
            Registre demandas com agilidade e acompanhe o status em tempo real, com integração
            direta ao painel interno da equipe.
          </p>
        </section>
      </div>
    )
  }

  return (
    <div className="docs-app">
      <aside className="docs-sidebar">
        <div className="docs-sidebar-brand">
          <img src="/favicon.svg" alt="HIVE DOCS" />
          <div>
            <strong>HIVE DOCS</strong>
            <small>Portal Cliente</small>
          </div>
        </div>

        <button
          type="button"
          className={`docs-menu-item ${activeSection === DOCS_SECTION.SOLICITATIONS ? 'active' : ''}`}
          onClick={() => handleSectionChange(DOCS_SECTION.SOLICITATIONS)}
        >
          Solicitações
        </button>
        <button
          type="button"
          className={`docs-menu-item ${activeSection === DOCS_SECTION.DOCUMENTS ? 'active' : ''}`}
          onClick={() => handleSectionChange(DOCS_SECTION.DOCUMENTS)}
        >
          Documentos Recebidos
        </button>

        <div className="docs-sidebar-footer">
          <span>{user?.name || 'Cliente'}</span>
          <button type="button" onClick={handleLogout}>
            Sair
          </button>
        </div>
      </aside>

      <main className="docs-content">
        <header className="docs-topbar">
          <input
            type="text"
            placeholder={
              activeSection === DOCS_SECTION.DOCUMENTS
                ? 'Pesquisar documentos recebidos...'
                : 'Digite aqui para começar a pesquisa...'
            }
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          {activeSection === DOCS_SECTION.SOLICITATIONS ? (
            <button type="button" className="primary" onClick={openCreateSolicitation}>
              Criar Solicitação
            </button>
          ) : null}
        </header>

        <section className="docs-filters-card">
          <div className="docs-filters-grid">
            <label>
              <span>Status</span>
              <select
                value={activeFilters.status}
                onChange={(event) => handleActiveFilterChange('status', event.target.value)}
              >
                <option value={FILTER_ALL_VALUE}>{FILTER_ALL_VALUE}</option>
                {activeFilterOptions.status.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Departamento</span>
              <select
                value={activeFilters.department}
                onChange={(event) => handleActiveFilterChange('department', event.target.value)}
              >
                <option value={FILTER_ALL_VALUE}>{FILTER_ALL_VALUE}</option>
                {activeFilterOptions.departments.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Cliente</span>
              <select
                value={activeFilters.client}
                onChange={(event) => handleActiveFilterChange('client', event.target.value)}
              >
                <option value={FILTER_ALL_VALUE}>{FILTER_ALL_VALUE}</option>
                {activeFilterOptions.clients.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Nome</span>
              <select
                value={activeFilters.name}
                onChange={(event) => handleActiveFilterChange('name', event.target.value)}
              >
                <option value={FILTER_ALL_VALUE}>{FILTER_ALL_VALUE}</option>
                {activeFilterOptions.names.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Competência</span>
              <select
                value={activeFilters.competence}
                onChange={(event) => handleActiveFilterChange('competence', event.target.value)}
              >
                <option value={FILTER_ALL_VALUE}>{FILTER_ALL_VALUE}</option>
                {activeFilterOptions.competences.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Por Data</span>
              <select
                value={activeFilters.dateField}
                onChange={(event) => handleActiveFilterChange('dateField', event.target.value)}
              >
                {activeDateFilterOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Período Inicial</span>
              <input
                type="date"
                value={activeFilters.startDate}
                onChange={(event) => handleActiveFilterChange('startDate', event.target.value)}
              />
            </label>
            <label>
              <span>Período Final</span>
              <input
                type="date"
                value={activeFilters.endDate}
                onChange={(event) => handleActiveFilterChange('endDate', event.target.value)}
              />
            </label>
          </div>
          <div className="docs-filters-actions">
            <button type="button" className="primary" onClick={applyActiveFilters}>
              Aplicar
            </button>
            <button type="button" className="ghost" onClick={clearActiveFilters}>
              Limpar
            </button>
          </div>
        </section>

        <section className="docs-kpis">
          <article>
            <span>Total</span>
            <strong>{totalCount}</strong>
          </article>
          <article>
            <span>{activeSection === DOCS_SECTION.DOCUMENTS ? 'Pendentes' : 'Em aberto'}</span>
            <strong>{openCount}</strong>
          </article>
          <article>
            <span>{activeSection === DOCS_SECTION.DOCUMENTS ? 'Baixados' : 'Finalizadas'}</span>
            <strong>{finishedCount}</strong>
          </article>
        </section>

        <section className="docs-table-card">
          {activeSection === DOCS_SECTION.SOLICITATIONS ? (
            <div className="docs-table-head">
              <span>No</span>
              <span>Status</span>
              <span>Departamento</span>
              <span>Nome</span>
              <span>Competência</span>
              <span>Cliente</span>
              <span>Ação</span>
              <span>Meta</span>
              <span>Vencimento</span>
              <span>Conclusão</span>
              <span>Responsável</span>
            </div>
          ) : (
            <div className="docs-table-head docs-table-head-documents">
              <span>No</span>
              <span>Status</span>
              <span>Departamento</span>
              <span>Nome</span>
              <span>Competência</span>
              <span>Cliente</span>
              <span>Ação</span>
              <span>Meta</span>
              <span>Vencimento</span>
              <span>Conclusão</span>
              <span>Responsável</span>
              <span>Anexo</span>
            </div>
          )}
          <div className="docs-table-body">
            {bootstrapLoading ? (
              <div className="docs-table-row empty">
                {activeSection === DOCS_SECTION.DOCUMENTS
                  ? 'Carregando documentos recebidos...'
                  : 'Carregando solicitações...'}
              </div>
            ) : (
              <>
                {activeSection === DOCS_SECTION.SOLICITATIONS
                  ? visibleSolicitations.length
                    ? visibleSolicitations.map((record) => {
                        const statusLabel = getStatusLabel(record)
                        const statusTone = getStatusBadgeTone(statusLabel)
                        const canEdit = isOpenSolicitationStatus(statusLabel)
                        return (
                          <div
                            className={`docs-table-row ${canEdit ? 'editable' : 'interactive'}`}
                            key={`docs-sol-${record.id}`}
                            role="button"
                            tabIndex={0}
                            onClick={() => handleSolicitationRowClick(record)}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault()
                                handleSolicitationRowClick(record)
                              }
                            }}
                            title={
                              canEdit
                                ? 'Clique para editar esta solicitação'
                                : 'Clique para abrir o histórico de respostas'
                            }
                          >
                            <span>{record.id}</span>
                            <span>
                              <mark className={statusTone}>{statusLabel}</mark>
                            </span>
                            <span title={record.departamento || '-'}>{record.departamento || '-'}</span>
                            <span title={record.assunto || '-'}>{record.assunto || '-'}</span>
                            <span>{getCompetenceFromIso(record.actionDate)}</span>
                            <span title={record.clientName || '-'}>{record.clientName || '-'}</span>
                            <span>{parseIsoDateToBr(record.actionDate)}</span>
                            <span>{parseIsoDateToBr(record.metaDate)}</span>
                            <span>{parseIsoDateToBr(record.dueDate)}</span>
                            <span>{parseIsoDateToBr(record.conclusionDate)}</span>
                            <span title={record.responsavel || '-'}>{record.responsavel || '-'}</span>
                          </div>
                        )
                      })
                    : (
                        <div className="docs-table-row empty">Sem solicitações cadastradas.</div>
                      )
                  : visibleDocuments.length
                    ? visibleDocuments.map((row) => {
                        const downloadedAt = String(row?.downloadedAt || '').trim()
                        const isDownloaded = Boolean(downloadedAt)
                        const statusLabel = isDownloaded ? 'Arquivo baixado' : 'Disponível'
                        const statusTone = getStatusBadgeTone(statusLabel)
                        const statusTitle = isDownloaded ? `Baixado em ${parseIsoDateTimeToBr(downloadedAt)}` : ''
                        return (
                          <div className="docs-table-row docs-table-row-documents" key={row.documentKey}>
                            <span>{row.taskId || '-'}</span>
                            <span>
                              <mark className={statusTone} title={statusTitle}>
                                {statusLabel}
                              </mark>
                            </span>
                            <span title={row.departamento || '-'}>{row.departamento || '-'}</span>
                            <span title={row.nome || '-'}>{row.nome || '-'}</span>
                            <span>{row.competencia || '-'}</span>
                            <span title={row.cliente || '-'}>{row.cliente || '-'}</span>
                            <span>{parseIsoDateToBr(row.actionDate)}</span>
                            <span>{parseIsoDateToBr(row.metaDate)}</span>
                            <span>{parseIsoDateToBr(row.dueDate)}</span>
                            <span>{parseIsoDateToBr(row.conclusionDate)}</span>
                            <span title={row.responsavel || '-'}>{row.responsavel || '-'}</span>
                            <span>
                              <button
                                type="button"
                                className="ghost docs-inline-button"
                                onClick={() => openDownloadModal(row)}
                                disabled={!row.hasContent}
                                title={row.hasContent ? 'Abrir anexos para download' : 'Anexo indisponível'}
                              >
                                Anexos
                              </button>
                            </span>
                          </div>
                        )
                      })
                    : (
                        <div className="docs-table-row empty">Sem documentos recebidos.</div>
                      )}
              </>
            )}
          </div>
        </section>

        {solicitationActionError ? <p className="docs-feedback error">{solicitationActionError}</p> : null}
        {documentsActionError ? <p className="docs-feedback error">{documentsActionError}</p> : null}
        {bootstrapError ? <p className="docs-feedback error">{bootstrapError}</p> : null}
      </main>

      {solicitationOpen ? (
        <div className="docs-modal-backdrop" onClick={closeSolicitationModal}>
          <div className="docs-modal" onClick={(event) => event.stopPropagation()}>
            <div className="docs-modal-head">
              <h3>{editingSolicitationId ? 'Editar Solicitação' : 'Nova Solicitação'}</h3>
              <button type="button" onClick={closeSolicitationModal}>
                ×
              </button>
            </div>

            <form className="docs-modal-form" onSubmit={saveSolicitation}>
              <label>
                <span>Departamento</span>
                <select
                  value={solicitationForm.departamento}
                  onChange={(event) =>
                    setSolicitationForm((prev) => ({ ...prev, departamento: event.target.value }))
                  }
                >
                  <option value="">Selecione...</option>
                  {departmentOptions.map((option) => (
                    <option key={`docs-dept-${option}`} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span>Processo</span>
                <input
                  type="text"
                  value={solicitationForm.processo}
                  onChange={(event) =>
                    setSolicitationForm((prev) => ({ ...prev, processo: event.target.value }))
                  }
                  placeholder="Opcional"
                />
              </label>

              <label>
                <span>Etapa</span>
                <select
                  value={solicitationForm.etapa}
                  onChange={(event) =>
                    setSolicitationForm((prev) => ({ ...prev, etapa: event.target.value }))
                  }
                >
                  {stageOptions.map((option) => (
                    <option key={`docs-step-${option}`} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>

              <label className="wide">
                <span>Assunto</span>
                <input
                  type="text"
                  value={solicitationForm.assunto}
                  onChange={(event) =>
                    setSolicitationForm((prev) => ({ ...prev, assunto: event.target.value }))
                  }
                  placeholder="Descreva a nova solicitação"
                />
              </label>

              <label>
                <span>Ação</span>
                <input
                  type="date"
                  value={solicitationForm.actionDate}
                  onChange={(event) =>
                    setSolicitationForm((prev) => ({ ...prev, actionDate: event.target.value }))
                  }
                />
              </label>
              <label>
                <span>Meta</span>
                <input
                  type="date"
                  value={solicitationForm.metaDate}
                  onChange={(event) =>
                    setSolicitationForm((prev) => ({ ...prev, metaDate: event.target.value }))
                  }
                />
              </label>
              <label>
                <span>Prazo</span>
                <input
                  type="date"
                  value={solicitationForm.dueDate}
                  onChange={(event) =>
                    setSolicitationForm((prev) => ({ ...prev, dueDate: event.target.value }))
                  }
                />
              </label>

              <label className="wide">
                <span>Informações adicionais</span>
                <textarea
                  value={solicitationForm.andamento}
                  onChange={(event) =>
                    setSolicitationForm((prev) => ({ ...prev, andamento: event.target.value }))
                  }
                  placeholder="Descreva os detalhes da solicitação"
                />
              </label>

              <label className="wide">
                <span>Anexar arquivo</span>
                <input
                  ref={solicitationAttachmentInputRef}
                  type="file"
                  multiple
                  onChange={handleSolicitationAttachmentDraftChange}
                />
              </label>
              <p className="wide docs-note">
                Qualquer tipo de documento é permitido. Limite de 25MB por arquivo.
              </p>

              <div className="wide docs-attachment-actions">
                <button
                  type="button"
                  className="ghost"
                  onClick={includeSolicitationAttachment}
                  disabled={solicitationLoading}
                >
                  Incluir
                </button>
                <button
                  type="button"
                  className="ghost danger"
                  onClick={removeSolicitationAttachment}
                  disabled={solicitationLoading}
                >
                  Excluir
                </button>
              </div>

              {solicitationAttachmentDrafts.length ? (
                <p className="wide docs-note">
                  Prontos para incluir ({solicitationAttachmentDrafts.length}):{' '}
                  {solicitationAttachmentDrafts.map((file) => file.name).join(', ')}
                </p>
              ) : null}
              {solicitationForm.attachments.length ? (
                <div className="wide docs-attachments-wrap">
                  <strong className="docs-attachments-title">
                    Anexos incluídos ({solicitationForm.attachments.length})
                  </strong>
                  <div className="docs-attachments-list">
                    {solicitationForm.attachments.map((attachment) => (
                      <span key={String(attachment.id || attachment.name)}>
                        {attachment.name}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
              {solicitationAttachmentFeedback ? (
                <p className="wide docs-feedback">{solicitationAttachmentFeedback}</p>
              ) : null}

              <label>
                <span>Responsável</span>
                <input
                  type="text"
                  value={solicitationForm.responsavel}
                  onChange={(event) =>
                    setSolicitationForm((prev) => ({ ...prev, responsavel: event.target.value }))
                  }
                />
              </label>

              <div className="docs-modal-actions">
                <button
                  type="button"
                  className="ghost"
                  onClick={closeSolicitationModal}
                  disabled={solicitationLoading}
                >
                  Cancelar
                </button>
                <button type="submit" className="primary" disabled={solicitationLoading}>
                  {solicitationLoading
                    ? 'Salvando...'
                    : editingSolicitationId
                      ? 'Salvar Edição'
                      : 'Salvar Solicitação'}
                </button>
              </div>
            </form>

            {solicitationError ? <p className="docs-feedback error">{solicitationError}</p> : null}
          </div>
        </div>
      ) : null}

      {downloadModalOpen ? (
        <div className="docs-modal-backdrop" onClick={closeDownloadModal}>
          <div className="docs-modal docs-download-modal" onClick={(event) => event.stopPropagation()}>
            <div className="docs-modal-head">
              <h3>Anexos do documento</h3>
              <button type="button" onClick={closeDownloadModal}>
                ×
              </button>
            </div>

            <div className="docs-conversation-summary">
              <p>
                <strong>Tarefa/Solicitação:</strong> {downloadModalDocument?.nome || '-'}
              </p>
              <p>
                <strong>Cliente:</strong> {downloadModalDocument?.cliente || '-'}
              </p>
              <p>
                <strong>Total de anexos:</strong>{' '}
                {Array.isArray(downloadModalDocument?.attachments)
                  ? downloadModalDocument.attachments.length
                  : 0}
              </p>
            </div>

            <section className="docs-download-list">
              {Array.isArray(downloadModalDocument?.attachments) &&
              downloadModalDocument.attachments.length ? (
                downloadModalDocument.attachments.map((attachment) => {
                  const attachmentKey = String(attachment?.attachmentKey || '').trim()
                  const isDownloaded = Boolean(String(attachment?.downloadedAt || '').trim())
                  const statusLabel = isDownloaded ? 'Arquivo baixado' : 'Disponível'
                  const statusTone = getStatusBadgeTone(statusLabel)
                  const statusTitle = isDownloaded
                    ? `Baixado em ${parseIsoDateTimeToBr(attachment?.downloadedAt)}`
                    : ''
                  const isDownloading =
                    Boolean(downloadingAttachmentKey) &&
                    String(downloadingAttachmentKey).trim() === attachmentKey
                  return (
                    <article className="docs-download-item" key={attachmentKey || attachment.attachmentName}>
                      <div className="docs-download-item-main">
                        <strong title={attachment?.attachmentName || '-'}>
                          {attachment?.attachmentName || '-'}
                        </strong>
                        <small>{formatFileSize(attachment?.attachmentSize)}</small>
                      </div>
                      <div className="docs-download-item-actions">
                        <mark className={statusTone} title={statusTitle}>
                          {statusLabel}
                        </mark>
                        <button
                          type="button"
                          className="ghost docs-inline-button"
                          onClick={() =>
                            handleDocumentAttachmentDownload(downloadModalDocument, attachment)
                          }
                          disabled={
                            downloadingAllAttachments ||
                            isDownloading ||
                            !attachment?.hasContent
                          }
                          title={attachment?.hasContent ? 'Baixar anexo' : 'Anexo indisponível'}
                        >
                          {isDownloading ? 'Baixando...' : 'Baixar'}
                        </button>
                      </div>
                    </article>
                  )
                })
              ) : (
                <p className="docs-conversation-empty">Sem anexos disponíveis para este documento.</p>
              )}
            </section>

            <div className="docs-conversation-actions">
              <button
                type="button"
                className="ghost"
                onClick={closeDownloadModal}
                disabled={downloadingAllAttachments}
              >
                Fechar
              </button>
              <button
                type="button"
                className="primary"
                onClick={() => handleDocumentDownloadAll(downloadModalDocument)}
                disabled={
                  downloadingAllAttachments ||
                  !Array.isArray(downloadModalDocument?.attachments) ||
                  !downloadModalDocument.attachments.some((attachment) => Boolean(attachment?.hasContent))
                }
              >
                {downloadingAllAttachments ? 'Baixando anexos...' : 'Baixar todos'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {conversationOpen ? (
        <div className="docs-modal-backdrop" onClick={closeConversationModal}>
          <div className="docs-modal docs-conversation-modal" onClick={(event) => event.stopPropagation()}>
            <div className="docs-modal-head">
              <h3>Responder Solicitação</h3>
              <button type="button" onClick={closeConversationModal}>
                ×
              </button>
            </div>

            <div className="docs-conversation-summary">
              <p>
                <strong>Assunto:</strong> {conversationRecord?.assunto || '-'}
              </p>
              <p>
                <strong>Cliente:</strong> {conversationRecord?.clientName || '-'}
              </p>
              <p>
                <strong>Status:</strong>{' '}
                <mark className={conversationStatusTone}>{conversationStatusLabel || 'Aberta'}</mark>
              </p>
            </div>

            <section className="docs-conversation-thread">
              <h4>Histórico da conversa</h4>
              {conversationMessages.length ? (
                <div className="docs-conversation-list">
                  {conversationMessages.map((message) => {
                    const authorLabel =
                      message.authorName ||
                      (message.authorType === 'client' ? 'Cliente' : 'Equipe HIVE Controller')
                    const createdAtLabel = parseIsoDateTimeToBr(message.createdAt)
                    return (
                      <article
                        key={message.id}
                        className={`docs-conversation-item ${
                          message.authorType === 'client' ? 'client' : 'internal'
                        }`}
                      >
                        <header>
                          <strong>{authorLabel}</strong>
                          <span>{createdAtLabel || '-'}</span>
                        </header>
                        <p>{message.text}</p>
                      </article>
                    )
                  })}
                </div>
              ) : (
                <p className="docs-conversation-empty">Sem respostas registradas até o momento.</p>
              )}
            </section>

            {conversationReplyOpen ? (
              <section className="docs-conversation-composer">
                <label>
                  <span>Mensagem</span>
                  <textarea
                    value={conversationDraft}
                    onChange={(event) => setConversationDraft(event.target.value)}
                    placeholder="Escreva a resposta sobre a solicitação..."
                    disabled={conversationLoading || conversationIsFinal}
                  />
                </label>
                <div className="docs-conversation-actions">
                  <button
                    type="button"
                    className="ghost"
                    onClick={handleConversationReplyToggle}
                    disabled={conversationLoading}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    className="primary"
                    onClick={sendConversationReply}
                    disabled={conversationLoading || conversationIsFinal}
                  >
                    {conversationLoading ? 'Enviando resposta...' : 'Enviar Resposta'}
                  </button>
                </div>
              </section>
            ) : (
              <div className="docs-conversation-actions">
                <button
                  type="button"
                  className="docs-reply-button"
                  onClick={handleConversationReplyToggle}
                  disabled={conversationLoading || conversationIsFinal}
                >
                  Responder
                </button>
              </div>
            )}

            {conversationError ? <p className="docs-feedback error">{conversationError}</p> : null}
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default DocsApp


