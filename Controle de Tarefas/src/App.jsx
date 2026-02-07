import { useEffect, useRef, useState } from 'react'
import './App.css'

const stats = [
  {
    label: 'Vencem Hoje',
    value: '0',
    tone: 'rose',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="3" y="5" width="18" height="16" rx="3" />
        <path d="M7 3v4M17 3v4M3 9h18" />
      </svg>
    ),
  },
  {
    label: 'Sujeitas à Multa',
    value: '0',
    tone: 'stone',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v5M12 16h.01" />
      </svg>
    ),
  },
  {
    label: 'Multas Geradas',
    value: '0',
    tone: 'lavender',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="4" y="4" width="16" height="16" rx="4" />
        <path d="M8 9h8M8 13h8M8 17h4" />
      </svg>
    ),
  },
  {
    label: 'Pendentes',
    value: '226',
    tone: 'sand',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M6 3h12l-2 6 2 6H6l2-6-2-6z" />
        <path d="M9 21h6" />
      </svg>
    ),
  },
]

const progressRows = [
  {
    label: 'Abertas',
    tone: 'amber',
    values: [2, 5, 25, 0],
  },
  {
    label: 'Vencem Hoje',
    tone: 'rose',
    values: [0, 0, 0, 0],
  },
  {
    label: 'Atenção',
    tone: 'violet',
    values: [361, 20, 190, 0],
  },
]

const controlRows = [
  {
    group: 'Obrigações',
    items: [
      { name: 'Administrativo', action: 0, alert: 1, pending: 0, done: 0 },
      { name: 'Financeiro', action: 0, alert: 2, pending: 0, done: 0 },
      { name: 'Onboarding do Franqueado', action: 0, alert: 0, pending: 1, done: 0 },
      { name: 'RH', action: 1, alert: 324, pending: 0, done: 0 },
    ],
  },
  {
    group: 'Solicitações',
    items: [
      { name: 'Back Office - Contábil', action: 0, alert: 0, pending: 5, done: 0 },
      { name: 'Back Office - Fiscal', action: 0, alert: 1, pending: 1, done: 0 },
      { name: 'Backoffice Novos Clientes', action: 0, alert: 1, pending: 0, done: 0 },
      { name: 'Comercial', action: 0, alert: 5, pending: 18, done: 1 },
      { name: 'Comercial - Franqueados', action: 0, alert: 5, pending: 132, done: 3 },
      { name: 'Contabilidade', action: 0, alert: 0, pending: 7, done: 0 },
      { name: 'Marketing', action: 0, alert: 0, pending: 1, done: 0 },
    ],
  },
]

const reportRows = [
  {
    id: 1,
    status: 'Concluída na programação',
    dept: 'Back Office - Fiscal',
    subject: 'Back Office - Fiscal - ISS - MAR/2022',
    client: 'LM Soluções (CF Lavras) 3831',
    cnpj: '45.055.208/0001-46',
    clientStatus: 'Desativado',
    dates: ['A: 09/04/2022', 'M: 09/04/2022', 'V: 10/04/2022'],
    owner: 'Jhonata',
    authorizer: 'Jhonata',
    guests: 'Não definido',
    tag: 'success',
  },
  {
    id: 2,
    status: 'Finalizada',
    dept: 'Back Office - Fiscal',
    subject: 'Back Office - Fiscal - ISS - MAR/2022',
    client: 'Prons Saúde 731',
    cnpj: '32.044.511/0001-00',
    clientStatus: 'Desativado',
    dates: ['A: 10/04/2022', 'M: 10/04/2022', 'V: 10/04/2022'],
    owner: 'Jocicle Lima da Silva',
    authorizer: 'Jhonata',
    guests: 'Não definido',
    tag: 'lime',
  },
  {
    id: 3,
    status: 'Concluída após o prazo',
    dept: 'Back Office - Fiscal',
    subject: 'Back Office - Fiscal - DAS - Simples Nacional - MAI/2022',
    client: 'Eliane Joias LTDA 3641',
    cnpj: '26.445.449/0001-57',
    clientStatus: 'Ativo',
    dates: ['A: 14/06/2022', 'M: 14/06/2022', 'V: 14/06/2022'],
    owner: 'Jhonata',
    authorizer: 'Jhonata',
    guests: 'Não definido',
    tag: 'purple',
  },
  {
    id: 4,
    status: 'Cancelada',
    dept: 'Back Office - Fiscal',
    subject: 'Back Office - Fiscal - Destda - MAI/2022',
    client: 'Biohealth Comércio e Importação 3902',
    cnpj: '32.014.717/0001-89',
    clientStatus: 'Ativo',
    dates: ['A: 21/06/2022', 'M: 21/06/2022', 'V: 21/06/2022'],
    owner: 'Carine Vieira Costa',
    authorizer: 'Jhonata',
    guests: 'Não definido',
    tag: 'gray',
  },
  {
    id: 5,
    status: 'Concluída após o prazo',
    dept: 'Back Office - Fiscal',
    subject: 'Back Office - Fiscal - DAS - Simples Nacional - JUN/2022',
    client: 'BG Clean Multisserviços 4315',
    cnpj: '46.386.433/0001-28',
    clientStatus: 'Ativo',
    dates: ['A: 11/07/2022', 'M: 13/07/2022', 'V: 15/07/2022'],
    owner: 'Marcelo Araújo Samuel',
    authorizer: 'Jhonata',
    guests: 'Não definido',
    tag: 'purple',
  },
  {
    id: 6,
    status: 'Concluída após o prazo',
    dept: 'Back Office - Fiscal',
    subject: 'Back Office - Fiscal - Pesquisa de Situação Fiscal - JUN/2022',
    client: 'Fastsignal Comércio e Serviços D 4124',
    cnpj: '08.763.976/0001-28',
    clientStatus: 'Desativado',
    dates: ['A: 18/07/2022', 'M: 18/07/2022', 'V: 18/07/2022'],
    owner: 'Jhonata',
    authorizer: 'Jhonata',
    guests: 'Não definido',
    tag: 'purple',
  },
]

const groupOptions = ['Dep. Pessoal', 'Fiscal', 'Contábil', 'Sucesso do Cliente']
const taxOptions = ['Simples Nacional', 'Lucro Real', 'Lucro Presumido', 'MEI']

const initialClients = [
  {
    id: 1,
    docType: 'CNPJ',
    inscricao: 'IS-33445',
    nome: 'LM Soluções',
    tipo: 'Fixo',
    apelido: 'Hive Lavras',
    sistema: 'Omie',
    dataInicio: '2026-02-06',
    status: 'Ativo',
    statusComplementar: 'Em implantação',
    grupos: ['Fiscal'],
    visibilidade: 'Geral',
    contato: 'Ana Paula',
    telefone: '(35) 9 9988-1000',
    email: 'contato@lmsolucoes.com',
    endereco: 'Rua das Flores',
    numero: '120',
    bairro: 'Centro',
    municipio: 'Lavras',
    uf: 'MG',
    tributacao: 'Simples Nacional',
  },
  {
    id: 2,
    docType: 'CNPJ',
    inscricao: 'IS-22991',
    nome: 'Prons Saúde',
    tipo: 'Fixo',
    apelido: 'Prons',
    sistema: 'Domínio',
    dataInicio: '2026-01-12',
    status: 'Ativo',
    statusComplementar: '',
    grupos: ['Dep. Pessoal'],
    visibilidade: 'Geral',
    contato: 'Jocicle Lima',
    telefone: '(31) 9 8877-2222',
    email: 'financeiro@prons.com',
    endereco: 'Av. Brasil',
    numero: '450',
    bairro: 'Savassi',
    municipio: 'Belo Horizonte',
    uf: 'MG',
    tributacao: 'Lucro Presumido',
  },
  {
    id: 3,
    docType: 'CPF',
    inscricao: '',
    nome: 'Eliane Joias LTDA',
    tipo: 'Fixo',
    apelido: 'Eliane',
    sistema: 'Contábil',
    dataInicio: '2025-11-03',
    status: 'Ativo',
    statusComplementar: 'Em implantação',
    grupos: ['Contábil'],
    visibilidade: 'Geral',
    contato: 'Eliane Joias',
    telefone: '(11) 9 9555-8833',
    email: 'eliane@joias.com',
    endereco: 'Rua das Lojas',
    numero: '85',
    bairro: 'Centro',
    municipio: 'São Paulo',
    uf: 'SP',
    tributacao: 'Lucro Real',
  },
  {
    id: 4,
    docType: 'CNPJ',
    inscricao: 'IS-88002',
    nome: 'Biohealth Comércio',
    tipo: 'Variável',
    apelido: 'Biohealth',
    sistema: 'Fiscal',
    dataInicio: '2025-10-21',
    status: 'Inativo',
    statusComplementar: 'Suspenso',
    grupos: ['Fiscal'],
    visibilidade: 'Restrito',
    contato: 'Carine Vieira',
    telefone: '(11) 9 9123-9988',
    email: 'suporte@biohealth.com',
    endereco: 'Rua das Américas',
    numero: '320',
    bairro: 'Jardins',
    municipio: 'São Paulo',
    uf: 'SP',
    tributacao: 'Lucro Presumido',
  },
  {
    id: 5,
    docType: 'CNPJ',
    inscricao: 'IS-77220',
    nome: 'BG Clean Multisserviços',
    tipo: 'Fixo',
    apelido: 'BG Clean',
    sistema: 'Omie',
    dataInicio: '2025-09-07',
    status: 'Ativo',
    statusComplementar: '',
    grupos: ['Dep. Pessoal'],
    visibilidade: 'Geral',
    contato: 'Marcelo Araújo',
    telefone: '(31) 9 9000-0101',
    email: 'contato@bgclean.com',
    endereco: 'Rua das Palmeiras',
    numero: '56',
    bairro: 'Centro',
    municipio: 'Belo Horizonte',
    uf: 'MG',
    tributacao: 'Simples Nacional',
  },
  {
    id: 6,
    docType: 'CNPJ',
    inscricao: 'IS-00919',
    nome: 'Fastsignal Comércio',
    tipo: 'Variável',
    apelido: 'Fastsignal',
    sistema: 'Contábil',
    dataInicio: '2025-08-14',
    status: 'Ativo',
    statusComplementar: '',
    grupos: ['Contábil'],
    visibilidade: 'Geral',
    contato: 'Jhonata',
    telefone: '(21) 9 9888-1111',
    email: 'fiscal@fastsignal.com',
    endereco: 'Av. Atlântica',
    numero: '912',
    bairro: 'Copacabana',
    municipio: 'Rio de Janeiro',
    uf: 'RJ',
    tributacao: 'Lucro Real',
  },
  {
    id: 7,
    docType: 'CNPJ',
    inscricao: 'IS-55512',
    nome: 'Norte Tech',
    tipo: 'Fixo',
    apelido: 'Norte',
    sistema: 'Omie',
    dataInicio: '2025-12-01',
    status: 'Ativo',
    statusComplementar: '',
    grupos: ['Sucesso do Cliente'],
    visibilidade: 'Geral',
    contato: 'Sueli Prado',
    telefone: '(41) 9 9766-5544',
    email: 'contato@nortetech.com',
    endereco: 'Rua do Sol',
    numero: '33',
    bairro: 'Batel',
    municipio: 'Curitiba',
    uf: 'PR',
    tributacao: 'Simples Nacional',
  },
  {
    id: 8,
    docType: 'CNPJ',
    inscricao: 'IS-42300',
    nome: 'Aquarela Studio',
    tipo: 'Variável',
    apelido: 'Aquarela',
    sistema: 'Domínio',
    dataInicio: '2025-07-18',
    status: 'Ativo',
    statusComplementar: '',
    grupos: ['Dep. Pessoal'],
    visibilidade: 'Restrito',
    contato: 'Camila Reis',
    telefone: '(51) 9 9444-2233',
    email: 'rh@aquarela.com',
    endereco: 'Rua das Artes',
    numero: '201',
    bairro: 'Moinhos',
    municipio: 'Porto Alegre',
    uf: 'RS',
    tributacao: 'MEI',
  },
  {
    id: 9,
    docType: 'CNPJ',
    inscricao: 'IS-33210',
    nome: 'Impacto Logística',
    tipo: 'Fixo',
    apelido: 'Impacto',
    sistema: 'Omie',
    dataInicio: '2025-06-09',
    status: 'Ativo',
    statusComplementar: '',
    grupos: ['Fiscal'],
    visibilidade: 'Geral',
    contato: 'Paulo Meireles',
    telefone: '(48) 9 9888-7711',
    email: 'contato@impacto.com',
    endereco: 'Av. Beira Mar',
    numero: '1001',
    bairro: 'Centro',
    municipio: 'Florianópolis',
    uf: 'SC',
    tributacao: 'Lucro Presumido',
  },
  {
    id: 10,
    docType: 'CNPJ',
    inscricao: 'IS-61002',
    nome: 'Orion Foods',
    tipo: 'Variável',
    apelido: 'Orion',
    sistema: 'Domínio',
    dataInicio: '2025-05-26',
    status: 'Ativo',
    statusComplementar: '',
    grupos: ['Contábil'],
    visibilidade: 'Geral',
    contato: 'Laura Martins',
    telefone: '(19) 9 9555-4411',
    email: 'fiscal@orionfoods.com',
    endereco: 'Rua do Mercado',
    numero: '150',
    bairro: 'Cambuí',
    municipio: 'Campinas',
    uf: 'SP',
    tributacao: 'Lucro Real',
  },
  {
    id: 11,
    docType: 'CPF',
    inscricao: '',
    nome: 'Beatriz Santos',
    tipo: 'Fixo',
    apelido: 'Beatriz',
    sistema: 'Fiscal',
    dataInicio: '2025-04-18',
    status: 'Inativo',
    statusComplementar: 'Suspenso',
    grupos: ['Dep. Pessoal'],
    visibilidade: 'Restrito',
    contato: 'Beatriz Santos',
    telefone: '(62) 9 9333-1200',
    email: 'beatriz@pessoal.com',
    endereco: 'Rua Goiás',
    numero: '88',
    bairro: 'Setor Oeste',
    municipio: 'Goiânia',
    uf: 'GO',
    tributacao: 'MEI',
  },
  {
    id: 12,
    docType: 'CNPJ',
    inscricao: 'IS-77090',
    nome: 'Solaris Energia',
    tipo: 'Fixo',
    apelido: 'Solaris',
    sistema: 'Omie',
    dataInicio: '2025-03-11',
    status: 'Ativo',
    statusComplementar: '',
    grupos: ['Fiscal'],
    visibilidade: 'Geral',
    contato: 'Carlos Lima',
    telefone: '(85) 9 9777-0202',
    email: 'contato@solaris.com',
    endereco: 'Av. Ceará',
    numero: '77',
    bairro: 'Aldeota',
    municipio: 'Fortaleza',
    uf: 'CE',
    tributacao: 'Simples Nacional',
  },
]

const emptyClientForm = {
  docType: '',
  inscricao: '',
  nome: '',
  tipo: 'Fixo',
  apelido: '',
  sistema: '',
  dataInicio: '2026-02-06',
  status: 'Ativo',
  statusComplementar: '',
  grupos: [],
  visibilidade: 'Geral',
  contato: '',
  telefone: '',
  email: '',
  endereco: '',
  numero: '',
  bairro: '',
  municipio: '',
  uf: '',
  tributacao: '',
}

const CREDENTIALS = {
  user: 'Admin',
  pass: 'Admin123',
}

const STORAGE_KEYS = {
  remember: 'hive-remember',
  user: 'hive-username',
  pass: 'hive-password',
}

function App() {
  const [screen, setScreen] = useState('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [error, setError] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [clientOpen, setClientOpen] = useState(false)
  const [clients, setClients] = useState(initialClients)
  const [clientForm, setClientForm] = useState(emptyClientForm)
  const [clientMode, setClientMode] = useState('create')
  const [editingId, setEditingId] = useState(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingDelete, setPendingDelete] = useState(null)
  const [groupsOpen, setGroupsOpen] = useState(false)
  const groupsRef = useRef(null)
  const [taxOpen, setTaxOpen] = useState(false)
  const taxRef = useRef(null)

  useEffect(() => {
    const shouldRemember = localStorage.getItem(STORAGE_KEYS.remember) === 'true'
    if (shouldRemember) {
      setRemember(true)
      setUsername(localStorage.getItem(STORAGE_KEYS.user) || '')
      setPassword(localStorage.getItem(STORAGE_KEYS.pass) || '')
    }
  }, [])

  useEffect(() => {
    if (!groupsOpen) return

    const handleOutsideClick = (event) => {
      if (groupsRef.current && !groupsRef.current.contains(event.target)) {
        setGroupsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [groupsOpen])

  useEffect(() => {
    if (!taxOpen) return

    const handleOutsideClick = (event) => {
      if (taxRef.current && !taxRef.current.contains(event.target)) {
        setTaxOpen(false)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [taxOpen])

  const handleLogin = (event) => {
    event.preventDefault()
    const isValid = username === CREDENTIALS.user && password === CREDENTIALS.pass

    if (!isValid) {
      setError('Usuário ou senha inválidos.')
      return
    }

    setError('')
    if (remember) {
      localStorage.setItem(STORAGE_KEYS.remember, 'true')
      localStorage.setItem(STORAGE_KEYS.user, username)
      localStorage.setItem(STORAGE_KEYS.pass, password)
    } else {
      localStorage.removeItem(STORAGE_KEYS.remember)
      localStorage.removeItem(STORAGE_KEYS.user)
      localStorage.removeItem(STORAGE_KEYS.pass)
    }

    setScreen('dashboard')
  }

  const handleLogout = () => {
    if (remember) {
      localStorage.setItem(STORAGE_KEYS.remember, 'true')
      localStorage.setItem(STORAGE_KEYS.user, username)
      localStorage.setItem(STORAGE_KEYS.pass, password)
    } else {
      localStorage.removeItem(STORAGE_KEYS.remember)
      localStorage.removeItem(STORAGE_KEYS.user)
      localStorage.removeItem(STORAGE_KEYS.pass)
      setUsername('')
      setPassword('')
      setError('')
    }

    setScreen('login')
  }

  const openCreateModal = () => {
    setCreateOpen(true)
    setClientOpen(false)
  }

  const openClientModal = (mode = 'create', client = null) => {
    setClientMode(mode)
    setEditingId(client ? client.id : null)
    setClientForm(client ? { ...client } : { ...emptyClientForm })
    setGroupsOpen(false)
    setTaxOpen(false)
    setClientOpen(true)
    setCreateOpen(false)
  }

  const handleClientChange = (field, value) => {
    setClientForm((prev) => ({ ...prev, [field]: value }))
  }

  const toggleGroup = (group) => {
    setClientForm((prev) => {
      const current = Array.isArray(prev.grupos) ? prev.grupos : []
      if (current.includes(group)) {
        return { ...prev, grupos: current.filter((item) => item !== group) }
      }
      return { ...prev, grupos: [...current, group] }
    })
  }

  const handleClientSave = () => {
    if (clientMode === 'edit' && editingId !== null) {
      setClients((prev) =>
        prev.map((client) => (client.id === editingId ? { ...clientForm, id: editingId } : client)),
      )
    } else {
      const nextId = clients.reduce((maxId, client) => Math.max(maxId, client.id), 0) + 1
      setClients((prev) => [...prev, { ...clientForm, id: nextId }])
    }

    setClientOpen(false)
    setGroupsOpen(false)
    setTaxOpen(false)
    setEditingId(null)
    setClientMode('create')
    setClientForm({ ...emptyClientForm })
  }

  const requestDelete = (client) => {
    setPendingDelete(client)
    setConfirmOpen(true)
  }

  const confirmDelete = () => {
    if (pendingDelete) {
      setClients((prev) => prev.filter((client) => client.id !== pendingDelete.id))
    }
    setPendingDelete(null)
    setConfirmOpen(false)
  }

  const cancelDelete = () => {
    setPendingDelete(null)
    setConfirmOpen(false)
  }

  const selectedGroups = Array.isArray(clientForm.grupos) ? clientForm.grupos : []
  const selectedTax = clientForm.tributacao || ''
  const isReadOnly = clientMode === 'view'

  return (
    <div className="app">
      {screen === 'login' ? (
        <section className="login-page">
          <div className="login-panel">
            <div className="brand">
              <div className="brand-mark">
                <svg viewBox="0 0 64 64" aria-hidden="true">
                  <polygon points="32 6 52 18 52 42 32 54 12 42 12 18" />
                  <polygon points="45 12 58 20 58 36 45 44 32 36 32 20" />
                  <polygon points="19 26 32 34 32 50 19 58 6 50 6 34" />
                </svg>
              </div>
              <div>
                <h1>Hive Tarefas</h1>
                <p>Controle de Tarefas</p>
              </div>
            </div>

            <div className="login-card">
              <div className="login-title">
                <h2>Bem-vindo de volta</h2>
                <p>Entre para acompanhar tarefas, metas e prazos da sua equipe.</p>
              </div>

              <form className="login-form" onSubmit={handleLogin}>
                <label>
                  Usuário
                  <div className="input-wrap">
                    <input
                      type="text"
                      placeholder="seu.usuario"
                      value={username}
                      onChange={(event) => {
                        setUsername(event.target.value)
                        setError('')
                      }}
                      autoComplete="username"
                    />
                    <span className="input-icon" />
                  </div>
                </label>
                <label>
                  Senha
                  <div className="input-wrap">
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(event) => {
                        setPassword(event.target.value)
                        setError('')
                      }}
                      autoComplete={remember ? 'current-password' : 'off'}
                    />
                    <span className="input-icon lock" />
                  </div>
                </label>

                <label className="remember">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(event) => setRemember(event.target.checked)}
                  />
                  Manter conectado
                </label>

                {error ? <span className="login-error">{error}</span> : null}

                <button className="primary" type="submit">
                  Entrar
                </button>
              </form>

              <div className="login-actions">
                <button className="link" type="button">
                  Esqueci minha senha
                </button>
                <button
                  className="ghost"
                  type="button"
                  onClick={() => {
                    setError('')
                    setScreen('dashboard')
                  }}
                >
                  Explorar demo
                </button>
              </div>
            </div>

            <div className="login-foot">Hive Tarefas © 2026</div>
          </div>

          <div className="login-hero">
            <div className="hero-content">
              <span className="pill">Segurança &amp; Performance</span>
              <h2>
                Ative a autenticação de duplo fator no seu
                <span> Hive Tarefas</span>
              </h2>
              <p>
                Adicione uma camada extra de proteção aos dados da sua empresa e de seus clientes.
                Automatize tarefas recorrentes, valide documentos e acompanhe indicadores em tempo real.
              </p>
              <button className="primary wide" type="button" onClick={() => setScreen('dashboard')}>
                Clique aqui e veja como ativar agora
              </button>
              <div className="hero-note">
                A autenticação de duplo fator será obrigatória a partir de janeiro de 2026.
              </div>
            </div>
            <div className="hero-art">
              <div className="shield">
                <div className="shield-core" />
              </div>
              <div className="orbit o1" />
              <div className="orbit o2" />
              <div className="orbit o3" />
            </div>
          </div>
        </section>
      ) : (
        <section className="dashboard">
          <aside className="sidebar">
            <div className="sidebar-avatar">HV</div>
            <nav className="nav">
              {[
                'Visão Geral',
                'Agenda',
                'Tarefas',
                'Kanban',
                'Relatórios',
                'Clientes',
                'Configurações',
              ].map((item, index) => (
                <button
                  key={item}
                  className={`nav-item ${
                    (screen === 'dashboard' && item === 'Visão Geral') ||
                    (screen === 'reports' && item === 'Relatórios') ||
                    (screen === 'clients' && item === 'Clientes')
                      ? 'active'
                      : ''
                  }`}
                  type="button"
                  onClick={() => {
                    if (item === 'Visão Geral') {
                      setScreen('dashboard')
                    } else if (item === 'Relatórios') {
                      setScreen('reports')
                    } else if (item === 'Clientes') {
                      setScreen('clients')
                    }
                  }}
                  style={{ '--delay': `${index * 0.05}s` }}
                >
                  <span className="nav-icon" />
                  <span>{item}</span>
                </button>
              ))}
            </nav>
            <button className="nav-logout" type="button" onClick={handleLogout}>
              Sair
            </button>
          </aside>

          <div className="main">
            <header className="topbar">
              <div className="search">
                <span className="search-icon" />
                <input type="search" placeholder="Digite aqui para começar a pesquisa..." />
              </div>
              <div className="top-actions">
                <button className="chip primary" type="button" onClick={openCreateModal}>
                  Criar Tarefas
                </button>
                <button className="chip" type="button">
                  Relatório do dia
                </button>
                <button className="chip" type="button" onClick={() => setScreen('reports')}>
                  Quadro Kanban
                </button>
              </div>
              <div className="user">
                <span className="user-org">Hive</span>
                <span className="user-dot" />
              </div>
            </header>

            {screen === 'dashboard' || screen === 'reports' ? (
              <div className="view-tabs">
                <button
                  className={screen === 'dashboard' ? 'active' : ''}
                  type="button"
                  onClick={() => setScreen('dashboard')}
                >
                  Visão Geral
                </button>
                <button
                  className={screen === 'reports' ? 'active' : ''}
                  type="button"
                  onClick={() => setScreen('reports')}
                >
                  Relatórios
                </button>
              </div>
            ) : null}

            {screen === 'dashboard' ? (
              <div className="dashboard-view">
                <section className="stats">
                  {stats.map((stat, index) => (
                    <article
                      key={stat.label}
                      className={`stat-card tone-${stat.tone}`}
                      style={{ '--delay': `${index * 0.08}s` }}
                    >
                      <div className="stat-icon">{stat.icon}</div>
                      <div>
                        <p>{stat.label}</p>
                        <h3>{stat.value}</h3>
                      </div>
                    </article>
                  ))}
                </section>

                <section className="overview-grid">
                  <article className="card progress" style={{ '--delay': '0.1s' }}>
                    <header>
                      <h4>Progresso Atual</h4>
                      <span>Por status e prioridade</span>
                    </header>
                    <div className="progress-table">
                      <div className="progress-head">
                        <span />
                        <span>Não iniciadas</span>
                        <span>Fazendo</span>
                        <span>Pendente</span>
                        <span>Revisão</span>
                      </div>
                      {progressRows.map((row) => (
                        <div className="progress-row" key={row.label}>
                          <span className={`tag tone-${row.tone}`}>{row.label}</span>
                          {row.values.map((value, idx) => (
                            <span key={`${row.label}-${idx}`} className="progress-cell">
                              {value}
                            </span>
                          ))}
                        </div>
                      ))}
                    </div>
                  </article>

                  <article className="card performance" style={{ '--delay': '0.16s' }}>
                    <header>
                      <h4>Performance do Mês</h4>
                      <span>FEV/2026</span>
                    </header>
                    <div className="performance-body">
                      <div className="metric">
                        <strong>0</strong>
                        <span>Tarefas Realizadas</span>
                      </div>
                      <div className="donut">
                        <div className="donut-value">0%</div>
                        <span>Tarefas Concluídas</span>
                      </div>
                      <div className="metric">
                        <strong>14</strong>
                        <span>Tarefas Restantes</span>
                      </div>
                    </div>
                    <button className="link" type="button">
                      Ver gráfico detalhado →
                    </button>
                  </article>

                  <article className="card client-view" style={{ '--delay': '0.22s' }}>
                    <header>
                      <h4>Visão do Cliente</h4>
                      <span>Indicadores chave</span>
                    </header>
                    <div className="client-cards">
                      <div className="pill-card">
                        <p>Aguardando resposta</p>
                        <strong>0</strong>
                      </div>
                      <div className="pill-card muted">
                        <p>Com impedimento</p>
                        <strong>0</strong>
                      </div>
                    </div>
                  </article>
                </section>

                <section className="card control-panel" style={{ '--delay': '0.26s' }}>
                  <header className="panel-header">
                    <div>
                      <h4>Painel de Controle</h4>
                      <span>Alertas e andamento por setor</span>
                    </div>
                    <div className="panel-actions">
                      <button type="button" className="chip tiny">
                        Gráfico Operacional
                      </button>
                      <button type="button" className="chip tiny">
                        Envio
                      </button>
                      <button type="button" className="chip tiny">
                        eContador
                      </button>
                    </div>
                  </header>
                  {controlRows.map((group) => (
                    <div className="control-group" key={group.group}>
                      <div className="control-head">
                        <span>{group.group}</span>
                        <span>Ação</span>
                        <span>Atenção</span>
                        <span>Pendentes</span>
                        <span>Concluídas</span>
                      </div>
                      {group.items.map((item) => (
                        <div className="control-row" key={item.name}>
                          <span>{item.name}</span>
                          <span className="counter">{item.action}</span>
                          <span className={`counter tone-${item.alert ? 'violet' : 'soft'}`}>{item.alert}</span>
                          <span className={`counter tone-${item.pending ? 'sand' : 'soft'}`}>{item.pending}</span>
                          <span className={`counter tone-${item.done ? 'green' : 'soft'}`}>{item.done}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </section>

                <section className="card features" style={{ '--delay': '0.3s' }}>
                  <header>
                    <h4>Funcionalidades que aceleram seu escritório</h4>
                    <span>Automatize o relacionamento com seus clientes</span>
                  </header>
                  <div className="feature-grid">
                    <div>
                      <h5>Baixa em lote de tarefas</h5>
                      <p>Otimize e mude o jeito antigo de dar baixa nas atividades com um clique.</p>
                    </div>
                    <div>
                      <h5>Validação de documentos</h5>
                      <p>Envie o documento certo para o cliente certo 100% das vezes.</p>
                    </div>
                    <div>
                      <h5>Envio automático de e-mails</h5>
                      <p>Reenvio inteligente de anexos que não foram abertos.</p>
                    </div>
                    <div>
                      <h5>Recibo de abertura</h5>
                      <p>Dados embasam ações do time e decisões da empresa.</p>
                    </div>
                    <div>
                      <h5>Alertas de prazos</h5>
                      <p>Notificações personalizadas para prazos importantes.</p>
                    </div>
                    <div>
                      <h5>Relacionamento por e-mail</h5>
                      <p>Recursos de notificação, recibo de leitura e acompanhamento.</p>
                    </div>
                  </div>
                </section>
              </div>
            ) : screen === 'reports' ? (
              <div className="reports-view">
                <header className="reports-header">
                  <div>
                    <h4>Relatórios</h4>
                    <p>Tarefas • Visão detalhada por cliente e status</p>
                  </div>
                  <div className="reports-actions">
                    <button type="button" className="chip tiny">
                      Exportar
                    </button>
                    <button type="button" className="chip tiny">
                      Atualizar
                    </button>
                  </div>
                </header>

                <div className="filters">
                  {[
                    'Tipos de tarefas: Solicitação',
                    'Clientes',
                    'Data Ação',
                    'Data Conclusão',
                    'Data Criação',
                    'Data Meta',
                    'Data Vencimento',
                    'Departamentos: Back Office - Fiscal',
                    'Grupos',
                    'Status',
                    'Status complementar do cliente',
                  ].map((item) => (
                    <button key={item} type="button" className="filter-chip">
                      {item}
                    </button>
                  ))}
                  <button type="button" className="filter-chip add">
                    + Filtros
                  </button>
                  <button type="button" className="chip primary small">
                    Aplicar
                  </button>
                  <button type="button" className="chip small">
                    Limpar
                  </button>
                </div>

                <div className="report-search">
                  <input type="text" placeholder="O que você está procurando?" />
                  <div className="report-icons">
                    <button type="button" className="icon-btn" aria-label="Baixar">
                      ⬇
                    </button>
                    <button type="button" className="icon-btn" aria-label="Visualizar">
                      ◻
                    </button>
                  </div>
                </div>

                <div className="report-table">
                  <div className="report-head">
                    <span>Nº</span>
                    <span>Status</span>
                    <span>Departamento</span>
                    <span>Assunto</span>
                    <span>Cliente</span>
                    <span>Status do Cliente</span>
                    <span>Datas</span>
                    <span>Responsável</span>
                    <span>Autorizador</span>
                    <span>Convidados</span>
                  </div>
                  {reportRows.map((row, index) => (
                    <div className="report-row" key={row.id} style={{ '--delay': `${index * 0.05}s` }}>
                      <span>{row.id}</span>
                      <span className={`status-pill ${row.tag}`}>{row.status}</span>
                      <span>{row.dept}</span>
                      <span>{row.subject}</span>
                      <span>
                        {row.client}
                        <small>{row.cnpj}</small>
                      </span>
                      <span className="client-status">{row.clientStatus}</span>
                      <span>
                        {row.dates.map((date) => (
                          <small key={date}>{date}</small>
                        ))}
                      </span>
                      <span>{row.owner}</span>
                      <span>{row.authorizer}</span>
                      <span>{row.guests}</span>
                    </div>
                  ))}
                </div>

                <footer className="report-footer">
                  <span>Itens por página</span>
                  <div className="select">10</div>
                  <span>1 - 10 de 1227</span>
                  <div className="pager">
                    <button type="button">◀</button>
                    <button type="button">▶</button>
                  </div>
                </footer>
              </div>
            ) : screen === 'clients' ? (
              <div className="clients-view">
                <header className="clients-header">
                  <div>
                    <h4>Clientes</h4>
                    <p>Lista completa de clientes cadastrados</p>
                  </div>
                  <div className="clients-actions">
                    <button
                      type="button"
                      className="chip primary small"
                      onClick={() => openClientModal('create')}
                    >
                      Novo cadastro
                    </button>
                  </div>
                </header>

                <div className="client-table card">
                  <div className="client-head">
                    <span>Nome</span>
                    <span>Apelido</span>
                    <span>Documento</span>
                    <span>Status</span>
                    <span>Contato</span>
                    <span>Telefone</span>
                    <span>Email</span>
                    <span>Grupo</span>
                    <span>Visibilidade</span>
                    <span>Ações</span>
                  </div>
                  <div className="client-rows">
                    {clients.map((client) => (
                      <div className="client-row" key={client.id}>
                        <span>{client.nome}</span>
                        <span>{client.apelido}</span>
                        <span className="client-doc">
                          <span className="doc-type">{client.docType}</span>
                          <small>{client.inscricao}</small>
                        </span>
                        <span className={`client-status-pill ${client.status === 'Ativo' ? 'ok' : 'warn'}`}>
                          {client.status}
                        </span>
                        <span>{client.contato || '-'}</span>
                        <span>{client.telefone}</span>
                        <span>{client.email}</span>
                        <span>
                          {Array.isArray(client.grupos) && client.grupos.length
                            ? client.grupos.join(', ')
                            : '-'}
                        </span>
                        <span>{client.visibilidade}</span>
                        <span className="row-actions">
                          <button
                            type="button"
                            className="link-btn eye"
                            onClick={() => openClientModal('view', client)}
                            aria-label="Visualizar"
                            title="Visualizar"
                          >
                            <svg viewBox="0 0 24 24" aria-hidden="true">
                              <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z" />
                              <circle cx="12" cy="12" r="3.5" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            className="link-btn icon"
                            onClick={() => openClientModal('edit', client)}
                            aria-label="Editar"
                            title="Editar"
                          >
                            <svg viewBox="0 0 24 24" aria-hidden="true">
                              <path d="M4 20h4l10-10-4-4L4 16v4z" />
                              <path d="M13 6l4 4" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            className="link-btn icon danger"
                            onClick={() => requestDelete(client)}
                            aria-label="Excluir"
                            title="Excluir"
                          >
                            <svg viewBox="0 0 24 24" aria-hidden="true">
                              <path d="M4 7h16" />
                              <path d="M9 7V5h6v2" />
                              <path d="M7 7l1 12h8l1-12" />
                            </svg>
                          </button>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          {createOpen ? (
            <div className="modal-backdrop" onClick={() => setCreateOpen(false)}>
              <div className="modal-card" onClick={(event) => event.stopPropagation()}>
                <header className="modal-header">
                  <h3>Criar</h3>
                  <button className="modal-close" type="button" onClick={() => setCreateOpen(false)}>
                    ×
                  </button>
                </header>
                <div className="modal-grid">
                  <button className="create-option" type="button">
                    <span className="option-icon" />
                    Obrigação Esporádica
                  </button>
                  <button className="create-option" type="button">
                    <span className="option-icon" />
                    Nova Solicitação
                  </button>
                  <button className="create-option" type="button">
                    <span className="option-icon" />
                    Iniciar Fluxo Cascata
                  </button>
                  <button className="create-option" type="button">
                    <span className="option-icon" />
                    Novo Agendamento
                  </button>
                  <button className="create-option" type="button">
                    <span className="option-icon" />
                    Novo Certificado
                  </button>
                  <button className="create-option" type="button">
                    <span className="option-icon" />
                    Nova Procuração
                  </button>
                  <button className="create-option" type="button" onClick={() => openClientModal('create')}>
                    <span className="option-icon" />
                    Novo Cliente
                  </button>
                </div>
                <div className="modal-footer">
                  <button className="chip small" type="button" onClick={() => setCreateOpen(false)}>
                    Fechar
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          {clientOpen ? (
            <div className="modal-backdrop" onClick={() => setClientOpen(false)}>
              <div className="modal-card wide" onClick={(event) => event.stopPropagation()}>
                <header className="modal-header">
                  <h3>
                    {clientMode === 'edit'
                      ? 'Editar Cliente'
                      : clientMode === 'view'
                        ? 'Visualizar Cliente'
                        : 'Novo Cliente'}
                  </h3>
                  <button className="modal-close" type="button" onClick={() => setClientOpen(false)}>
                    ×
                  </button>
                </header>
                <form
                  className="client-form"
                  onSubmit={(event) => {
                    event.preventDefault()
                    if (!isReadOnly) {
                      handleClientSave()
                    }
                  }}
                >
                  <div className="form-grid">
                    <div className="field">
                      <label>
                        CNPJ/CPF/CEI <span className="req">*</span>
                      </label>
                      <select
                        value={clientForm.docType}
                        onChange={(event) => handleClientChange('docType', event.target.value)}
                        disabled={isReadOnly}
                      >
                        <option value="" disabled>
                          Selecione...
                        </option>
                        <option>CNPJ</option>
                        <option>CPF</option>
                        <option>CEI</option>
                      </select>
                    </div>
                    <div className="field">
                      <label>Inscrição</label>
                      <input
                        type="text"
                        placeholder=""
                        value={clientForm.inscricao}
                        onChange={(event) => handleClientChange('inscricao', event.target.value)}
                        readOnly={isReadOnly}
                      />
                    </div>
                  </div>
                  <div className="form-grid">
                    <div className="field">
                      <label>
                        Nome <span className="req">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder=""
                        value={clientForm.nome}
                        onChange={(event) => handleClientChange('nome', event.target.value)}
                        readOnly={isReadOnly}
                      />
                    </div>
                    <div className="field">
                      <label>Tipo</label>
                      <select
                        value={clientForm.tipo}
                        onChange={(event) => handleClientChange('tipo', event.target.value)}
                        disabled={isReadOnly}
                      >
                        <option>Fixo</option>
                        <option>Variável</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-grid">
                    <div className="field">
                      <label>
                        Apelido <span className="req">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder=""
                        value={clientForm.apelido}
                        onChange={(event) => handleClientChange('apelido', event.target.value)}
                        readOnly={isReadOnly}
                      />
                    </div>
                    <div className="field">
                      <label>Sistema</label>
                      <input
                        type="text"
                        placeholder=""
                        value={clientForm.sistema}
                        onChange={(event) => handleClientChange('sistema', event.target.value)}
                        readOnly={isReadOnly}
                      />
                    </div>
                  </div>
                  <div className="form-grid three">
                    <div className="field">
                      <label>
                        Data Início <span className="req">*</span>
                      </label>
                      <input
                        type="date"
                        value={clientForm.dataInicio}
                        onChange={(event) => handleClientChange('dataInicio', event.target.value)}
                        disabled={isReadOnly}
                      />
                    </div>
                    <div className="field">
                      <label>Status</label>
                      <select
                        value={clientForm.status}
                        onChange={(event) => handleClientChange('status', event.target.value)}
                        disabled={isReadOnly}
                      >
                        <option>Ativo</option>
                        <option>Inativo</option>
                      </select>
                    </div>
                    <div className="field">
                      <label>Status Complementar</label>
                      <select
                        value={clientForm.statusComplementar}
                        onChange={(event) =>
                          handleClientChange('statusComplementar', event.target.value)
                        }
                        disabled={isReadOnly}
                      >
                        <option value="" disabled>
                          Selecione...
                        </option>
                        <option>Em implantação</option>
                        <option>Suspenso</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-grid">
                    <div className="field">
                      <label>Grupos</label>
                      <div className="multi-select" ref={groupsRef}>
                        <div
                          className={`multi-trigger ${groupsOpen ? 'open' : ''}`}
                          role="button"
                          tabIndex={0}
                          onClick={() => {
                            if (!isReadOnly) {
                              setGroupsOpen((prev) => !prev)
                            }
                          }}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault()
                              if (!isReadOnly) {
                                setGroupsOpen((prev) => !prev)
                              }
                            }
                          }}
                        >
                          {selectedGroups.length ? (
                            <div className="multi-tags">
                              {selectedGroups.map((grupo) => (
                                <span className="tag-pill" key={grupo}>
                                  {grupo}
                                  <button
                                    type="button"
                                    onClick={(event) => {
                                      event.stopPropagation()
                                      if (!isReadOnly) {
                                        toggleGroup(grupo)
                                      }
                                    }}
                                  >
                                    ×
                                  </button>
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="placeholder">Selecione...</span>
                          )}
                          <span className="caret" />
                        </div>
                        {groupsOpen && !isReadOnly ? (
                          <div className="multi-menu">
                            {groupOptions.map((option) => (
                              <button
                                type="button"
                                className={`multi-option ${
                                  selectedGroups.includes(option) ? 'selected' : ''
                                }`}
                                key={option}
                                onClick={() => toggleGroup(option)}
                              >
                                <span className="check" />
                                {option}
                              </button>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </div>
                    <div className="field">
                      <label>
                        Visibilidade <span className="req">*</span>
                      </label>
                      <div className="tag-input">
                        {clientForm.visibilidade ? (
                          <span className="tag-pill">
                            {clientForm.visibilidade}
                            <button
                              type="button"
                              onClick={() => {
                                if (!isReadOnly) {
                                  handleClientChange('visibilidade', '')
                                }
                              }}
                              disabled={isReadOnly}
                            >
                              ×
                            </button>
                          </span>
                        ) : null}
                        <select
                          value={clientForm.visibilidade}
                          onChange={(event) => handleClientChange('visibilidade', event.target.value)}
                          disabled={isReadOnly}
                        >
                          <option value="" disabled>
                            Selecione...
                          </option>
                          <option>Geral</option>
                          <option>Restrito</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <div className="form-grid contact">
                    <div className="field">
                      <label>Contato</label>
                      <input
                        type="text"
                        placeholder=""
                        value={clientForm.contato}
                        onChange={(event) => handleClientChange('contato', event.target.value)}
                        readOnly={isReadOnly}
                      />
                    </div>
                    <div className="field">
                      <label>Telefone</label>
                      <input
                        type="tel"
                        placeholder=""
                        value={clientForm.telefone}
                        onChange={(event) => handleClientChange('telefone', event.target.value)}
                        readOnly={isReadOnly}
                      />
                    </div>
                    <div className="field">
                      <label>Email</label>
                      <input
                        type="email"
                        placeholder=""
                        value={clientForm.email}
                        onChange={(event) => handleClientChange('email', event.target.value)}
                        readOnly={isReadOnly}
                      />
                    </div>
                  </div>
                  <div className="form-grid address">
                    <div className="field">
                      <label>Endereço</label>
                      <input
                        type="text"
                        placeholder=""
                        value={clientForm.endereco}
                        onChange={(event) => handleClientChange('endereco', event.target.value)}
                        readOnly={isReadOnly}
                      />
                    </div>
                    <div className="field">
                      <label>Número</label>
                      <input
                        type="text"
                        placeholder=""
                        value={clientForm.numero}
                        onChange={(event) => handleClientChange('numero', event.target.value)}
                        readOnly={isReadOnly}
                      />
                    </div>
                  </div>
                  <div className="form-grid location">
                    <div className="field">
                      <label>Bairro</label>
                      <input
                        type="text"
                        placeholder=""
                        value={clientForm.bairro}
                        onChange={(event) => handleClientChange('bairro', event.target.value)}
                        readOnly={isReadOnly}
                      />
                    </div>
                    <div className="field">
                      <label>Município</label>
                      <input
                        type="text"
                        placeholder=""
                        value={clientForm.municipio}
                        onChange={(event) => handleClientChange('municipio', event.target.value)}
                        readOnly={isReadOnly}
                      />
                    </div>
                    <div className="field">
                      <label>UF</label>
                      <input
                        type="text"
                        placeholder=""
                        value={clientForm.uf}
                        onChange={(event) => handleClientChange('uf', event.target.value)}
                        readOnly={isReadOnly}
                      />
                    </div>
                    <div className="field">
                      <label>Tributação</label>
                      <div className="single-select" ref={taxRef}>
                        <div
                          className={`single-trigger ${taxOpen ? 'open' : ''}`}
                          role="button"
                          tabIndex={0}
                          onClick={() => {
                            if (!isReadOnly) {
                              setTaxOpen((prev) => !prev)
                            }
                          }}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault()
                              if (!isReadOnly) {
                                setTaxOpen((prev) => !prev)
                              }
                            }
                          }}
                        >
                          {selectedTax ? (
                            <span>{selectedTax}</span>
                          ) : (
                            <span className="placeholder">Selecione...</span>
                          )}
                          <span className="caret" />
                        </div>
                        {taxOpen && !isReadOnly ? (
                          <div className="single-menu">
                            {taxOptions.map((option) => (
                              <button
                                key={option}
                                type="button"
                                className={`single-option ${selectedTax === option ? 'selected' : ''}`}
                                onClick={() => {
                                  handleClientChange('tributacao', option)
                                  setTaxOpen(false)
                                }}
                              >
                                {option}
                              </button>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                  <div className="form-actions">
                    {isReadOnly ? (
                      <button className="chip small" type="button" onClick={() => setClientOpen(false)}>
                        Fechar
                      </button>
                    ) : (
                      <>
                        <button className="chip small" type="button" onClick={() => setClientOpen(false)}>
                          Cancelar
                        </button>
                        <button className="primary small" type="submit">
                          Confirmar
                        </button>
                      </>
                    )}
                  </div>
                </form>
              </div>
            </div>
          ) : null}

          {confirmOpen ? (
            <div className="modal-backdrop" onClick={cancelDelete}>
              <div className="modal-card confirm" onClick={(event) => event.stopPropagation()}>
                <header className="modal-header">
                  <h3>Confirmar exclusão</h3>
                  <button className="modal-close" type="button" onClick={cancelDelete}>
                    ×
                  </button>
                </header>
                <p className="confirm-text">
                  Deseja excluir o cliente{' '}
                  <strong>{pendingDelete ? pendingDelete.nome : 'selecionado'}</strong>?
                </p>
                <div className="form-actions">
                  <button className="chip small" type="button" onClick={cancelDelete}>
                    Cancelar
                  </button>
                  <button className="danger-btn" type="button" onClick={confirmDelete}>
                    Excluir
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </section>
      )}
    </div>
  )
}

export default App

