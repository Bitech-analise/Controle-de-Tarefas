import { useEffect, useRef, useState } from 'react'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'
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
    competence: 'MAR/2022',
    client: 'LM Soluções (CF Lavras) 3831',
    cnpj: '45.055.208/0001-46',
    clientStatus: 'Desativado',
    dates: ['A: 09/04/2022', 'M: 09/04/2022', 'V: 10/04/2022'],
    deliveryDate: '10/04/2022',
    conclusionDate: '10/04/2022',
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
    competence: 'MAR/2022',
    client: 'Prons Saúde 731',
    cnpj: '32.044.511/0001-00',
    clientStatus: 'Desativado',
    dates: ['A: 10/04/2022', 'M: 10/04/2022', 'V: 10/04/2022'],
    deliveryDate: '10/04/2022',
    conclusionDate: '10/04/2022',
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
    competence: 'MAI/2022',
    client: 'Eliane Joias LTDA 3641',
    cnpj: '26.445.449/0001-57',
    clientStatus: 'Ativo',
    dates: ['A: 14/06/2022', 'M: 14/06/2022', 'V: 14/06/2022'],
    deliveryDate: '14/06/2022',
    conclusionDate: '14/06/2022',
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
    competence: 'MAI/2022',
    client: 'Biohealth Comércio e Importação 3902',
    cnpj: '32.014.717/0001-89',
    clientStatus: 'Ativo',
    dates: ['A: 21/06/2022', 'M: 21/06/2022', 'V: 21/06/2022'],
    deliveryDate: '21/06/2022',
    conclusionDate: '21/06/2022',
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
    competence: 'JUN/2022',
    client: 'BG Clean Multisserviços 4315',
    cnpj: '46.386.433/0001-28',
    clientStatus: 'Ativo',
    dates: ['A: 11/07/2022', 'M: 13/07/2022', 'V: 15/07/2022'],
    deliveryDate: '15/07/2022',
    conclusionDate: '15/07/2022',
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
    competence: 'JUN/2022',
    client: 'Fastsignal Comércio e Serviços D 4124',
    cnpj: '08.763.976/0001-28',
    clientStatus: 'Desativado',
    dates: ['A: 18/07/2022', 'M: 18/07/2022', 'V: 18/07/2022'],
    deliveryDate: '18/07/2022',
    conclusionDate: '18/07/2022',
    owner: 'Jhonata',
    authorizer: 'Jhonata',
    guests: 'Não definido',
    tag: 'purple',
  },
]

const groupOptions = ['Dep. Pessoal', 'Fiscal', 'Contábil', 'Sucesso do Cliente']
const taxOptions = ['Simples Nacional', 'Lucro Real', 'Lucro Presumido', 'MEI']
const dateFilterOptions = ['Ação', 'Meta', 'Conclusão']
const taskDateFilterOptions = ['Ação', 'Meta', 'Vencimento', 'Data da Entrega']
const operationalActionKeys = ['A Realizar', '3 Dias', 'Hoje', 'Último Dia']
const operationalOverdueKeys = ['Após Ação', 'Após Meta', 'Após Vencimento']
const operationalCompletedKeys = ['Concluído', 'Fora Meta', 'Fora Prazo', 'Dispensado']
const operationalPendingKeys = ['Aguardando', 'Retificando']

const operationalRecords = [
  {
    id: 1,
    department: 'Administrativo',
    obligation: 'Fechamento Mensal',
    client: 'LM Soluções',
    groupClient: 'Fiscal',
    user: 'Yasmin Fraga',
    team: 'Back Office',
    actionDate: '2026-02-02',
    metaDate: '2026-02-10',
    conclusionDate: '2026-02-13',
    action: { 'A Realizar': 0, '3 Dias': 1, Hoje: 0, 'Último Dia': 0 },
    overdue: { 'Após Ação': 0, 'Após Meta': 1, 'Após Vencimento': 0 },
    completed: { Concluído: 0, 'Fora Meta': 0, 'Fora Prazo': 1, Dispensado: 0 },
    pending: { Aguardando: 0, Retificando: 1 },
  },
  {
    id: 2,
    department: 'Financeiro',
    obligation: 'Conciliação',
    client: 'Prons Saúde',
    groupClient: 'Dep. Pessoal',
    user: 'Yasmin Fraga',
    team: 'Back Office',
    actionDate: '2026-02-05',
    metaDate: '2026-02-12',
    conclusionDate: '2026-02-14',
    action: { 'A Realizar': 1, '3 Dias': 0, Hoje: 0, 'Último Dia': 0 },
    overdue: { 'Após Ação': 0, 'Após Meta': 0, 'Após Vencimento': 0 },
    completed: { Concluído: 1, 'Fora Meta': 0, 'Fora Prazo': 0, Dispensado: 0 },
    pending: { Aguardando: 1, Retificando: 0 },
  },
  {
    id: 3,
    department: 'RH',
    obligation: 'Folha',
    client: 'BG Clean',
    groupClient: 'Dep. Pessoal',
    user: 'Carine Vieira',
    team: 'Dep. Pessoal',
    actionDate: '2026-02-06',
    metaDate: '2026-02-15',
    conclusionDate: '2026-02-16',
    action: { 'A Realizar': 0, '3 Dias': 0, Hoje: 1, 'Último Dia': 0 },
    overdue: { 'Após Ação': 0, 'Após Meta': 1, 'Após Vencimento': 0 },
    completed: { Concluído: 2, 'Fora Meta': 0, 'Fora Prazo': 0, Dispensado: 0 },
    pending: { Aguardando: 0, Retificando: 1 },
  },
  {
    id: 4,
    department: 'Contabilidade',
    obligation: 'Balancete',
    client: 'Fastsignal',
    groupClient: 'Contábil',
    user: 'Jhonata',
    team: 'Contábil',
    actionDate: '2026-02-07',
    metaDate: '2026-02-18',
    conclusionDate: '2026-02-19',
    action: { 'A Realizar': 1, '3 Dias': 0, Hoje: 0, 'Último Dia': 1 },
    overdue: { 'Após Ação': 0, 'Após Meta': 0, 'Após Vencimento': 1 },
    completed: { Concluído: 1, 'Fora Meta': 1, 'Fora Prazo': 0, Dispensado: 0 },
    pending: { Aguardando: 2, Retificando: 0 },
  },
  {
    id: 5,
    department: 'Comercial',
    obligation: 'Onboarding',
    client: 'Norte Tech',
    groupClient: 'Sucesso do Cliente',
    user: 'Sueli Prado',
    team: 'Comercial',
    actionDate: '2026-02-09',
    metaDate: '2026-02-20',
    conclusionDate: '2026-02-21',
    action: { 'A Realizar': 0, '3 Dias': 1, Hoje: 1, 'Último Dia': 0 },
    overdue: { 'Após Ação': 1, 'Após Meta': 0, 'Após Vencimento': 0 },
    completed: { Concluído: 1, 'Fora Meta': 0, 'Fora Prazo': 1, Dispensado: 0 },
    pending: { Aguardando: 1, Retificando: 1 },
  },
  {
    id: 6,
    department: 'Fiscal',
    obligation: 'Apuração',
    client: 'Aquarela Studio',
    groupClient: 'Fiscal',
    user: 'Marcelo Araújo',
    team: 'Fiscal',
    actionDate: '2026-02-11',
    metaDate: '2026-02-22',
    conclusionDate: '2026-02-23',
    action: { 'A Realizar': 1, '3 Dias': 0, Hoje: 0, 'Último Dia': 0 },
    overdue: { 'Após Ação': 0, 'Após Meta': 1, 'Após Vencimento': 1 },
    completed: { Concluído: 0, 'Fora Meta': 1, 'Fora Prazo': 0, Dispensado: 1 },
    pending: { Aguardando: 1, Retificando: 0 },
  },
  {
    id: 7,
    department: 'Fiscal',
    obligation: 'Apuração',
    client: 'Impacto Logística',
    groupClient: 'Fiscal',
    user: 'Paulo Meireles',
    team: 'Fiscal',
    actionDate: '2026-01-28',
    metaDate: '2026-02-07',
    conclusionDate: '2026-02-08',
    action: { 'A Realizar': 0, '3 Dias': 1, Hoje: 0, 'Último Dia': 0 },
    overdue: { 'Após Ação': 1, 'Após Meta': 0, 'Após Vencimento': 0 },
    completed: { Concluído: 1, 'Fora Meta': 0, 'Fora Prazo': 0, Dispensado: 0 },
    pending: { Aguardando: 0, Retificando: 1 },
  },
  {
    id: 8,
    department: 'Contabilidade',
    obligation: 'Fechamento Anual',
    client: 'Orion Foods',
    groupClient: 'Contábil',
    user: 'Laura Martins',
    team: 'Contábil',
    actionDate: '2026-02-15',
    metaDate: '2026-02-25',
    conclusionDate: '2026-02-27',
    action: { 'A Realizar': 1, '3 Dias': 1, Hoje: 0, 'Último Dia': 0 },
    overdue: { 'Após Ação': 0, 'Após Meta': 0, 'Após Vencimento': 1 },
    completed: { Concluído: 2, 'Fora Meta': 0, 'Fora Prazo': 0, Dispensado: 0 },
    pending: { Aguardando: 0, Retificando: 1 },
  },
]

const initialOperationalFilters = {
  department: 'Todos',
  obligation: 'Todos',
  clientQuery: '',
  groupClient: 'Todos',
  user: 'Todos',
  team: 'Todos',
  dateBy: 'Ação',
  startDate: '2026-02-01',
  endDate: '2026-02-28',
}

const initialTaskFilters = {
  taskType: 'Solicitação',
  subject: 'Todos',
  client: 'Todos',
  department: 'Todos',
  status: 'Todos',
  clientStatus: 'Todos',
  owner: 'Todos',
  dateBy: 'Ação',
  startDate: '',
  endDate: '',
  query: '',
}

const sumCategoryCounts = (records, categoryField, keys) =>
  keys.reduce((acc, key) => {
    acc[key] = records.reduce((total, row) => total + (row[categoryField]?.[key] || 0), 0)
    return acc
  }, {})

const getCountsTotal = (counts) => Object.values(counts).reduce((total, value) => total + value, 0)

const getHighlightPercent = (counts) => {
  const total = getCountsTotal(counts)
  if (!total) return 0
  const maxValue = Math.max(...Object.values(counts))
  return Math.round((maxValue / total) * 100)
}

const formatDateForFile = (value) => {
  if (!value) return 'sem-data'
  return value.replaceAll('-', '')
}

const getCsvCell = (value) => {
  const text = String(value ?? '')
  if (text.includes(',') || text.includes('"') || text.includes('\n')) {
    return `"${text.replaceAll('"', '""')}"`
  }
  return text
}

const parseBrDateToIso = (value) => {
  if (!value) return ''
  const [day, month, year] = value.split('/')
  if (!day || !month || !year) return ''
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
}

const parseIsoDateToBr = (value) => {
  if (!value) return ''
  const [year, month, day] = value.split('-')
  if (!day || !month || !year) return ''
  return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`
}

const getTodayIsoLocal = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const getNowBrDate = () => parseIsoDateToBr(getTodayIsoLocal())

const getNowBrTimestamp = () =>
  new Date().toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })

const formatFileSize = (bytes) => {
  if (!bytes) return '0 KB'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const addMonthsToIsoDate = (value, monthsToAdd) => {
  if (!value) return ''
  const [yearRaw, monthRaw, dayRaw] = value.split('-')
  const year = Number(yearRaw)
  const month = Number(monthRaw)
  const day = Number(dayRaw)
  if (!year || !month || !day) return ''

  const baseDate = new Date(year, month - 1 + monthsToAdd, 1)
  const lastDay = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0).getDate()
  const safeDay = Math.min(day, lastDay)
  baseDate.setDate(safeDay)

  const nextYear = baseDate.getFullYear()
  const nextMonth = String(baseDate.getMonth() + 1).padStart(2, '0')
  const nextDay = String(baseDate.getDate()).padStart(2, '0')
  return `${nextYear}-${nextMonth}-${nextDay}`
}

const getCompetenceFromDate = (isoDate, mode) => {
  if (!isoDate) return ''
  const [yearRaw, monthRaw] = isoDate.split('-')
  const year = Number(yearRaw)
  const month = Number(monthRaw)
  if (!year || !month) return ''

  const date = new Date(year, month - 1, 1)
  if (mode === 'Mês anterior') {
    date.setMonth(date.getMonth() - 1)
  }

  const monthByIndex = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ']
  return `${monthByIndex[date.getMonth()]}/${date.getFullYear()}`
}

const getGeneratedTaskStatus = (actionIso, metaIso, dueIso) => {
  const todayIso = getTodayIsoLocal()

  if (actionIso && actionIso > todayIso) {
    return { status: 'A Vencer', tag: 'lime' }
  }

  if (dueIso && dueIso < todayIso) {
    return { status: 'Vencida', tag: 'purple' }
  }

  if (metaIso && metaIso < todayIso) {
    return { status: 'Atenção', tag: 'purple' }
  }

  return { status: 'Em andamento', tag: 'success' }
}

const getTaskDisplayStatus = (row) => {
  const hasDeliveryDate = Boolean(String(row.deliveryDate || '').trim())
  if (!hasDeliveryDate) {
    const actionIso = parseBrDateToIso(getTaggedReportDate(row.dates, 'A'))
    const metaIso = parseBrDateToIso(getTaggedReportDate(row.dates, 'M'))
    const dueIso = parseBrDateToIso(getTaggedReportDate(row.dates, 'V'))
    return getGeneratedTaskStatus(actionIso, metaIso, dueIso)
  }

  return { status: row.status, tag: row.tag }
}

const getTaskDisplayConclusion = (row) => {
  const hasDeliveryDate = Boolean(String(row.deliveryDate || '').trim())
  if (!hasDeliveryDate) return ''
  return row.conclusionDate || row.deliveryDate || ''
}

const isCompletedTaskStatus = (status) => {
  const normalizedStatus = String(status || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

  return ['finalizada', 'concluida', 'dispensada', 'cancelada'].some((keyword) =>
    normalizedStatus.includes(keyword),
  )
}

const getTaskProgressColumnKey = ({
  todayIso,
  actionIso,
  metaIso,
  dueIso,
  isCompleted,
  hasDeliveryDate,
}) => {
  if (isCompleted || hasDeliveryDate) return 'review'
  if (actionIso && todayIso < actionIso) return 'notStarted'
  if (metaIso && todayIso < metaIso) return 'doing'
  if (dueIso && todayIso <= dueIso) return 'pending'
  return 'pending'
}

const formatCompetenceValue = (value) => {
  if (!value) return ''
  const normalized = String(value).trim().toUpperCase()
  const monthByNumber = {
    '01': 'JAN',
    '02': 'FEV',
    '03': 'MAR',
    '04': 'ABR',
    '05': 'MAI',
    '06': 'JUN',
    '07': 'JUL',
    '08': 'AGO',
    '09': 'SET',
    '10': 'OUT',
    '11': 'NOV',
    '12': 'DEZ',
  }

  const numericMatch = normalized.match(/^(\d{2})\/(\d{4})$/)
  if (numericMatch) {
    const month = monthByNumber[numericMatch[1]]
    return month ? `${month}/${numericMatch[2]}` : normalized
  }

  const abbrMatch = normalized.match(/^([A-Z]{3})\/(\d{4})$/)
  if (abbrMatch) return `${abbrMatch[1]}/${abbrMatch[2]}`

  return normalized
}

const getTaggedReportDate = (dates, key) => {
  const entry = (dates || []).find((item) => item.startsWith(`${key}:`))
  if (!entry) return ''
  return entry.split(':')[1]?.trim() || ''
}

const getCsvContent = (rows) => {
  if (!rows.length) return ''
  const headers = Object.keys(rows[0])
  const lines = [headers.join(','), ...rows.map((row) => headers.map((header) => getCsvCell(row[header])).join(','))]
  return `\uFEFF${lines.join('\n')}`
}

const downloadFileFromBlob = (content, fileName, type) => {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

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

const initialUsers = [
  {
    id: 1,
    nome: 'Administrador',
    departamento: 'Fiscal',
    telefone: '(35) 9 9999-0000',
    email: 'admin@hive.com',
    senha: 'Admin123',
  },
]

const emptyUserForm = {
  nome: '',
  departamento: '',
  telefone: '',
  email: '',
  senha: '',
}

const getEmptySettingsTaskForm = () => {
  const today = new Date().toISOString().slice(0, 10)
  return {
    actionDate: today,
    metaDate: today,
    dueDate: today,
    obligation: '',
    complement: '',
    installments: 1,
    competenceMode: 'Mesmo mês',
    clientIds: [],
    includeDisabledClients: false,
    attachments: [],
    andamento: '',
    owner: '',
    guests: '',
  }
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
  const [remember, setRemember] = useState(
    () => localStorage.getItem(STORAGE_KEYS.remember) === 'true',
  )
  const [username, setUsername] = useState(() =>
    localStorage.getItem(STORAGE_KEYS.remember) === 'true'
      ? localStorage.getItem(STORAGE_KEYS.user) || ''
      : '',
  )
  const [password, setPassword] = useState(() =>
    localStorage.getItem(STORAGE_KEYS.remember) === 'true'
      ? localStorage.getItem(STORAGE_KEYS.pass) || ''
      : '',
  )
  const [error, setError] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [taskCreateOpen, setTaskCreateOpen] = useState(false)
  const [clientOpen, setClientOpen] = useState(false)
  const [settingsTab, setSettingsTab] = useState('users')
  const [users, setUsers] = useState(initialUsers)
  const [userForm, setUserForm] = useState(emptyUserForm)
  const [editingUserId, setEditingUserId] = useState(null)
  const [settingsUserFeedback, setSettingsUserFeedback] = useState('')
  const [settingsTaskForm, setSettingsTaskForm] = useState(() => getEmptySettingsTaskForm())
  const [settingsTaskFeedback, setSettingsTaskFeedback] = useState('')
  const [clients, setClients] = useState(initialClients)
  const [tasksRows, setTasksRows] = useState(() =>
    reportRows.map((task) => ({
      ...task,
      attachments: [],
      baixaAt: '',
      baixaAction: '',
      justification: '',
    })),
  )
  const [selectedTaskId, setSelectedTaskId] = useState(null)
  const [taskEditMode, setTaskEditMode] = useState(false)
  const [taskActionLogs, setTaskActionLogs] = useState([])
  const [taskActionError, setTaskActionError] = useState('')
  const [clientForm, setClientForm] = useState(emptyClientForm)
  const [clientMode, setClientMode] = useState('create')
  const [editingId, setEditingId] = useState(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingDelete, setPendingDelete] = useState(null)
  const [groupsOpen, setGroupsOpen] = useState(false)
  const groupsRef = useRef(null)
  const [taxOpen, setTaxOpen] = useState(false)
  const taxRef = useRef(null)
  const [selectedClientIds, setSelectedClientIds] = useState([])
  const selectAllRef = useRef(null)
  const [bulkOpen, setBulkOpen] = useState(false)
  const [bulkForm, setBulkForm] = useState({
    status: '',
    visibilidade: '',
    grupos: [],
    tributacao: '',
  })
  const [bulkGroupsOpen, setBulkGroupsOpen] = useState(false)
  const bulkGroupsRef = useRef(null)
  const [bulkTaxOpen, setBulkTaxOpen] = useState(false)
  const bulkTaxRef = useRef(null)
  const [taskFilters, setTaskFilters] = useState(initialTaskFilters)
  const [appliedTaskFilters, setAppliedTaskFilters] = useState(initialTaskFilters)
  const [taskPage, setTaskPage] = useState(1)
  const [taskItemsPerPage, setTaskItemsPerPage] = useState(10)
  const [operationalFilters, setOperationalFilters] = useState(initialOperationalFilters)
  const [appliedOperationalFilters, setAppliedOperationalFilters] = useState(initialOperationalFilters)

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

  useEffect(() => {
    if (!bulkGroupsOpen) return

    const handleOutsideClick = (event) => {
      if (bulkGroupsRef.current && !bulkGroupsRef.current.contains(event.target)) {
        setBulkGroupsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [bulkGroupsOpen])

  useEffect(() => {
    if (!bulkTaxOpen) return

    const handleOutsideClick = (event) => {
      if (bulkTaxRef.current && !bulkTaxRef.current.contains(event.target)) {
        setBulkTaxOpen(false)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [bulkTaxOpen])

  useEffect(() => {
    if (!selectAllRef.current) return
    const total = clients.length
    const selected = selectedClientIds.length
    selectAllRef.current.indeterminate = selected > 0 && selected < total
  }, [clients.length, selectedClientIds.length])

  const handleLogin = (event) => {
    event.preventDefault()
    const normalizedUser = username.trim().toLowerCase()
    const hasRegisteredUser = users.some(
      (user) => user.email.trim().toLowerCase() === normalizedUser && user.senha === password,
    )
    const hasLegacyAccess = username === CREDENTIALS.user && password === CREDENTIALS.pass
    const isValid = hasRegisteredUser || hasLegacyAccess

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

  const openBulkModal = () => {
    if (!selectedClientIds.length) return
    setBulkOpen(true)
    setBulkGroupsOpen(false)
    setBulkTaxOpen(false)
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

  const handleBulkChange = (field, value) => {
    setBulkForm((prev) => ({ ...prev, [field]: value }))
  }

  const toggleBulkGroup = (group) => {
    setBulkForm((prev) => {
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

  const handleBulkSave = () => {
    if (!selectedClientIds.length) return
    setClients((prev) =>
      prev.map((client) => {
        if (!selectedClientIds.includes(client.id)) return client
        return {
          ...client,
          ...(bulkForm.status ? { status: bulkForm.status } : {}),
          ...(bulkForm.visibilidade ? { visibilidade: bulkForm.visibilidade } : {}),
          ...(bulkForm.tributacao ? { tributacao: bulkForm.tributacao } : {}),
          ...(bulkForm.grupos.length ? { grupos: bulkForm.grupos } : {}),
        }
      }),
    )
    setBulkOpen(false)
    setBulkGroupsOpen(false)
    setBulkTaxOpen(false)
    setBulkForm({ status: '', visibilidade: '', grupos: [], tributacao: '' })
  }

  const requestDelete = (client) => {
    setPendingDelete([client])
    setConfirmOpen(true)
  }

  const requestBulkDelete = () => {
    if (!selectedClientIds.length) return
    setPendingDelete(clients.filter((client) => selectedClientIds.includes(client.id)))
    setConfirmOpen(true)
  }

  const confirmDelete = () => {
    if (pendingDelete) {
      const idsToDelete = pendingDelete.map((client) => client.id)
      setClients((prev) => prev.filter((client) => !idsToDelete.includes(client.id)))
      setSelectedClientIds((prev) => prev.filter((id) => !idsToDelete.includes(id)))
    }
    setPendingDelete(null)
    setConfirmOpen(false)
  }

  const cancelDelete = () => {
    setPendingDelete(null)
    setConfirmOpen(false)
  }

  const toggleSelectAll = () => {
    if (selectedClientIds.length === clients.length) {
      setSelectedClientIds([])
    } else {
      setSelectedClientIds(clients.map((client) => client.id))
    }
  }

  const toggleSelectClient = (clientId) => {
    setSelectedClientIds((prev) =>
      prev.includes(clientId) ? prev.filter((id) => id !== clientId) : [...prev, clientId],
    )
  }

  const handleTaskFilterChange = (field, value) => {
    setTaskFilters((prev) => ({ ...prev, [field]: value }))
  }

  const applyTaskFilters = () => {
    setAppliedTaskFilters(taskFilters)
    setTaskPage(1)
  }

  const clearTaskFilters = () => {
    setTaskFilters(initialTaskFilters)
    setAppliedTaskFilters(initialTaskFilters)
    setTaskPage(1)
  }

  const selectedTask = tasksRows.find((task) => task.id === selectedTaskId) || null
  const selectedTaskDisplayStatus = selectedTask ? getTaskDisplayStatus(selectedTask) : null

  const logTaskAction = (task, action) => {
    const timestamp = getNowBrTimestamp()
    if (!task) return timestamp
    setTaskActionLogs((prev) =>
      [
        {
          id: `${Date.now()}-${Math.random()}`,
          taskId: task.id,
          taskName: task.subject,
          action,
          timestamp,
        },
        ...prev,
      ].slice(0, 20),
    )
    return timestamp
  }

  const registerTaskBaixa = (task, action) => {
    if (!task) return
    const timestamp = logTaskAction(task, action)
    setTasksRows((prev) =>
      prev.map((item) =>
        item.id === task.id
          ? {
              ...item,
              baixaAt: timestamp,
              baixaAction: action,
            }
          : item,
      ),
    )
  }

  const updateTaskField = (field, value) => {
    if (!selectedTaskId) return
    setTasksRows((prev) =>
      prev.map((item) => (item.id === selectedTaskId ? { ...item, [field]: value } : item)),
    )
  }

  const updateTaskTaggedDate = (key, value) => {
    if (!selectedTaskId) return
    setTasksRows((prev) =>
      prev.map((item) => {
        if (item.id !== selectedTaskId) return item
        const nextDates = [...(item.dates || [])]
        const entryIndex = nextDates.findIndex((entry) => entry.startsWith(`${key}:`))
        const nextEntry = `${key}: ${value}`
        if (entryIndex >= 0) {
          nextDates[entryIndex] = nextEntry
        } else {
          nextDates.push(nextEntry)
        }
        return { ...item, dates: nextDates }
      }),
    )
  }

  const openTaskDetail = (taskId) => {
    setSelectedTaskId(taskId)
    setTaskEditMode(false)
    setTaskActionError('')
    setScreen('task-detail')
  }

  const handleTaskAttachmentAdd = (event) => {
    if (!selectedTaskId) return
    const files = Array.from(event.target.files || [])
    if (!files.length) return

    setTasksRows((prev) =>
      prev.map((item) =>
        item.id === selectedTaskId
          ? {
              ...item,
              attachments: [
                ...(item.attachments || []),
                ...files.map((file, index) => ({
                  id: `${Date.now()}-${index}-${file.name}`,
                  name: file.name,
                  size: file.size,
                  type: file.type,
                  file,
                })),
              ],
            }
          : item,
      ),
    )
    setTaskActionError('')

    event.target.value = ''
  }

  const downloadAttachment = (attachment) => {
    if (!attachment?.file) return
    const url = URL.createObjectURL(attachment.file)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = attachment.name || 'arquivo'
    document.body.appendChild(anchor)
    anchor.click()
    document.body.removeChild(anchor)
    URL.revokeObjectURL(url)
  }

  const handleTaskDownload = () => {
    if (!selectedTask) return
    const hasAttachment = Boolean(selectedTask.attachments?.length)
    const hasJustification = Boolean((selectedTask.justification || '').trim())
    if (!hasAttachment && !hasJustification) {
      setTaskActionError('Para baixar a tarefa, anexe um arquivo ou preencha a justificativa.')
      return
    }
    if (hasAttachment) {
      const newestAttachment = selectedTask.attachments[selectedTask.attachments.length - 1]
      downloadAttachment(newestAttachment)
    }
    registerTaskBaixa(selectedTask, 'Baixar')
    setTasksRows((prev) =>
      prev.map((item) =>
        item.id === selectedTask.id
          ? {
              ...item,
              deliveryDate: getNowBrDate(),
              conclusionDate: getNowBrDate(),
              status: 'Finalizada',
              tag: 'lime',
            }
          : item,
      ),
    )
    setTaskActionError('')
  }

  const handleTaskDispense = () => {
    if (!selectedTask) return
    const hasAttachment = Boolean(selectedTask.attachments?.length)
    const hasJustification = Boolean((selectedTask.justification || '').trim())
    if (!hasAttachment && !hasJustification) {
      setTaskActionError('Para dispensar a tarefa, anexe um arquivo ou preencha a justificativa.')
      return
    }
    registerTaskBaixa(selectedTask, 'Dispensar')
    setTasksRows((prev) =>
      prev.map((item) =>
        item.id === selectedTask.id
          ? {
              ...item,
              status: 'Dispensada',
              tag: 'gray',
              deliveryDate: getNowBrDate(),
              conclusionDate: getNowBrDate(),
            }
          : item,
      ),
    )
    setTaskActionError('')
  }

  const handleTaskEdit = () => {
    if (!selectedTask) return
    if (!taskEditMode) {
      setTaskEditMode(true)
      return
    }
    registerTaskBaixa(selectedTask, 'Editar')
    setTaskEditMode(false)
  }

  const handleTaskDelete = () => {
    if (!selectedTask) return
    const shouldDelete = window.confirm(
      `Deseja excluir a tarefa #${selectedTask.id} (${selectedTask.subject})?`,
    )
    if (!shouldDelete) return
    logTaskAction(selectedTask, 'Excluir')
    setTasksRows((prev) => prev.filter((item) => item.id !== selectedTask.id))
    setSelectedTaskId(null)
    setTaskEditMode(false)
    setScreen('tasks')
  }

  const goBackToTasks = () => {
    setTaskEditMode(false)
    setTaskActionError('')
    setScreen('tasks')
  }

  const handleSettingsUserChange = (field, value) => {
    setUserForm((prev) => ({ ...prev, [field]: value }))
  }

  const clearSettingsUserForm = () => {
    setEditingUserId(null)
    setUserForm(emptyUserForm)
    setSettingsUserFeedback('')
  }

  const handleSettingsUserSave = (event) => {
    event.preventDefault()
    const nome = userForm.nome.trim()
    const departamento = userForm.departamento.trim()
    const telefone = userForm.telefone.trim()
    const email = userForm.email.trim().toLowerCase()
    const senha = userForm.senha

    if (!nome || !departamento || !email || !senha) {
      setSettingsUserFeedback('Preencha nome, departamento, e-mail e senha para salvar o usuário.')
      return
    }

    const duplicatedEmail = users.some(
      (user) => user.email.trim().toLowerCase() === email && user.id !== editingUserId,
    )

    if (duplicatedEmail) {
      setSettingsUserFeedback('Já existe um usuário com esse e-mail.')
      return
    }

    if (editingUserId !== null) {
      setUsers((prev) =>
        prev.map((user) =>
          user.id === editingUserId
            ? { id: editingUserId, nome, departamento, telefone, email, senha }
            : user,
        ),
      )
      setSettingsUserFeedback('Usuário atualizado com sucesso.')
    } else {
      const nextId = users.reduce((maxId, user) => Math.max(maxId, user.id), 0) + 1
      setUsers((prev) => [...prev, { id: nextId, nome, departamento, telefone, email, senha }])
      setSettingsUserFeedback('Usuário cadastrado com sucesso.')
    }

    setEditingUserId(null)
    setUserForm(emptyUserForm)
  }

  const editSettingsUser = (user) => {
    setEditingUserId(user.id)
    setUserForm({
      nome: user.nome || '',
      departamento: user.departamento || '',
      telefone: user.telefone || '',
      email: user.email || '',
      senha: user.senha || '',
    })
    setSettingsUserFeedback('')
  }

  const removeSettingsUser = (userId) => {
    const targetUser = users.find((user) => user.id === userId)
    if (!targetUser) return
    const canDelete = window.confirm(`Deseja excluir o usuário ${targetUser.email}?`)
    if (!canDelete) return
    setUsers((prev) => prev.filter((user) => user.id !== userId))
    if (editingUserId === userId) {
      setEditingUserId(null)
      setUserForm(emptyUserForm)
    }
    setSettingsUserFeedback('Usuário excluído com sucesso.')
  }

  const handleSettingsTaskChange = (field, value) => {
    setSettingsTaskForm((prev) => ({ ...prev, [field]: value }))
  }

  const toggleSettingsTaskClient = (clientId) => {
    setSettingsTaskForm((prev) => {
      const current = Array.isArray(prev.clientIds) ? prev.clientIds : []
      if (current.includes(clientId)) {
        return { ...prev, clientIds: current.filter((id) => id !== clientId) }
      }
      return { ...prev, clientIds: [...current, clientId] }
    })
  }

  const handleSettingsTaskAttachments = (event) => {
    const files = Array.from(event.target.files || [])
    if (!files.length) return
    setSettingsTaskForm((prev) => ({
      ...prev,
      attachments: [...prev.attachments, ...files],
    }))
    event.target.value = ''
  }

  const removeSettingsTaskAttachment = (fileName, fileSize) => {
    setSettingsTaskForm((prev) => ({
      ...prev,
      attachments: prev.attachments.filter(
        (file) => !(file.name === fileName && file.size === fileSize),
      ),
    }))
  }

  const clearSettingsTaskForm = () => {
    setSettingsTaskForm(getEmptySettingsTaskForm())
    setSettingsTaskFeedback('')
  }

  const handleSettingsTaskSave = (event) => {
    event.preventDefault()

    const obligation = settingsTaskForm.obligation.trim()
    const owner = settingsTaskForm.owner.trim()
    const selectedIds = Array.isArray(settingsTaskForm.clientIds) ? settingsTaskForm.clientIds : []
    const installments = Number(settingsTaskForm.installments) || 1

    if (!settingsTaskForm.actionDate || !settingsTaskForm.metaDate || !settingsTaskForm.dueDate) {
      setSettingsTaskFeedback('Preencha Ação, Meta e Vencimento.')
      return
    }

    if (!obligation) {
      setSettingsTaskFeedback('Informe a Obrigação para gerar as tarefas.')
      return
    }

    if (!owner) {
      setSettingsTaskFeedback('Informe o responsável da tarefa.')
      return
    }

    if (!settingsTaskForm.andamento.trim()) {
      setSettingsTaskFeedback('Informe o andamento da tarefa.')
      return
    }

    if (!selectedIds.length) {
      setSettingsTaskFeedback('Selecione pelo menos um cliente para gerar as tarefas.')
      return
    }

    const targetClients = clients.filter(
      (client) =>
        selectedIds.includes(client.id) &&
        (settingsTaskForm.includeDisabledClients || client.status !== 'Inativo'),
    )

    if (!targetClients.length) {
      setSettingsTaskFeedback('Nenhum cliente disponível para os filtros selecionados.')
      return
    }

    const complement = settingsTaskForm.complement.trim()
    const guests = settingsTaskForm.guests.trim() || 'Não definido'
    const subject = complement ? `${obligation} - ${complement}` : obligation

    let nextId = tasksRows.reduce((maxId, task) => Math.max(maxId, task.id), 0) + 1
    const generatedRows = []

    targetClients.forEach((client) => {
      for (let step = 0; step < installments; step += 1) {
        const actionIso = addMonthsToIsoDate(settingsTaskForm.actionDate, step)
        const metaIso = addMonthsToIsoDate(settingsTaskForm.metaDate, step)
        const dueIso = addMonthsToIsoDate(settingsTaskForm.dueDate, step)

        const actionBr = parseIsoDateToBr(actionIso)
        const metaBr = parseIsoDateToBr(metaIso)
        const dueBr = parseIsoDateToBr(dueIso)
        const competence = getCompetenceFromDate(actionIso, settingsTaskForm.competenceMode)
        const generatedStatus = getGeneratedTaskStatus(actionIso, metaIso, dueIso)
        const firstGroup =
          Array.isArray(client.grupos) && client.grupos.length ? client.grupos[0] : 'Fiscal'
        const dept = firstGroup.startsWith('Back Office') ? firstGroup : `Back Office - ${firstGroup}`
        const rowId = nextId
        nextId += 1

        generatedRows.push({
          id: rowId,
          status: generatedStatus.status,
          dept,
          subject,
          competence,
          client: client.nome,
          cnpj: client.inscricao || `${client.docType} não informado`,
          clientStatus: client.status === 'Ativo' ? 'Ativo' : 'Desativado',
          dates: [`A: ${actionBr}`, `M: ${metaBr}`, `V: ${dueBr}`],
          deliveryDate: '',
          conclusionDate: '',
          owner,
          authorizer: owner,
          guests,
          tag: generatedStatus.tag,
          attachments: settingsTaskForm.attachments.map((file, index) => ({
            id: `${rowId}-${index}-${file.name}`,
            name: file.name,
            size: file.size,
            type: file.type,
            file,
          })),
          baixaAt: '',
          baixaAction: '',
          justification: '',
          generatedBySettings: true,
          andamento: settingsTaskForm.andamento,
          competenceMode: settingsTaskForm.competenceMode,
        })
      }
    })

    setTasksRows((prev) => [...generatedRows, ...prev])
    setSettingsTaskFeedback(
      `${generatedRows.length} tarefa(s) gerada(s) para ${targetClients.length} cliente(s).`,
    )
    setSettingsTaskForm({
      ...getEmptySettingsTaskForm(),
      actionDate: settingsTaskForm.actionDate,
      metaDate: settingsTaskForm.metaDate,
      dueDate: settingsTaskForm.dueDate,
      owner: settingsTaskForm.owner,
    })
    setTaskFilters(initialTaskFilters)
    setAppliedTaskFilters(initialTaskFilters)
    setTaskPage(1)
    setTaskCreateOpen(false)
    setScreen('tasks')
  }

  const taskTypeOptions = ['Solicitação']
  const taskSubjectOptions = ['Todos', ...Array.from(new Set(tasksRows.map((item) => item.subject)))]
  const taskClientOptions = ['Todos', ...Array.from(new Set(tasksRows.map((item) => item.client)))]
  const taskDepartmentOptions = ['Todos', ...Array.from(new Set(tasksRows.map((item) => item.dept)))]
  const taskStatusOptions = [
    'Todos',
    ...Array.from(new Set(tasksRows.map((item) => getTaskDisplayStatus(item).status))),
  ]
  const taskClientStatusOptions = [
    'Todos',
    ...Array.from(new Set(tasksRows.map((item) => item.clientStatus))),
  ]
  const taskOwnerOptions = ['Todos', ...Array.from(new Set(tasksRows.map((item) => item.owner)))]
  const settingsTaskObligationOptions = Array.from(
    new Set(
      tasksRows
        .map((task) => task.subject.split(' - ')[0]?.trim())
        .filter((value) => value && value.length > 0),
    ),
  )
  const settingsTaskClients = clients.filter(
    (client) => settingsTaskForm.includeDisabledClients || client.status !== 'Inativo',
  )
  const settingsOwnerOptions = Array.from(
    new Set(users.map((user) => user.nome).concat(tasksRows.map((task) => task.owner))),
  ).filter(Boolean)
  const settingsCompetencePreview = getCompetenceFromDate(
    settingsTaskForm.actionDate,
    settingsTaskForm.competenceMode,
  )
  const currentMonthPrefix = (() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })()

  const getTaskDateBy = (row, dateBy) => {
    if (dateBy === 'Meta') return getTaggedReportDate(row.dates, 'M')
    if (dateBy === 'Vencimento') return getTaggedReportDate(row.dates, 'V')
    if (dateBy === 'Data da Entrega') return row.deliveryDate
    return getTaggedReportDate(row.dates, 'A')
  }

  const filteredReportRows = tasksRows.filter((row) => {
    const displayStatus = getTaskDisplayStatus(row)
    const matchesType =
      appliedTaskFilters.taskType === 'Todos' || appliedTaskFilters.taskType === 'Solicitação'
    const matchesSubject =
      appliedTaskFilters.subject === 'Todos' || row.subject === appliedTaskFilters.subject
    const matchesClient =
      appliedTaskFilters.client === 'Todos' || row.client === appliedTaskFilters.client
    const matchesDepartment =
      appliedTaskFilters.department === 'Todos' || row.dept === appliedTaskFilters.department
    const matchesStatus =
      appliedTaskFilters.status === 'Todos' || displayStatus.status === appliedTaskFilters.status
    const matchesClientStatus =
      appliedTaskFilters.clientStatus === 'Todos' ||
      row.clientStatus === appliedTaskFilters.clientStatus
    const matchesOwner = appliedTaskFilters.owner === 'Todos' || row.owner === appliedTaskFilters.owner

    const rowDateIso = parseBrDateToIso(getTaskDateBy(row, appliedTaskFilters.dateBy))
    const normalizedStartDate = appliedTaskFilters.startDate.includes('/')
      ? parseBrDateToIso(appliedTaskFilters.startDate)
      : appliedTaskFilters.startDate
    const normalizedEndDate = appliedTaskFilters.endDate.includes('/')
      ? parseBrDateToIso(appliedTaskFilters.endDate)
      : appliedTaskFilters.endDate
    const matchesStartDate =
      !normalizedStartDate || (rowDateIso && rowDateIso >= normalizedStartDate)
    const matchesEndDate =
      !normalizedEndDate || (rowDateIso && rowDateIso <= normalizedEndDate)

    const query = appliedTaskFilters.query.trim().toLowerCase()
    const searchableText = [
      row.subject,
      row.client,
      row.cnpj,
      row.owner,
      row.authorizer,
      row.guests,
      displayStatus.status,
      row.dept,
      row.clientStatus,
      row.deliveryDate,
    ]
      .join(' ')
      .toLowerCase()
    const matchesQuery = !query || searchableText.includes(query)

    return (
      matchesType &&
      matchesSubject &&
      matchesClient &&
      matchesDepartment &&
      matchesStatus &&
      matchesClientStatus &&
      matchesOwner &&
      matchesStartDate &&
      matchesEndDate &&
      matchesQuery
    )
  })

  const hasTaskPeriodFilter = Boolean(appliedTaskFilters.startDate || appliedTaskFilters.endDate)
  const rowsVisibleInTaskPanel =
    screen === 'tasks' && !hasTaskPeriodFilter
      ? filteredReportRows.filter(
          (row) =>
            !row.generatedBySettings ||
            parseBrDateToIso(getTaggedReportDate(row.dates, 'A')).startsWith(currentMonthPrefix),
        )
      : filteredReportRows

  const taskExportRows = rowsVisibleInTaskPanel.map((row) => {
    const displayStatus = getTaskDisplayStatus(row)
    return {
      No: row.id,
      Status: displayStatus.status,
      Departamento: row.dept,
      Nome: row.subject,
      Competência: formatCompetenceValue(row.competence) || '',
      Cliente: `${row.client} ${row.cnpj}`,
      'Status do Cliente': row.clientStatus,
      Ação: getTaggedReportDate(row.dates, 'A'),
      Meta: getTaggedReportDate(row.dates, 'M'),
      Vencimento: getTaggedReportDate(row.dates, 'V'),
      Conclusão: getTaskDisplayConclusion(row),
      Responsável: row.owner,
    }
  })

  const handleTaskExportCsv = () => {
    if (!taskExportRows.length) return
    const dateRange = `${formatDateForFile(appliedTaskFilters.startDate)}-${formatDateForFile(appliedTaskFilters.endDate)}`
    const fileName = `hive-tarefas-${dateRange}.csv`
    downloadFileFromBlob(getCsvContent(taskExportRows), fileName, 'text/csv;charset=utf-8;')
  }

  const handleTaskExportXlsx = () => {
    if (!taskExportRows.length) return
    const dateRange = `${formatDateForFile(appliedTaskFilters.startDate)}-${formatDateForFile(appliedTaskFilters.endDate)}`
    const fileName = `hive-tarefas-${dateRange}.xlsx`

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(taskExportRows), 'Tarefas')
    XLSX.writeFile(workbook, fileName)
  }

  const handleTaskExportPdf = () => {
    if (!taskExportRows.length) return
    const dateRange = `${formatDateForFile(appliedTaskFilters.startDate)}-${formatDateForFile(appliedTaskFilters.endDate)}`
    const fileName = `hive-tarefas-${dateRange}.pdf`
    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' })

    doc.setFontSize(14)
    doc.text('Hive Tarefas - Relatorio de Tarefas', 40, 34)
    doc.setFontSize(9)
    doc.text(
      `Filtros: Tipo ${appliedTaskFilters.taskType} | Departamento ${appliedTaskFilters.department} | Status ${appliedTaskFilters.status}`,
      40,
      52,
    )
    doc.text(
      `Periodo: ${appliedTaskFilters.startDate || 'Todos'} ate ${appliedTaskFilters.endDate || 'Todos'} | Registros: ${taskExportRows.length}`,
      40,
      66,
    )

    autoTable(doc, {
      startY: 78,
      head: [
        [
          'Nº',
          'Status',
          'Departamento',
          'Nome',
          'Competência',
          'Cliente',
          'Status Cliente',
          'Ação',
          'Meta',
          'Vencimento',
          'Conclusão',
          'Responsável',
        ],
      ],
      body: taskExportRows.map((row) => [
        row.No,
        row.Status,
        row.Departamento,
        row.Nome,
        row.Competência,
        row.Cliente,
        row['Status do Cliente'],
        row.Ação,
        row.Meta,
        row.Vencimento,
        row.Conclusão,
        row.Responsável,
      ]),
      styles: { fontSize: 8, cellPadding: 4, overflow: 'linebreak' },
      headStyles: { fillColor: [22, 33, 45] },
      margin: { left: 24, right: 24, top: 24, bottom: 24 },
    })

    doc.save(fileName)
  }

  const taskTotalRows = rowsVisibleInTaskPanel.length
  const taskTotalPages = Math.max(1, Math.ceil(taskTotalRows / taskItemsPerPage))
  const safeTaskPage = Math.min(taskPage, taskTotalPages)
  const taskStartIndex = (safeTaskPage - 1) * taskItemsPerPage
  const paginatedReportRows = rowsVisibleInTaskPanel.slice(
    taskStartIndex,
    taskStartIndex + taskItemsPerPage,
  )
  const taskRangeStart = taskTotalRows ? taskStartIndex + 1 : 0
  const taskRangeEnd = taskTotalRows ? Math.min(taskStartIndex + taskItemsPerPage, taskTotalRows) : 0

  const handleOperationalFilterChange = (field, value) => {
    setOperationalFilters((prev) => ({ ...prev, [field]: value }))
  }

  const applyOperationalFilters = () => {
    setAppliedOperationalFilters(operationalFilters)
  }

  const operationalDepartments = [
    'Todos',
    ...Array.from(new Set(operationalRecords.map((item) => item.department))),
  ]
  const operationalObligations = [
    'Todos',
    ...Array.from(new Set(operationalRecords.map((item) => item.obligation))),
  ]
  const operationalGroups = ['Todos', ...Array.from(new Set(operationalRecords.map((item) => item.groupClient)))]
  const operationalUsers = ['Todos', ...Array.from(new Set(operationalRecords.map((item) => item.user)))]
  const operationalTeams = ['Todos', ...Array.from(new Set(operationalRecords.map((item) => item.team)))]

  const getOperationalDateBy = (record, dateBy) => {
    if (dateBy === 'Meta') return record.metaDate
    if (dateBy === 'Conclusão') return record.conclusionDate
    return record.actionDate
  }

  const filteredOperationalRecords = operationalRecords.filter((record) => {
    const matchesDepartment =
      appliedOperationalFilters.department === 'Todos' ||
      record.department === appliedOperationalFilters.department
    const matchesObligation =
      appliedOperationalFilters.obligation === 'Todos' ||
      record.obligation === appliedOperationalFilters.obligation
    const matchesGroup =
      appliedOperationalFilters.groupClient === 'Todos' ||
      record.groupClient === appliedOperationalFilters.groupClient
    const matchesUser =
      appliedOperationalFilters.user === 'Todos' || record.user === appliedOperationalFilters.user
    const matchesTeam =
      appliedOperationalFilters.team === 'Todos' || record.team === appliedOperationalFilters.team
    const matchesClient = record.client
      .toLowerCase()
      .includes(appliedOperationalFilters.clientQuery.trim().toLowerCase())
    const selectedDate = getOperationalDateBy(record, appliedOperationalFilters.dateBy)
    const matchesInitial =
      !appliedOperationalFilters.startDate || selectedDate >= appliedOperationalFilters.startDate
    const matchesFinal = !appliedOperationalFilters.endDate || selectedDate <= appliedOperationalFilters.endDate

    return (
      matchesDepartment &&
      matchesObligation &&
      matchesGroup &&
      matchesUser &&
      matchesTeam &&
      matchesClient &&
      matchesInitial &&
      matchesFinal
    )
  })

  const operationalActionCounts = sumCategoryCounts(
    filteredOperationalRecords,
    'action',
    operationalActionKeys,
  )
  const operationalOverdueCounts = sumCategoryCounts(
    filteredOperationalRecords,
    'overdue',
    operationalOverdueKeys,
  )
  const operationalCompletedCounts = sumCategoryCounts(
    filteredOperationalRecords,
    'completed',
    operationalCompletedKeys,
  )
  const operationalPendingCounts = sumCategoryCounts(
    filteredOperationalRecords,
    'pending',
    operationalPendingKeys,
  )
  const operationalActionTotal = getCountsTotal(operationalActionCounts)
  const operationalOverdueTotal = getCountsTotal(operationalOverdueCounts)
  const operationalCompletedTotal = getCountsTotal(operationalCompletedCounts)
  const operationalPendingTotal = getCountsTotal(operationalPendingCounts)
  const getShare = (value, total) => (total ? Math.round((value / total) * 100) : 0)
  const operationalExportRows = filteredOperationalRecords.map((record) => ({
    Departamento: record.department,
    Obrigação: record.obligation,
    Cliente: record.client,
    'Grupo Cliente': record.groupClient,
    Usuário: record.user,
    Time: record.team,
    'Data Ação': record.actionDate,
    'Data Meta': record.metaDate,
    'Data Conclusão': record.conclusionDate,
    'Ação - A Realizar': record.action['A Realizar'] || 0,
    'Ação - 3 Dias': record.action['3 Dias'] || 0,
    'Ação - Hoje': record.action.Hoje || 0,
    'Ação - Último Dia': record.action['Último Dia'] || 0,
    'Atrasados - Após Ação': record.overdue['Após Ação'] || 0,
    'Atrasados - Após Meta': record.overdue['Após Meta'] || 0,
    'Atrasados - Após Vencimento': record.overdue['Após Vencimento'] || 0,
    'Concluídos - Concluído': record.completed.Concluído || 0,
    'Concluídos - Fora Meta': record.completed['Fora Meta'] || 0,
    'Concluídos - Fora Prazo': record.completed['Fora Prazo'] || 0,
    'Concluídos - Dispensado': record.completed.Dispensado || 0,
    'Pendentes - Aguardando': record.pending.Aguardando || 0,
    'Pendentes - Retificando': record.pending.Retificando || 0,
  }))

  const getOperationalSummaryRows = (panel, keys, counts, total) =>
    keys.map((key) => ({
      Painel: panel,
      Indicador: key,
      Percentual: `${getShare(counts[key] || 0, total)}%`,
      Quantidade: counts[key] || 0,
    }))

  const handleOperationalExportCsv = () => {
    if (!operationalExportRows.length) return
    const dateRange = `${formatDateForFile(appliedOperationalFilters.startDate)}-${formatDateForFile(appliedOperationalFilters.endDate)}`
    const fileName = `hive-operacional-${dateRange}.csv`
    downloadFileFromBlob(getCsvContent(operationalExportRows), fileName, 'text/csv;charset=utf-8;')
  }

  const handleOperationalExportXlsx = () => {
    if (!operationalExportRows.length) return
    const dateRange = `${formatDateForFile(appliedOperationalFilters.startDate)}-${formatDateForFile(appliedOperationalFilters.endDate)}`
    const fileName = `hive-operacional-${dateRange}.xlsx`

    const filtersSheetRows = [
      {
        Departamento: appliedOperationalFilters.department,
        Obrigação: appliedOperationalFilters.obligation,
        Cliente: appliedOperationalFilters.clientQuery || 'Todos',
        'Grupo Cliente': appliedOperationalFilters.groupClient,
        Usuário: appliedOperationalFilters.user,
        Time: appliedOperationalFilters.team,
        'Filtrar Data Por': appliedOperationalFilters.dateBy,
        'Período Inicial': appliedOperationalFilters.startDate,
        'Período Final': appliedOperationalFilters.endDate,
        Registros: operationalExportRows.length,
      },
    ]

    const summaryRows = [
      ...getOperationalSummaryRows(
        'Ação',
        operationalActionKeys,
        operationalActionCounts,
        operationalActionTotal,
      ),
      ...getOperationalSummaryRows(
        'Atrasados',
        operationalOverdueKeys,
        operationalOverdueCounts,
        operationalOverdueTotal,
      ),
      ...getOperationalSummaryRows(
        'Concluídos',
        operationalCompletedKeys,
        operationalCompletedCounts,
        operationalCompletedTotal,
      ),
      ...getOperationalSummaryRows(
        'Pendentes',
        operationalPendingKeys,
        operationalPendingCounts,
        operationalPendingTotal,
      ),
    ]

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(filtersSheetRows), 'Filtros')
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(summaryRows), 'Resumo')
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(operationalExportRows), 'Registros')
    XLSX.writeFile(workbook, fileName)
  }

  const selectedGroups = Array.isArray(clientForm.grupos) ? clientForm.grupos : []
  const selectedTax = clientForm.tributacao || ''
  const isReadOnly = clientMode === 'view'
  const bulkSelectedGroups = Array.isArray(bulkForm.grupos) ? bulkForm.grupos : []
  const bulkSelectedTax = bulkForm.tributacao || ''
  const currentMonthLabel = getCompetenceFromDate(getTodayIsoLocal(), 'Mesmo mês')
  const todayIso = getTodayIsoLocal()
  const getEmptyProgressBucket = () => ({ notStarted: 0, doing: 0, pending: 0, review: 0 })
  const overviewMetrics = tasksRows.reduce(
    (acc, row) => {
      const displayStatus = getTaskDisplayStatus(row)
      const actionIso = parseBrDateToIso(getTaggedReportDate(row.dates, 'A'))
      const metaIso = parseBrDateToIso(getTaggedReportDate(row.dates, 'M'))
      const dueIso = parseBrDateToIso(getTaggedReportDate(row.dates, 'V'))
      const deliveryIso = parseBrDateToIso(row.deliveryDate)
      const hasDeliveryDate = Boolean(String(row.deliveryDate || '').trim())
      const isCompleted = isCompletedTaskStatus(displayStatus.status)
      const progressColumn = getTaskProgressColumnKey({
        todayIso,
        actionIso,
        metaIso,
        dueIso,
        isCompleted,
        hasDeliveryDate,
      })

      if (!isCompleted) {
        acc.pending += 1
        acc.progress.open[progressColumn] += 1
      }

      if (!isCompleted && dueIso && dueIso === todayIso) {
        acc.dueToday += 1
        acc.progress.dueToday[progressColumn] += 1
      }

      if (!isCompleted && metaIso && dueIso && todayIso >= metaIso && todayIso <= dueIso) {
        acc.subjectToFine += 1
        acc.progress.attention[progressColumn] += 1
      }

      if (deliveryIso && dueIso && deliveryIso > dueIso) {
        acc.generatedFine += 1
      }

      return acc
    },
    {
      dueToday: 0,
      subjectToFine: 0,
      generatedFine: 0,
      pending: 0,
      progress: {
        open: getEmptyProgressBucket(),
        dueToday: getEmptyProgressBucket(),
        attention: getEmptyProgressBucket(),
      },
    },
  )
  const completedTasks = Math.max(0, tasksRows.length - overviewMetrics.pending)
  const completionPercent = tasksRows.length
    ? Math.round((completedTasks / tasksRows.length) * 100)
    : 0
  const dashboardStats = stats.map((stat) => {
    const dynamicValueByLabel = {
      'Vencem Hoje': overviewMetrics.dueToday,
      'Sujeitas à Multa': overviewMetrics.subjectToFine,
      'Multas Geradas': overviewMetrics.generatedFine,
      Pendentes: overviewMetrics.pending,
    }
    return {
      ...stat,
      value: String(dynamicValueByLabel[stat.label] ?? stat.value),
    }
  })
  const progressRowsData = [
    {
      label: 'Abertas',
      tone: 'amber',
      values: [
        overviewMetrics.progress.open.notStarted,
        overviewMetrics.progress.open.doing,
        overviewMetrics.progress.open.pending,
        overviewMetrics.progress.open.review,
      ],
    },
    {
      label: 'Vencem Hoje',
      tone: 'rose',
      values: [
        overviewMetrics.progress.dueToday.notStarted,
        overviewMetrics.progress.dueToday.doing,
        overviewMetrics.progress.dueToday.pending,
        overviewMetrics.progress.dueToday.review,
      ],
    },
    {
      label: 'Atenção',
      tone: 'violet',
      values: [
        overviewMetrics.progress.attention.notStarted,
        overviewMetrics.progress.attention.doing,
        overviewMetrics.progress.attention.pending,
        overviewMetrics.progress.attention.review,
      ],
    },
  ]
  const selectedTaskLogs = selectedTask
    ? taskActionLogs.filter((log) => log.taskId === selectedTask.id)
    : []

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
                  Usuário / E-mail
                  <div className="input-wrap">
                    <input
                      type="text"
                      placeholder="seu.email@empresa.com"
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
                    (screen === 'operational' && item === 'Visão Geral') ||
                    ((screen === 'tasks' || screen === 'task-detail') && item === 'Tarefas') ||
                    (screen === 'reports' && item === 'Relatórios') ||
                    (screen === 'clients' && item === 'Clientes') ||
                    (screen === 'settings' && item === 'Configurações')
                      ? 'active'
                      : ''
                  }`}
                  type="button"
                  onClick={() => {
                    if (item === 'Visão Geral') {
                      setScreen('dashboard')
                    } else if (item === 'Tarefas') {
                      setScreen('tasks')
                    } else if (item === 'Relatórios') {
                      setScreen('reports')
                    } else if (item === 'Clientes') {
                      setScreen('clients')
                    } else if (item === 'Configurações') {
                      setSettingsTab('users')
                      setScreen('settings')
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
                  {dashboardStats.map((stat, index) => (
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
                      {progressRowsData.map((row) => (
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
                      <span>{currentMonthLabel || '-'}</span>
                    </header>
                    <div className="performance-body">
                      <div className="metric">
                        <strong>{completedTasks}</strong>
                        <span>Tarefas Realizadas</span>
                      </div>
                      <div className="donut">
                        <div className="donut-value">{completionPercent}%</div>
                        <span>Tarefas Concluídas</span>
                      </div>
                      <div className="metric">
                        <strong>{overviewMetrics.pending}</strong>
                        <span>Tarefas Restantes</span>
                      </div>
                    </div>
                    <button className="link" type="button">
                      Ver gráfico detalhado ?
                    </button>
                  </article>

                </section>

                <section className="card control-panel" style={{ '--delay': '0.26s' }}>
                  <header className="panel-header">
                    <div>
                      <h4>Painel de Controle</h4>
                      <span>Alertas e andamento por setor</span>
                    </div>
                    <div className="panel-actions">
                      <button
                        type="button"
                        className="chip tiny"
                        onClick={() => setScreen('operational')}
                      >
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
            ) : screen === 'operational' ? (
              <div className="operational-view">
                <section className="card operational-wrap">
                  <header className="operational-title">
                    <h4>Gráficos &gt; Operacional</h4>
                    <div className="operational-actions">
                      <button
                        type="button"
                        className="chip small"
                        onClick={handleOperationalExportCsv}
                        disabled={!operationalExportRows.length}
                      >
                        Exportar CSV
                      </button>
                      <button
                        type="button"
                        className="chip small primary"
                        onClick={handleOperationalExportXlsx}
                        disabled={!operationalExportRows.length}
                      >
                        Exportar XLSX
                      </button>
                    </div>
                  </header>

                  <div className="operational-filters">
                    <label className="operational-field">
                      <span>Por Departamento:</span>
                      <select
                        value={operationalFilters.department}
                        onChange={(event) =>
                          handleOperationalFilterChange('department', event.target.value)
                        }
                      >
                        {operationalDepartments.map((item) => (
                          <option key={item} value={item}>
                            {item}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="operational-field">
                      <span>Por Obrigações:</span>
                      <select
                        value={operationalFilters.obligation}
                        onChange={(event) =>
                          handleOperationalFilterChange('obligation', event.target.value)
                        }
                      >
                        {operationalObligations.map((item) => (
                          <option key={item} value={item}>
                            {item}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <div className="operational-filters">
                    <label className="operational-field">
                      <span>Por Cliente:</span>
                      <div className="operational-input-search">
                        <input
                          type="text"
                          placeholder="Digite e aperte enter para pesquisar..."
                          value={operationalFilters.clientQuery}
                          onChange={(event) =>
                            handleOperationalFilterChange('clientQuery', event.target.value)
                          }
                          onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                              event.preventDefault()
                              applyOperationalFilters()
                            }
                          }}
                        />
                        <button type="button" onClick={applyOperationalFilters} aria-label="Pesquisar">
                          Buscar
                        </button>
                      </div>
                    </label>
                    <label className="operational-field">
                      <span>Por Grupo Cliente:</span>
                      <select
                        value={operationalFilters.groupClient}
                        onChange={(event) =>
                          handleOperationalFilterChange('groupClient', event.target.value)
                        }
                      >
                        {operationalGroups.map((item) => (
                          <option key={item} value={item}>
                            {item}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <div className="operational-filters">
                    <label className="operational-field">
                      <span>Por Usuário:</span>
                      <select
                        value={operationalFilters.user}
                        onChange={(event) => handleOperationalFilterChange('user', event.target.value)}
                      >
                        {operationalUsers.map((item) => (
                          <option key={item} value={item}>
                            {item}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="operational-field">
                      <span>Por Time:</span>
                      <select
                        value={operationalFilters.team}
                        onChange={(event) => handleOperationalFilterChange('team', event.target.value)}
                      >
                        {operationalTeams.map((item) => (
                          <option key={item} value={item}>
                            {item}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <div className="operational-filters operational-date-row">
                    <label className="operational-field">
                      <span>Por Data:</span>
                      <select
                        value={operationalFilters.dateBy}
                        onChange={(event) => handleOperationalFilterChange('dateBy', event.target.value)}
                      >
                        {dateFilterOptions.map((item) => (
                          <option key={item} value={item}>
                            {item}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="operational-field">
                      <span>Por Período Inicial:</span>
                      <input
                        type="date"
                        value={operationalFilters.startDate}
                        onChange={(event) =>
                          handleOperationalFilterChange('startDate', event.target.value)
                        }
                      />
                    </label>
                    <label className="operational-field">
                      <span>Por Período Final:</span>
                      <input
                        type="date"
                        value={operationalFilters.endDate}
                        onChange={(event) => handleOperationalFilterChange('endDate', event.target.value)}
                      />
                    </label>
                    <button type="button" className="chip primary small operational-search-btn" onClick={applyOperationalFilters}>
                      Buscar
                    </button>
                  </div>

                  <div className="operational-results">
                    <article className="operational-panel">
                      <header>
                        <h5>Ação</h5>
                        <span>{getHighlightPercent(operationalActionCounts)}%</span>
                      </header>
                      <div className="operational-legend">
                        {operationalActionKeys.map((key, index) => (
                          <span key={key}>
                            <i className={`legend-dot legend-${index + 1}`} />
                            {key}
                          </span>
                        ))}
                      </div>
                      <div className="operational-table">
                        <div className="operational-row operational-head">
                          <span>#</span>
                          <span>Ação</span>
                          <span>%</span>
                          <span>Qtd</span>
                        </div>
                        {operationalActionKeys.map((key, index) => (
                          <div className="operational-row" key={key}>
                            <span>{index + 1}</span>
                            <span>{key}</span>
                            <span>{getShare(operationalActionCounts[key], operationalActionTotal)}%</span>
                            <span>{operationalActionCounts[key]}</span>
                          </div>
                        ))}
                        <div className="operational-row operational-total">
                          <span>#</span>
                          <span>Total</span>
                          <span>100%</span>
                          <span>{operationalActionTotal}</span>
                        </div>
                      </div>
                    </article>

                    <article className="operational-panel">
                      <header>
                        <h5>Atrasados</h5>
                        <span>{getHighlightPercent(operationalOverdueCounts)}%</span>
                      </header>
                      <div
                        className="operational-pie"
                        style={{ '--fill': `${getHighlightPercent(operationalOverdueCounts)}%` }}
                      />
                      <div className="operational-legend">
                        {operationalOverdueKeys.map((key, index) => (
                          <span key={key}>
                            <i className={`legend-dot legend-${index + 5}`} />
                            {key}
                          </span>
                        ))}
                      </div>
                      <div className="operational-table">
                        <div className="operational-row operational-head">
                          <span>#</span>
                          <span>Atrasados</span>
                          <span>%</span>
                          <span>Qtd</span>
                        </div>
                        {operationalOverdueKeys.map((key, index) => (
                          <div className="operational-row" key={key}>
                            <span>{index + 1}</span>
                            <span>{key}</span>
                            <span>{getShare(operationalOverdueCounts[key], operationalOverdueTotal)}%</span>
                            <span>{operationalOverdueCounts[key]}</span>
                          </div>
                        ))}
                        <div className="operational-row operational-total">
                          <span>#</span>
                          <span>Total</span>
                          <span>100%</span>
                          <span>{operationalOverdueTotal}</span>
                        </div>
                      </div>
                    </article>

                    <article className="operational-panel">
                      <header>
                        <h5>Concluídos</h5>
                        <span>{getHighlightPercent(operationalCompletedCounts)}%</span>
                      </header>
                      <div className="operational-legend">
                        {operationalCompletedKeys.map((key, index) => (
                          <span key={key}>
                            <i className={`legend-dot legend-${index + 8}`} />
                            {key}
                          </span>
                        ))}
                      </div>
                      <div className="operational-table">
                        <div className="operational-row operational-head">
                          <span>#</span>
                          <span>Concluídos</span>
                          <span>%</span>
                          <span>Qtd</span>
                        </div>
                        {operationalCompletedKeys.map((key, index) => (
                          <div className="operational-row" key={key}>
                            <span>{index + 1}</span>
                            <span>{key}</span>
                            <span>{getShare(operationalCompletedCounts[key], operationalCompletedTotal)}%</span>
                            <span>{operationalCompletedCounts[key]}</span>
                          </div>
                        ))}
                        <div className="operational-row operational-total">
                          <span>#</span>
                          <span>Total</span>
                          <span>100%</span>
                          <span>{operationalCompletedTotal}</span>
                        </div>
                      </div>
                    </article>

                    <article className="operational-panel">
                      <header>
                        <h5>Pendentes</h5>
                        <span>{getHighlightPercent(operationalPendingCounts)}%</span>
                      </header>
                      <div className="operational-legend">
                        {operationalPendingKeys.map((key, index) => (
                          <span key={key}>
                            <i className={`legend-dot legend-${index + 12}`} />
                            {key}
                          </span>
                        ))}
                      </div>
                      <div className="operational-table">
                        <div className="operational-row operational-head">
                          <span>#</span>
                          <span>Pendentes</span>
                          <span>%</span>
                          <span>Qtd</span>
                        </div>
                        {operationalPendingKeys.map((key, index) => (
                          <div className="operational-row" key={key}>
                            <span>{index + 1}</span>
                            <span>{key}</span>
                            <span>{getShare(operationalPendingCounts[key], operationalPendingTotal)}%</span>
                            <span>{operationalPendingCounts[key]}</span>
                          </div>
                        ))}
                        <div className="operational-row operational-total">
                          <span>#</span>
                          <span>Total</span>
                          <span>100%</span>
                          <span>{operationalPendingTotal}</span>
                        </div>
                      </div>
                    </article>
                  </div>
                </section>
              </div>
            ) : screen === 'reports' || screen === 'tasks' ? (
              <div className="reports-view">
                <header className="reports-header">
                  <div>
                    <h4>{screen === 'tasks' ? 'Relatórios > Tarefas' : 'Relatórios'}</h4>
                    <p>
                      {screen === 'tasks'
                        ? 'Tarefas cadastradas • visão detalhada por cliente e status'
                        : 'Tarefas • Visão detalhada por cliente e status'}
                    </p>
                  </div>
                  <div className="reports-actions">
                    <button
                      type="button"
                      className="chip tiny"
                      onClick={handleTaskExportCsv}
                      disabled={!taskExportRows.length}
                    >
                      CSV
                    </button>
                    <button
                      type="button"
                      className="chip tiny"
                      onClick={handleTaskExportXlsx}
                      disabled={!taskExportRows.length}
                    >
                      XLSX
                    </button>
                    <button
                      type="button"
                      className="chip tiny"
                      onClick={handleTaskExportPdf}
                      disabled={!taskExportRows.length}
                    >
                      PDF
                    </button>
                    <button type="button" className="chip tiny" onClick={applyTaskFilters}>
                      Atualizar
                    </button>
                  </div>
                </header>

                <div className="filters task-filters-grid">
                  <label className="task-filter-field">
                    <span>Tipos de tarefas</span>
                    <select
                      value={taskFilters.taskType}
                      onChange={(event) => handleTaskFilterChange('taskType', event.target.value)}
                    >
                      {taskTypeOptions.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="task-filter-field">
                    <span>Assunto</span>
                    <select
                      value={taskFilters.subject}
                      onChange={(event) => handleTaskFilterChange('subject', event.target.value)}
                    >
                      {taskSubjectOptions.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="task-filter-field">
                    <span>Clientes</span>
                    <select
                      value={taskFilters.client}
                      onChange={(event) => handleTaskFilterChange('client', event.target.value)}
                    >
                      {taskClientOptions.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="task-filter-field">
                    <span>Departamento</span>
                    <select
                      value={taskFilters.department}
                      onChange={(event) => handleTaskFilterChange('department', event.target.value)}
                    >
                      {taskDepartmentOptions.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="task-filter-field">
                    <span>Status</span>
                    <select
                      value={taskFilters.status}
                      onChange={(event) => handleTaskFilterChange('status', event.target.value)}
                    >
                      {taskStatusOptions.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="task-filter-field">
                    <span>Status do Cliente</span>
                    <select
                      value={taskFilters.clientStatus}
                      onChange={(event) => handleTaskFilterChange('clientStatus', event.target.value)}
                    >
                      {taskClientStatusOptions.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="task-filter-field">
                    <span>Responsável</span>
                    <select
                      value={taskFilters.owner}
                      onChange={(event) => handleTaskFilterChange('owner', event.target.value)}
                    >
                      {taskOwnerOptions.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="task-filter-field">
                    <span>Por Data</span>
                    <select
                      value={taskFilters.dateBy}
                      onChange={(event) => handleTaskFilterChange('dateBy', event.target.value)}
                    >
                      {taskDateFilterOptions.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="task-filter-field">
                    <span>Período Inicial</span>
                    <input
                      type="date"
                      value={taskFilters.startDate}
                      onChange={(event) => handleTaskFilterChange('startDate', event.target.value)}
                    />
                  </label>
                  <label className="task-filter-field">
                    <span>Período Final</span>
                    <input
                      type="date"
                      value={taskFilters.endDate}
                      onChange={(event) => handleTaskFilterChange('endDate', event.target.value)}
                    />
                  </label>
                  <button type="button" className="chip primary small" onClick={applyTaskFilters}>
                    Aplicar
                  </button>
                  <button type="button" className="chip small" onClick={clearTaskFilters}>
                    Limpar
                  </button>
                </div>

                <div className="report-search">
                  <input
                    type="text"
                    placeholder="O que você está procurando?"
                    value={taskFilters.query}
                    onChange={(event) => handleTaskFilterChange('query', event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault()
                        applyTaskFilters()
                      }
                    }}
                  />
                  <div className="report-icons">
                    <button type="button" className="icon-btn" aria-label="Pesquisar" onClick={applyTaskFilters}>
                      Buscar
                    </button>
                    <button type="button" className="icon-btn" aria-label="Limpar filtros" onClick={clearTaskFilters}>
                      Limpar
                    </button>
                  </div>
                </div>

                <div className="report-table">
                  <div className="report-head">
                    <span>No</span>
                    <span>Status</span>
                    <span>Departamento</span>
                    <span>Nome</span>
                    <span>Competência</span>
                    <span>Cliente</span>
                    <span>Status do Cliente</span>
                    <span>Ação</span>
                    <span>Meta</span>
                    <span>Vencimento</span>
                    <span>Conclusão</span>
                    <span>Responsável</span>
                  </div>
                  <div className="report-body">
                    {paginatedReportRows.length ? (
                      paginatedReportRows.map((row, index) => {
                        const displayStatus = getTaskDisplayStatus(row)
                        return (
                          <div
                            className="report-row clickable"
                            key={row.id}
                            style={{ '--delay': `${index * 0.05}s` }}
                            role="button"
                            tabIndex={0}
                            onClick={() => openTaskDetail(row.id)}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault()
                                openTaskDetail(row.id)
                              }
                            }}
                          >
                            <span>{row.id}</span>
                            <span className={`status-pill ${displayStatus.tag}`} title={displayStatus.status}>
                              {displayStatus.status}
                            </span>
                            <span title={row.dept}>{row.dept}</span>
                            <span title={row.subject}>{row.subject}</span>
                            <span title={formatCompetenceValue(row.competence) || '-'}>
                              {formatCompetenceValue(row.competence) || '-'}
                            </span>
                            <span className="client-cell" title={`${row.client} ${row.cnpj}`}>
                              {`${row.client} ${row.cnpj}`}
                            </span>
                            <span className="client-status">{row.clientStatus}</span>
                            <span>{getTaggedReportDate(row.dates, 'A')}</span>
                            <span>{getTaggedReportDate(row.dates, 'M')}</span>
                            <span>{getTaggedReportDate(row.dates, 'V')}</span>
                            <span>{getTaskDisplayConclusion(row)}</span>
                            <span title={row.owner}>{row.owner}</span>
                          </div>
                        )
                      })
                    ) : (
                      <div className="report-row report-empty">
                        <span>#</span>
                        <span>Sem resultados</span>
                        <span>-</span>
                        <span>-</span>
                        <span>-</span>
                        <span>-</span>
                        <span>-</span>
                        <span>-</span>
                        <span>-</span>
                        <span>-</span>
                        <span>-</span>
                        <span>-</span>
                      </div>
                    )}
                  </div>
                </div>

                <footer className="report-footer">
                  <span>Itens por página</span>
                  <select
                    className="select"
                    value={taskItemsPerPage}
                    onChange={(event) => {
                      setTaskItemsPerPage(Number(event.target.value))
                      setTaskPage(1)
                    }}
                  >
                    {[10, 25, 50].map((size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                  <span>
                    {taskTotalRows ? `${taskRangeStart} - ${taskRangeEnd} de ${taskTotalRows}` : '0 - 0 de 0'}
                  </span>
                  <div className="pager">
                    <button
                      type="button"
                      onClick={() => setTaskPage(Math.max(1, safeTaskPage - 1))}
                      disabled={safeTaskPage <= 1}
                    >
                      {'<'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setTaskPage(Math.min(taskTotalPages, safeTaskPage + 1))}
                      disabled={safeTaskPage >= taskTotalPages || !taskTotalRows}
                    >
                      {'>'}
                    </button>
                  </div>
                </footer>
              </div>
            ) : screen === 'task-detail' ? (
              <div className="task-detail-view">
                <header className="task-detail-header card">
                  <div className="task-detail-title">
                    <button type="button" className="chip small" onClick={goBackToTasks}>
                      Voltar para tarefas
                    </button>
                    <h4>{selectedTask ? selectedTask.subject : 'Tarefa não encontrada'}</h4>
                    <p>
                      {selectedTask
                        ? `#${selectedTask.id} • ${selectedTask.dept} • ${selectedTask.competence || '-'}`
                        : 'Selecione uma tarefa na listagem para visualizar os detalhes.'}
                    </p>
                  </div>
                  {selectedTask && selectedTaskDisplayStatus ? (
                    <span
                      className={`status-pill ${selectedTaskDisplayStatus.tag}`}
                      title={selectedTaskDisplayStatus.status}
                    >
                      {selectedTaskDisplayStatus.status}
                    </span>
                  ) : null}
                </header>

                {selectedTask ? (
                  <div className="task-detail-grid">
                    <section className="card task-detail-card">
                      <h5>Informações da tarefa</h5>
                      <div className="task-detail-fields">
                        <label className="task-detail-field wide">
                          <span>Assunto</span>
                          <input
                            type="text"
                            value={selectedTask.subject}
                            readOnly={!taskEditMode}
                            onChange={(event) => updateTaskField('subject', event.target.value)}
                          />
                        </label>
                        <label className="task-detail-field">
                          <span>Competência</span>
                          <input
                            type="text"
                            value={
                              taskEditMode
                                ? selectedTask.competence || ''
                                : formatCompetenceValue(selectedTask.competence)
                            }
                            readOnly={!taskEditMode}
                            onChange={(event) => updateTaskField('competence', event.target.value)}
                          />
                        </label>
                        <label className="task-detail-field">
                          <span>Status do Cliente</span>
                          <select
                            value={selectedTask.clientStatus}
                            disabled={!taskEditMode}
                            onChange={(event) => updateTaskField('clientStatus', event.target.value)}
                          >
                            <option>Ativo</option>
                            <option>Desativado</option>
                          </select>
                        </label>
                        <label className="task-detail-field wide">
                          <span>Cliente</span>
                          <input
                            type="text"
                            value={selectedTask.client}
                            readOnly={!taskEditMode}
                            onChange={(event) => updateTaskField('client', event.target.value)}
                          />
                        </label>
                        <label className="task-detail-field">
                          <span>CNPJ/CPF</span>
                          <input
                            type="text"
                            value={selectedTask.cnpj}
                            readOnly={!taskEditMode}
                            onChange={(event) => updateTaskField('cnpj', event.target.value)}
                          />
                        </label>
                        <label className="task-detail-field">
                          <span>Responsável</span>
                          <input
                            type="text"
                            value={selectedTask.owner}
                            readOnly={!taskEditMode}
                            onChange={(event) => updateTaskField('owner', event.target.value)}
                          />
                        </label>
                        <label className="task-detail-field">
                          <span>Ação</span>
                          <input
                            type="text"
                            value={getTaggedReportDate(selectedTask.dates, 'A')}
                            readOnly={!taskEditMode}
                            onChange={(event) => updateTaskTaggedDate('A', event.target.value)}
                          />
                        </label>
                        <label className="task-detail-field">
                          <span>Meta</span>
                          <input
                            type="text"
                            value={getTaggedReportDate(selectedTask.dates, 'M')}
                            readOnly={!taskEditMode}
                            onChange={(event) => updateTaskTaggedDate('M', event.target.value)}
                          />
                        </label>
                        <label className="task-detail-field">
                          <span>Vencimento</span>
                          <input
                            type="text"
                            value={getTaggedReportDate(selectedTask.dates, 'V')}
                            readOnly={!taskEditMode}
                            onChange={(event) => updateTaskTaggedDate('V', event.target.value)}
                          />
                        </label>
                        <label className="task-detail-field">
                          <span>Data da Entrega</span>
                          <input
                            type="text"
                            value={selectedTask.deliveryDate || ''}
                            readOnly={!taskEditMode}
                            onChange={(event) => updateTaskField('deliveryDate', event.target.value)}
                          />
                        </label>
                      </div>
                      <div className="task-detail-baixa">
                        <strong>Baixa registrada:</strong>{' '}
                        {selectedTask.baixaAt
                          ? `${selectedTask.baixaAction} em ${selectedTask.baixaAt}`
                          : 'Sem baixa até o momento'}
                      </div>
                    </section>

                    <section className="card task-detail-card">
                      <h5>Anexos e ações</h5>
                      <label className="task-upload-field">
                        <span>Anexar arquivo da tarefa</span>
                        <input type="file" onChange={handleTaskAttachmentAdd} />
                      </label>

                      <div className="task-attachments">
                        {selectedTask.attachments?.length ? (
                          selectedTask.attachments.map((attachment) => (
                            <div className="task-attachment-row" key={attachment.id}>
                              <div>
                                <strong>{attachment.name}</strong>
                                <small>{formatFileSize(attachment.size)}</small>
                              </div>
                              <button
                                type="button"
                                className="chip tiny"
                                onClick={() => downloadAttachment(attachment)}
                              >
                                Baixar
                              </button>
                            </div>
                          ))
                        ) : (
                          <p className="task-empty-attachments">Nenhum arquivo anexado.</p>
                        )}
                      </div>

                      <div className="task-detail-actions">
                        <button
                          type="button"
                          className="chip tiny"
                          onClick={handleTaskDownload}
                        >
                          Baixar
                        </button>
                        <button type="button" className="chip tiny" onClick={handleTaskDispense}>
                          Dispensar
                        </button>
                        <button type="button" className="chip tiny" onClick={handleTaskEdit}>
                          {taskEditMode ? 'Salvar edição' : 'Editar'}
                        </button>
                        <button type="button" className="danger-outline" onClick={handleTaskDelete}>
                          Excluir
                        </button>
                      </div>

                      <div className="task-action-log">
                        <h6>Histórico da tarefa</h6>
                        {selectedTaskLogs.length ? (
                          selectedTaskLogs.map((log) => (
                            <p key={log.id}>
                              <strong>{log.action}</strong> em {log.timestamp}
                            </p>
                          ))
                        ) : (
                          <p>Nenhuma ação de baixa registrada.</p>
                        )}
                      </div>

                      <label className="task-justification">
                        <span>Justificativa</span>
                        <textarea
                          rows={4}
                          value={selectedTask.justification || ''}
                          onChange={(event) => {
                            updateTaskField('justification', event.target.value)
                            setTaskActionError('')
                          }}
                          placeholder="Preencha a justificativa quando não houver anexo."
                        />
                      </label>
                      {taskActionError ? <p className="task-action-error">{taskActionError}</p> : null}
                    </section>
                  </div>
                ) : (
                  <section className="card task-detail-empty">
                    <p>A tarefa selecionada não foi encontrada.</p>
                    <button type="button" className="chip small" onClick={goBackToTasks}>
                      Voltar para listagem
                    </button>
                  </section>
                )}
              </div>
            ) : screen === 'settings' ? (
              <div className="settings-view">
                <header className="settings-header card">
                  <div>
                    <h4>Configurações</h4>
                    <p>Cadastre usuários com acesso ao painel.</p>
                  </div>
                  <div className="settings-tabs">
                    <button
                      type="button"
                      className="active"
                      onClick={() => {
                        setSettingsTab('users')
                      }}
                    >
                      Cadastro de Usuários
                    </button>
                  </div>
                </header>

                {settingsTab === 'users' ? (
                  <section className="card settings-card">
                    <h5>Cadastro de usuários</h5>
                    <form className="settings-form-grid" onSubmit={handleSettingsUserSave}>
                      <label className="settings-field">
                        <span>Nome</span>
                        <input
                          type="text"
                          value={userForm.nome}
                          onChange={(event) => handleSettingsUserChange('nome', event.target.value)}
                          placeholder="Nome do usuário"
                        />
                      </label>
                      <label className="settings-field">
                        <span>Departamento</span>
                        <select
                          value={userForm.departamento}
                          onChange={(event) =>
                            handleSettingsUserChange('departamento', event.target.value)
                          }
                        >
                          <option value="" disabled>
                            Selecione...
                          </option>
                          {groupOptions.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="settings-field">
                        <span>Telefone</span>
                        <input
                          type="text"
                          value={userForm.telefone}
                          onChange={(event) => handleSettingsUserChange('telefone', event.target.value)}
                          placeholder="(00) 9 0000-0000"
                        />
                      </label>
                      <label className="settings-field">
                        <span>E-mail (login)</span>
                        <input
                          type="email"
                          value={userForm.email}
                          onChange={(event) => handleSettingsUserChange('email', event.target.value)}
                          placeholder="usuario@empresa.com"
                        />
                      </label>
                      <label className="settings-field">
                        <span>Senha</span>
                        <input
                          type="text"
                          value={userForm.senha}
                          onChange={(event) => handleSettingsUserChange('senha', event.target.value)}
                          placeholder="Senha de acesso"
                        />
                      </label>
                      <div className="settings-actions-row">
                        <button type="button" className="chip small" onClick={clearSettingsUserForm}>
                          Limpar
                        </button>
                        <button type="submit" className="primary small">
                          {editingUserId !== null ? 'Salvar alteração' : 'Cadastrar usuário'}
                        </button>
                      </div>
                    </form>
                    {settingsUserFeedback ? (
                      <p className="settings-feedback">{settingsUserFeedback}</p>
                    ) : null}

                    <div className="settings-users-table">
                      <div className="settings-users-head">
                        <span>Nome</span>
                        <span>Departamento</span>
                        <span>Telefone</span>
                        <span>E-mail (login)</span>
                        <span>Senha</span>
                        <span>Ações</span>
                      </div>
                      <div className="settings-users-body">
                        {users.map((user) => (
                          <div className="settings-users-row" key={user.id}>
                            <span title={user.nome}>{user.nome}</span>
                            <span title={user.departamento || '-'}>{user.departamento || '-'}</span>
                            <span title={user.telefone || '-'}>{user.telefone || '-'}</span>
                            <span title={user.email}>{user.email}</span>
                            <span title={user.senha}>{user.senha}</span>
                            <span className="settings-users-actions">
                              <button type="button" className="link-btn" onClick={() => editSettingsUser(user)}>
                                Editar
                              </button>
                              <button
                                type="button"
                                className="link-btn danger"
                                onClick={() => removeSettingsUser(user.id)}
                              >
                                Excluir
                              </button>
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </section>
                ) : (
                  <section className="card settings-card">
                    <h5>Cadastro de tarefas</h5>
                    <form className="settings-task-form" onSubmit={handleSettingsTaskSave}>
                      <div className="settings-form-grid settings-task-dates">
                        <label className="settings-field">
                          <span>
                            Ação <strong className="req">*</strong>
                          </span>
                          <input
                            type="date"
                            value={settingsTaskForm.actionDate}
                            onChange={(event) => handleSettingsTaskChange('actionDate', event.target.value)}
                          />
                        </label>
                        <label className="settings-field">
                          <span>
                            Meta <strong className="req">*</strong>
                          </span>
                          <input
                            type="date"
                            value={settingsTaskForm.metaDate}
                            onChange={(event) => handleSettingsTaskChange('metaDate', event.target.value)}
                          />
                        </label>
                        <label className="settings-field">
                          <span>
                            Vencimento <strong className="req">*</strong>
                          </span>
                          <input
                            type="date"
                            value={settingsTaskForm.dueDate}
                            onChange={(event) => handleSettingsTaskChange('dueDate', event.target.value)}
                          />
                        </label>
                      </div>

                      <div className="settings-form-grid settings-task-obligation">
                        <label className="settings-field">
                          <span>
                            Obrigação <strong className="req">*</strong>
                          </span>
                          <input
                            list="settings-obligation-options"
                            type="text"
                            value={settingsTaskForm.obligation}
                            onChange={(event) => handleSettingsTaskChange('obligation', event.target.value)}
                            placeholder="Selecione ou digite"
                          />
                          <datalist id="settings-obligation-options">
                            {settingsTaskObligationOptions.map((option) => (
                              <option key={option} value={option} />
                            ))}
                          </datalist>
                        </label>
                        <label className="settings-field">
                          <span>Complemento</span>
                          <input
                            type="text"
                            value={settingsTaskForm.complement}
                            onChange={(event) => handleSettingsTaskChange('complement', event.target.value)}
                            placeholder="Ex.: ISS mensal"
                          />
                        </label>
                      </div>

                      <div className="settings-form-grid settings-task-rules">
                        <label className="settings-field">
                          <span>
                            Parcelas <strong className="req">*</strong>
                          </span>
                          <select
                            value={settingsTaskForm.installments}
                            onChange={(event) =>
                              handleSettingsTaskChange('installments', Number(event.target.value))
                            }
                          >
                            {Array.from({ length: 12 }, (_, index) => index + 1).map((value) => (
                              <option key={value} value={value}>
                                {value}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="settings-field">
                          <span>
                            Fato Gerador (Competência) <strong className="req">*</strong>
                          </span>
                          <select
                            value={settingsTaskForm.competenceMode}
                            onChange={(event) =>
                              handleSettingsTaskChange('competenceMode', event.target.value)
                            }
                          >
                            <option>Mesmo mês</option>
                            <option>Mês anterior</option>
                          </select>
                        </label>
                        <label className="settings-field">
                          <span>
                            Responsável <strong className="req">*</strong>
                          </span>
                          <input
                            list="settings-owner-options"
                            type="text"
                            value={settingsTaskForm.owner}
                            onChange={(event) => handleSettingsTaskChange('owner', event.target.value)}
                            placeholder="Nome do responsável"
                          />
                          <datalist id="settings-owner-options">
                            {settingsOwnerOptions.map((option) => (
                              <option key={option} value={option} />
                            ))}
                          </datalist>
                        </label>
                      </div>

                      <p className="settings-hint">
                        Competência inicial prevista: <strong>{settingsCompetencePreview || '--/----'}</strong>
                      </p>

                      <div className="settings-clients-box">
                        <div className="settings-clients-top">
                          <span>
                            Cliente(s) <strong className="req">*</strong>
                          </span>
                          <label>
                            <input
                              type="checkbox"
                              checked={settingsTaskForm.includeDisabledClients}
                              onChange={(event) =>
                                handleSettingsTaskChange('includeDisabledClients', event.target.checked)
                              }
                            />
                            Exibir clientes desativados
                          </label>
                        </div>
                        <div className="settings-clients-list">
                          {settingsTaskClients.length ? (
                            settingsTaskClients.map((client) => (
                              <label key={client.id} className="settings-client-item">
                                <input
                                  type="checkbox"
                                  checked={settingsTaskForm.clientIds.includes(client.id)}
                                  onChange={() => toggleSettingsTaskClient(client.id)}
                                />
                                <span>
                                  {client.nome} ({client.status})
                                </span>
                              </label>
                            ))
                          ) : (
                            <p>Nenhum cliente disponível para seleção.</p>
                          )}
                        </div>
                      </div>

                      <label className="settings-field">
                        <span>Enviar arquivos</span>
                        <input type="file" multiple onChange={handleSettingsTaskAttachments} />
                      </label>
                      {settingsTaskForm.attachments.length ? (
                        <div className="settings-attachments">
                          {settingsTaskForm.attachments.map((file) => (
                            <span key={`${file.name}-${file.size}`} className="settings-attachment-pill">
                              {file.name}
                              <button
                                type="button"
                                onClick={() => removeSettingsTaskAttachment(file.name, file.size)}
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      ) : null}

                      <div className="settings-form-grid settings-task-notes">
                        <label className="settings-field">
                          <span>
                            Andamento <strong className="req">*</strong>
                          </span>
                          <textarea
                            value={settingsTaskForm.andamento}
                            onChange={(event) => handleSettingsTaskChange('andamento', event.target.value)}
                            rows={3}
                            placeholder="Descreva o andamento da tarefa"
                          />
                        </label>
                        <label className="settings-field">
                          <span>Convidados</span>
                          <input
                            type="text"
                            value={settingsTaskForm.guests}
                            onChange={(event) => handleSettingsTaskChange('guests', event.target.value)}
                            placeholder="Nomes separados por vírgula"
                          />
                        </label>
                      </div>

                      <div className="settings-actions-row">
                        <button type="button" className="chip small" onClick={clearSettingsTaskForm}>
                          Cancelar
                        </button>
                        <button type="submit" className="primary small">
                          Confirmar
                        </button>
                      </div>
                    </form>
                    {settingsTaskFeedback ? (
                      <p className="settings-feedback">{settingsTaskFeedback}</p>
                    ) : null}
                  </section>
                )}
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
                  <div className="client-select-all">
                    <label>
                      <input
                        type="checkbox"
                        ref={selectAllRef}
                        checked={clients.length > 0 && selectedClientIds.length === clients.length}
                        onChange={toggleSelectAll}
                      />
                      Selecionar todos
                    </label>
                    <div className="bulk-actions">
                      <button
                        type="button"
                        className="chip small"
                        disabled={!selectedClientIds.length}
                        onClick={openBulkModal}
                      >
                        Editar em lote
                      </button>
                      <button
                        type="button"
                        className="danger-outline"
                        disabled={!selectedClientIds.length}
                        onClick={requestBulkDelete}
                      >
                        Excluir selecionados
                      </button>
                    </div>
                  </div>
                  <div className="client-head">
                    <span />
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
                        <span>
                          <input
                            type="checkbox"
                            checked={selectedClientIds.includes(client.id)}
                            onChange={() => toggleSelectClient(client.id)}
                          />
                        </span>
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
                  <button
                    className="create-option"
                    type="button"
                    onClick={() => {
                      clearSettingsTaskForm()
                      setCreateOpen(false)
                      setTaskCreateOpen(true)
                    }}
                  >
                    <span className="option-icon" />
                    Criar Tarefa
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

          {taskCreateOpen ? (
            <div className="modal-backdrop" onClick={() => setTaskCreateOpen(false)}>
              <div className="modal-card wide" onClick={(event) => event.stopPropagation()}>
                <header className="modal-header">
                  <h3>Cadastro de tarefas</h3>
                  <button className="modal-close" type="button" onClick={() => setTaskCreateOpen(false)}>
                    ×
                  </button>
                </header>
                <form className="settings-task-form" onSubmit={handleSettingsTaskSave}>
                  <div className="settings-form-grid settings-task-dates">
                    <label className="settings-field">
                      <span>
                        Ação <strong className="req">*</strong>
                      </span>
                      <input
                        type="date"
                        value={settingsTaskForm.actionDate}
                        onChange={(event) => handleSettingsTaskChange('actionDate', event.target.value)}
                      />
                    </label>
                    <label className="settings-field">
                      <span>
                        Meta <strong className="req">*</strong>
                      </span>
                      <input
                        type="date"
                        value={settingsTaskForm.metaDate}
                        onChange={(event) => handleSettingsTaskChange('metaDate', event.target.value)}
                      />
                    </label>
                    <label className="settings-field">
                      <span>
                        Vencimento <strong className="req">*</strong>
                      </span>
                      <input
                        type="date"
                        value={settingsTaskForm.dueDate}
                        onChange={(event) => handleSettingsTaskChange('dueDate', event.target.value)}
                      />
                    </label>
                  </div>

                  <div className="settings-form-grid settings-task-obligation">
                    <label className="settings-field">
                      <span>
                        Obrigação <strong className="req">*</strong>
                      </span>
                      <input
                        list="settings-obligation-options-modal"
                        type="text"
                        value={settingsTaskForm.obligation}
                        onChange={(event) => handleSettingsTaskChange('obligation', event.target.value)}
                        placeholder="Selecione ou digite"
                      />
                      <datalist id="settings-obligation-options-modal">
                        {settingsTaskObligationOptions.map((option) => (
                          <option key={option} value={option} />
                        ))}
                      </datalist>
                    </label>
                    <label className="settings-field">
                      <span>Complemento</span>
                      <input
                        type="text"
                        value={settingsTaskForm.complement}
                        onChange={(event) => handleSettingsTaskChange('complement', event.target.value)}
                        placeholder="Ex.: ISS mensal"
                      />
                    </label>
                  </div>

                  <div className="settings-form-grid settings-task-rules">
                    <label className="settings-field">
                      <span>
                        Parcelas <strong className="req">*</strong>
                      </span>
                      <select
                        value={settingsTaskForm.installments}
                        onChange={(event) =>
                          handleSettingsTaskChange('installments', Number(event.target.value))
                        }
                      >
                        {Array.from({ length: 12 }, (_, index) => index + 1).map((value) => (
                          <option key={value} value={value}>
                            {value}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="settings-field">
                      <span>
                        Fato Gerador (Competência) <strong className="req">*</strong>
                      </span>
                      <select
                        value={settingsTaskForm.competenceMode}
                        onChange={(event) =>
                          handleSettingsTaskChange('competenceMode', event.target.value)
                        }
                      >
                        <option>Mesmo mês</option>
                        <option>Mês anterior</option>
                      </select>
                    </label>
                    <label className="settings-field">
                      <span>
                        Responsável <strong className="req">*</strong>
                      </span>
                      <input
                        list="settings-owner-options-modal"
                        type="text"
                        value={settingsTaskForm.owner}
                        onChange={(event) => handleSettingsTaskChange('owner', event.target.value)}
                        placeholder="Nome do responsável"
                      />
                      <datalist id="settings-owner-options-modal">
                        {settingsOwnerOptions.map((option) => (
                          <option key={option} value={option} />
                        ))}
                      </datalist>
                    </label>
                  </div>

                  <p className="settings-hint">
                    Competência inicial prevista: <strong>{settingsCompetencePreview || '--/----'}</strong>
                  </p>

                  <div className="settings-clients-box">
                    <div className="settings-clients-top">
                      <span>
                        Cliente(s) <strong className="req">*</strong>
                      </span>
                      <label>
                        <input
                          type="checkbox"
                          checked={settingsTaskForm.includeDisabledClients}
                          onChange={(event) =>
                            handleSettingsTaskChange('includeDisabledClients', event.target.checked)
                          }
                        />
                        Exibir clientes desativados
                      </label>
                    </div>
                    <div className="settings-clients-list">
                      {settingsTaskClients.length ? (
                        settingsTaskClients.map((client) => (
                          <label key={client.id} className="settings-client-item">
                            <input
                              type="checkbox"
                              checked={settingsTaskForm.clientIds.includes(client.id)}
                              onChange={() => toggleSettingsTaskClient(client.id)}
                            />
                            <span>
                              {client.nome} ({client.status})
                            </span>
                          </label>
                        ))
                      ) : (
                        <p>Nenhum cliente disponível para seleção.</p>
                      )}
                    </div>
                  </div>

                  <label className="settings-field">
                    <span>Enviar arquivos</span>
                    <input type="file" multiple onChange={handleSettingsTaskAttachments} />
                  </label>
                  {settingsTaskForm.attachments.length ? (
                    <div className="settings-attachments">
                      {settingsTaskForm.attachments.map((file) => (
                        <span key={`${file.name}-${file.size}`} className="settings-attachment-pill">
                          {file.name}
                          <button
                            type="button"
                            onClick={() => removeSettingsTaskAttachment(file.name, file.size)}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  ) : null}

                  <div className="settings-form-grid settings-task-notes">
                    <label className="settings-field">
                      <span>
                        Andamento <strong className="req">*</strong>
                      </span>
                      <textarea
                        value={settingsTaskForm.andamento}
                        onChange={(event) => handleSettingsTaskChange('andamento', event.target.value)}
                        rows={3}
                        placeholder="Descreva o andamento da tarefa"
                      />
                    </label>
                    <label className="settings-field">
                      <span>Convidados</span>
                      <input
                        type="text"
                        value={settingsTaskForm.guests}
                        onChange={(event) => handleSettingsTaskChange('guests', event.target.value)}
                        placeholder="Nomes separados por vírgula"
                      />
                    </label>
                  </div>

                  <div className="settings-actions-row">
                    <button type="button" className="chip small" onClick={clearSettingsTaskForm}>
                      Cancelar
                    </button>
                    <button type="submit" className="primary small">
                      Confirmar
                    </button>
                  </div>
                </form>
                {settingsTaskFeedback ? <p className="settings-feedback">{settingsTaskFeedback}</p> : null}
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
                  {pendingDelete && pendingDelete.length > 1 ? (
                    <>
                      Deseja excluir <strong>{pendingDelete.length}</strong> clientes selecionados?
                    </>
                  ) : (
                    <>
                      Deseja excluir o cliente{' '}
                      <strong>{pendingDelete && pendingDelete[0] ? pendingDelete[0].nome : 'selecionado'}</strong>?
                    </>
                  )}
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

          {bulkOpen ? (
            <div className="modal-backdrop" onClick={() => setBulkOpen(false)}>
              <div className="modal-card" onClick={(event) => event.stopPropagation()}>
                <header className="modal-header">
                  <h3>Editar em lote</h3>
                  <button className="modal-close" type="button" onClick={() => setBulkOpen(false)}>
                    ×
                  </button>
                </header>
                <p className="confirm-text">
                  Aplicar alterações para <strong>{selectedClientIds.length}</strong> clientes selecionados.
                </p>
                <form
                  className="client-form"
                  onSubmit={(event) => {
                    event.preventDefault()
                    handleBulkSave()
                  }}
                >
                  <div className="form-grid">
                    <div className="field">
                      <label>Status</label>
                      <select
                        value={bulkForm.status}
                        onChange={(event) => handleBulkChange('status', event.target.value)}
                      >
                        <option value="">Manter atual</option>
                        <option>Ativo</option>
                        <option>Inativo</option>
                      </select>
                    </div>
                    <div className="field">
                      <label>Visibilidade</label>
                      <select
                        value={bulkForm.visibilidade}
                        onChange={(event) => handleBulkChange('visibilidade', event.target.value)}
                      >
                        <option value="">Manter atual</option>
                        <option>Geral</option>
                        <option>Restrito</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-grid">
                    <div className="field">
                      <label>Grupos</label>
                      <div className="multi-select" ref={bulkGroupsRef}>
                        <div
                          className={`multi-trigger ${bulkGroupsOpen ? 'open' : ''}`}
                          role="button"
                          tabIndex={0}
                          onClick={() => setBulkGroupsOpen((prev) => !prev)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault()
                              setBulkGroupsOpen((prev) => !prev)
                            }
                          }}
                        >
                          {bulkSelectedGroups.length ? (
                            <div className="multi-tags">
                              {bulkSelectedGroups.map((grupo) => (
                                <span className="tag-pill" key={grupo}>
                                  {grupo}
                                  <button
                                    type="button"
                                    onClick={(event) => {
                                      event.stopPropagation()
                                      toggleBulkGroup(grupo)
                                    }}
                                  >
                                    ×
                                  </button>
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="placeholder">Manter atual</span>
                          )}
                          <span className="caret" />
                        </div>
                        {bulkGroupsOpen ? (
                          <div className="multi-menu">
                            {groupOptions.map((option) => (
                              <button
                                type="button"
                                className={`multi-option ${
                                  bulkSelectedGroups.includes(option) ? 'selected' : ''
                                }`}
                                key={option}
                                onClick={() => toggleBulkGroup(option)}
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
                      <label>Tributação</label>
                      <div className="single-select" ref={bulkTaxRef}>
                        <div
                          className={`single-trigger ${bulkTaxOpen ? 'open' : ''}`}
                          role="button"
                          tabIndex={0}
                          onClick={() => setBulkTaxOpen((prev) => !prev)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault()
                              setBulkTaxOpen((prev) => !prev)
                            }
                          }}
                        >
                          {bulkSelectedTax ? (
                            <span>{bulkSelectedTax}</span>
                          ) : (
                            <span className="placeholder">Manter atual</span>
                          )}
                          <span className="caret" />
                        </div>
                        {bulkTaxOpen ? (
                          <div className="single-menu">
                            {taxOptions.map((option) => (
                              <button
                                key={option}
                                type="button"
                                className={`single-option ${bulkSelectedTax === option ? 'selected' : ''}`}
                                onClick={() => {
                                  handleBulkChange('tributacao', option)
                                  setBulkTaxOpen(false)
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
                    <button className="chip small" type="button" onClick={() => setBulkOpen(false)}>
                      Cancelar
                    </button>
                    <button className="primary small" type="submit">
                      Aplicar
                    </button>
                  </div>
                </form>
              </div>
            </div>
          ) : null}
        </section>
      )}
    </div>
  )
}

export default App




