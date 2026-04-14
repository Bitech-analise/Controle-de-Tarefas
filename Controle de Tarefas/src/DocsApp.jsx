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
  'Contabil',
  'Sucesso do Cliente',
  'Cliente',
]

const defaultStageOptions = ['Aberta', 'Em andamento', 'Pendente', 'Finalizado']
const MAX_ATTACHMENT_SIZE_BYTES = 25 * 1024 * 1024

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

const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = String(reader.result || '')
      const base64 = result.includes(',') ? result.split(',')[1] : result
      resolve(base64 || '')
    }
    reader.onerror = () => reject(new Error('Nao foi possivel ler o arquivo.'))
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
  return `Falha na requisicao (${response.status}).`
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
    throw new Error(await getErrorMessage(response))
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
  const [downloadingDocumentKey, setDownloadingDocumentKey] = useState('')

  const [search, setSearch] = useState('')
  const [activeSection, setActiveSection] = useState(DOCS_SECTION.SOLICITATIONS)
  const [solicitationOpen, setSolicitationOpen] = useState(false)
  const [solicitationForm, setSolicitationForm] = useState(getEmptySolicitationForm())
  const [editingSolicitationId, setEditingSolicitationId] = useState('')
  const [solicitationLoading, setSolicitationLoading] = useState(false)
  const [solicitationError, setSolicitationError] = useState('')
  const [solicitationActionError, setSolicitationActionError] = useState('')
  const [solicitationAttachmentDrafts, setSolicitationAttachmentDrafts] = useState([])
  const [solicitationAttachmentFeedback, setSolicitationAttachmentFeedback] = useState('')
  const solicitationAttachmentInputRef = useRef(null)

  const loadBootstrap = async (activeSession) => {
    if (!activeSession?.token) return
    setBootstrapLoading(true)
    setBootstrapError('')
    try {
      const payload = await apiRequest('/tenant/portal/bootstrap', {
        token: activeSession.token,
      })
      setUser(payload?.user || null)
      setSolicitations(Array.isArray(payload?.solicitations) ? payload.solicitations : [])
      setDocuments(Array.isArray(payload?.documents) ? payload.documents : [])
      setDocumentsActionError('')
      setSolicitationActionError('')
    } catch (error) {
      setBootstrapError(error?.message || 'Nao foi possivel carregar dados do HIVE DOCS.')
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
      setLoginError(error?.message || 'Nao foi possivel autenticar no HIVE DOCS.')
    } finally {
      setLoginLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEYS.session)
    setSession(null)
    setUser(null)
    setSolicitations([])
    setDocuments([])
    setBootstrapError('')
    setDocumentsActionError('')
    setDownloadingDocumentKey('')
    setActiveSection(DOCS_SECTION.SOLICITATIONS)
    setSolicitationOpen(false)
    setEditingSolicitationId('')
    setSolicitationError('')
    setSolicitationActionError('')
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

  const visibleSolicitations = useMemo(() => {
    const term = search.trim().toLowerCase()
    const records = [...solicitations].sort((a, b) => Number(b?.id || 0) - Number(a?.id || 0))
    if (!term) return records
    return records.filter((record) => {
      const text = [
        record?.id,
        record?.departamento,
        record?.assunto,
        record?.processo,
        record?.clientName,
        record?.responsavel,
        getStatusLabel(record),
      ]
        .join(' ')
        .toLowerCase()
      return text.includes(term)
    })
  }, [search, solicitations])

  const visibleDocuments = useMemo(() => {
    const term = search.trim().toLowerCase()
    const rows = [...documents].sort((a, b) => Number(b?.taskId || 0) - Number(a?.taskId || 0))
    if (!term) return rows
    return rows.filter((row) => {
      const text = [
        row?.taskId,
        row?.status,
        row?.departamento,
        row?.nome,
        row?.competencia,
        row?.cliente,
        row?.actionDate,
        row?.metaDate,
        row?.dueDate,
        row?.conclusionDate,
        row?.responsavel,
        row?.attachmentName,
      ]
        .join(' ')
        .toLowerCase()
      return text.includes(term)
    })
  }, [documents, search])

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

  const openEditSolicitation = (record) => {
    const statusLabel = getStatusLabel(record)
    if (!isOpenSolicitationStatus(statusLabel)) {
      setSolicitationActionError(
        'Esta solicitacao nao pode mais ser editada porque nao esta com status aberto.',
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

  const handleDocumentDownload = async (documentRow) => {
    const documentKey = String(documentRow?.documentKey || '').trim()
    if (!documentKey || !session?.token) return
    setDocumentsActionError('')
    setDownloadingDocumentKey(documentKey)
    try {
      const payload = await apiRequest('/tenant/portal/documents/download', {
        method: 'POST',
        token: session.token,
        body: { documentKey },
      })
      const file = payload?.file || {}
      const fileName = String(file?.name || documentRow?.attachmentName || 'documento')
      const fileType = String(file?.type || documentRow?.attachmentType || 'application/octet-stream')
      const fileContentBase64 = String(file?.contentBase64 || '').trim()
      const downloadedAt = String(payload?.downloadedAt || '').trim()

      if (!fileContentBase64) {
        throw new Error('O arquivo selecionado nao possui conteudo para download.')
      }

      const downloaded = triggerBase64Download({
        contentBase64: fileContentBase64,
        fileName,
        mimeType: fileType,
      })
      if (!downloaded) {
        throw new Error('Nao foi possivel baixar o arquivo.')
      }

      setDocuments((prev) =>
        prev.map((item) =>
          String(item?.documentKey || '').trim() === documentKey
            ? { ...item, status: 'Arquivo baixado', downloadedAt }
            : item,
        ),
      )
    } catch (error) {
      setDocumentsActionError(error?.message || 'Nao foi possivel baixar o documento.')
    } finally {
      setDownloadingDocumentKey('')
    }
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
        setSolicitationAttachmentFeedback('Nao foi possivel incluir os arquivos selecionados.')
        return
      }

      setSolicitationForm((prev) => ({
        ...prev,
        attachments: [...(Array.isArray(prev.attachments) ? prev.attachments : []), ...validAttachments],
      }))
      if (failedCount > 0) {
        setSolicitationAttachmentFeedback(
          `${validAttachments.length} anexo(s) incluido(s). ${failedCount} nao puderam ser incluidos.`,
        )
      } else {
        setSolicitationAttachmentFeedback(`${validAttachments.length} anexo(s) incluido(s) com sucesso.`)
      }
      setSolicitationAttachmentDrafts([])
      if (solicitationAttachmentInputRef.current) {
        solicitationAttachmentInputRef.current.value = ''
      }
    } catch {
      setSolicitationAttachmentFeedback('Nao foi possivel incluir os arquivos selecionados.')
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
      setSolicitationError('Informe o assunto da solicitacao.')
      return
    }
    if (!solicitationForm.actionDate || !solicitationForm.metaDate || !solicitationForm.dueDate) {
      setSolicitationError('Preencha Acao, Meta e Prazo.')
      return
    }
    if (!andamento) {
      setSolicitationError('Informe os detalhes da solicitacao.')
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
      setSolicitationError(
        error?.message ||
          (editingSolicitationId
            ? 'Nao foi possivel editar a solicitacao.'
            : 'Nao foi possivel criar a solicitacao.'),
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
              <p>Portal de Solicitacoes</p>
            </div>
          </div>
          <h2>Bem-vindo de volta</h2>
          <p>Entre para abrir e acompanhar solicitacoes do seu cliente.</p>

          <form onSubmit={handleLogin} className="docs-login-form">
            <label>
              <span>Usuario / E-mail</span>
              <input
                type="text"
                value={loginForm.login}
                onChange={(event) => setLoginForm((prev) => ({ ...prev, login: event.target.value }))}
                placeholder="usuario ou cliente@empresa.com"
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
          <h2>Abertura de solicitacoes em um painel dedicado ao cliente</h2>
          <p>
            Registre demandas com agilidade e acompanhe o status em tempo real, com integracao
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
          Solicitacoes
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
                : 'Digite aqui para comecar a pesquisa...'
            }
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          {activeSection === DOCS_SECTION.SOLICITATIONS ? (
            <button type="button" className="primary" onClick={openCreateSolicitation}>
              Criar Solicitacao
            </button>
          ) : null}
        </header>

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
              <span>Competencia</span>
              <span>Cliente</span>
              <span>Acao</span>
              <span>Meta</span>
              <span>Vencimento</span>
              <span>Conclusao</span>
              <span>Responsavel</span>
            </div>
          ) : (
            <div className="docs-table-head docs-table-head-documents">
              <span>No</span>
              <span>Status</span>
              <span>Departamento</span>
              <span>Nome</span>
              <span>Competencia</span>
              <span>Cliente</span>
              <span>Acao</span>
              <span>Meta</span>
              <span>Vencimento</span>
              <span>Conclusao</span>
              <span>Responsavel</span>
              <span>Anexo</span>
            </div>
          )}
          <div className="docs-table-body">
            {bootstrapLoading ? (
              <div className="docs-table-row empty">
                {activeSection === DOCS_SECTION.DOCUMENTS
                  ? 'Carregando documentos recebidos...'
                  : 'Carregando solicitacoes...'}
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
                            className={`docs-table-row ${canEdit ? 'editable' : ''}`}
                            key={`docs-sol-${record.id}`}
                            role="button"
                            tabIndex={0}
                            onClick={() => openEditSolicitation(record)}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault()
                                openEditSolicitation(record)
                              }
                            }}
                            title={
                              canEdit
                                ? 'Clique para editar esta solicitacao'
                                : 'Somente solicitacoes abertas podem ser editadas'
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
                        <div className="docs-table-row empty">Sem solicitacoes cadastradas.</div>
                      )
                  : visibleDocuments.length
                    ? visibleDocuments.map((row) => {
                        const downloadedAt = String(row?.downloadedAt || '').trim()
                        const isDownloaded = Boolean(downloadedAt)
                        const statusLabel = isDownloaded ? 'Arquivo baixado' : 'Disponivel'
                        const statusTone = getStatusBadgeTone(statusLabel)
                        const statusTitle = isDownloaded ? `Baixado em ${parseIsoDateTimeToBr(downloadedAt)}` : ''
                        const isDownloading =
                          downloadingDocumentKey &&
                          String(downloadingDocumentKey).trim() === String(row?.documentKey || '').trim()
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
                                onClick={() => handleDocumentDownload(row)}
                                disabled={isDownloading || !row.hasContent}
                                title={row.hasContent ? row.attachmentName || 'Baixar anexo' : 'Anexo indisponível'}
                              >
                                {isDownloading ? 'Baixando...' : 'Baixar'}
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
              <h3>{editingSolicitationId ? 'Editar Solicitacao' : 'Nova Solicitacao'}</h3>
              <button type="button" onClick={closeSolicitationModal}>
                A—
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
                  placeholder="Descreva a nova solicitacao"
                />
              </label>

              <label>
                <span>Acao</span>
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
                <span>Informacoes adicionais</span>
                <textarea
                  value={solicitationForm.andamento}
                  onChange={(event) =>
                    setSolicitationForm((prev) => ({ ...prev, andamento: event.target.value }))
                  }
                  placeholder="Descreva os detalhes da solicitacao"
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
                Qualquer tipo de documento e permitido. Limite de 25MB por arquivo.
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
                    Anexos incluidos ({solicitationForm.attachments.length})
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
                <span>Responsavel</span>
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
                      ? 'Salvar Edicao'
                      : 'Salvar Solicitacao'}
                </button>
              </div>
            </form>

            {solicitationError ? <p className="docs-feedback error">{solicitationError}</p> : null}
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default DocsApp


