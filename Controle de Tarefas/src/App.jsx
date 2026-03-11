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
    value: '0',
    tone: 'sand',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M6 3h12l-2 6 2 6H6l2-6-2-6z" />
        <path d="M9 21h6" />
      </svg>
    ),
  },
]

const _progressRows = [
  {
    label: 'Abertas',
    tone: 'amber',
    values: [0, 0, 0, 0],
  },
  {
    label: 'Vencem Hoje',
    tone: 'rose',
    values: [0, 0, 0, 0],
  },
  {
    label: 'Atenção',
    tone: 'violet',
    values: [0, 0, 0, 0],
  },
]

const controlRows = [
  {
    group: 'Obrigações',
    items: [],
  },
  {
    group: 'Solicitações',
    items: [],
  },
]

const _reportRows = [
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
const clientChecklistOptions = [
  'Iss',
  'Difal',
  'Sub. Tributária',
  'Emite Nfse',
  'Compra fora do Estado',
  'Parcelamentos',
  'Parcelamento MEI',
  'Parcelamento PGFN',
  'Parcelamento Simples Nacional',
  'Folha de pagamento',
  'Folha de Pagamento Ultimo Dia',
  'Pró-Labore',
]
const brazilUfOptions = [
  'Todos',
  'AC',
  'AL',
  'AP',
  'AM',
  'BA',
  'CE',
  'DF',
  'ES',
  'GO',
  'MA',
  'MT',
  'MS',
  'MG',
  'PA',
  'PB',
  'PR',
  'PE',
  'PI',
  'RJ',
  'RN',
  'RS',
  'RO',
  'RR',
  'SC',
  'SP',
  'SE',
  'TO',
]
const monthDayOptions = Array.from({ length: 31 }, (_, index) => String(index + 1))
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
  taskType: 'Todos',
  subject: 'Todos',
  client: 'Todos',
  department: 'Todos',
  status: 'Todos',
  statusBucket: 'all',
  clientStatus: 'Todos',
  owner: 'Todos',
  dateBy: 'Ação',
  startDate: '',
  endDate: '',
  query: '',
}

const initialOverviewFilters = {
  taskType: 'Todos',
  department: 'Todos',
  status: 'Todos',
  clientStatus: 'Todos',
  owner: 'Todos',
  dateBy: 'Ação',
  startDate: '',
  endDate: '',
}

const initialClientTableFilters = {
  status: 'Todos',
  grupo: 'Todos',
  visibilidade: 'Todos',
  uf: 'Todos',
  tributacao: 'Todos',
  docType: 'Todos',
  query: '',
}

const initialTaskBlueprintFilters = {
  obligation: 'Todos',
  uf: 'Todos',
  tributacao: 'Todos',
  installments: 'Todos',
  competence: 'Todos',
  dateBy: 'Cadastro',
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

const formatIsoDateTimeToBr = (value) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const getTodayIsoLocal = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const getNowBrDate = () => parseIsoDateToBr(getTodayIsoLocal())

const formatMonthYearInput = (value) => {
  const digits = String(value || '')
    .replace(/\D/g, '')
    .slice(0, 6)
  if (digits.length <= 2) return digits
  return `${digits.slice(0, 2)}/${digits.slice(2)}`
}

const parseMonthYearToMonthIndex = (value) => {
  const match = String(value || '')
    .trim()
    .match(/^(\d{2})\/(\d{4})$/)
  if (!match) return null
  const month = Number(match[1])
  const year = Number(match[2])
  if (!year || month < 1 || month > 12) return null
  return year * 12 + (month - 1)
}

const getMonthYearFromIso = (isoDate) => {
  if (!isoDate) return ''
  const [yearRaw, monthRaw] = String(isoDate).split('-')
  const year = Number(yearRaw)
  const month = Number(monthRaw)
  if (!year || !month) return ''
  return `${String(month).padStart(2, '0')}/${String(year).padStart(4, '0')}`
}

const getClientCompetenceStartMonthIndex = (client, fallbackIsoDate = getTodayIsoLocal()) => {
  const fromClient = formatMonthYearInput(String(client?.competenceStart || '').trim())
  const fromClientParsed = parseMonthYearToMonthIndex(fromClient)
  if (fromClientParsed !== null) return fromClientParsed

  const fromStartDate = formatMonthYearInput(getMonthYearFromIso(client?.dataInicio))
  const fromStartDateParsed = parseMonthYearToMonthIndex(fromStartDate)
  if (fromStartDateParsed !== null) return fromStartDateParsed

  const fallbackMonthIndex = getMonthIndexFromIso(fallbackIsoDate)
  if (fallbackMonthIndex !== null) return fallbackMonthIndex
  return getMonthIndexFromIso(getTodayIsoLocal()) ?? 0
}

const getMonthStartIso = (isoDate) => {
  if (!isoDate) return ''
  const [year, month] = String(isoDate).split('-')
  if (!year || !month) return ''
  return `${year}-${month}-01`
}

const normalizeFreeText = (value) =>
  String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

const checklistMatchingRules = [
  { checklist: 'Iss', terms: ['iss'] },
  { checklist: 'Difal', terms: ['difal'] },
  {
    checklist: 'Sub. Tributária',
    terms: ['sub tributaria', 'substituicao tributaria', 'st'],
  },
  { checklist: 'Emite Nfse', terms: ['nfse', 'nfs e', 'nota fiscal de servico'] },
  { checklist: 'Compra fora do Estado', terms: ['compra fora do estado', 'fora do estado'] },
  { checklist: 'Parcelamentos', terms: ['parcelamento', 'parcelamentos'] },
  { checklist: 'Parcelamento MEI', terms: ['parcelamento mei'] },
  { checklist: 'Parcelamento PGFN', terms: ['parcelamento pgfn'] },
  {
    checklist: 'Parcelamento Simples Nacional',
    terms: ['parcelamento simples nacional'],
  },
  { checklist: 'Folha de pagamento', terms: ['folha de pagamento', 'folha pagamento'] },
  {
    checklist: 'Folha de Pagamento Ultimo Dia',
    terms: ['folha de pagamento ultimo dia', 'folha pagamento ultimo dia'],
  },
  { checklist: 'Pró-Labore', terms: ['pro labore', 'prolabore'] },
]

const checklistFolhaPagamentoKey = normalizeFreeText('Folha de pagamento')
const checklistFolhaUltimoDiaKey = normalizeFreeText('Folha de Pagamento Ultimo Dia')
const checklistParcelamentosKey = normalizeFreeText('Parcelamentos')
const checklistParcelamentoMeiKey = normalizeFreeText('Parcelamento MEI')
const checklistParcelamentoPgfnKey = normalizeFreeText('Parcelamento PGFN')
const checklistParcelamentoSimplesNacionalKey = normalizeFreeText('Parcelamento Simples Nacional')

const getChecklistRequirementsForBlueprint = (blueprint) => {
  const sourceText = normalizeFreeText(
    [
      String(blueprint?.obligation || '').trim(),
      String(blueprint?.subject || '').trim(),
      String(blueprint?.complement || '').trim(),
    ]
      .filter(Boolean)
      .join(' '),
  )
  if (!sourceText) return []

  const textTokens = sourceText.split(' ').filter(Boolean)
  const matchedKeys = checklistMatchingRules
    .filter((rule) =>
      rule.terms.some((term) => {
        const normalizedTerm = normalizeFreeText(term)
        if (!normalizedTerm) return false
        if (!normalizedTerm.includes(' ')) {
          return textTokens.includes(normalizedTerm)
        }
        return sourceText.includes(normalizedTerm)
      }),
    )
    .map((rule) => normalizeFreeText(rule.checklist))

  const normalizedRequiredChecklist = new Set(matchedKeys)

  // "Folha de Pagamento Ultimo Dia" é uma particularidade exclusiva.
  // Quando ela é identificada, a obrigação NÃO deve exigir também "Folha de pagamento".
  if (normalizedRequiredChecklist.has(checklistFolhaUltimoDiaKey)) {
    normalizedRequiredChecklist.delete(checklistFolhaPagamentoKey)
  }

  // Quando o blueprint já identificar parcelamento específico,
  // removemos a chave genérica "Parcelamentos" para não exigir ambas.
  if (
    normalizedRequiredChecklist.has(checklistParcelamentoMeiKey) ||
    normalizedRequiredChecklist.has(checklistParcelamentoPgfnKey) ||
    normalizedRequiredChecklist.has(checklistParcelamentoSimplesNacionalKey)
  ) {
    normalizedRequiredChecklist.delete(checklistParcelamentosKey)
  }

  return checklistMatchingRules
    .map((rule) => rule.checklist)
    .filter((item, index, array) => array.indexOf(item) === index)
    .filter((item) => normalizedRequiredChecklist.has(normalizeFreeText(item)))
}

const isBlueprintAllowedByClientChecklist = (blueprint, client) => {
  const requiredChecklist = getChecklistRequirementsForBlueprint(blueprint)
  if (!requiredChecklist.length) return true

  const clientChecklist = new Set(
    (Array.isArray(client?.checklist) ? client.checklist : [])
      .map((item) => normalizeFreeText(item))
      .filter(Boolean),
  )
  return requiredChecklist.every((item) => {
    const requiredKey = normalizeFreeText(item)
    if (clientChecklist.has(requiredKey)) return true

    // Retrocompatibilidade: se o cliente tiver apenas "Parcelamentos",
    // considera atendido também para parcelamentos específicos.
    if (
      clientChecklist.has(checklistParcelamentosKey) &&
      (requiredKey === checklistParcelamentoMeiKey ||
        requiredKey === checklistParcelamentoPgfnKey ||
        requiredKey === checklistParcelamentoSimplesNacionalKey)
    ) {
      return true
    }
    return false
  })
}

const getMonthEndIso = (isoDate) => {
  if (!isoDate) return ''
  const [yearRaw, monthRaw] = String(isoDate).split('-')
  const year = Number(yearRaw)
  const month = Number(monthRaw)
  if (!year || !month) return ''
  const lastDay = new Date(year, month, 0).getDate()
  return `${yearRaw}-${monthRaw}-${String(lastDay).padStart(2, '0')}`
}

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

const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const value = String(reader.result || '')
      const parts = value.split(',')
      resolve(parts.length > 1 ? parts[1] : parts[0])
    }
    reader.onerror = () => reject(new Error('Falha ao ler o arquivo anexado.'))
    reader.readAsDataURL(file)
  })

const fileToDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error('Falha ao ler a imagem selecionada.'))
    reader.readAsDataURL(file)
  })

const extractDigits = (value) => String(value || '').replace(/\D/g, '')

const formatCnpjValue = (value) => {
  const digits = String(value || '')
    .replace(/\D/g, '')
    .slice(0, 14)
  if (!digits) return ''
  if (digits.length <= 2) return digits
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`
  if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`
  if (digits.length <= 12) {
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`
  }
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`
}

const formatCpfValue = (value) => {
  const digits = String(value || '')
    .replace(/\D/g, '')
    .slice(0, 11)
  if (!digits) return ''
  if (digits.length <= 3) return digits
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
}

const formatClientInscricaoByDocType = (value, docType) => {
  if (docType === 'CNPJ') return formatCnpjValue(value)
  if (docType === 'CPF') return formatCpfValue(value)
  return value
}

const formatCepValue = (value) => {
  const digits = String(value || '')
    .replace(/\D/g, '')
    .slice(0, 8)
  if (digits.length <= 5) return digits
  return `${digits.slice(0, 5)}-${digits.slice(5)}`
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
  const persistedStatus = String(row.status || '').trim()
  if (isCompletedTaskStatus(persistedStatus)) {
    return { status: persistedStatus, tag: row.tag || 'lime' }
  }

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

const getMonthIndexFromIso = (value) => {
  if (!value) return null
  const [yearRaw, monthRaw] = String(value).split('-')
  const year = Number(yearRaw)
  const month = Number(monthRaw)
  if (!year || !month) return null
  return year * 12 + (month - 1)
}

const getYearMonthOffset = (baseIso, targetIso) => {
  const baseIndex = getMonthIndexFromIso(baseIso)
  const targetIndex = getMonthIndexFromIso(targetIso)
  if (baseIndex === null || targetIndex === null) return 0
  return targetIndex - baseIndex
}

const getDayOfMonthFromIso = (value) => {
  if (!value) return 1
  const day = Number(String(value).split('-')[2])
  if (!day) return 1
  return day
}

const setIsoDateDay = (isoDate, dayValue) => {
  const day = Number(dayValue)
  if (!day || day < 1 || day > 31) {
    return isoDate || getTodayIsoLocal()
  }
  const baseIso = isoDate || getTodayIsoLocal()
  const [yearRaw, monthRaw] = String(baseIso).split('-')
  const year = Number(yearRaw)
  const month = Number(monthRaw)
  if (!year || !month) {
    return getTodayIsoLocal()
  }
  const lastDay = new Date(year, month, 0).getDate()
  const safeDay = Math.min(day, lastDay)
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(safeDay).padStart(2, '0')}`
}

const buildIsoDateFromMonthIndexAndDay = (monthIndex, day) => {
  if (typeof monthIndex !== 'number' || Number.isNaN(monthIndex)) return ''
  const year = Math.floor(monthIndex / 12)
  const monthIndexZeroBased = monthIndex % 12
  const lastDay = new Date(year, monthIndexZeroBased + 1, 0).getDate()
  const safeDay = Math.min(Math.max(Number(day) || 1, 1), lastDay)
  const month = String(monthIndexZeroBased + 1).padStart(2, '0')
  return `${year}-${month}-${String(safeDay).padStart(2, '0')}`
}

const isCompletedTaskStatus = (status) => {
  const normalizedStatus = String(status || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

  return ['finaliz', 'concluid', 'dispensad', 'cancelad'].some((keyword) =>
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

const getDepartmentLabel = (value) => {
  const text = String(value || '').trim()
  if (!text) return ''
  const normalized = text.toLowerCase()
  if (normalized.startsWith('back office - ')) {
    return text.slice('Back Office - '.length).trim()
  }
  if (normalized.startsWith('backoffice - ')) {
    return text.slice('Backoffice - '.length).trim()
  }
  return text
}

const normalizeSolicitationDepartment = (value) => {
  const text = String(value || '').trim()
  if (!text) return ''
  return getDepartmentLabel(text)
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

const _initialClients = [
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
  competenceStart: getMonthYearFromIso(getTodayIsoLocal()),
  cep: '',
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
  checklist: [],
}

const initialUsers = [
  {
    id: 1,
    nome: 'Administrador',
    departamento: 'Fiscal',
    telefone: '(35) 9 9999-0000',
    email: 'admin@hive.com',
    senha: 'Admin123',
    clientIds: [],
  },
]

const emptyUserForm = {
  nome: '',
  departamento: '',
  telefone: '',
  email: '',
  senha: '',
  clientIds: [],
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
    departmentScope: '',
    ufScope: 'Todos',
    tributacaoScopes: [],
    clientIds: [],
    includeDisabledClients: false,
    attachments: [],
    owner: '',
    guests: '',
  }
}

const getEmptyClientTaskGenerateForm = () => {
  const today = getTodayIsoLocal()
  return {
    startDate: getMonthStartIso(today),
    endDate: getMonthEndIso(today),
    blueprintIds: [],
  }
}

const getEmptySolicitationForm = () => {
  const today = getTodayIsoLocal()
  return {
    departamento: '',
    processo: '',
    etapa: '',
    assunto: '',
    clientIds: [],
    includeDisabledClients: false,
    actionDate: today,
    metaDate: today,
    dueDate: today,
    attachments: [],
    andamento: '',
    responsavel: '',
    convidados: '',
    notifyOpen: false,
    notifyEnd: false,
    notifyGuests: false,
    replicateSubtasks: false,
    iAmResponsible: false,
    iAmAuthorizer: false,
  }
}

const API_BASE_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '')

const STORAGE_KEYS = {
  remember: 'hive-remember',
  user: 'hive-username',
  pass: 'hive-password',
  session: 'hive-session',
}

const renderSidebarIcon = (label) => {
  switch (label) {
    case 'Visão Geral':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6z" />
          <circle cx="12" cy="12" r="2.6" />
        </svg>
      )
    case 'Tarefas':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M9 7h10M9 12h10M9 17h10" />
          <path d="M4 7.5l1.4 1.4L7.8 6.5M4 12.5l1.4 1.4 2.4-2.4M4 17.5l1.4 1.4 2.4-2.4" />
        </svg>
      )
    case 'Relatórios':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M9 4h6" />
          <path d="M9 2h6v3H9z" />
          <path d="M7 5h10a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z" />
          <path d="M8.5 11h7M8.5 15h7M8.5 19h4" />
        </svg>
      )
    case 'Solicitações':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6 3h12a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
          <path d="M8 8h8M8 12h6M8 16h5" />
          <circle cx="18.5" cy="16.5" r="2.5" />
        </svg>
      )
    case 'Clientes':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M7.5 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM16.5 11a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z" />
          <path d="M2.8 20a4.8 4.8 0 0 1 9.4 0M12.6 20a4.1 4.1 0 0 1 8 0" />
        </svg>
      )
    case 'Configurações':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 8.5A3.5 3.5 0 1 0 12 15.5A3.5 3.5 0 1 0 12 8.5Z" />
          <path d="M19 12a7 7 0 0 0-.06-.9l2-1.55-2-3.46-2.4.8a7.7 7.7 0 0 0-1.56-.9L14.5 3h-5l-.48 2.99c-.55.22-1.08.52-1.56.9l-2.4-.8-2 3.46 2 1.55a7 7 0 0 0 0 1.8l-2 1.55 2 3.46 2.4-.8c.48.38 1.01.68 1.56.9L9.5 21h5l.48-2.99c.55-.22 1.08-.52 1.56-.9l2.4.8 2-3.46-2-1.55c.04-.3.06-.6.06-.9z" />
        </svg>
      )
    default:
      return null
  }
}

const apiRequest = async (path, { method = 'GET', token, body } = {}) => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })

  let payload = null
  try {
    payload = await response.json()
  } catch {
    payload = null
  }

  if (!response.ok) {
    const message = payload?.message || 'Erro de comunicação com o servidor.'
    const error = new Error(message)
    error.status = response.status
    error.payload = payload
    throw error
  }

  return payload
}

function App() {
  const [screen, setScreen] = useState('login')
  const [remember, setRemember] = useState(
    () => localStorage.getItem(STORAGE_KEYS.remember) === 'true',
  )
  const tenantStatePersistTimeoutRef = useRef(null)
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
  const [showPasswordOnHold, setShowPasswordOnHold] = useState(false)
  const [error, setError] = useState('')
  const [authSession, setAuthSession] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.session)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  })
  const [isApiLoading, setIsApiLoading] = useState(false)
  const [tenantStateHydrated, setTenantStateHydrated] = useState(false)
  const [superAdminStats, setSuperAdminStats] = useState({
    tenantsTotal: 0,
    tenantsActive: 0,
    clientsTotal: 0,
    usersTotal: 0,
    tasksTotal: 0,
  })
  const [superAdminTenants, setSuperAdminTenants] = useState([])
  const [superAdminClients, setSuperAdminClients] = useState([])
  const [selectedSuperTenantId, setSelectedSuperTenantId] = useState('')
  const [superAdminFilters, setSuperAdminFilters] = useState({ q: '', status: 'ALL' })
  const [superAdminClientFilters, setSuperAdminClientFilters] = useState({ q: '', status: 'ALL' })
  const [superAdminFeedback, setSuperAdminFeedback] = useState('')
  const [superTenantForm, setSuperTenantForm] = useState({
    name: '',
    slug: '',
    adminName: '',
    adminEmail: '',
    adminPassword: '',
  })
  const [superTenantEditorOpen, setSuperTenantEditorOpen] = useState(false)
  const [superTenantEditorMode, setSuperTenantEditorMode] = useState('view')
  const [superTenantEditorForm, setSuperTenantEditorForm] = useState({
    id: '',
    name: '',
    slug: '',
    status: '',
    createdAt: '',
    updatedAt: '',
    adminUserId: '',
    adminName: '',
    adminEmail: '',
    adminPassword: '',
  })
  const [superClientForm, setSuperClientForm] = useState({
    name: '',
    alias: '',
    documentType: 'CNPJ',
    documentNumber: '',
    status: 'ACTIVE',
    contact: '',
    phone: '',
    email: '',
    groups: '',
    visibility: 'Geral',
    uf: '',
    taxation: '',
    initialCompetence: '',
  })
  const [createOpen, setCreateOpen] = useState(false)
  const [taskCreateOpen, setTaskCreateOpen] = useState(false)
  const [solicitationOpen, setSolicitationOpen] = useState(false)
  const [clientOpen, setClientOpen] = useState(false)
  const [clientTaskGenerateOpen, setClientTaskGenerateOpen] = useState(false)
  const [clientTaskGenerateClients, setClientTaskGenerateClients] = useState([])
  const [clientTaskGenerateMode, setClientTaskGenerateMode] = useState('generate')
  const [clientTaskGenerateForm, setClientTaskGenerateForm] = useState(() => getEmptyClientTaskGenerateForm())
  const [clientTaskGenerateFeedback, setClientTaskGenerateFeedback] = useState('')
  const [settingsTab, setSettingsTab] = useState('users')
  const [companyLogoDataUrl, setCompanyLogoDataUrl] = useState('')
  const [companyLogoName, setCompanyLogoName] = useState('')
  const [settingsLogoDraftDataUrl, setSettingsLogoDraftDataUrl] = useState('')
  const [settingsLogoDraftName, setSettingsLogoDraftName] = useState('')
  const [settingsLogoFeedback, setSettingsLogoFeedback] = useState('')
  const [settingsLogoLoading, setSettingsLogoLoading] = useState(false)
  const [users, setUsers] = useState(initialUsers)
  const [userForm, setUserForm] = useState(emptyUserForm)
  const [editingUserId, setEditingUserId] = useState(null)
  const [settingsUserFeedback, setSettingsUserFeedback] = useState('')
  const [userClientsOpen, setUserClientsOpen] = useState(false)
  const userClientsRef = useRef(null)
  const [settingsTaskForm, setSettingsTaskForm] = useState(() => getEmptySettingsTaskForm())
  const [settingsTaskFeedback, setSettingsTaskFeedback] = useState('')
  const [clients, setClients] = useState([])
  const [tasksRows, setTasksRows] = useState([])
  const [taskBlueprints, setTaskBlueprints] = useState([])
  const [editingTaskBlueprintId, setEditingTaskBlueprintId] = useState(null)
  const [selectedTaskRef, setSelectedTaskRef] = useState(null)
  const [taskEditMode, setTaskEditMode] = useState(false)
  const [taskActionLogs, setTaskActionLogs] = useState([])
  const [taskActionError, setTaskActionError] = useState('')
  const [taskEmailSending, setTaskEmailSending] = useState(false)
  const [solicitationForm, setSolicitationForm] = useState(() => getEmptySolicitationForm())
  const [solicitationFeedback, setSolicitationFeedback] = useState('')
  const [solicitationRecords, setSolicitationRecords] = useState([])
  const [solicitationClientSearch, setSolicitationClientSearch] = useState('')
  const [clientCepLookupLoading, setClientCepLookupLoading] = useState(false)
  const [clientCepLookupMessage, setClientCepLookupMessage] = useState('')
  const [clientForm, setClientForm] = useState(emptyClientForm)
  const [clientMode, setClientMode] = useState('create')
  const [editingId, setEditingId] = useState(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingDelete, setPendingDelete] = useState(null)
  const modalBackdropMouseDownRef = useRef(false)
  const [groupsOpen, setGroupsOpen] = useState(false)
  const groupsRef = useRef(null)
  const [taxOpen, setTaxOpen] = useState(false)
  const taxRef = useRef(null)
  const [checklistOpen, setChecklistOpen] = useState(false)
  const checklistRef = useRef(null)
  const [settingsTaskTaxOpen, setSettingsTaskTaxOpen] = useState(false)
  const settingsTaskTaxRef = useRef(null)
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
  const [overviewFilters, setOverviewFilters] = useState(initialOverviewFilters)
  const [appliedOverviewFilters, setAppliedOverviewFilters] = useState(initialOverviewFilters)
  const [clientTableFilters, setClientTableFilters] = useState(initialClientTableFilters)
  const [appliedClientTableFilters, setAppliedClientTableFilters] = useState(initialClientTableFilters)
  const [taskBlueprintFilters, setTaskBlueprintFilters] = useState(initialTaskBlueprintFilters)
  const [appliedTaskBlueprintFilters, setAppliedTaskBlueprintFilters] = useState(initialTaskBlueprintFilters)
  const [taskPage, setTaskPage] = useState(1)
  const [taskItemsPerPage, setTaskItemsPerPage] = useState(10)
  const [operationalFilters, setOperationalFilters] = useState(initialOperationalFilters)
  const [appliedOperationalFilters, setAppliedOperationalFilters] = useState(initialOperationalFilters)
  const superAdminToken = authSession?.token || ''
  const isSuperAdmin = authSession?.user?.role === 'SUPER_ADMIN'
  const isTenantAdmin = authSession?.user?.role === 'TENANT_ADMIN'
  const currentAuthEmailLower = String(authSession?.user?.email || '')
    .trim()
    .toLowerCase()
  const tenantDisplayName = String(authSession?.user?.tenantName || '').trim() || 'Empresa'
  const isTenantRestrictedUser = authSession?.user?.role === 'TENANT_USER'
  const canManageTaskBlueprints = isTenantAdmin || isSuperAdmin
  const canCreateTaskBlueprints = canManageTaskBlueprints
  const canManageClients = isTenantAdmin || isSuperAdmin
  const canManageClientTaskGeneration = isTenantAdmin || isSuperAdmin
  const canManageTenantUsers = isTenantAdmin
  const canManageTenantBranding = isTenantAdmin
  const currentTenantUserProfile = users.find(
    (user) => String(user.email || '').trim().toLowerCase() === currentAuthEmailLower,
  )
  const currentTenantDepartmentKey = normalizeFreeText(
    getDepartmentLabel(currentTenantUserProfile?.departamento || ''),
  )
  const authAllowedClientIds = Array.isArray(authSession?.user?.clientIds)
    ? authSession.user.clientIds
    : []
  const authAllowedClientIdSet = new Set(authAllowedClientIds.map((id) => String(id)))
  const authAllowedClientNameSet = new Set(
    clients
      .filter((client) => authAllowedClientIdSet.has(String(client.id)))
      .map((client) => String(client.nome || '').trim().toLowerCase())
      .filter(Boolean),
  )
  const isAllowedByAuthClientScope = (clientId, clientName = '') => {
    if (!isTenantRestrictedUser) return true
    if (clientId && authAllowedClientIdSet.has(String(clientId))) return true
    return authAllowedClientNameSet.has(String(clientName || '').trim().toLowerCase())
  }
  const isAllowedByAuthDepartmentScope = (department) => {
    if (!isTenantRestrictedUser) return true
    if (!currentTenantDepartmentKey) return false
    const normalizedTaskDepartment = normalizeFreeText(getDepartmentLabel(department))
    return normalizedTaskDepartment === currentTenantDepartmentKey
  }
  const clientsForCurrentUser = isTenantRestrictedUser
    ? clients.filter((client) => authAllowedClientIdSet.has(String(client.id)))
    : clients
  const tasksRowsForCurrentUser = isTenantRestrictedUser
    ? tasksRows.filter(
        (task) =>
          isAllowedByAuthClientScope(task.clientId, task.client) &&
          isAllowedByAuthDepartmentScope(task.dept),
      )
    : tasksRows
  const solicitationRecordsForCurrentUser = isTenantRestrictedUser
    ? solicitationRecords.filter((record) =>
        isAllowedByAuthClientScope(record.clientId, record.clientName) &&
        isAllowedByAuthDepartmentScope(record.departamento),
      )
    : solicitationRecords

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
    if (!checklistOpen) return

    const handleOutsideClick = (event) => {
      if (checklistRef.current && !checklistRef.current.contains(event.target)) {
        setChecklistOpen(false)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [checklistOpen])

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
    if (!settingsTaskTaxOpen) return

    const handleOutsideClick = (event) => {
      if (settingsTaskTaxRef.current && !settingsTaskTaxRef.current.contains(event.target)) {
        setSettingsTaskTaxOpen(false)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [settingsTaskTaxOpen])

  useEffect(() => {
    if (!userClientsOpen) return

    const handleOutsideClick = (event) => {
      if (userClientsRef.current && !userClientsRef.current.contains(event.target)) {
        setUserClientsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [userClientsOpen])

  useEffect(() => {
    if (canManageTenantUsers) return
    setEditingUserId(null)
    setUserForm(emptyUserForm)
    setUserClientsOpen(false)
  }, [canManageTenantUsers])

  useEffect(() => {
    if (!isTenantRestrictedUser) return
    if (screen !== 'settings') return
    setScreen('dashboard')
  }, [isTenantRestrictedUser, screen])

  useEffect(() => {
    if (!selectAllRef.current) return
    const total = clientsForCurrentUser.length
    const selected = selectedClientIds.length
    selectAllRef.current.indeterminate = selected > 0 && selected < total
  }, [clientsForCurrentUser.length, selectedClientIds.length])

  useEffect(() => {
    if (!authSession?.token || !authSession?.user) return
    if (authSession.user.role === 'SUPER_ADMIN') {
      setScreen('super-admin')
      return
    }
    setScreen('dashboard')
  }, [authSession])

  useEffect(() => {
    if (!isSuperAdmin || !superAdminToken) return
    refreshSuperAdminData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuperAdmin, superAdminToken])

  useEffect(() => {
    if (!isSuperAdmin || !selectedSuperTenantId) return
    loadSuperAdminClients(selectedSuperTenantId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuperAdmin, selectedSuperTenantId])

  useEffect(() => {
    if (!authSession?.token || isSuperAdmin) {
      setTenantStateHydrated(false)
      setCompanyLogoDataUrl('')
      setCompanyLogoName('')
      setSettingsLogoDraftDataUrl('')
      setSettingsLogoDraftName('')
      setSettingsLogoFeedback('')
      return
    }
    loadTenantState()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authSession?.token, isSuperAdmin])

  const clearPendingTenantStatePersist = () => {
    if (!tenantStatePersistTimeoutRef.current) return
    clearTimeout(tenantStatePersistTimeoutRef.current)
    tenantStatePersistTimeoutRef.current = null
  }

  useEffect(() => {
    if (!authSession?.token || isSuperAdmin || !tenantStateHydrated) return

    clearPendingTenantStatePersist()

    const statePayload = {
      schemaVersion: 1,
      branding: {
        logoDataUrl: companyLogoDataUrl || '',
        logoName: companyLogoName || '',
      },
      users,
      clients,
      tasksRows,
      taskBlueprints,
      solicitationRecords,
      taskActionLogs,
    }

    tenantStatePersistTimeoutRef.current = setTimeout(async () => {
      tenantStatePersistTimeoutRef.current = null
      try {
        await apiRequest('/tenant/state', {
          method: 'PUT',
          token: authSession.token,
          body: { state: statePayload },
        })
      } catch (error) {
        console.error('Falha ao persistir estado do tenant:', error)
      }
    }, 650)

    return () => {
      clearPendingTenantStatePersist()
    }
  }, [
    authSession?.token,
    isSuperAdmin,
    tenantStateHydrated,
    users,
    clients,
    tasksRows,
    taskBlueprints,
    solicitationRecords,
    taskActionLogs,
    companyLogoDataUrl,
    companyLogoName,
  ])

  const handleLogin = async (event) => {
    event.preventDefault()
    const normalizedUser = username.trim().toLowerCase()
    const loginEmail =
      normalizedUser.includes('@')
        ? normalizedUser
        : normalizedUser === 'admin'
          ? 'admin@hive.com'
          : normalizedUser

    if (!loginEmail.includes('@')) {
      setError('Use o e-mail cadastrado para entrar.')
      return
    }

    try {
      setIsApiLoading(true)
      const authResponse = await apiRequest('/auth/login', {
        method: 'POST',
        body: { email: loginEmail, password },
      })
      setError('')
      setAuthSession(authResponse)
      localStorage.setItem(STORAGE_KEYS.session, JSON.stringify(authResponse))

      if (remember) {
        localStorage.setItem(STORAGE_KEYS.remember, 'true')
        localStorage.setItem(STORAGE_KEYS.user, username)
        localStorage.setItem(STORAGE_KEYS.pass, password)
      } else {
        localStorage.removeItem(STORAGE_KEYS.remember)
        localStorage.removeItem(STORAGE_KEYS.user)
        localStorage.removeItem(STORAGE_KEYS.pass)
      }

      setScreen(authResponse?.user?.role === 'SUPER_ADMIN' ? 'super-admin' : 'dashboard')
      return
    } catch (apiError) {
      setError(apiError?.message || 'Não foi possível autenticar com o servidor.')
    } finally {
      setIsApiLoading(false)
    }
  }

  const handleLogout = () => {
    if (tenantStatePersistTimeoutRef.current) {
      clearTimeout(tenantStatePersistTimeoutRef.current)
      tenantStatePersistTimeoutRef.current = null
    }
    setTenantStateHydrated(false)

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

    setAuthSession(null)
    localStorage.removeItem(STORAGE_KEYS.session)
    setScreen('login')
  }

  const listToArray = (value) =>
    String(value || '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)

  const clearSuperClientForm = () => {
    setSuperClientForm({
      name: '',
      alias: '',
      documentType: 'CNPJ',
      documentNumber: '',
      status: 'ACTIVE',
      contact: '',
      phone: '',
      email: '',
      groups: '',
      visibility: 'Geral',
      uf: '',
      taxation: '',
      initialCompetence: '',
    })
  }

  const loadSuperAdminDashboard = async () => {
    if (!superAdminToken) return
    const data = await apiRequest('/super-admin/dashboard', { token: superAdminToken })
    setSuperAdminStats(data)
  }

  const loadSuperAdminTenants = async (filters = superAdminFilters) => {
    if (!superAdminToken) return
    const params = new URLSearchParams()
    if (filters.q) params.set('q', filters.q)
    if (filters.status) params.set('status', filters.status)
    const data = await apiRequest(`/super-admin/tenants?${params.toString()}`, { token: superAdminToken })
    setSuperAdminTenants(data)
    setSelectedSuperTenantId((current) => {
      if (!data.length) return ''
      return data.some((tenant) => tenant.id === current) ? current : data[0].id
    })
  }

  const loadSuperAdminClients = async (tenantId, filters = superAdminClientFilters) => {
    if (!superAdminToken || !tenantId) {
      setSuperAdminClients([])
      return
    }
    const params = new URLSearchParams()
    if (filters.q) params.set('q', filters.q)
    if (filters.status) params.set('status', filters.status)
    const data = await apiRequest(
      `/super-admin/tenants/${tenantId}/clients?${params.toString()}`,
      { token: superAdminToken },
    )
    setSuperAdminClients(data)
  }

  const refreshSuperAdminData = async () => {
    if (!isSuperAdmin || !superAdminToken) return
    try {
      setIsApiLoading(true)
      await Promise.all([loadSuperAdminDashboard(), loadSuperAdminTenants()])
      setSuperAdminFeedback('')
    } catch (err) {
      setSuperAdminFeedback(err.message || 'Erro ao carregar dados do super admin.')
    } finally {
      setIsApiLoading(false)
    }
  }

  const handleSuperTenantCreate = async (event) => {
    event.preventDefault()
    const adminEmail = String(superTenantForm.adminEmail || '').trim().toLowerCase()
    const adminPassword = String(superTenantForm.adminPassword || '').trim()
    if (!adminEmail || !adminPassword) {
      setSuperAdminFeedback('Informe e-mail e senha do admin para criar o tenant.')
      return
    }
    try {
      setIsApiLoading(true)
      await apiRequest('/super-admin/tenants', {
        method: 'POST',
        token: superAdminToken,
        body: {
          name: superTenantForm.name,
          slug: superTenantForm.slug || undefined,
          adminName: superTenantForm.adminName || undefined,
          adminEmail,
          adminPassword,
        },
      })
      setSuperTenantForm({
        name: '',
        slug: '',
        adminName: '',
        adminEmail: '',
        adminPassword: '',
      })
      setSuperAdminFeedback('Tenant criado com sucesso.')
      await refreshSuperAdminData()
    } catch (err) {
      setSuperAdminFeedback(err.message || 'Não foi possível criar o tenant.')
    } finally {
      setIsApiLoading(false)
    }
  }

  const handleSuperTenantStatusToggle = async (tenant) => {
    try {
      setIsApiLoading(true)
      const nextStatus = tenant.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
      await apiRequest(`/super-admin/tenants/${tenant.id}`, {
        method: 'PATCH',
        token: superAdminToken,
        body: { status: nextStatus },
      })
      if (superTenantEditorForm.id === tenant.id) {
        setSuperTenantEditorForm((prev) => ({ ...prev, status: nextStatus }))
      }
      setSuperAdminFeedback('Status do tenant atualizado.')
      await refreshSuperAdminData()
    } catch (err) {
      setSuperAdminFeedback(err.message || 'Não foi possível atualizar o tenant.')
    } finally {
      setIsApiLoading(false)
    }
  }

  const openSuperTenantEditor = async (tenant) => {
    if (!tenant) return
    setSelectedSuperTenantId(tenant.id)
    setSuperTenantEditorForm({
      id: tenant.id,
      name: tenant.name || '',
      slug: tenant.slug || '',
      status: tenant.status || '',
      createdAt: tenant.createdAt || '',
      updatedAt: tenant.updatedAt || '',
      adminUserId: '',
      adminName: '',
      adminEmail: '',
      adminPassword: '',
    })
    setSuperTenantEditorMode('view')
    setSuperTenantEditorOpen(true)

    try {
      const tenantUsers = await apiRequest(`/super-admin/tenants/${tenant.id}/users`, {
        token: superAdminToken,
      })
      const adminUser = Array.isArray(tenantUsers)
        ? tenantUsers.find((user) => user.role === 'TENANT_ADMIN') || tenantUsers[0]
        : null

      if (adminUser) {
        setSuperTenantEditorForm((prev) => ({
          ...prev,
          adminUserId: adminUser.id || '',
          adminName: adminUser.name || '',
          adminEmail: adminUser.email || '',
          adminPassword: '',
        }))
      }
    } catch (error) {
      setSuperAdminFeedback(error.message || 'Não foi possível carregar os dados do admin do tenant.')
    }
  }

  const closeSuperTenantEditor = () => {
    setSuperTenantEditorOpen(false)
    setSuperTenantEditorMode('view')
    setSuperTenantEditorForm({
      id: '',
      name: '',
      slug: '',
      status: '',
      createdAt: '',
      updatedAt: '',
      adminUserId: '',
      adminName: '',
      adminEmail: '',
      adminPassword: '',
    })
  }

  const enableSuperTenantEditorEdit = () => {
    setSuperTenantEditorMode('edit')
    setSuperAdminFeedback('')
  }

  const cancelSuperTenantEditorEdit = () => {
    setSuperTenantEditorMode('view')
    setSuperTenantEditorForm((prev) => ({
      ...prev,
      adminPassword: '',
    }))
  }

  const handleSuperTenantEditorSave = async (event) => {
    event.preventDefault()
    const tenantId = superTenantEditorForm.id
    if (!tenantId) return

    const name = String(superTenantEditorForm.name || '').trim()
    const slug = String(superTenantEditorForm.slug || '').trim()
    const adminName = String(superTenantEditorForm.adminName || '').trim()
    const adminEmail = String(superTenantEditorForm.adminEmail || '').trim().toLowerCase()
    const adminPassword = String(superTenantEditorForm.adminPassword || '').trim()
    if (!name) {
      setSuperAdminFeedback('Informe o nome do tenant para salvar.')
      return
    }
    if (!adminEmail) {
      setSuperAdminFeedback('Informe o e-mail do admin do tenant.')
      return
    }
    if (!superTenantEditorForm.adminUserId && !adminPassword) {
      setSuperAdminFeedback('Este tenant ainda não possui usuário admin. Informe uma senha para criar o acesso.')
      return
    }

    try {
      setIsApiLoading(true)
      const updated = await apiRequest(`/super-admin/tenants/${tenantId}`, {
        method: 'PATCH',
        token: superAdminToken,
        body: {
          name,
          ...(slug ? { slug } : {}),
        },
      })

      const updatedAdmin = await apiRequest(`/super-admin/tenants/${tenantId}/admin`, {
        method: 'PATCH',
        token: superAdminToken,
        body: {
          name: adminName || undefined,
          email: adminEmail,
          password: adminPassword || undefined,
        },
      })

      setSuperTenantEditorForm((prev) => ({
        ...prev,
        name: updated.name || name,
        slug: updated.slug || slug,
        status: updated.status || prev.status,
        updatedAt: updated.updatedAt || prev.updatedAt,
        adminUserId: updatedAdmin.id || prev.adminUserId,
        adminName: updatedAdmin.name || adminName,
        adminEmail: updatedAdmin.email || adminEmail,
        adminPassword: '',
      }))
      setSuperTenantEditorMode('view')
      setSuperAdminFeedback('Tenant atualizado com sucesso.')
      await loadSuperAdminTenants(superAdminFilters)
    } catch (err) {
      setSuperAdminFeedback(err.message || 'Não foi possível salvar o tenant.')
    } finally {
      setIsApiLoading(false)
    }
  }

  const handleSuperTenantDelete = async () => {
    const tenantId = superTenantEditorForm.id
    if (!tenantId) return

    const allowDelete = window.confirm(
      `Excluir o tenant "${superTenantEditorForm.name}"?\nEssa ação remove também usuários, clientes, tarefas e estado desse tenant.`,
    )
    if (!allowDelete) return

    try {
      setIsApiLoading(true)
      await apiRequest(`/super-admin/tenants/${tenantId}`, {
        method: 'DELETE',
        token: superAdminToken,
      })
      setSuperAdminFeedback('Tenant excluído com sucesso.')
      closeSuperTenantEditor()
      if (selectedSuperTenantId === tenantId) {
        setSelectedSuperTenantId('')
      }
      await refreshSuperAdminData()
    } catch (err) {
      setSuperAdminFeedback(err.message || 'Não foi possível excluir o tenant.')
    } finally {
      setIsApiLoading(false)
    }
  }

  const handleSuperClientCreate = async (event) => {
    event.preventDefault()
    if (!selectedSuperTenantId) {
      setSuperAdminFeedback('Selecione um tenant para cadastrar clientes.')
      return
    }

    try {
      setIsApiLoading(true)
      await apiRequest(`/super-admin/tenants/${selectedSuperTenantId}/clients`, {
        method: 'POST',
        token: superAdminToken,
        body: {
          name: superClientForm.name,
          alias: superClientForm.alias || null,
          documentType: superClientForm.documentType || null,
          documentNumber: superClientForm.documentNumber || null,
          status: superClientForm.status,
          contact: superClientForm.contact || null,
          phone: superClientForm.phone || null,
          email: superClientForm.email || null,
          groups: listToArray(superClientForm.groups),
          visibility: superClientForm.visibility || null,
          uf: superClientForm.uf || null,
          taxation: listToArray(superClientForm.taxation),
          checklist: [],
          initialCompetence: superClientForm.initialCompetence || null,
        },
      })
      clearSuperClientForm()
      setSuperAdminFeedback('Cliente criado com sucesso.')
      await loadSuperAdminClients(selectedSuperTenantId)
      await loadSuperAdminDashboard()
    } catch (err) {
      setSuperAdminFeedback(err.message || 'Não foi possível criar o cliente.')
    } finally {
      setIsApiLoading(false)
    }
  }

  const handleSuperClientDelete = async (client) => {
    if (!selectedSuperTenantId) return
    const allowDelete = window.confirm(`Excluir o cliente "${client.name}" deste tenant?`)
    if (!allowDelete) return
    try {
      setIsApiLoading(true)
      await apiRequest(`/super-admin/tenants/${selectedSuperTenantId}/clients/${client.id}`, {
        method: 'DELETE',
        token: superAdminToken,
      })
      setSuperAdminFeedback('Cliente excluído com sucesso.')
      await loadSuperAdminClients(selectedSuperTenantId)
      await loadSuperAdminDashboard()
    } catch (err) {
      setSuperAdminFeedback(err.message || 'Não foi possível excluir o cliente.')
    } finally {
      setIsApiLoading(false)
    }
  }

  const loadTenantState = async () => {
    if (!authSession?.token || isSuperAdmin) return

    const fallbackUser = {
      id: String(authSession?.user?.id || '1'),
      authUserId: String(authSession?.user?.id || ''),
      nome: authSession?.user?.name || 'Usuário',
      departamento: '',
      telefone: '',
      email: authSession?.user?.email || '',
      senha: '',
      clientIds: Array.isArray(authSession?.user?.clientIds) ? authSession.user.clientIds : [],
    }

    try {
      setTenantStateHydrated(false)
      const response = await apiRequest('/tenant/state', { token: authSession.token })
      const state = response?.state && typeof response.state === 'object' ? response.state : {}
      const branding = state?.branding && typeof state.branding === 'object' ? state.branding : {}
      const logoDataUrl = typeof branding.logoDataUrl === 'string' ? branding.logoDataUrl : ''
      const logoName = typeof branding.logoName === 'string' ? branding.logoName : ''

      const usersFromState = Array.isArray(state.users) ? state.users : []
      const normalizedStateUsers = usersFromState
        .map((item, index) => ({
          id: String(item?.id || item?.authUserId || index + 1),
          authUserId: String(item?.authUserId || item?.id || ''),
          nome: String(item?.nome || item?.name || '').trim(),
          departamento: String(item?.departamento || '').trim(),
          telefone: String(item?.telefone || '').trim(),
          email: String(item?.email || '').trim(),
          senha: String(item?.senha || '').trim(),
          clientIds: Array.isArray(item?.clientIds) ? item.clientIds : [],
        }))
        .filter((item) => item.nome || item.email)
      const stateUsersByAuthId = new Map(
        normalizedStateUsers
          .filter((item) => item.authUserId)
          .map((item) => [String(item.authUserId), item]),
      )
      const stateUsersByEmail = new Map(
        normalizedStateUsers
          .filter((item) => item.email)
          .map((item) => [item.email.toLowerCase(), item]),
      )

      let normalizedUsers = normalizedStateUsers
      try {
        const backendUsers = await apiRequest('/tenant/users', { token: authSession.token })
        if (Array.isArray(backendUsers) && backendUsers.length) {
          normalizedUsers = backendUsers.map((backendUser, index) => {
            const byAuthId = stateUsersByAuthId.get(String(backendUser.id))
            const byEmail = stateUsersByEmail.get(String(backendUser.email || '').toLowerCase())
            const localMeta = byAuthId || byEmail
            return {
              id: String(backendUser.id || localMeta?.id || index + 1),
              authUserId: String(backendUser.id || ''),
              nome: String(localMeta?.nome || backendUser.name || '').trim(),
              departamento: String(localMeta?.departamento || '').trim(),
              telefone: String(localMeta?.telefone || '').trim(),
              email: String(backendUser.email || localMeta?.email || '').trim(),
              senha: String(localMeta?.senha || '').trim(),
              clientIds: Array.isArray(backendUser.clientIds) ? backendUser.clientIds : [],
              role: backendUser.role || 'TENANT_USER',
              isActive: backendUser.isActive !== false,
            }
          })
        }
      } catch (usersError) {
        console.error('Falha ao carregar usuários do tenant:', usersError)
      }

      const currentLoginEmail = String(authSession?.user?.email || '').trim().toLowerCase()
      if (
        currentLoginEmail &&
        !normalizedUsers.some((user) => String(user.email || '').trim().toLowerCase() === currentLoginEmail)
      ) {
        normalizedUsers = [fallbackUser, ...normalizedUsers]
      }

      setUsers(normalizedUsers.length ? normalizedUsers : [fallbackUser])
      setClients(Array.isArray(state.clients) ? state.clients : [])
      setTasksRows(Array.isArray(state.tasksRows) ? state.tasksRows : [])
      setTaskBlueprints(Array.isArray(state.taskBlueprints) ? state.taskBlueprints : [])
      setSolicitationRecords(Array.isArray(state.solicitationRecords) ? state.solicitationRecords : [])
      setTaskActionLogs(Array.isArray(state.taskActionLogs) ? state.taskActionLogs : [])
      setCompanyLogoDataUrl(logoDataUrl)
      setCompanyLogoName(logoName)
      setSettingsLogoDraftDataUrl('')
      setSettingsLogoDraftName('')
      setSettingsLogoFeedback('')
    } catch (error) {
      if (error?.status === 401 || error?.status === 403) {
        setAuthSession(null)
        localStorage.removeItem(STORAGE_KEYS.session)
        setScreen('login')
        setError('Sua sessão expirou. Faça login novamente.')
      } else {
        console.error('Falha ao carregar estado persistido do tenant:', error)
      }
      setUsers([fallbackUser])
      setClients([])
      setTasksRows([])
      setTaskBlueprints([])
      setSolicitationRecords([])
      setTaskActionLogs([])
      setCompanyLogoDataUrl('')
      setCompanyLogoName('')
      setSettingsLogoDraftDataUrl('')
      setSettingsLogoDraftName('')
      setSettingsLogoFeedback('')
    } finally {
      setTenantStateHydrated(true)
    }
  }

  const persistTenantStateNow = async (brandingOverride = null) => {
    if (!authSession?.token || isSuperAdmin) return
    clearPendingTenantStatePersist()
    const statePayload = {
      schemaVersion: 1,
      branding:
        brandingOverride ||
        {
          logoDataUrl: companyLogoDataUrl || '',
          logoName: companyLogoName || '',
        },
      users,
      clients,
      tasksRows,
      taskBlueprints,
      solicitationRecords,
      taskActionLogs,
    }
    await apiRequest('/tenant/state', {
      method: 'PUT',
      token: authSession.token,
      body: { state: statePayload },
    })
  }

  const persistTenantBrandingNow = async (brandingPayload) => {
    if (!authSession?.token || isSuperAdmin) return
    clearPendingTenantStatePersist()

    const sanitizedBranding = {
      logoDataUrl:
        typeof brandingPayload?.logoDataUrl === 'string' ? brandingPayload.logoDataUrl : '',
      logoName: typeof brandingPayload?.logoName === 'string' ? brandingPayload.logoName : '',
    }

    try {
      await apiRequest('/tenant/branding', {
        method: 'PUT',
        token: authSession.token,
        body: { branding: sanitizedBranding },
      })
    } catch (error) {
      if (error?.status === 404 || error?.status === 405) {
        await persistTenantStateNow(sanitizedBranding)
        return
      }
      throw error
    }
  }

  const handleSettingsLogoSelect = async (event) => {
    if (!canManageTenantBranding) {
      setSettingsLogoFeedback('Somente o administrador pode alterar a logo da empresa.')
      event.target.value = ''
      return
    }

    const file = event.target.files?.[0]
    if (!file) return

    if (!String(file.type || '').startsWith('image/')) {
      setSettingsLogoFeedback('Selecione um arquivo de imagem válido.')
      event.target.value = ''
      return
    }

    try {
      setSettingsLogoLoading(true)
      const dataUrl = await fileToDataUrl(file)
      setSettingsLogoDraftDataUrl(dataUrl)
      setSettingsLogoDraftName(file.name || 'logo')
      setSettingsLogoFeedback('Imagem pronta. Clique em "Salvar logo".')
    } catch (error) {
      setSettingsLogoFeedback(error.message || 'Não foi possível carregar a imagem.')
    } finally {
      setSettingsLogoLoading(false)
      event.target.value = ''
    }
  }

  const handleSettingsLogoSave = async () => {
    if (!canManageTenantBranding) {
      setSettingsLogoFeedback('Somente o administrador pode alterar a logo da empresa.')
      return
    }

    if (!settingsLogoDraftDataUrl) {
      setSettingsLogoFeedback('Selecione uma imagem para salvar.')
      return
    }
    const previousLogoDataUrl = companyLogoDataUrl
    const previousLogoName = companyLogoName
    const nextLogoDataUrl = settingsLogoDraftDataUrl
    const nextLogoName = settingsLogoDraftName || 'logo'

    setCompanyLogoDataUrl(nextLogoDataUrl)
    setCompanyLogoName(nextLogoName)
    setSettingsLogoDraftDataUrl('')
    setSettingsLogoDraftName('')
    setSettingsLogoFeedback('Salvando logo...')

    try {
      setSettingsLogoLoading(true)
      await persistTenantBrandingNow({
        logoDataUrl: nextLogoDataUrl,
        logoName: nextLogoName,
      })
      setSettingsLogoFeedback('Logo da empresa salva com sucesso.')
    } catch (error) {
      setCompanyLogoDataUrl(previousLogoDataUrl)
      setCompanyLogoName(previousLogoName)
      setSettingsLogoFeedback(error?.message || 'Não foi possível salvar a logo no servidor.')
    } finally {
      setSettingsLogoLoading(false)
    }
  }

  const handleSettingsLogoRemove = async () => {
    if (!canManageTenantBranding) {
      setSettingsLogoFeedback('Somente o administrador pode alterar a logo da empresa.')
      return
    }

    const previousLogoDataUrl = companyLogoDataUrl
    const previousLogoName = companyLogoName

    setCompanyLogoDataUrl('')
    setCompanyLogoName('')
    setSettingsLogoDraftDataUrl('')
    setSettingsLogoDraftName('')
    setSettingsLogoFeedback('Removendo logo...')

    try {
      setSettingsLogoLoading(true)
      await persistTenantBrandingNow({
        logoDataUrl: '',
        logoName: '',
      })
      setSettingsLogoFeedback('Logo removida.')
    } catch (error) {
      setCompanyLogoDataUrl(previousLogoDataUrl)
      setCompanyLogoName(previousLogoName)
      setSettingsLogoFeedback(error?.message || 'Não foi possível remover a logo no servidor.')
    } finally {
      setSettingsLogoLoading(false)
    }
  }

  const openCreateModal = () => {
    if (isTenantRestrictedUser) {
      openSolicitationModal()
      return
    }
    setCreateOpen(true)
    setClientOpen(false)
  }

  const clearSolicitationForm = () => {
    setSolicitationForm(getEmptySolicitationForm())
    setSolicitationClientSearch('')
    setSolicitationFeedback('')
  }

  const openSolicitationModal = () => {
    clearSolicitationForm()
    setCreateOpen(false)
    setTaskCreateOpen(false)
    setSolicitationOpen(true)
  }

  const openClientModal = (mode = 'create', client = null) => {
    if (mode === 'edit' && !canManageClients) return

    const nextClientForm = client
      ? {
          ...client,
          competenceStart:
            formatMonthYearInput(String(client.competenceStart || '').trim()) ||
            getMonthYearFromIso(client.dataInicio) ||
            getMonthYearFromIso(getTodayIsoLocal()),
        }
      : { ...emptyClientForm }

    setClientMode(mode)
    setEditingId(client ? client.id : null)
    setClientForm(nextClientForm)
    setClientCepLookupLoading(false)
    setClientCepLookupMessage('')
    setGroupsOpen(false)
    setTaxOpen(false)
    setChecklistOpen(false)
    setClientOpen(true)
    setCreateOpen(false)
  }

  const handleModalBackdropMouseDown = (event) => {
    modalBackdropMouseDownRef.current = event.target === event.currentTarget
  }

  const handleModalBackdropClick = (event, onClose) => {
    if (event.target !== event.currentTarget) return
    if (!modalBackdropMouseDownRef.current) return
    onClose()
    modalBackdropMouseDownRef.current = false
  }

  const openBulkModal = () => {
    if (!canManageClients) return
    if (!selectedClientIds.length) return
    setBulkOpen(true)
    setBulkGroupsOpen(false)
    setBulkTaxOpen(false)
  }

  const handleClientChange = (field, value) => {
    setClientForm((prev) => {
      if (field === 'docType') {
        return {
          ...prev,
          docType: value,
          inscricao: formatClientInscricaoByDocType(prev.inscricao, value),
        }
      }
      if (field === 'inscricao') {
        return {
          ...prev,
          inscricao: formatClientInscricaoByDocType(value, prev.docType),
        }
      }
      if (field === 'cep') {
        return {
          ...prev,
          cep: formatCepValue(value),
        }
      }
      if (field === 'competenceStart') {
        return {
          ...prev,
          competenceStart: formatMonthYearInput(value),
        }
      }
      return { ...prev, [field]: value }
    })
  }

  const handleClientCepBlur = async (rawValue) => {
    if (clientMode === 'view') return
    const cepDigits = String(rawValue ?? clientForm.cep ?? '').replace(/\D/g, '')
    if (!cepDigits) {
      setClientCepLookupMessage('')
      return
    }
    if (cepDigits.length !== 8) {
      setClientCepLookupMessage('CEP inválido. Use 8 números.')
      return
    }

    setClientCepLookupLoading(true)
    setClientCepLookupMessage('Consultando CEP...')

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cepDigits}/json/`)
      if (!response.ok) {
        throw new Error('Falha ao consultar CEP')
      }

      const data = await response.json()
      if (data.erro) {
        setClientCepLookupMessage('CEP não encontrado.')
        return
      }

      setClientForm((prev) => ({
        ...prev,
        cep: formatCepValue(cepDigits),
        endereco: data.logradouro || prev.endereco || '',
        bairro: data.bairro || prev.bairro || '',
        municipio: data.localidade || prev.municipio || '',
        uf: data.uf || prev.uf || '',
      }))
      setClientCepLookupMessage('Endereço preenchido pelo CEP.')
    } catch {
      setClientCepLookupMessage('Não foi possível consultar o CEP agora.')
    } finally {
      setClientCepLookupLoading(false)
    }
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

  const toggleClientChecklist = (item) => {
    setClientForm((prev) => {
      const current = Array.isArray(prev.checklist) ? prev.checklist : []
      const nextChecklist = current.includes(item)
        ? current.filter((entry) => entry !== item)
        : [...current, item]

      if (clientMode === 'view' && editingId !== null) {
        setClients((prevClients) =>
          prevClients.map((client) =>
            client.id === editingId ? { ...client, checklist: nextChecklist } : client,
          ),
        )
      }

      return { ...prev, checklist: nextChecklist }
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
    const normalizedCompetenceStart = formatMonthYearInput(String(clientForm.competenceStart || '').trim())
    const validCompetenceStart =
      parseMonthYearToMonthIndex(normalizedCompetenceStart) !== null
        ? normalizedCompetenceStart
        : formatMonthYearInput(getMonthYearFromIso(clientForm.dataInicio)) ||
          getMonthYearFromIso(getTodayIsoLocal())
    const payload = {
      ...clientForm,
      competenceStart: validCompetenceStart,
    }

    if (clientMode === 'edit' && editingId !== null) {
      setClients((prev) =>
        prev.map((client) => (client.id === editingId ? { ...payload, id: editingId } : client)),
      )
    } else {
      const nextId = clients.reduce((maxId, client) => Math.max(maxId, client.id), 0) + 1
      setClients((prev) => [...prev, { ...payload, id: nextId }])
    }

    setClientOpen(false)
    setGroupsOpen(false)
    setTaxOpen(false)
    setChecklistOpen(false)
    setEditingId(null)
    setClientMode('create')
    setClientForm({ ...emptyClientForm })
  }

  const handleBulkSave = () => {
    if (!canManageClients) return
    if (!selectedClientIds.length) return
    const selectedClientIdSet = new Set(selectedClientIds.map((id) => String(id)))
    setClients((prev) =>
      prev.map((client) => {
        if (!selectedClientIdSet.has(String(client.id))) return client
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

  const getMatchingTaskBlueprintsForClient = (client) => {
    if (!client) return []
    const clientUf = String(client.uf || '').trim().toUpperCase()
    const clientTaxation = String(client.tributacao || '').trim()
    const clientGroups = Array.isArray(client.grupos)
      ? client.grupos.map((group) => String(group || '').trim()).filter(Boolean)
      : []

    return taskBlueprints.filter((blueprint) => {
      const blueprintUf = String(blueprint.ufScope || 'Todos').trim().toUpperCase()
      const blueprintDepartment = String(blueprint.departmentScope || '').trim()
      const blueprintTaxations = (
        Array.isArray(blueprint.tributacaoScopes)
          ? blueprint.tributacaoScopes
          : blueprint.tributacaoScope
            ? [blueprint.tributacaoScope]
            : []
      )
        .map((item) => String(item || '').trim())
        .filter(Boolean)

      const matchesUf = blueprintUf === 'TODOS' || (clientUf && blueprintUf === clientUf)
      const matchesTaxation = !blueprintTaxations.length || blueprintTaxations.includes(clientTaxation)
      const matchesDepartment = !blueprintDepartment || clientGroups.includes(blueprintDepartment)
      const matchesChecklist = isBlueprintAllowedByClientChecklist(blueprint, client)
      return matchesUf && matchesTaxation && matchesDepartment && matchesChecklist
    })
  }

  const buildTaskDuplicateKey = ({
    subject,
    clientName,
    clientDocument,
    department,
    competence,
    actionDate,
    metaDate,
    dueDate,
  }) =>
    [
      subject,
      clientName,
      clientDocument,
      getDepartmentLabel(department),
      competence,
      actionDate,
      metaDate,
      dueDate,
    ].join('|')

  const closeClientTaskGenerateModal = () => {
    setClientTaskGenerateOpen(false)
    setClientTaskGenerateClients([])
    setClientTaskGenerateMode('generate')
    setClientTaskGenerateForm(getEmptyClientTaskGenerateForm())
    setClientTaskGenerateFeedback('')
  }

  const handleClientTaskGenerateFormChange = (field, value) => {
    setClientTaskGenerateForm((prev) => ({ ...prev, [field]: value }))
    if (clientTaskGenerateFeedback) {
      setClientTaskGenerateFeedback('')
    }
  }

  const toggleClientTaskGenerateBlueprint = (blueprintId) => {
    setClientTaskGenerateForm((prev) => {
      const current = Array.isArray(prev.blueprintIds) ? prev.blueprintIds : []
      const nextIds = current.includes(blueprintId)
        ? current.filter((id) => id !== blueprintId)
        : [...current, blueprintId]
      return { ...prev, blueprintIds: nextIds }
    })
    if (clientTaskGenerateFeedback) {
      setClientTaskGenerateFeedback('')
    }
  }

  const toggleClientTaskGenerateAllBlueprints = () => {
    const availableIds = clientTaskGenerateAvailableBlueprints.map((blueprint) => blueprint.id)
    setClientTaskGenerateForm((prev) => ({
      ...prev,
      blueprintIds:
        availableIds.length &&
        availableIds.every((blueprintId) => (prev.blueprintIds || []).includes(blueprintId))
          ? []
          : availableIds,
    }))
    if (clientTaskGenerateFeedback) {
      setClientTaskGenerateFeedback('')
    }
  }

  const getMatchingTaskBlueprintsForClients = (clientsList) => {
    const uniqueBlueprints = new Map()
    clientsList.forEach((client) => {
      getMatchingTaskBlueprintsForClient(client).forEach((blueprint) => {
        uniqueBlueprints.set(blueprint.id, blueprint)
      })
    })
    return Array.from(uniqueBlueprints.values())
  }

  const openClientTaskGenerateModal = (clientsList, mode = 'generate') => {
    if (!canManageClientTaskGeneration) return
    const targetClients = Array.isArray(clientsList) ? clientsList.filter(Boolean) : []
    if (!targetClients.length) return

    const matchedBlueprints = getMatchingTaskBlueprintsForClients(targetClients)
    const firstCompetenceByClient = targetClients
      .map((client) => getClientCompetenceStartMonthIndex(client))
      .filter((monthIndex) => typeof monthIndex === 'number' && !Number.isNaN(monthIndex))
    const startMonthIndex =
      firstCompetenceByClient.length > 0
        ? Math.min(...firstCompetenceByClient)
        : getMonthIndexFromIso(getTodayIsoLocal())
    const baseStartIso =
      typeof startMonthIndex === 'number'
        ? buildIsoDateFromMonthIndexAndDay(startMonthIndex, 1)
        : getTodayIsoLocal()
    const defaults = {
      ...getEmptyClientTaskGenerateForm(),
      startDate: getMonthStartIso(baseStartIso),
      endDate: getMonthEndIso(baseStartIso),
    }

    setClientTaskGenerateClients(targetClients)
    setClientTaskGenerateMode(mode)
    setClientTaskGenerateForm({
      ...defaults,
      blueprintIds: matchedBlueprints.map((blueprint) => blueprint.id),
    })
    setClientTaskGenerateFeedback('')
    setClientTaskGenerateOpen(true)
  }

  const generateTasksForClient = (client) => {
    openClientTaskGenerateModal([client], 'generate')
  }

  const deleteTasksForClient = (client) => {
    openClientTaskGenerateModal([client], 'delete')
  }

  const generateTasksForSelectedClients = () => {
    const selectedClientIdSet = new Set(selectedClientIds.map((id) => String(id)))
    const selectedClients = clientsForCurrentUser.filter((client) =>
      selectedClientIdSet.has(String(client.id)),
    )
    openClientTaskGenerateModal(selectedClients, 'generate')
  }

  const deleteTasksForSelectedClients = () => {
    const selectedClientIdSet = new Set(selectedClientIds.map((id) => String(id)))
    const selectedClients = clientsForCurrentUser.filter((client) =>
      selectedClientIdSet.has(String(client.id)),
    )
    openClientTaskGenerateModal(selectedClients, 'delete')
  }

  const confirmClientTaskGeneration = () => {
    if (!canManageClientTaskGeneration) return
    const targetClients = Array.isArray(clientTaskGenerateClients)
      ? clientTaskGenerateClients.filter(Boolean)
      : []
    if (!targetClients.length) return

    if (!clientTaskGenerateForm.startDate || !clientTaskGenerateForm.endDate) {
      setClientTaskGenerateFeedback('Informe a data inicial e a data final.')
      return
    }

    if (clientTaskGenerateForm.startDate > clientTaskGenerateForm.endDate) {
      setClientTaskGenerateFeedback('A data final deve ser maior ou igual à data inicial.')
      return
    }

    const matchedBlueprints = getMatchingTaskBlueprintsForClients(targetClients)
    if (!matchedBlueprints.length) {
      setClientTaskGenerateFeedback(
        'Nenhuma tarefa cadastrada compatível com UF/Tributação/Departamento foi encontrada.',
      )
      return
    }

    const selectedBlueprintIds = Array.isArray(clientTaskGenerateForm.blueprintIds)
      ? clientTaskGenerateForm.blueprintIds
      : []
    const selectedBlueprints = matchedBlueprints.filter((blueprint) =>
      selectedBlueprintIds.includes(blueprint.id),
    )

    if (!selectedBlueprints.length) {
      setClientTaskGenerateFeedback(
        `Selecione ao menos uma tarefa para ${clientTaskGenerateMode === 'delete' ? 'excluir' : 'gerar'}.`,
      )
      return
    }

    const startMonthIndex = getMonthIndexFromIso(clientTaskGenerateForm.startDate)
    const endMonthIndex = getMonthIndexFromIso(clientTaskGenerateForm.endDate)
    if (startMonthIndex === null || endMonthIndex === null) {
      setClientTaskGenerateFeedback('Período inválido para geração.')
      return
    }

    if (endMonthIndex - startMonthIndex + 1 <= 0) {
      setClientTaskGenerateFeedback('Período inválido para geração.')
      return
    }

    if (clientTaskGenerateMode === 'delete') {
      const selectedBlueprintById = new Map(selectedBlueprints.map((blueprint) => [blueprint.id, blueprint]))
      const targetClientIds = new Set(targetClients.map((client) => client.id))
      const targetClientNames = new Set(
        targetClients.map((client) => String(client.nome || '').trim().toLowerCase()),
      )
      let removedCount = 0

      const nextRows = tasksRows.filter((task) => {
        const actionIso = parseBrDateToIso(getTaggedReportDate(task.dates, 'A'))
        if (!actionIso) return true
        if (actionIso < clientTaskGenerateForm.startDate || actionIso > clientTaskGenerateForm.endDate) {
          return true
        }

        const hasClientMatch =
          (typeof task.clientId === 'number' && targetClientIds.has(task.clientId)) ||
          targetClientNames.has(String(task.client || '').trim().toLowerCase())
        if (!hasClientMatch) return true

        const directBlueprintId = task.blueprintId
        const directMatch =
          (typeof directBlueprintId === 'number' || typeof directBlueprintId === 'string') &&
          selectedBlueprintById.has(directBlueprintId)

        const fallbackMatch = selectedBlueprints.some((blueprint) => {
          const blueprintSubject = String(blueprint.subject || blueprint.obligation || '').trim()
          const blueprintDepartment = getDepartmentLabel(blueprint.departmentScope)
          return (
            String(task.subject || '').trim() === blueprintSubject &&
            getDepartmentLabel(task.dept) === blueprintDepartment
          )
        })

        if (!directMatch && !fallbackMatch) {
          return true
        }

        removedCount += 1
        return false
      })

      if (!removedCount) {
        setClientTaskGenerateFeedback('Nenhuma tarefa encontrada para exclusão no período selecionado.')
        return
      }

      const deleteConfirmed = window.confirm(
        [
          'Tem certeza que deseja excluir mensalmente essas tarefas?',
          '',
          `Clientes: ${targetClients.length}`,
          `Tarefas selecionadas: ${selectedBlueprints.length}`,
          `Período: ${parseIsoDateToBr(clientTaskGenerateForm.startDate)} até ${parseIsoDateToBr(clientTaskGenerateForm.endDate)}`,
          `Registros que serão excluídos: ${removedCount}`,
        ].join('\n'),
      )
      if (!deleteConfirmed) {
        setClientTaskGenerateFeedback('Exclusão mensal cancelada.')
        return
      }

      setTasksRows(nextRows)
      setTaskFilters(initialTaskFilters)
      setAppliedTaskFilters(initialTaskFilters)
      setTaskPage(1)
      closeClientTaskGenerateModal()

      window.alert(
        `${removedCount} tarefa(s) excluída(s) mensalmente para ${targetClients.length} cliente(s).`,
      )
      return
    }

    const loggedOwner =
      users.find((user) => user.email.trim().toLowerCase() === username.trim().toLowerCase())?.nome ||
      username ||
      'Não definido'

    const existingKeys = new Set(
      tasksRows.map((row) =>
        buildTaskDuplicateKey({
          subject: row.subject,
          clientName: row.client,
          clientDocument: row.cnpj,
          department: row.dept,
          competence: row.competence,
          actionDate: getTaggedReportDate(row.dates, 'A'),
          metaDate: getTaggedReportDate(row.dates, 'M'),
          dueDate: getTaggedReportDate(row.dates, 'V'),
        }),
      ),
    )

    let nextId = tasksRows.reduce((maxId, task) => Math.max(maxId, task.id), 0) + 1
    let skippedDuplicates = 0
    let clientsWithGeneration = 0
    const generatedRows = []

    targetClients.forEach((client) => {
      const clientSelectedBlueprints = getMatchingTaskBlueprintsForClient(client).filter((blueprint) =>
        selectedBlueprintIds.includes(blueprint.id),
      )
      if (!clientSelectedBlueprints.length) return

      let generatedForThisClient = 0
      const owner =
        String(client.contato || '').trim() || String(loggedOwner).trim() || 'Não definido'

      clientSelectedBlueprints.forEach((blueprint) => {
        const obligation = String(blueprint.obligation || '').trim()
        const complement = String(blueprint.complement || '').trim()
        const subject =
          String(blueprint.subject || '').trim() ||
          (complement ? `${obligation} - ${complement}` : obligation)
        const guests =
          String(blueprint.guests || '').trim() &&
          String(blueprint.guests || '').trim() !== 'Não definido'
            ? String(blueprint.guests || '').trim()
            : 'Não definido'

        const blueprintDepartment = String(blueprint.departmentScope || '').trim()
        const clientGroups = Array.isArray(client.grupos)
          ? client.grupos.map((group) => String(group || '').trim()).filter(Boolean)
          : []
        const dept = blueprintDepartment || clientGroups[0] || 'Fiscal'

        const actionDay = getDayOfMonthFromIso(blueprint.actionDate)
        const metaDay = getDayOfMonthFromIso(blueprint.metaDate)
        const dueDay = getDayOfMonthFromIso(blueprint.dueDate)
        const metaMonthOffset = getYearMonthOffset(blueprint.actionDate, blueprint.metaDate)
        const dueMonthOffset = getYearMonthOffset(blueprint.actionDate, blueprint.dueDate)
        const clientCompetenceMonthIndex = getClientCompetenceStartMonthIndex(client, blueprint.actionDate)
        const firstActionMonthIndex =
          clientCompetenceMonthIndex + (blueprint.competenceMode === 'Mês anterior' ? 1 : 0)
        const generationStartMonthIndex = Math.max(startMonthIndex, firstActionMonthIndex)

        if (generationStartMonthIndex > endMonthIndex) {
          return
        }

        for (
          let actionMonthIndex = generationStartMonthIndex;
          actionMonthIndex <= endMonthIndex;
          actionMonthIndex += 1
        ) {
          const actionIso = buildIsoDateFromMonthIndexAndDay(actionMonthIndex, actionDay)
          const metaIso = buildIsoDateFromMonthIndexAndDay(actionMonthIndex + metaMonthOffset, metaDay)
          const dueIso = buildIsoDateFromMonthIndexAndDay(actionMonthIndex + dueMonthOffset, dueDay)

          const actionBr = parseIsoDateToBr(actionIso)
          const metaBr = parseIsoDateToBr(metaIso)
          const dueBr = parseIsoDateToBr(dueIso)
          const competence = getCompetenceFromDate(actionIso, blueprint.competenceMode || 'Mesmo mês')
          const duplicateKey = buildTaskDuplicateKey({
            subject,
            clientName: client.nome,
            clientDocument: client.inscricao || `${client.docType || 'Documento'} não informado`,
            department: dept,
            competence,
            actionDate: actionBr,
            metaDate: metaBr,
            dueDate: dueBr,
          })

          if (existingKeys.has(duplicateKey)) {
            skippedDuplicates += 1
            continue
          }

          existingKeys.add(duplicateKey)

          const generatedStatus = getGeneratedTaskStatus(actionIso, metaIso, dueIso)
          const rowId = nextId
          nextId += 1

          generatedRows.push({
            id: rowId,
            status: generatedStatus.status,
            dept,
            subject,
            competence,
            client: client.nome,
            clientEmail: client.email || '',
            cnpj: client.inscricao || `${client.docType || 'Documento'} não informado`,
            clientStatus: client.status === 'Ativo' ? 'Ativo' : 'Desativado',
            dates: [`A: ${actionBr}`, `M: ${metaBr}`, `V: ${dueBr}`],
            deliveryDate: '',
            conclusionDate: '',
            owner,
            authorizer: owner,
            guests,
            tag: generatedStatus.tag,
            attachments: [],
            baixaAt: '',
            baixaAction: '',
            justification: '',
            emailSentAt: '',
            emailSentTo: '',
            generatedBySettings: true,
            competenceMode: blueprint.competenceMode || 'Mesmo mês',
            departmentScope: blueprintDepartment || '',
            ufScope: blueprint.ufScope || 'Todos',
            tributacaoScopes: Array.isArray(blueprint.tributacaoScopes)
              ? blueprint.tributacaoScopes
              : blueprint.tributacaoScope
                ? [blueprint.tributacaoScope]
                : [],
            blueprintId: blueprint.id,
            clientId: client.id,
          })
          generatedForThisClient += 1
        }
      })

      if (generatedForThisClient > 0) {
        clientsWithGeneration += 1
      }
    })

    if (!generatedRows.length) {
      setClientTaskGenerateFeedback(
        skippedDuplicates
          ? 'Nenhuma nova tarefa foi gerada. As tarefas selecionadas já existem para esse período.'
          : 'Nenhuma tarefa foi gerada para os critérios selecionados.',
      )
      return
    }

    setTasksRows((prev) => [...generatedRows, ...prev])
    setTaskFilters(initialTaskFilters)
    setAppliedTaskFilters(initialTaskFilters)
    setTaskPage(1)
    closeClientTaskGenerateModal()

    window.alert(
      `${generatedRows.length} tarefa(s) gerada(s) para ${clientsWithGeneration} cliente(s).${skippedDuplicates ? ` ${skippedDuplicates} já existiam.` : ''}`,
    )
  }

  const requestDelete = (client) => {
    if (!canManageClients) return
    setPendingDelete([client])
    setConfirmOpen(true)
  }

  const requestBulkDelete = () => {
    if (!canManageClients) return
    if (!selectedClientIds.length) return
    const selectedClientIdSet = new Set(selectedClientIds.map((id) => String(id)))
    setPendingDelete(
      clientsForCurrentUser.filter((client) => selectedClientIdSet.has(String(client.id))),
    )
    setConfirmOpen(true)
  }

  const confirmDelete = () => {
    if (pendingDelete) {
      const idsToDelete = pendingDelete.map((client) => String(client.id))
      const idsToDeleteSet = new Set(idsToDelete)
      setClients((prev) => prev.filter((client) => !idsToDeleteSet.has(String(client.id))))
      setSelectedClientIds((prev) =>
        prev
          .map((id) => String(id))
          .filter((id) => !idsToDeleteSet.has(id)),
      )
    }
    setPendingDelete(null)
    setConfirmOpen(false)
  }

  const cancelDelete = () => {
    setPendingDelete(null)
    setConfirmOpen(false)
  }

  const toggleSelectAll = () => {
    const visibleClientIds = filteredClients.map((client) => String(client.id))
    if (!visibleClientIds.length) return

    const selectedSet = new Set(selectedClientIds.map((id) => String(id)))
    const allVisibleSelected = visibleClientIds.every((id) => selectedSet.has(id))
    if (allVisibleSelected) {
      const visibleSet = new Set(visibleClientIds)
      setSelectedClientIds((prev) =>
        prev
          .map((id) => String(id))
          .filter((id) => !visibleSet.has(id)),
      )
      return
    }

    setSelectedClientIds((prev) => Array.from(new Set([...prev.map((id) => String(id)), ...visibleClientIds])))
  }

  const toggleSelectClient = (clientId) => {
    const normalizedClientId = String(clientId)
    setSelectedClientIds((prev) => {
      const normalized = prev.map((id) => String(id))
      return normalized.includes(normalizedClientId)
        ? normalized.filter((id) => id !== normalizedClientId)
        : [...normalized, normalizedClientId]
    })
  }

  const getForcedTaskTypeByScreen = (targetScreen) => {
    if (targetScreen === 'reports') return 'Tarefa'
    if (targetScreen === 'solicitations') return 'Solicitação'
    return ''
  }

  const normalizeTaskFiltersForScreen = (filters, targetScreen) => {
    const forcedTaskType = getForcedTaskTypeByScreen(targetScreen || screen)
    if (!forcedTaskType) return filters
    return {
      ...filters,
      taskType: forcedTaskType,
    }
  }

  const openObligationsScreen = () => {
    const nextTaskFilters = normalizeTaskFiltersForScreen(taskFilters, 'reports')
    const nextAppliedTaskFilters = normalizeTaskFiltersForScreen(appliedTaskFilters, 'reports')
    setTaskFilters(nextTaskFilters)
    setAppliedTaskFilters(nextAppliedTaskFilters)
    setTaskPage(1)
    setScreen('reports')
  }

  const openSolicitationsScreen = () => {
    const nextTaskFilters = normalizeTaskFiltersForScreen(taskFilters, 'solicitations')
    const nextAppliedTaskFilters = normalizeTaskFiltersForScreen(appliedTaskFilters, 'solicitations')
    setTaskFilters(nextTaskFilters)
    setAppliedTaskFilters(nextAppliedTaskFilters)
    setTaskPage(1)
    setScreen('solicitations')
  }

  const handleTaskFilterChange = (field, value) => {
    setTaskFilters((prev) => ({ ...prev, [field]: value }))
  }

  const applyTaskFilters = () => {
    const nextTaskFilters = normalizeTaskFiltersForScreen(taskFilters)
    setTaskFilters(nextTaskFilters)
    setAppliedTaskFilters(nextTaskFilters)
    setTaskPage(1)
  }

  const clearTaskFilters = () => {
    const nextTaskFilters = normalizeTaskFiltersForScreen(initialTaskFilters)
    setTaskFilters(nextTaskFilters)
    setAppliedTaskFilters(nextTaskFilters)
    setTaskPage(1)
  }

  const handleOverviewFilterChange = (field, value) => {
    setOverviewFilters((prev) => ({ ...prev, [field]: value }))
  }

  const applyOverviewFilters = () => {
    setAppliedOverviewFilters(overviewFilters)
  }

  const clearOverviewFilters = () => {
    setOverviewFilters(initialOverviewFilters)
    setAppliedOverviewFilters(initialOverviewFilters)
  }

  const handleClientTableFilterChange = (field, value) => {
    setClientTableFilters((prev) => ({ ...prev, [field]: value }))
  }

  const applyClientTableFilters = () => {
    setAppliedClientTableFilters(clientTableFilters)
  }

  const clearClientTableFilters = () => {
    setClientTableFilters(initialClientTableFilters)
    setAppliedClientTableFilters(initialClientTableFilters)
  }

  const handleTaskBlueprintFilterChange = (field, value) => {
    setTaskBlueprintFilters((prev) => ({ ...prev, [field]: value }))
  }

  const applyTaskBlueprintFilters = () => {
    setAppliedTaskBlueprintFilters(taskBlueprintFilters)
  }

  const clearTaskBlueprintFilters = () => {
    setTaskBlueprintFilters(initialTaskBlueprintFilters)
    setAppliedTaskBlueprintFilters(initialTaskBlueprintFilters)
  }

  const openControlPanelDrilldown = (groupName, departmentName, bucket) => {
    const taskType = groupName === 'Solicitações' ? 'Solicitação' : 'Tarefa'
    const nextFilters = {
      ...initialTaskFilters,
      taskType,
      department: departmentName || 'Todos',
      statusBucket: bucket,
    }
    setTaskFilters(nextFilters)
    setAppliedTaskFilters(nextFilters)
    setTaskPage(1)
    setScreen(groupName === 'Solicitações' ? 'solicitations' : 'reports')
  }

  const getResponsibleByClientAndDepartment = ({
    clientId,
    clientName,
    department,
    fallback = '',
  }) => {
    const normalizedDepartment = getDepartmentLabel(department)
    if (!normalizedDepartment) {
      return String(fallback || '').trim()
    }

    const normalizedClientId =
      clientId !== null && clientId !== undefined && String(clientId).trim() !== ''
        ? String(clientId)
        : String(
            clientsForCurrentUser.find(
              (client) =>
                String(client.nome || '').trim().toLowerCase() ===
                String(clientName || '').trim().toLowerCase(),
            )?.id || '',
          )

    if (!normalizedClientId) {
      return String(fallback || '').trim()
    }

    const assignedUser = users.find((user) => {
      const userDepartment = getDepartmentLabel(user.departamento)
      const userClientIds = Array.isArray(user.clientIds)
        ? user.clientIds.map((id) => String(id))
        : []
      return userDepartment === normalizedDepartment && userClientIds.includes(normalizedClientId)
    })

    return String(assignedUser?.nome || fallback || '').trim()
  }

  const mapSolicitationRecordToReportRow = (record) => {
    const linkedClient = clientsForCurrentUser.find((client) => client.id === record.clientId)
    const clientDocument = linkedClient
      ? `${linkedClient.docType || ''} ${linkedClient.inscricao || ''}`.trim()
      : ''

    return {
      id: record.id,
      status: record.status || record.etapa || 'Aberta',
      dept: normalizeSolicitationDepartment(record.departamento),
      subject: record.assunto || record.processo || 'Solicitação',
      competence: getCompetenceFromDate(record.actionDate, 'Mesmo mês'),
      client: record.clientName || linkedClient?.nome || '',
      clientId: linkedClient?.id || record.clientId || null,
      clientEmail: linkedClient?.email || '',
      cnpj: clientDocument,
      clientStatus: linkedClient?.status || 'Ativo',
      dates: [
        `A: ${parseIsoDateToBr(record.actionDate)}`,
        `M: ${parseIsoDateToBr(record.metaDate)}`,
        `V: ${parseIsoDateToBr(record.dueDate)}`,
      ],
      deliveryDate: record.deliveryDate || '',
      conclusionDate: record.conclusionDate || '',
      owner: getResponsibleByClientAndDepartment({
        clientId: record.clientId,
        clientName: record.clientName || linkedClient?.nome || '',
        department: normalizeSolicitationDepartment(record.departamento),
        fallback: record.responsavel || '',
      }),
      authorizer: '',
      guests: record.convidados || 'Não definido',
      tag: record.tag || 'success',
      generatedBySettings: false,
      taskType: 'Solicitação',
      reportSource: 'solicitation',
      reportKey: `solicitation-${record.id}`,
      attachments: record.attachments || [],
      baixaAt: record.baixaAt || '',
      baixaAction: record.baixaAction || '',
      justification: record.justification || '',
      emailSentAt: record.emailSentAt || '',
      emailSentTo: record.emailSentTo || '',
    }
  }

  const selectedTask = selectedTaskRef
    ? selectedTaskRef.source === 'solicitation'
      ? (() => {
          const record = solicitationRecordsForCurrentUser.find((item) => item.id === selectedTaskRef.id)
          return record ? mapSolicitationRecordToReportRow(record) : null
        })()
      : (() => {
          const task = tasksRowsForCurrentUser.find((item) => item.id === selectedTaskRef.id)
          if (!task) return null
          const resolvedOwner = getResponsibleByClientAndDepartment({
            clientId: task.clientId,
            clientName: task.client,
            department: task.dept,
            fallback: task.owner,
          })
          return {
            ...task,
            owner: resolvedOwner || task.owner || '',
            authorizer: resolvedOwner || task.authorizer || task.owner || '',
            reportSource: 'task',
            reportKey: `task-${task.id}`,
            taskType: 'Tarefa',
            emailSentAt: task.emailSentAt || '',
            emailSentTo: task.emailSentTo || '',
            clientEmail: task.clientEmail || '',
          }
        })()
    : null
  const selectedTaskDisplayStatus = selectedTask ? getTaskDisplayStatus(selectedTask) : null

  const resolveTaskRecipientEmail = (task) => {
    if (!task) return ''
    if (String(task.clientEmail || '').trim()) return String(task.clientEmail || '').trim()

    const byId = task.clientId
      ? clientsForCurrentUser.find((client) => client.id === task.clientId)
      : null
    if (byId?.email) return String(byId.email).trim()

    const taskDocumentDigits = extractDigits(task.cnpj)
    if (taskDocumentDigits) {
      const byDocument = clientsForCurrentUser.find(
        (client) => extractDigits(client.inscricao) === taskDocumentDigits,
      )
      if (byDocument?.email) return String(byDocument.email).trim()
    }

    const taskClientName = String(task.client || '').trim().toLowerCase()
    if (taskClientName) {
      const byName = clientsForCurrentUser.find(
        (client) => String(client.nome || '').trim().toLowerCase() === taskClientName,
      )
      if (byName?.email) return String(byName.email).trim()
    }

    return ''
  }

  const selectedTaskRecipientEmail = selectedTask ? resolveTaskRecipientEmail(selectedTask) : ''
  const isTaskEmailSent = Boolean(selectedTask?.emailSentAt)

  const logTaskAction = (task, action) => {
    const timestamp = getNowBrTimestamp()
    if (!task) return timestamp
    const source = task.reportSource || 'task'
    setTaskActionLogs((prev) =>
      [
        {
          id: `${Date.now()}-${Math.random()}`,
          taskId: task.id,
          taskSource: source,
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
    if (task.reportSource === 'solicitation') {
      setSolicitationRecords((prev) =>
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
      return
    }

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
    if (!selectedTaskRef) return
    if (selectedTaskRef.source === 'solicitation') {
      const fieldMap = {
        subject: 'assunto',
        owner: 'responsavel',
        justification: 'justification',
        deliveryDate: 'deliveryDate',
        conclusionDate: 'conclusionDate',
        status: 'status',
        tag: 'tag',
      }
      const mappedField = fieldMap[field] || field
      setSolicitationRecords((prev) =>
        prev.map((item) =>
          item.id === selectedTaskRef.id
            ? {
                ...item,
                [mappedField]: value,
              }
            : item,
        ),
      )
      return
    }

    setTasksRows((prev) =>
      prev.map((item) => (item.id === selectedTaskRef.id ? { ...item, [field]: value } : item)),
    )
  }

  const updateTaskTaggedDate = (key, value) => {
    if (!selectedTaskRef) return
    if (selectedTaskRef.source === 'solicitation') {
      const isoValue = value.includes('/') ? parseBrDateToIso(value) : value
      const keyMap = { A: 'actionDate', M: 'metaDate', V: 'dueDate' }
      const mappedKey = keyMap[key]
      if (!mappedKey) return
      setSolicitationRecords((prev) =>
        prev.map((item) =>
          item.id === selectedTaskRef.id
            ? {
                ...item,
                [mappedKey]: isoValue,
              }
            : item,
        ),
      )
      return
    }

    setTasksRows((prev) =>
      prev.map((item) => {
        if (item.id !== selectedTaskRef.id) return item
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

  const openTaskDetail = (taskId, source = 'task') => {
    setSelectedTaskRef({ id: taskId, source })
    setTaskEditMode(false)
    setTaskActionError('')
    setScreen('task-detail')
  }

  const handleTaskAttachmentAdd = async (event) => {
    if (!selectedTaskRef) return
    const files = Array.from(event.target.files || [])
    if (!files.length) return

    const mappedFiles = await Promise.all(
      files.map(async (file, index) => ({
        id: `${Date.now()}-${index}-${file.name}`,
        name: file.name,
        size: file.size,
        type: file.type,
        file,
        contentBase64: await fileToBase64(file),
      })),
    )
    if (selectedTaskRef.source === 'solicitation') {
      setSolicitationRecords((prev) =>
        prev.map((item) =>
          item.id === selectedTaskRef.id
            ? {
                ...item,
                attachments: [...(item.attachments || []), ...mappedFiles],
              }
            : item,
        ),
      )
    } else {
      setTasksRows((prev) =>
        prev.map((item) =>
          item.id === selectedTaskRef.id
            ? {
                ...item,
                attachments: [...(item.attachments || []), ...mappedFiles],
              }
            : item,
        ),
      )
    }
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

  const updateSelectedTaskData = (updater) => {
    if (!selectedTaskRef) return
    if (selectedTaskRef.source === 'solicitation') {
      setSolicitationRecords((prev) =>
        prev.map((item) => (item.id === selectedTaskRef.id ? updater(item) : item)),
      )
      return
    }

    setTasksRows((prev) => prev.map((item) => (item.id === selectedTaskRef.id ? updater(item) : item)))
  }

  const handleTaskSendEmail = async () => {
    if (!selectedTask) return
    if (!authSession?.token) {
      setTaskActionError('Faça login no backend para enviar e-mails.')
      return
    }

    const recipientEmail = selectedTaskRecipientEmail
    if (!recipientEmail) {
      setTaskActionError('Cliente sem e-mail cadastrado. Atualize o cadastro do cliente e tente novamente.')
      return
    }

    const newestAttachment = [...(selectedTask.attachments || [])]
      .reverse()
      .find((attachment) => attachment?.contentBase64 || attachment?.file)

    if (!newestAttachment) {
      setTaskActionError('Anexe um arquivo para enviar por e-mail.')
      return
    }

    try {
      setTaskEmailSending(true)
      let contentBase64 = newestAttachment.contentBase64 || ''

      if (!contentBase64) {
        if (!(newestAttachment.file instanceof File)) {
          setTaskActionError('O anexo não está disponível para envio. Reanexe o arquivo e tente novamente.')
          return
        }

        contentBase64 = await fileToBase64(newestAttachment.file)
        updateSelectedTaskData((item) => ({
          ...item,
          attachments: (item.attachments || []).map((attachment) =>
            attachment.id === newestAttachment.id ? { ...attachment, contentBase64 } : attachment,
          ),
        }))
      }

      await apiRequest('/tenant/send-task-email', {
        method: 'POST',
        token: authSession.token,
        body: {
          to: recipientEmail,
          subject: `Hive Tarefas - ${selectedTask.subject}`,
          message: `Envio automático da ${selectedTask.taskType || 'Tarefa'} #${selectedTask.id}.`,
          taskId: selectedTask.id,
          taskSource: selectedTask.reportSource || 'task',
          attachment: {
            name: newestAttachment.name || 'anexo',
            type: newestAttachment.type || 'application/octet-stream',
            contentBase64,
          },
        },
      })

      const sentAt = getNowBrTimestamp()
      updateSelectedTaskData((item) => ({
        ...item,
        emailSentAt: sentAt,
        emailSentTo: recipientEmail,
      }))
      logTaskAction(selectedTask, 'Enviar por E-mail')
      setTaskActionError('')
    } catch (error) {
      setTaskActionError(error.message || 'Não foi possível enviar o e-mail.')
    } finally {
      setTaskEmailSending(false)
    }
  }

  const handleTaskFinalize = () => {
    if (!selectedTask) return
    const entity = selectedTask.reportSource === 'solicitation' ? 'solicitação' : 'tarefa'
    const hasAttachment = Boolean(selectedTask.attachments?.length)
    const hasJustification = Boolean((selectedTask.justification || '').trim())
    if (!hasAttachment && !hasJustification) {
      setTaskActionError(`Para finalizar a ${entity}, anexe um arquivo ou preencha a justificativa.`)
      return
    }
    registerTaskBaixa(selectedTask, 'Finalizar')
    if (selectedTask.reportSource === 'solicitation') {
      setSolicitationRecords((prev) =>
        prev.map((item) =>
          item.id === selectedTask.id
            ? {
                ...item,
                deliveryDate: getNowBrDate(),
                conclusionDate: getNowBrDate(),
                status: 'Finalizado',
                etapa: 'Concluída',
                tag: 'lime',
              }
            : item,
        ),
      )
    } else {
      setTasksRows((prev) =>
        prev.map((item) =>
          item.id === selectedTask.id
            ? {
                ...item,
                deliveryDate: getNowBrDate(),
                conclusionDate: getNowBrDate(),
                status: 'Finalizado',
                tag: 'lime',
              }
            : item,
        ),
      )
    }
    setTaskActionError('')
  }

  const handleTaskDispense = () => {
    if (!selectedTask) return
    const entity = selectedTask.reportSource === 'solicitation' ? 'solicitação' : 'tarefa'
    const hasAttachment = Boolean(selectedTask.attachments?.length)
    const hasJustification = Boolean((selectedTask.justification || '').trim())
    if (!hasAttachment && !hasJustification) {
      setTaskActionError(`Para dispensar a ${entity}, anexe um arquivo ou preencha a justificativa.`)
      return
    }
    registerTaskBaixa(selectedTask, 'Dispensar')
    if (selectedTask.reportSource === 'solicitation') {
      setSolicitationRecords((prev) =>
        prev.map((item) =>
          item.id === selectedTask.id
            ? {
                ...item,
                status: 'Dispensada',
                etapa: 'Dispensada',
                tag: 'gray',
                deliveryDate: getNowBrDate(),
                conclusionDate: getNowBrDate(),
              }
            : item,
        ),
      )
    } else {
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
    }
    setTaskActionError('')
  }

  const handleTaskEdit = () => {
    if (!selectedTask) return
    if (selectedTask.reportSource !== 'solicitation' && !canManageTaskBlueprints) {
      setTaskActionError('Somente administradores podem editar tarefas cadastradas.')
      return
    }
    if (!taskEditMode) {
      setTaskEditMode(true)
      return
    }
    registerTaskBaixa(selectedTask, 'Editar')
    setTaskEditMode(false)
  }

  const handleTaskDelete = () => {
    if (!selectedTask) return
    if (selectedTask.reportSource !== 'solicitation' && !canManageTaskBlueprints) {
      setTaskActionError('Somente administradores podem excluir tarefas cadastradas.')
      return
    }
    const entity = selectedTask.reportSource === 'solicitation' ? 'solicitação' : 'tarefa'
    const shouldDelete = window.confirm(
      `Deseja excluir a ${entity} #${selectedTask.id} (${selectedTask.subject})?`,
    )
    if (!shouldDelete) return
    logTaskAction(selectedTask, 'Excluir')
    if (selectedTask.reportSource === 'solicitation') {
      setSolicitationRecords((prev) => prev.filter((item) => item.id !== selectedTask.id))
    } else {
      setTasksRows((prev) => prev.filter((item) => item.id !== selectedTask.id))
    }
    setSelectedTaskRef(null)
    setTaskEditMode(false)
    setScreen('tasks')
  }

  const goBackToTasks = () => {
    setTaskEditMode(false)
    setTaskActionError('')
    setScreen('reports')
  }

  const getClientsByDepartment = (department) => {
    const normalizedDepartment = getDepartmentLabel(department)
    if (!normalizedDepartment) return []
    return clientsForCurrentUser.filter((client) =>
      (Array.isArray(client.grupos) ? client.grupos : [])
        .map((group) => getDepartmentLabel(String(group || '').trim()))
        .includes(normalizedDepartment),
    )
  }

  const handleSettingsUserChange = (field, value) => {
    if (!canManageTenantUsers) return

    if (field === 'departamento') {
      setUserClientsOpen(false)
    }
    setUserForm((prev) => {
      if (field === 'departamento') {
        const allowedClientIds = new Set(
          getClientsByDepartment(value).map((client) => String(client.id)),
        )
        const currentClientIds = Array.isArray(prev.clientIds)
          ? prev.clientIds.map((id) => String(id))
          : []
        return {
          ...prev,
          departamento: value,
          clientIds: currentClientIds.filter((id) => allowedClientIds.has(id)),
        }
      }

      if (field === 'clientIds') {
        return {
          ...prev,
          clientIds: Array.isArray(value) ? value.map((id) => String(id)) : [],
        }
      }

      return { ...prev, [field]: value }
    })
  }

  const toggleSettingsUserClient = (clientId) => {
    if (!canManageTenantUsers) return

    const normalizedClientId = String(clientId)
    setUserForm((prev) => {
      const current = Array.isArray(prev.clientIds) ? prev.clientIds.map((id) => String(id)) : []
      if (current.includes(normalizedClientId)) {
        return { ...prev, clientIds: current.filter((id) => id !== normalizedClientId) }
      }
      return { ...prev, clientIds: [...current, normalizedClientId] }
    })
  }

  const clearSettingsUserForm = () => {
    if (!canManageTenantUsers) return

    setEditingUserId(null)
    setUserForm(emptyUserForm)
    setSettingsUserFeedback('')
    setUserClientsOpen(false)
  }

  const handleSettingsUserSave = async (event) => {
    event.preventDefault()
    if (!canManageTenantUsers) {
      setSettingsUserFeedback('Somente o administrador pode gerenciar usuários.')
      return
    }

    if (!authSession?.token) {
      setSettingsUserFeedback('Faça login novamente para cadastrar usuários.')
      return
    }

    const nome = userForm.nome.trim()
    const departamento = userForm.departamento.trim()
    const telefone = userForm.telefone.trim()
    const email = userForm.email.trim().toLowerCase()
    const senha = userForm.senha
    const eligibleClientIds = new Set(
      getClientsByDepartment(departamento).map((client) => String(client.id)),
    )
    const clientIds = (Array.isArray(userForm.clientIds) ? userForm.clientIds.map((id) => String(id)) : []).filter((id) =>
      eligibleClientIds.has(id),
    )

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

    try {
      if (editingUserId !== null) {
        const currentUser = users.find((user) => user.id === editingUserId)
        const authUserId = String(currentUser?.authUserId || currentUser?.id || '')
        const currentRole =
          currentUser?.role === 'TENANT_ADMIN' || currentUser?.role === 'TENANT_USER'
            ? currentUser.role
            : 'TENANT_USER'
        if (!authUserId) {
          setSettingsUserFeedback('Usuário sem vínculo de autenticação. Recarregue a tela e tente novamente.')
          return
        }

        const updatedAuthUser = await apiRequest(`/tenant/users/${authUserId}`, {
          method: 'PATCH',
          token: authSession.token,
          body: {
            name: nome,
            email,
            password: senha,
            clientIds,
            role: currentRole,
            isActive: true,
          },
        })

        setUsers((prev) =>
          prev.map((user) =>
            user.id === editingUserId
              ? {
                  ...user,
                  id: String(updatedAuthUser.id || editingUserId),
                  authUserId: String(updatedAuthUser.id || authUserId),
                  nome,
                  departamento,
                  telefone,
                  email: updatedAuthUser.email || email,
                  senha,
                  clientIds: Array.isArray(updatedAuthUser.clientIds)
                    ? updatedAuthUser.clientIds.map((id) => String(id))
                    : clientIds,
                  role: updatedAuthUser.role || 'TENANT_USER',
                  isActive: updatedAuthUser.isActive !== false,
                }
              : user,
          ),
        )
        setSettingsUserFeedback('Usuário atualizado com sucesso.')
      } else {
        const createdAuthUser = await apiRequest('/tenant/users', {
          method: 'POST',
          token: authSession.token,
          body: {
            name: nome,
            email,
            password: senha,
            clientIds,
            role: 'TENANT_USER',
            isActive: true,
          },
        })

        const createdId = String(createdAuthUser.id || `${Date.now()}`)
        setUsers((prev) => [
          ...prev,
          {
            id: createdId,
            authUserId: createdId,
            nome,
            departamento,
            telefone,
            email: createdAuthUser.email || email,
            senha,
            clientIds: Array.isArray(createdAuthUser.clientIds)
              ? createdAuthUser.clientIds.map((id) => String(id))
              : clientIds,
            role: createdAuthUser.role || 'TENANT_USER',
            isActive: createdAuthUser.isActive !== false,
          },
        ])
        setSettingsUserFeedback('Usuário cadastrado com sucesso.')
      }

      setEditingUserId(null)
      setUserForm(emptyUserForm)
      setUserClientsOpen(false)
    } catch (saveError) {
      setSettingsUserFeedback(saveError?.message || 'Não foi possível salvar o usuário.')
    }
  }

  const editSettingsUser = (user) => {
    if (!canManageTenantUsers) {
      setSettingsUserFeedback('Somente o administrador pode gerenciar usuários.')
      return
    }

    const allowedClientIds = new Set(
      getClientsByDepartment(user.departamento).map((client) => String(client.id)),
    )
    const currentClientIds = Array.isArray(user.clientIds)
      ? user.clientIds.map((id) => String(id))
      : []
    setEditingUserId(user.id)
    setUserForm({
      nome: user.nome || '',
      departamento: user.departamento || '',
      telefone: user.telefone || '',
      email: user.email || '',
      senha: user.senha || '',
      clientIds: currentClientIds.filter((id) => allowedClientIds.has(id)),
    })
    setSettingsUserFeedback('')
    setUserClientsOpen(false)
  }

  const removeSettingsUser = async (userId) => {
    if (!canManageTenantUsers) {
      setSettingsUserFeedback('Somente o administrador pode gerenciar usuários.')
      return
    }

    if (!authSession?.token) {
      setSettingsUserFeedback('Faça login novamente para excluir usuários.')
      return
    }

    const targetUser = users.find((user) => user.id === userId)
    if (!targetUser) return
    const canDelete = window.confirm(`Deseja excluir o usuário ${targetUser.email}?`)
    if (!canDelete) return
    const authUserId = String(targetUser.authUserId || targetUser.id || '')
    if (!authUserId) {
      setSettingsUserFeedback('Usuário sem vínculo de autenticação. Recarregue a tela e tente novamente.')
      return
    }

    try {
      await apiRequest(`/tenant/users/${authUserId}`, {
        method: 'DELETE',
        token: authSession.token,
      })
      setUsers((prev) => prev.filter((user) => user.id !== userId))
      if (editingUserId === userId) {
        setEditingUserId(null)
        setUserForm(emptyUserForm)
        setUserClientsOpen(false)
      }
      setSettingsUserFeedback('Usuário excluído com sucesso.')
    } catch (deleteError) {
      setSettingsUserFeedback(deleteError?.message || 'Não foi possível excluir o usuário.')
    }
  }

  const handleSettingsTaskChange = (field, value) => {
    setSettingsTaskForm((prev) => ({ ...prev, [field]: value }))
  }

  const toggleSettingsTaskTaxation = (taxation) => {
    setSettingsTaskForm((prev) => {
      const current = Array.isArray(prev.tributacaoScopes) ? prev.tributacaoScopes : []
      if (current.includes(taxation)) {
        return { ...prev, tributacaoScopes: current.filter((item) => item !== taxation) }
      }
      return { ...prev, tributacaoScopes: [...current, taxation] }
    })
  }

  const handleSolicitationChange = (field, value) => {
    setSolicitationForm((prev) => ({ ...prev, [field]: value }))
  }

  const toggleSolicitationClient = (clientId) => {
    const normalizedClientId = String(clientId)
    setSolicitationForm((prev) => {
      const current = Array.isArray(prev.clientIds) ? prev.clientIds.map((id) => String(id)) : []
      if (current.includes(normalizedClientId)) {
        return { ...prev, clientIds: current.filter((id) => id !== normalizedClientId) }
      }
      return { ...prev, clientIds: [...current, normalizedClientId] }
    })
  }

  const handleSolicitationAttachments = (event) => {
    const files = Array.from(event.target.files || [])
    if (!files.length) return
    setSolicitationForm((prev) => ({
      ...prev,
      attachments: [...prev.attachments, ...files],
    }))
    event.target.value = ''
  }

  const removeSolicitationAttachment = (fileName, fileSize) => {
    setSolicitationForm((prev) => ({
      ...prev,
      attachments: prev.attachments.filter(
        (file) => !(file.name === fileName && file.size === fileSize),
      ),
    }))
  }

  const addSolicitationClientBySearch = (clientId) => {
    const normalizedClientId = String(clientId)
    setSolicitationForm((prev) => {
      const current = Array.isArray(prev.clientIds) ? prev.clientIds.map((id) => String(id)) : []
      if (current.includes(normalizedClientId)) {
        return prev
      }
      return { ...prev, clientIds: [...current, normalizedClientId] }
    })
    setSolicitationClientSearch('')
  }

  const _toggleSettingsTaskClient = (clientId) => {
    const normalizedClientId = String(clientId)
    setSettingsTaskForm((prev) => {
      const current = Array.isArray(prev.clientIds) ? prev.clientIds.map((id) => String(id)) : []
      if (current.includes(normalizedClientId)) {
        return { ...prev, clientIds: current.filter((id) => id !== normalizedClientId) }
      }
      return { ...prev, clientIds: [...current, normalizedClientId] }
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
    setEditingTaskBlueprintId(null)
    setSettingsTaskTaxOpen(false)
    setSettingsTaskForm(getEmptySettingsTaskForm())
    setSettingsTaskFeedback('')
  }

  const editTaskBlueprint = (blueprint) => {
    if (!canManageTaskBlueprints) {
      setSettingsTaskFeedback('Somente administradores podem editar tarefas cadastradas.')
      return
    }
    if (!blueprint) return
    setEditingTaskBlueprintId(blueprint.id)
    setSettingsTaskFeedback('')
    setSettingsTaskForm({
      ...getEmptySettingsTaskForm(),
      actionDate: blueprint.actionDate || getTodayIsoLocal(),
      metaDate: blueprint.metaDate || getTodayIsoLocal(),
      dueDate: blueprint.dueDate || getTodayIsoLocal(),
      obligation: blueprint.obligation || '',
      complement: blueprint.complement || '',
      installments: Number(blueprint.installments) || 1,
      competenceMode: blueprint.competenceMode || 'Mesmo mês',
      departmentScope: blueprint.departmentScope || '',
      ufScope: blueprint.ufScope || 'Todos',
      tributacaoScopes: Array.isArray(blueprint.tributacaoScopes)
        ? blueprint.tributacaoScopes
        : blueprint.tributacaoScope
          ? [blueprint.tributacaoScope]
          : [],
      includeDisabledClients: false,
      attachments: [],
      guests: blueprint.guests && blueprint.guests !== 'Não definido' ? blueprint.guests : '',
    })
    setSettingsTaskTaxOpen(false)
    setCreateOpen(false)
    setTaskCreateOpen(true)
  }

  const deleteTaskBlueprint = (blueprintId) => {
    if (!canManageTaskBlueprints) {
      setSettingsTaskFeedback('Somente administradores podem excluir tarefas cadastradas.')
      return
    }
    const blueprint = taskBlueprints.find((item) => item.id === blueprintId)
    if (!blueprint) return
    const canDelete = window.confirm(
      `Tem certeza que deseja excluir o cadastro da tarefa "${blueprint.subject || blueprint.obligation}"?`,
    )
    if (!canDelete) return
    setTaskBlueprints((prev) => prev.filter((item) => item.id !== blueprintId))
    if (editingTaskBlueprintId === blueprintId) {
      clearSettingsTaskForm()
    }
  }

  const handleSettingsTaskSave = (event) => {
    event.preventDefault()
    if (!canCreateTaskBlueprints) {
      setSettingsTaskFeedback('Somente administradores podem cadastrar tarefas.')
      return
    }

    const obligation = settingsTaskForm.obligation.trim()
    const loggedOwner =
      users.find((user) => user.email.trim().toLowerCase() === username.trim().toLowerCase())?.nome ||
      username ||
      'Não definido'
    const owner = String(loggedOwner).trim() || 'Não definido'
    const installments = Number(settingsTaskForm.installments) || 1

    if (!settingsTaskForm.actionDate || !settingsTaskForm.metaDate || !settingsTaskForm.dueDate) {
      setSettingsTaskFeedback('Preencha Ação, Meta e Vencimento.')
      return
    }

    if (!obligation) {
      setSettingsTaskFeedback('Informe a Obrigação para gerar as tarefas.')
      return
    }

    if (!String(settingsTaskForm.departmentScope || '').trim()) {
      setSettingsTaskFeedback('Selecione o Departamento da tarefa.')
      return
    }

    const selectedDepartment = String(settingsTaskForm.departmentScope || '').trim()
    const selectedUf = (settingsTaskForm.ufScope || 'Todos').trim().toUpperCase()
    const selectedTaxations = (
      Array.isArray(settingsTaskForm.tributacaoScopes)
        ? settingsTaskForm.tributacaoScopes
        : settingsTaskForm.tributacaoScope
          ? [settingsTaskForm.tributacaoScope]
          : []
    )
      .map((item) => String(item || '').trim())
      .filter(Boolean)
    const complement = settingsTaskForm.complement.trim()
    const subject = complement ? `${obligation} - ${complement}` : obligation
    const targetClients = settingsTaskClients.filter((client) => {
      const clientUf = String(client.uf || '').trim().toUpperCase()
      const clientTaxation = String(client.tributacao || '').trim()
      const clientGroups = Array.isArray(client.grupos)
        ? client.grupos.map((group) => String(group || '').trim())
        : []
      const matchesUf = selectedUf === 'TODOS' || clientUf === selectedUf
      const matchesTaxation = !selectedTaxations.length || selectedTaxations.includes(clientTaxation)
      const matchesDepartment = clientGroups.includes(selectedDepartment)
      const matchesChecklist = isBlueprintAllowedByClientChecklist(
        {
          obligation,
          complement,
          subject,
        },
        client,
      )
      return matchesUf && matchesTaxation && matchesDepartment && matchesChecklist
    })

    const guests = settingsTaskForm.guests.trim() || 'Não definido'
    const ufScope = settingsTaskForm.ufScope || 'Todos'
    const tributacaoScopes = selectedTaxations
    const actionDay = getDayOfMonthFromIso(settingsTaskForm.actionDate)
    const metaDay = getDayOfMonthFromIso(settingsTaskForm.metaDate)
    const dueDay = getDayOfMonthFromIso(settingsTaskForm.dueDate)
    const metaMonthOffset = getYearMonthOffset(settingsTaskForm.actionDate, settingsTaskForm.metaDate)
    const dueMonthOffset = getYearMonthOffset(settingsTaskForm.actionDate, settingsTaskForm.dueDate)
    const saveTaskBlueprint = (generatedCount, matchedClientsCount) => {
      setTaskBlueprints((prev) => {
        const payload = {
          id: editingTaskBlueprintId || `${Date.now()}-${Math.random()}`,
          obligation,
          complement,
          subject,
          installments,
          competenceMode: settingsTaskForm.competenceMode,
          departmentScope: selectedDepartment,
          actionDate: settingsTaskForm.actionDate,
          metaDate: settingsTaskForm.metaDate,
          dueDate: settingsTaskForm.dueDate,
          ufScope,
          tributacaoScopes,
          guests,
          createdAt:
            prev.find((item) => item.id === editingTaskBlueprintId)?.createdAt || getNowBrTimestamp(),
          generatedCount,
          matchedClientsCount,
        }
        if (editingTaskBlueprintId) {
          return prev.map((item) => (item.id === editingTaskBlueprintId ? payload : item))
        }
        return [payload, ...prev]
      })
    }

    if (!targetClients.length) {
      saveTaskBlueprint(0, 0)
      setSettingsTaskFeedback(
        'Cadastro salvo como modelo. Nenhum cliente compatível foi encontrado agora.',
      )
      setSettingsTaskForm({
        ...getEmptySettingsTaskForm(),
        actionDate: settingsTaskForm.actionDate,
        metaDate: settingsTaskForm.metaDate,
        dueDate: settingsTaskForm.dueDate,
      })
      setEditingTaskBlueprintId(null)
      setTaskCreateOpen(false)
      return
    }

    let nextId = tasksRows.reduce((maxId, task) => Math.max(maxId, task.id), 0) + 1
    const generatedRows = []

    targetClients.forEach((client) => {
      const clientCompetenceMonthIndex = getClientCompetenceStartMonthIndex(client, settingsTaskForm.actionDate)
      const firstActionMonthIndex =
        clientCompetenceMonthIndex + (settingsTaskForm.competenceMode === 'Mês anterior' ? 1 : 0)

      for (let step = 0; step < installments; step += 1) {
        const actionMonthIndex = firstActionMonthIndex + step
        const actionIso = buildIsoDateFromMonthIndexAndDay(actionMonthIndex, actionDay)
        const metaIso = buildIsoDateFromMonthIndexAndDay(actionMonthIndex + metaMonthOffset, metaDay)
        const dueIso = buildIsoDateFromMonthIndexAndDay(actionMonthIndex + dueMonthOffset, dueDay)

        const actionBr = parseIsoDateToBr(actionIso)
        const metaBr = parseIsoDateToBr(metaIso)
        const dueBr = parseIsoDateToBr(dueIso)
        const competence = getCompetenceFromDate(actionIso, settingsTaskForm.competenceMode)
        const generatedStatus = getGeneratedTaskStatus(actionIso, metaIso, dueIso)
        const dept = selectedDepartment
        const rowId = nextId
        nextId += 1

        generatedRows.push({
          id: rowId,
          status: generatedStatus.status,
          dept,
          subject,
          competence,
          client: client.nome,
          clientId: client.id,
          clientEmail: client.email || '',
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
          emailSentAt: '',
          emailSentTo: '',
          generatedBySettings: true,
          competenceMode: settingsTaskForm.competenceMode,
          departmentScope: selectedDepartment,
          ufScope,
          tributacaoScopes,
        })
      }
    })

    saveTaskBlueprint(generatedRows.length, targetClients.length)
    setTasksRows((prev) => [...generatedRows, ...prev])
    setSettingsTaskFeedback(
      `${generatedRows.length} tarefa(s) gerada(s) para ${targetClients.length} cliente(s).`,
    )
    setSettingsTaskForm({
      ...getEmptySettingsTaskForm(),
      actionDate: settingsTaskForm.actionDate,
      metaDate: settingsTaskForm.metaDate,
      dueDate: settingsTaskForm.dueDate,
    })
    setEditingTaskBlueprintId(null)
    setTaskFilters(initialTaskFilters)
    setAppliedTaskFilters(initialTaskFilters)
    setTaskPage(1)
    setTaskCreateOpen(false)
    setScreen('tasks')
  }

  const handleSolicitationSave = (event) => {
    event.preventDefault()

    const departamento = normalizeSolicitationDepartment(solicitationForm.departamento)
    const assunto = solicitationForm.assunto.trim()
    const andamento = solicitationForm.andamento.trim()
    const responsavel = solicitationForm.responsavel.trim()
    const selectedIds = Array.isArray(solicitationForm.clientIds) ? solicitationForm.clientIds : []

    if (!departamento) {
      setSolicitationFeedback('Informe o departamento da solicitação.')
      return
    }

    if (!assunto) {
      setSolicitationFeedback('Informe o assunto da solicitação.')
      return
    }

    if (!selectedIds.length) {
      setSolicitationFeedback('Selecione pelo menos um cliente para salvar a solicitação.')
      return
    }

    if (!solicitationForm.actionDate || !solicitationForm.metaDate || !solicitationForm.dueDate) {
      setSolicitationFeedback('Preencha Ação, Meta e Prazo.')
      return
    }

    if (!andamento) {
      setSolicitationFeedback('Informe o andamento da solicitação.')
      return
    }

    if (!responsavel) {
      setSolicitationFeedback('Informe o responsável da solicitação.')
      return
    }

    const selectedClientIdSet = new Set(selectedIds.map((id) => String(id)))
    const targetClients = clientsForCurrentUser.filter(
      (client) =>
        selectedClientIdSet.has(String(client.id)) &&
        (solicitationForm.includeDisabledClients || client.status !== 'Inativo'),
    )

    if (!targetClients.length) {
      setSolicitationFeedback('Nenhum cliente disponível para os filtros selecionados.')
      return
    }

    let nextId = solicitationRecords.reduce((maxId, record) => Math.max(maxId, record.id), 0) + 1
    const newRecords = targetClients.map((client) => {
      const record = {
        id: nextId,
        departamento,
        processo: solicitationForm.processo.trim(),
        etapa: solicitationForm.etapa.trim() || 'Aberta',
        assunto,
        clientId: client.id,
        clientName: client.nome,
        actionDate: solicitationForm.actionDate,
        metaDate: solicitationForm.metaDate,
        dueDate: solicitationForm.dueDate,
        andamento,
        responsavel,
        convidados: solicitationForm.convidados.trim(),
        attachments: solicitationForm.attachments.map((file, index) => ({
          id: `${nextId}-${index}-${file.name}`,
          name: file.name,
          size: file.size,
          type: file.type,
          file,
        })),
        notifyOpen: solicitationForm.notifyOpen,
        notifyEnd: solicitationForm.notifyEnd,
        notifyGuests: solicitationForm.notifyGuests,
        replicateSubtasks: solicitationForm.replicateSubtasks,
        iAmResponsible: solicitationForm.iAmResponsible,
        iAmAuthorizer: solicitationForm.iAmAuthorizer,
        status: '',
        tag: 'success',
        deliveryDate: '',
        conclusionDate: '',
        baixaAt: '',
        baixaAction: '',
        justification: '',
        emailSentAt: '',
        emailSentTo: '',
        createdAt: getNowBrTimestamp(),
      }
      nextId += 1
      return record
    })

    setSolicitationRecords((prev) => [...newRecords, ...prev])
    clearSolicitationForm()
    setSolicitationOpen(false)
    setScreen('dashboard')
  }

  const reportTaskRows = tasksRowsForCurrentUser.map((task) => {
    const resolvedOwner = getResponsibleByClientAndDepartment({
      clientId: task.clientId,
      clientName: task.client,
      department: task.dept,
      fallback: task.owner,
    })
    return {
      ...task,
      owner: resolvedOwner || task.owner || '',
      authorizer: resolvedOwner || task.authorizer || task.owner || '',
      taskType: 'Tarefa',
      reportSource: 'task',
      reportKey: `task-${task.id}`,
    }
  })
  const reportSolicitationRows = solicitationRecordsForCurrentUser.map((record) =>
    mapSolicitationRecordToReportRow(record),
  )
  const taskReportRows = [...reportTaskRows, ...reportSolicitationRows]

  const taskTypeOptions = ['Todos', 'Tarefa', 'Solicitação']
  const taskSubjectOptions = [
    'Todos',
    ...Array.from(new Set(taskReportRows.map((item) => item.subject).filter(Boolean))),
  ]
  const taskClientOptions = [
    'Todos',
    ...Array.from(new Set(taskReportRows.map((item) => item.client).filter(Boolean))),
  ]
  const taskDepartmentOptions = [
    'Todos',
    ...Array.from(
      new Set(taskReportRows.map((item) => getDepartmentLabel(item.dept)).filter(Boolean)),
    ),
  ]
  const taskStatusOptions = [
    'Todos',
    ...Array.from(new Set(taskReportRows.map((item) => getTaskDisplayStatus(item).status))),
  ]
  const taskClientStatusOptions = [
    'Todos',
    ...Array.from(new Set(taskReportRows.map((item) => item.clientStatus).filter(Boolean))),
  ]
  const taskOwnerOptions = [
    'Todos',
    ...Array.from(new Set(taskReportRows.map((item) => item.owner).filter(Boolean))),
  ]
  const settingsTaskObligationOptions = Array.from(
    new Set(
      [
        ...taskBlueprints.map((template) => String(template.obligation || '').trim()),
        ...tasksRowsForCurrentUser.map((task) => task.subject.split(' - ')[0]?.trim()),
      ].filter((value) => value && value.length > 0),
    ),
  )
  const settingsTaskClients = clientsForCurrentUser.filter(
    (client) => settingsTaskForm.includeDisabledClients || client.status !== 'Inativo',
  )
  const clientTaxationOptions = Array.from(
    new Set(clientsForCurrentUser.map((client) => (client.tributacao || '').trim()).filter(Boolean)),
  )
  const settingsTaskTaxationOptions = (clientTaxationOptions.length
    ? clientTaxationOptions
    : taxOptions
  ).filter(Boolean)
  const selectedSettingsTaskTaxations = Array.isArray(settingsTaskForm.tributacaoScopes)
    ? settingsTaskForm.tributacaoScopes
    : settingsTaskForm.tributacaoScope
      ? [settingsTaskForm.tributacaoScope]
      : []
  const settingsOwnerOptions = Array.from(
    new Set(users.map((user) => user.nome).concat(tasksRowsForCurrentUser.map((task) => task.owner))),
  ).filter(Boolean)
  const taskBlueprintRows = taskBlueprints.map((template) => {
    return {
      ...template,
      ufLabel: template.ufScope || 'Todos',
      tributacaoLabel: (
        Array.isArray(template.tributacaoScopes)
          ? template.tributacaoScopes
          : template.tributacaoScope
            ? [template.tributacaoScope]
            : []
      )
        .filter(Boolean)
        .join(', ') || 'Todas',
      actionDate: template.actionDate || '',
      metaDate: template.metaDate || '',
      dueDate: template.dueDate || '',
      actionDateBr: parseIsoDateToBr(template.actionDate),
      metaDateBr: parseIsoDateToBr(template.metaDate),
      dueDateBr: parseIsoDateToBr(template.dueDate),
      competencePreview:
        getCompetenceFromDate(template.actionDate, template.competenceMode) ||
        formatCompetenceValue(String(template.competenceStart || '').trim()),
    }
  })
  const taskBlueprintDateFilterOptions = ['Cadastro', 'Ação', 'Meta', 'Vencimento']
  const taskBlueprintObligationOptions = [
    'Todos',
    ...Array.from(
      new Set(taskBlueprintRows.map((row) => String(row.subject || row.obligation || '').trim()).filter(Boolean)),
    ),
  ]
  const taskBlueprintUfOptions = [
    'Todos',
    ...Array.from(new Set(taskBlueprintRows.map((row) => String(row.ufLabel || '').trim()).filter(Boolean))),
  ]
  const taskBlueprintTaxationOptions = [
    'Todos',
    ...Array.from(
      new Set(
        taskBlueprintRows.flatMap((row) =>
          (
            Array.isArray(row.tributacaoScopes)
              ? row.tributacaoScopes
              : row.tributacaoScope
                ? [row.tributacaoScope]
                : []
          )
            .map((item) => String(item || '').trim())
            .filter(Boolean),
        ),
      ),
    ),
  ]
  const taskBlueprintInstallmentOptions = [
    'Todos',
    ...Array.from(new Set(taskBlueprintRows.map((row) => String(row.installments || '')).filter(Boolean))),
  ]
  const taskBlueprintCompetenceOptions = [
    'Todos',
    ...Array.from(new Set(taskBlueprintRows.map((row) => row.competencePreview).filter(Boolean))),
  ]
  const getTaskBlueprintDateIso = (row, dateBy) => {
    if (dateBy === 'Ação') return row.actionDate || ''
    if (dateBy === 'Meta') return row.metaDate || ''
    if (dateBy === 'Vencimento') return row.dueDate || ''
    const createdBr = String(row.createdAt || '').split(',')[0]?.trim()
    return parseBrDateToIso(createdBr)
  }
  const filteredTaskBlueprintRows = taskBlueprintRows.filter((row) => {
    const obligationLabel = String(row.subject || row.obligation || '').trim()
    const ufLabel = String(row.ufLabel || '').trim()
    const rowTaxations = (
      Array.isArray(row.tributacaoScopes)
        ? row.tributacaoScopes
        : row.tributacaoScope
          ? [row.tributacaoScope]
          : []
    )
      .map((item) => String(item || '').trim())
      .filter(Boolean)
    const installments = String(row.installments || '')
    const competence = row.competencePreview || ''
    const matchesObligation =
      appliedTaskBlueprintFilters.obligation === 'Todos' ||
      obligationLabel === appliedTaskBlueprintFilters.obligation
    const matchesUf =
      appliedTaskBlueprintFilters.uf === 'Todos' || ufLabel === appliedTaskBlueprintFilters.uf
    const matchesTaxation =
      appliedTaskBlueprintFilters.tributacao === 'Todos' ||
      rowTaxations.includes(appliedTaskBlueprintFilters.tributacao)
    const matchesInstallments =
      appliedTaskBlueprintFilters.installments === 'Todos' ||
      installments === appliedTaskBlueprintFilters.installments
    const matchesCompetence =
      appliedTaskBlueprintFilters.competence === 'Todos' ||
      competence === appliedTaskBlueprintFilters.competence

    const rowDateIso = getTaskBlueprintDateIso(row, appliedTaskBlueprintFilters.dateBy)
    const matchesStartDate =
      !appliedTaskBlueprintFilters.startDate ||
      (rowDateIso && rowDateIso >= appliedTaskBlueprintFilters.startDate)
    const matchesEndDate =
      !appliedTaskBlueprintFilters.endDate ||
      (rowDateIso && rowDateIso <= appliedTaskBlueprintFilters.endDate)

    const query = appliedTaskBlueprintFilters.query.trim().toLowerCase()
    const searchableText = [
      obligationLabel,
      ufLabel,
      row.tributacaoLabel,
      installments,
      competence,
      row.actionDateBr,
      row.metaDateBr,
      row.dueDateBr,
      row.createdAt,
    ]
      .join(' ')
      .toLowerCase()
    const matchesQuery = !query || searchableText.includes(query)

    return (
      matchesObligation &&
      matchesUf &&
      matchesTaxation &&
      matchesInstallments &&
      matchesCompetence &&
      matchesStartDate &&
      matchesEndDate &&
      matchesQuery
    )
  })
  const taskBlueprintsPanel = (
    <section className="settings-task-blueprints">
      <div className="settings-task-blueprints-head">
        <div>
          <h6>Tarefas Cadastradas</h6>
          <p>Lista de cadastros para acompanhar o que já foi configurado.</p>
        </div>
        <span>{filteredTaskBlueprintRows.length} registro(s)</span>
      </div>
      <div className="settings-task-blueprints-table">
        <div className="settings-task-blueprints-grid settings-task-blueprints-grid-head">
          <span>Obrigação</span>
          <span>UF</span>
          <span>Tributação</span>
          <span>Parcelas</span>
          <span>Competência</span>
          <span>Ação</span>
          <span>Meta</span>
          <span>Vencimento</span>
          <span>Cadastro</span>
          <span>Ações</span>
        </div>
        <div className="settings-task-blueprints-body">
          {filteredTaskBlueprintRows.length ? (
            filteredTaskBlueprintRows.map((row) => (
              <div className="settings-task-blueprints-grid" key={row.id}>
                <span title={row.subject || row.obligation}>{row.subject || row.obligation}</span>
                <span title={row.ufLabel}>{row.ufLabel}</span>
                <span title={row.tributacaoLabel}>{row.tributacaoLabel}</span>
                <span title={String(row.installments)}>{row.installments}</span>
                <span title={row.competencePreview}>{row.competencePreview}</span>
                <span title={row.actionDateBr}>{row.actionDateBr}</span>
                <span title={row.metaDateBr}>{row.metaDateBr}</span>
                <span title={row.dueDateBr}>{row.dueDateBr}</span>
                <span title={row.createdAt}>{row.createdAt}</span>
                <span className="settings-task-blueprints-actions">
                  <>
                    <button
                      type="button"
                      className="link-btn"
                      onClick={() => editTaskBlueprint(row)}
                      disabled={!canManageTaskBlueprints}
                      title={
                        canManageTaskBlueprints
                          ? 'Editar tarefa cadastrada'
                          : 'Apenas administrador pode editar tarefas cadastradas'
                      }
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      className="link-btn danger"
                      onClick={() => deleteTaskBlueprint(row.id)}
                      disabled={!canManageTaskBlueprints}
                      title={
                        canManageTaskBlueprints
                          ? 'Excluir tarefa cadastrada'
                          : 'Apenas administrador pode excluir tarefas cadastradas'
                      }
                    >
                      Excluir
                    </button>
                  </>
                </span>
              </div>
            ))
          ) : (
            <p className="settings-task-blueprints-empty">
              Nenhuma tarefa cadastrada encontrada para os filtros informados.
            </p>
          )}
        </div>
      </div>
    </section>
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

  const forcedTaskTypeForCurrentScreen = getForcedTaskTypeByScreen(screen)
  const taskTypeFilterValue = forcedTaskTypeForCurrentScreen || taskFilters.taskType
  const appliedTaskTypeFilterValue = forcedTaskTypeForCurrentScreen || appliedTaskFilters.taskType

  const reportTodayIso = getTodayIsoLocal()
  const filteredReportRows = taskReportRows.filter((row) => {
    const displayStatus = getTaskDisplayStatus(row)
    const actionIso = parseBrDateToIso(getTaggedReportDate(row.dates, 'A'))
    const metaIso = parseBrDateToIso(getTaggedReportDate(row.dates, 'M'))
    const dueIso = parseBrDateToIso(getTaggedReportDate(row.dates, 'V'))
    const isCompleted = isCompletedTaskStatus(displayStatus.status)
    const matchesType =
      appliedTaskTypeFilterValue === 'Todos' || row.taskType === appliedTaskTypeFilterValue
    const matchesSubject =
      appliedTaskFilters.subject === 'Todos' || row.subject === appliedTaskFilters.subject
    const matchesClient =
      appliedTaskFilters.client === 'Todos' || row.client === appliedTaskFilters.client
    const matchesDepartment =
      appliedTaskFilters.department === 'Todos' ||
      getDepartmentLabel(row.dept) === getDepartmentLabel(appliedTaskFilters.department)
    const matchesStatus =
      appliedTaskFilters.status === 'Todos' || displayStatus.status === appliedTaskFilters.status
    const statusBucket = appliedTaskFilters.statusBucket || 'all'
    const matchesStatusBucket =
      statusBucket === 'all' ||
      (statusBucket === 'done' && isCompleted) ||
      (statusBucket === 'pending' && !isCompleted) ||
      (statusBucket === 'attention' &&
        !isCompleted &&
        metaIso &&
        dueIso &&
        reportTodayIso >= metaIso &&
        reportTodayIso <= dueIso) ||
      (statusBucket === 'action' &&
        !isCompleted &&
        actionIso &&
        reportTodayIso >= actionIso &&
        (!metaIso || reportTodayIso < metaIso))
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
      row.taskType,
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
      matchesStatusBucket &&
      matchesClientStatus &&
      matchesOwner &&
      matchesStartDate &&
      matchesEndDate &&
      matchesQuery
    )
  })

  const hasTaskPeriodFilter = Boolean(appliedTaskFilters.startDate || appliedTaskFilters.endDate)
  const rowsVisibleInTaskPanel = hasTaskPeriodFilter
    ? filteredReportRows
    : filteredReportRows.filter((row) => {
        const rowDateIso = parseBrDateToIso(getTaskDateBy(row, appliedTaskFilters.dateBy))
        return Boolean(rowDateIso && rowDateIso.startsWith(currentMonthPrefix))
      })

  const taskExportRows = rowsVisibleInTaskPanel.map((row) => {
    const displayStatus = getTaskDisplayStatus(row)
    return {
      No: row.id,
      Status: displayStatus.status,
      Departamento: getDepartmentLabel(row.dept),
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
      `Filtros: Tipo ${appliedTaskTypeFilterValue} | Departamento ${appliedTaskFilters.department} | Status ${appliedTaskFilters.status}`,
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
  const selectedChecklist = Array.isArray(clientForm.checklist) ? clientForm.checklist : []
  const selectedTax = clientForm.tributacao || ''
  const isReadOnly = clientMode === 'view'
  const selectedUserDepartment = getDepartmentLabel(userForm.departamento)
  const settingsUserAvailableClients = selectedUserDepartment
    ? clientsForCurrentUser.filter((client) =>
        (Array.isArray(client.grupos) ? client.grupos : [])
          .map((group) => getDepartmentLabel(String(group || '').trim()))
          .includes(selectedUserDepartment),
      )
    : []
  const settingsUserAvailableClientIds = new Set(
    settingsUserAvailableClients.map((client) => String(client.id)),
  )
  const selectedUserClientIds = (Array.isArray(userForm.clientIds)
    ? userForm.clientIds.map((id) => String(id))
    : []
  ).filter((id) =>
    settingsUserAvailableClientIds.has(id),
  )
  const selectedUserClientLabels = selectedUserClientIds
    .map((id) => settingsUserAvailableClients.find((client) => String(client.id) === id)?.nome)
    .filter(Boolean)
  const settingsUsersVisibleRows = isTenantRestrictedUser
    ? users.filter(
        (user) => String(user.email || '').trim().toLowerCase() === currentAuthEmailLower,
      )
    : users
  const bulkSelectedGroups = Array.isArray(bulkForm.grupos) ? bulkForm.grupos : []
  const bulkSelectedTax = bulkForm.tributacao || ''
  const clientStatusFilterOptions = [
    'Todos',
    ...Array.from(
      new Set(clientsForCurrentUser.map((client) => String(client.status || '').trim()).filter(Boolean)),
    ),
  ]
  const clientGroupFilterOptions = [
    'Todos',
    ...Array.from(
      new Set(
        clientsForCurrentUser.flatMap((client) =>
          (Array.isArray(client.grupos) ? client.grupos : [])
            .map((group) => String(group || '').trim())
            .filter(Boolean),
        ),
      ),
    ),
  ]
  const clientVisibilityFilterOptions = [
    'Todos',
    ...Array.from(
      new Set(
        clientsForCurrentUser.map((client) => String(client.visibilidade || '').trim()).filter(Boolean),
      ),
    ),
  ]
  const clientUfFilterOptions = [
    'Todos',
    ...Array.from(
      new Set(
        clientsForCurrentUser
          .map((client) => String(client.uf || '').trim().toUpperCase())
          .filter(Boolean),
      ),
    ),
  ]
  const clientTaxationFilterOptions = [
    'Todos',
    ...Array.from(
      new Set(clientsForCurrentUser.map((client) => String(client.tributacao || '').trim()).filter(Boolean)),
    ),
  ]
  const clientDocTypeFilterOptions = [
    'Todos',
    ...Array.from(
      new Set(clientsForCurrentUser.map((client) => String(client.docType || '').trim()).filter(Boolean)),
    ),
  ]
  const filteredClients = clientsForCurrentUser.filter((client) => {
    const matchesStatus =
      appliedClientTableFilters.status === 'Todos' || client.status === appliedClientTableFilters.status
    const matchesGroup =
      appliedClientTableFilters.grupo === 'Todos' ||
      (Array.isArray(client.grupos) ? client.grupos : []).includes(appliedClientTableFilters.grupo)
    const matchesVisibility =
      appliedClientTableFilters.visibilidade === 'Todos' ||
      client.visibilidade === appliedClientTableFilters.visibilidade
    const matchesUf =
      appliedClientTableFilters.uf === 'Todos' ||
      String(client.uf || '').trim().toUpperCase() === appliedClientTableFilters.uf
    const matchesTaxation =
      appliedClientTableFilters.tributacao === 'Todos' ||
      String(client.tributacao || '').trim() === appliedClientTableFilters.tributacao
    const matchesDocType =
      appliedClientTableFilters.docType === 'Todos' ||
      String(client.docType || '').trim() === appliedClientTableFilters.docType

    const query = appliedClientTableFilters.query.trim().toLowerCase()
    const searchableText = [
      client.nome,
      client.apelido,
      client.docType,
      client.inscricao,
      client.status,
      client.contato,
      client.telefone,
      client.email,
      Array.isArray(client.grupos) ? client.grupos.join(' ') : '',
      client.visibilidade,
      client.uf,
      client.tributacao,
    ]
      .join(' ')
      .toLowerCase()
    const matchesQuery = !query || searchableText.includes(query)

    return (
      matchesStatus &&
      matchesGroup &&
      matchesVisibility &&
      matchesUf &&
      matchesTaxation &&
      matchesDocType &&
      matchesQuery
    )
  })
  const clientTaskGenerateAvailableBlueprints = clientTaskGenerateClients.length
    ? getMatchingTaskBlueprintsForClients(clientTaskGenerateClients)
    : []
  const clientTaskGenerateSingleClient =
    clientTaskGenerateClients.length === 1 ? clientTaskGenerateClients[0] : null
  const clientTaskGenerateClientsCount = clientTaskGenerateClients.length
  const clientTaskGenerateSelectedIds = Array.isArray(clientTaskGenerateForm.blueprintIds)
    ? clientTaskGenerateForm.blueprintIds
    : []
  const clientTaskGenerateAllSelected =
    clientTaskGenerateAvailableBlueprints.length > 0 &&
    clientTaskGenerateAvailableBlueprints.every((blueprint) =>
      clientTaskGenerateSelectedIds.includes(blueprint.id),
    )
  const currentMonthLabel = getCompetenceFromDate(getTodayIsoLocal(), 'Mesmo mês')
  const todayIso = getTodayIsoLocal()
  const hasOverviewPeriodFilter = Boolean(
    appliedOverviewFilters.startDate || appliedOverviewFilters.endDate,
  )
  const filteredOverviewRows = taskReportRows.filter((row) => {
    const displayStatus = getTaskDisplayStatus(row)
    const matchesType =
      appliedOverviewFilters.taskType === 'Todos' ||
      row.taskType === appliedOverviewFilters.taskType
    const matchesDepartment =
      appliedOverviewFilters.department === 'Todos' ||
      getDepartmentLabel(row.dept) === getDepartmentLabel(appliedOverviewFilters.department)
    const matchesStatus =
      appliedOverviewFilters.status === 'Todos' || displayStatus.status === appliedOverviewFilters.status
    const matchesClientStatus =
      appliedOverviewFilters.clientStatus === 'Todos' ||
      row.clientStatus === appliedOverviewFilters.clientStatus
    const matchesOwner =
      appliedOverviewFilters.owner === 'Todos' || row.owner === appliedOverviewFilters.owner

    const rowDateIso = parseBrDateToIso(getTaskDateBy(row, appliedOverviewFilters.dateBy))
    const normalizedStartDate = appliedOverviewFilters.startDate.includes('/')
      ? parseBrDateToIso(appliedOverviewFilters.startDate)
      : appliedOverviewFilters.startDate
    const normalizedEndDate = appliedOverviewFilters.endDate.includes('/')
      ? parseBrDateToIso(appliedOverviewFilters.endDate)
      : appliedOverviewFilters.endDate
    const matchesStartDate =
      !normalizedStartDate || (rowDateIso && rowDateIso >= normalizedStartDate)
    const matchesEndDate = !normalizedEndDate || (rowDateIso && rowDateIso <= normalizedEndDate)
    const matchesPeriod = hasOverviewPeriodFilter
      ? matchesStartDate && matchesEndDate
      : Boolean(rowDateIso && rowDateIso.startsWith(currentMonthPrefix))

    return (
      matchesType &&
      matchesDepartment &&
      matchesStatus &&
      matchesClientStatus &&
      matchesOwner &&
      matchesPeriod
    )
  })
  const overviewTaskRows = filteredOverviewRows.filter((row) => row.taskType === 'Tarefa')
  const overviewSolicitationRows = filteredOverviewRows.filter((row) => row.taskType === 'Solicitação')
  const overviewPeriodLabel =
    hasOverviewPeriodFilter
      ? `${appliedOverviewFilters.startDate ? parseIsoDateToBr(appliedOverviewFilters.startDate) : 'Início'} - ${
          appliedOverviewFilters.endDate ? parseIsoDateToBr(appliedOverviewFilters.endDate) : 'Atual'
        }`
      : currentMonthLabel
  const getEmptyProgressBucket = () => ({ notStarted: 0, doing: 0, pending: 0, review: 0 })
  const overviewMetrics = filteredOverviewRows.reduce(
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
  const completedTasks = Math.max(0, filteredOverviewRows.length - overviewMetrics.pending)
  const completionPercent = filteredOverviewRows.length
    ? Math.round((completedTasks / filteredOverviewRows.length) * 100)
    : 0
  const safeCompletionPercent = Math.min(100, Math.max(0, completionPercent))
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
  const departmentsInSystem = Array.from(
    new Set(
      [
        ...users.map((user) => getDepartmentLabel(user.departamento)),
        ...clientsForCurrentUser.flatMap((client) =>
          (Array.isArray(client.grupos) ? client.grupos : []).map((group) => getDepartmentLabel(group)),
        ),
        ...tasksRowsForCurrentUser.map((task) => getDepartmentLabel(task.dept)),
      ]
        .filter(Boolean)
        .filter(
          (department) =>
            !isTenantRestrictedUser ||
            normalizeFreeText(getDepartmentLabel(department)) === currentTenantDepartmentKey,
        ),
    ),
  ).sort((a, b) => a.localeCompare(b, 'pt-BR'))
  const obligationsByDepartment = new Map(
    departmentsInSystem.map((department) => [
      department,
      { name: department, action: 0, alert: 0, pending: 0, done: 0 },
    ]),
  )
  overviewTaskRows.forEach((task) => {
    const department = getDepartmentLabel(task.dept) || 'Sem departamento'
    const displayStatus = getTaskDisplayStatus(task)
    const isCompleted = isCompletedTaskStatus(displayStatus.status)
    const actionIso = parseBrDateToIso(getTaggedReportDate(task.dates, 'A'))
    const metaIso = parseBrDateToIso(getTaggedReportDate(task.dates, 'M'))
    const dueIso = parseBrDateToIso(getTaggedReportDate(task.dates, 'V'))

    if (!obligationsByDepartment.has(department)) {
      obligationsByDepartment.set(department, {
        name: department,
        action: 0,
        alert: 0,
        pending: 0,
        done: 0,
      })
    }

    const current = obligationsByDepartment.get(department)
    if (!current) return

    if (isCompleted) {
      current.done += 1
      return
    }

    current.pending += 1

    if (metaIso && dueIso && todayIso >= metaIso && todayIso <= dueIso) {
      current.alert += 1
      return
    }

    if (actionIso && todayIso >= actionIso && (!metaIso || todayIso < metaIso)) {
      current.action += 1
    }
  })
  const obligationsRowsDynamic = Array.from(obligationsByDepartment.values()).sort((a, b) =>
    a.name.localeCompare(b.name, 'pt-BR'),
  )
  const solicitationDepartmentOptions = Array.from(
    new Set(
      [
        ...departmentsInSystem.map((department) => normalizeSolicitationDepartment(department)),
        ...users.map((user) => normalizeSolicitationDepartment(user.departamento)),
        ...clientsForCurrentUser.flatMap((client) =>
          (Array.isArray(client.grupos) ? client.grupos : []).map((group) =>
            normalizeSolicitationDepartment(group),
          ),
        ),
        ...solicitationRecordsForCurrentUser.map((record) =>
          normalizeSolicitationDepartment(record.departamento),
        ),
      ].filter(Boolean),
    ),
  ).sort((a, b) => a.localeCompare(b, 'pt-BR'))
  const solicitationProcessOptions = Array.from(
    new Set(
      solicitationRecordsForCurrentUser
        .map((record) => String(record.processo || '').trim())
        .filter(Boolean),
    ),
  ).sort((a, b) => a.localeCompare(b, 'pt-BR'))
  const solicitationStageOptions = Array.from(
    new Set([
      'Aberta',
      'Em andamento',
      'Concluída',
      ...solicitationRecordsForCurrentUser.map((record) => record.etapa),
    ]),
  )
  const solicitationClients = clientsForCurrentUser.filter(
    (client) => solicitationForm.includeDisabledClients || client.status !== 'Inativo',
  )
  const solicitationClientSearchTerm = solicitationClientSearch.trim().toLowerCase()
  const solicitationClientSearchResults = solicitationClientSearchTerm
    ? solicitationClients
        .filter((client) =>
          [client.nome, client.apelido, client.inscricao, client.email]
            .join(' ')
            .toLowerCase()
            .includes(solicitationClientSearchTerm),
        )
        .slice(0, 8)
    : []
  const solicitationsByDepartment = new Map(
    departmentsInSystem.map((department) => [
      department,
      { name: department, action: 0, alert: 0, pending: 0, done: 0 },
    ]),
  )
  overviewSolicitationRows.forEach((record) => {
    const department = getDepartmentLabel(normalizeSolicitationDepartment(record.dept)) || 'Sem departamento'
    if (!solicitationsByDepartment.has(department)) {
      solicitationsByDepartment.set(department, {
        name: department,
        action: 0,
        alert: 0,
        pending: 0,
        done: 0,
      })
    }

    const current = solicitationsByDepartment.get(department)
    if (!current) return

    const displayStatus = getTaskDisplayStatus(record)
    const doneByStage = isCompletedTaskStatus(displayStatus.status)
    if (doneByStage) {
      current.done += 1
      return
    }

    current.pending += 1

    const actionIso = parseBrDateToIso(getTaggedReportDate(record.dates, 'A'))
    const metaIso = parseBrDateToIso(getTaggedReportDate(record.dates, 'M'))
    const dueIso = parseBrDateToIso(getTaggedReportDate(record.dates, 'V'))
    if (metaIso && dueIso && todayIso >= metaIso && todayIso <= dueIso) {
      current.alert += 1
      return
    }

    if (actionIso && todayIso >= actionIso && (!metaIso || todayIso < metaIso)) {
      current.action += 1
    }
  })
  const solicitationItems = Array.from(solicitationsByDepartment.values()).sort((a, b) =>
    a.name.localeCompare(b.name, 'pt-BR'),
  )
  const controlRowsData = controlRows.map((group) => {
    if (group.group === 'Obrigações') {
      return { ...group, items: obligationsRowsDynamic }
    }
    if (group.group === 'Solicitações') {
      return { ...group, items: solicitationItems }
    }
    return group
  })
  const selectedTaskLogs = selectedTask
    ? taskActionLogs.filter(
        (log) =>
          log.taskId === selectedTask.id &&
          (log.taskSource || 'task') === (selectedTask.reportSource || 'task'),
      )
    : []
  const isSelectedSolicitation = selectedTask?.reportSource === 'solicitation'
  const selectedEntityLabel = isSelectedSolicitation ? 'Solicitação' : 'Tarefa'
  const selectedEntityLabelLower = isSelectedSolicitation ? 'solicitação' : 'tarefa'
  const canManageSelectedTaskRecord = isSelectedSolicitation || canManageTaskBlueprints
  const isObligationsScreen = screen === 'reports'
  const isSolicitationsScreen = screen === 'solicitations'
  const isReportsLikeScreen = isObligationsScreen || isSolicitationsScreen
  const isSolicitationReportMode =
    (screen === 'tasks' || isReportsLikeScreen) && appliedTaskTypeFilterValue === 'Solicitação'

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
                    <span className="input-icon" aria-hidden="true">
                      <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
                        <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6z" />
                        <circle cx="12" cy="12" r="2.6" />
                      </svg>
                    </span>
                  </div>
                </label>
                <label>
                  Senha
                  <div className="input-wrap">
                    <input
                      type={showPasswordOnHold ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(event) => {
                        setPassword(event.target.value)
                        setError('')
                      }}
                      autoComplete={remember ? 'current-password' : 'off'}
                    />
                    <button
                      type="button"
                      className="input-icon input-icon-btn"
                      aria-label="Mostrar senha enquanto pressionado"
                      onPointerDown={(event) => {
                        event.preventDefault()
                        setShowPasswordOnHold(true)
                      }}
                      onPointerUp={() => setShowPasswordOnHold(false)}
                      onPointerLeave={() => setShowPasswordOnHold(false)}
                      onPointerCancel={() => setShowPasswordOnHold(false)}
                      onBlur={() => setShowPasswordOnHold(false)}
                    >
                      <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
                        <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6z" />
                        <circle cx="12" cy="12" r="2.6" />
                      </svg>
                    </button>
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

                <button className="primary" type="submit" disabled={isApiLoading}>
                  {isApiLoading ? 'Entrando...' : 'Entrar'}
                </button>
              </form>

              <div className="login-actions">
                <button className="link" type="button">
                  Esqueci minha senha
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
              <button className="primary wide" type="button">
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
            <div className={`sidebar-avatar${companyLogoDataUrl && !isSuperAdmin ? ' has-logo' : ''}`}>
              {companyLogoDataUrl && !isSuperAdmin ? (
                <img src={companyLogoDataUrl} alt={companyLogoName || 'Logo da empresa'} />
              ) : (
                'HV'
              )}
            </div>
            <nav className="nav">
              {(isSuperAdmin
                ? ['Super Admin']
                : [
                    'Visão Geral',
                    'Tarefas',
                    'Relatórios',
                    'Solicitações',
                    'Clientes',
                    ...(canManageTenantUsers ? ['Configurações'] : []),
                  ]
              ).map((item, index) => (
                <button
                  key={item}
                  className={`nav-item ${
                    item === 'Tarefas' ? 'nav-item--tasks' : ''
                  } ${
                    (screen === 'super-admin' && item === 'Super Admin') ||
                    (screen === 'dashboard' && item === 'Visão Geral') ||
                    (screen === 'operational' && item === 'Visão Geral') ||
                    ((screen === 'tasks' || screen === 'task-detail') && item === 'Tarefas') ||
                    (screen === 'reports' && item === 'Relatórios') ||
                    (screen === 'solicitations' && item === 'Solicitações') ||
                    (screen === 'clients' && item === 'Clientes') ||
                    (screen === 'settings' && item === 'Configurações')
                      ? 'active'
                      : ''
                  }`.trim()}
                  type="button"
                  onClick={() => {
                    if (item === 'Super Admin') {
                      setScreen('super-admin')
                    } else if (item === 'Visão Geral') {
                      setScreen('dashboard')
                    } else if (item === 'Tarefas') {
                      setScreen('tasks')
                    } else if (item === 'Relatórios') {
                      openObligationsScreen()
                    } else if (item === 'Solicitações') {
                      openSolicitationsScreen()
                    } else if (item === 'Clientes') {
                      setScreen('clients')
                    } else if (item === 'Configurações') {
                      setSettingsTab('users')
                      setScreen('settings')
                    }
                  }}
                  style={{ '--delay': `${index * 0.05}s` }}
                >
                  <span className="nav-icon">{item === 'Super Admin' ? renderSidebarIcon('Configurações') : renderSidebarIcon(item)}</span>
                  <span>
                    {item === 'Tarefas'
                      ? 'Tarefas Cadastradas'
                      : item === 'Relatórios'
                        ? 'Obrigações'
                        : item}
                  </span>
                </button>
              ))}
            </nav>
            <button className="nav-logout" type="button" onClick={handleLogout}>
              Sair
            </button>
          </aside>

          <div className="main">
            <header className="topbar">
              <div className="topbar-main">
                <div className="search">
                  <span className="search-icon" />
                  <input type="search" placeholder="Digite aqui para começar a pesquisa..." />
                </div>
                {!isSuperAdmin && screen === 'dashboard' ? (
                  <span className="welcome-tenant-pill" title={`Tenant: ${tenantDisplayName}`}>
                    Bem Vindo {tenantDisplayName}
                  </span>
                ) : null}
              </div>
              <div className="top-actions">
                {isSuperAdmin ? (
                  <button
                    className="chip primary"
                    type="button"
                    onClick={refreshSuperAdminData}
                    disabled={isApiLoading}
                  >
                    Atualizar dados
                  </button>
                ) : (
                  <>
                    <button className="chip primary" type="button" onClick={openCreateModal}>
                      {isTenantRestrictedUser ? 'Nova Solicitação' : 'Criar Tarefas'}
                    </button>
                    <button className="chip" type="button">
                      Relatório do dia
                    </button>
                    <button className="chip" type="button" onClick={openObligationsScreen}>
                      Quadro Kanban
                    </button>
                  </>
                )}
              </div>
              <div className="user">
                <span className="user-org">{isSuperAdmin ? 'Super Admin' : 'Hive'}</span>
                <span className="user-dot" />
              </div>
            </header>

            {!isSuperAdmin && (screen === 'dashboard' || isReportsLikeScreen) ? (
              <div className="view-tabs">
                <button
                  className={screen === 'dashboard' ? 'active' : ''}
                  type="button"
                  onClick={() => setScreen('dashboard')}
                >
                  Visão Geral
                </button>
                <button
                  className={isReportsLikeScreen ? 'active' : ''}
                  type="button"
                  onClick={openObligationsScreen}
                >
                  Obrigações
                </button>
              </div>
            ) : null}

            {isSuperAdmin ? (
              <div className="super-admin-view">
                <section className="card super-admin-summary">
                  <h4>Painel Super Admin</h4>
                  <p>Gestão multi-tenant de tenants e clientes em tempo real.</p>
                  <div className="super-admin-kpis">
                    <div className="super-admin-kpi">
                      <span>Tenants</span>
                      <strong>{superAdminStats.tenantsTotal}</strong>
                    </div>
                    <div className="super-admin-kpi">
                      <span>Tenants ativos</span>
                      <strong>{superAdminStats.tenantsActive}</strong>
                    </div>
                    <div className="super-admin-kpi">
                      <span>Clientes</span>
                      <strong>{superAdminStats.clientsTotal}</strong>
                    </div>
                    <div className="super-admin-kpi">
                      <span>Usuários</span>
                      <strong>{superAdminStats.usersTotal}</strong>
                    </div>
                    <div className="super-admin-kpi">
                      <span>Tarefas</span>
                      <strong>{superAdminStats.tasksTotal}</strong>
                    </div>
                  </div>
                </section>

                <section className="super-admin-grid">
                  <article className="card super-admin-card">
                    <div className="super-admin-card-head">
                      <h5>Tenants</h5>
                      <button type="button" className="chip small" onClick={refreshSuperAdminData}>
                        Recarregar
                      </button>
                    </div>

                    <div className="super-admin-inline-filters">
                      <input
                        type="text"
                        value={superAdminFilters.q}
                        placeholder="Buscar por nome ou slug..."
                        onChange={(event) =>
                          setSuperAdminFilters((prev) => ({ ...prev, q: event.target.value }))
                        }
                      />
                      <select
                        value={superAdminFilters.status}
                        onChange={(event) =>
                          setSuperAdminFilters((prev) => ({ ...prev, status: event.target.value }))
                        }
                      >
                        <option value="ALL">Todos</option>
                        <option value="ACTIVE">Ativos</option>
                        <option value="INACTIVE">Inativos</option>
                      </select>
                      <button
                        type="button"
                        className="chip primary small"
                        onClick={() => loadSuperAdminTenants(superAdminFilters)}
                      >
                        Buscar
                      </button>
                    </div>

                    <form className="super-admin-form" onSubmit={handleSuperTenantCreate}>
                      <label>
                        <span>Nome do tenant</span>
                        <input
                          type="text"
                          value={superTenantForm.name}
                          onChange={(event) =>
                            setSuperTenantForm((prev) => ({ ...prev, name: event.target.value }))
                          }
                          required
                        />
                      </label>
                      <label>
                        <span>Slug (opcional)</span>
                        <input
                          type="text"
                          value={superTenantForm.slug}
                          onChange={(event) =>
                            setSuperTenantForm((prev) => ({ ...prev, slug: event.target.value }))
                          }
                        />
                      </label>
                      <label>
                        <span>Admin tenant</span>
                        <input
                          type="text"
                          value={superTenantForm.adminName}
                          onChange={(event) =>
                            setSuperTenantForm((prev) => ({ ...prev, adminName: event.target.value }))
                          }
                          placeholder="Nome (opcional)"
                        />
                      </label>
                      <label>
                        <span>E-mail admin</span>
                        <input
                          type="email"
                          value={superTenantForm.adminEmail}
                          onChange={(event) =>
                            setSuperTenantForm((prev) => ({ ...prev, adminEmail: event.target.value }))
                          }
                          placeholder="admin@tenant.com"
                          required
                        />
                      </label>
                      <label>
                        <span>Senha admin</span>
                        <input
                          type="password"
                          value={superTenantForm.adminPassword}
                          onChange={(event) =>
                            setSuperTenantForm((prev) => ({ ...prev, adminPassword: event.target.value }))
                          }
                          placeholder="mínimo 6 caracteres"
                          required
                        />
                      </label>
                      <button type="submit" className="chip primary small" disabled={isApiLoading}>
                        Criar tenant
                      </button>
                    </form>

                    <div className="super-admin-list">
                      {superAdminTenants.map((tenant) => (
                        <div
                          key={tenant.id}
                          className={`super-admin-item ${
                            selectedSuperTenantId === tenant.id ? 'active' : ''
                          }`}
                        >
                          <button
                            type="button"
                            className="super-admin-item-main"
                            onClick={() => openSuperTenantEditor(tenant)}
                          >
                            <strong>{tenant.name}</strong>
                            <small>{tenant.slug}</small>
                          </button>
                          <button
                            type="button"
                            className={`chip tiny ${tenant.status === 'ACTIVE' ? 'primary' : ''}`}
                            onClick={() => handleSuperTenantStatusToggle(tenant)}
                          >
                            {tenant.status === 'ACTIVE' ? 'Ativo' : 'Inativo'}
                          </button>
                        </div>
                      ))}
                      {!superAdminTenants.length ? (
                        <div className="super-admin-empty">Sem tenants para os filtros atuais.</div>
                      ) : null}
                    </div>
                  </article>

                  <article className="card super-admin-card">
                    <div className="super-admin-card-head">
                      <h5>Clientes do tenant</h5>
                      <span>
                        {selectedSuperTenantId
                          ? superAdminTenants.find((item) => item.id === selectedSuperTenantId)?.name ||
                            'Tenant selecionado'
                          : 'Selecione um tenant'}
                      </span>
                    </div>

                    <div className="super-admin-inline-filters">
                      <input
                        type="text"
                        value={superAdminClientFilters.q}
                        placeholder="Buscar cliente..."
                        onChange={(event) =>
                          setSuperAdminClientFilters((prev) => ({ ...prev, q: event.target.value }))
                        }
                      />
                      <select
                        value={superAdminClientFilters.status}
                        onChange={(event) =>
                          setSuperAdminClientFilters((prev) => ({
                            ...prev,
                            status: event.target.value,
                          }))
                        }
                      >
                        <option value="ALL">Todos</option>
                        <option value="ACTIVE">Ativos</option>
                        <option value="INACTIVE">Inativos</option>
                      </select>
                      <button
                        type="button"
                        className="chip primary small"
                        onClick={() =>
                          loadSuperAdminClients(selectedSuperTenantId, superAdminClientFilters)
                        }
                        disabled={!selectedSuperTenantId}
                      >
                        Buscar
                      </button>
                    </div>

                    <form className="super-admin-form" onSubmit={handleSuperClientCreate}>
                      <label>
                        <span>Nome</span>
                        <input
                          type="text"
                          value={superClientForm.name}
                          onChange={(event) =>
                            setSuperClientForm((prev) => ({ ...prev, name: event.target.value }))
                          }
                          required
                        />
                      </label>
                      <label>
                        <span>Apelido</span>
                        <input
                          type="text"
                          value={superClientForm.alias}
                          onChange={(event) =>
                            setSuperClientForm((prev) => ({ ...prev, alias: event.target.value }))
                          }
                        />
                      </label>
                      <label>
                        <span>Documento</span>
                        <input
                          type="text"
                          value={superClientForm.documentNumber}
                          onChange={(event) =>
                            setSuperClientForm((prev) => ({
                              ...prev,
                              documentNumber: event.target.value,
                            }))
                          }
                        />
                      </label>
                      <label>
                        <span>E-mail</span>
                        <input
                          type="email"
                          value={superClientForm.email}
                          onChange={(event) =>
                            setSuperClientForm((prev) => ({ ...prev, email: event.target.value }))
                          }
                        />
                      </label>
                      <label>
                        <span>Grupos (vírgula)</span>
                        <input
                          type="text"
                          value={superClientForm.groups}
                          placeholder="Fiscal, Dep. Pessoal"
                          onChange={(event) =>
                            setSuperClientForm((prev) => ({ ...prev, groups: event.target.value }))
                          }
                        />
                      </label>
                      <label>
                        <span>Tributação (vírgula)</span>
                        <input
                          type="text"
                          value={superClientForm.taxation}
                          placeholder="Simples Nacional, Lucro Real"
                          onChange={(event) =>
                            setSuperClientForm((prev) => ({ ...prev, taxation: event.target.value }))
                          }
                        />
                      </label>
                      <label>
                        <span>UF</span>
                        <input
                          type="text"
                          value={superClientForm.uf}
                          onChange={(event) =>
                            setSuperClientForm((prev) => ({ ...prev, uf: event.target.value }))
                          }
                        />
                      </label>
                      <label>
                        <span>Competência inicial</span>
                        <input
                          type="text"
                          value={superClientForm.initialCompetence}
                          placeholder="MM/AAAA"
                          onChange={(event) =>
                            setSuperClientForm((prev) => ({
                              ...prev,
                              initialCompetence: event.target.value,
                            }))
                          }
                        />
                      </label>
                      <button
                        type="submit"
                        className="chip primary small"
                        disabled={!selectedSuperTenantId || isApiLoading}
                      >
                        Cadastrar cliente
                      </button>
                    </form>

                    <div className="super-admin-list">
                      {superAdminClients.map((client) => (
                        <div key={client.id} className="super-admin-item">
                          <div className="super-admin-item-main">
                            <strong>{client.name}</strong>
                            <small>{client.documentNumber || '-'}</small>
                          </div>
                          <button
                            type="button"
                            className="danger-outline"
                            onClick={() => handleSuperClientDelete(client)}
                          >
                            Excluir
                          </button>
                        </div>
                      ))}
                      {!superAdminClients.length ? (
                        <div className="super-admin-empty">
                          Sem clientes para o tenant/filtro selecionado.
                        </div>
                      ) : null}
                    </div>
                  </article>
                </section>

                {superAdminFeedback ? <div className="super-admin-feedback">{superAdminFeedback}</div> : null}
              </div>
            ) : screen === 'dashboard' ? (
              <div className="dashboard-view">
                <section className="filters task-filters-grid overview-filters">
                  <label className="task-filter-field">
                    <span>Tipos de tarefas</span>
                    <select
                      value={overviewFilters.taskType}
                      onChange={(event) => handleOverviewFilterChange('taskType', event.target.value)}
                    >
                      {taskTypeOptions.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="task-filter-field">
                    <span>Departamento</span>
                    <select
                      value={overviewFilters.department}
                      onChange={(event) =>
                        handleOverviewFilterChange('department', event.target.value)
                      }
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
                      value={overviewFilters.status}
                      onChange={(event) => handleOverviewFilterChange('status', event.target.value)}
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
                      value={overviewFilters.clientStatus}
                      onChange={(event) =>
                        handleOverviewFilterChange('clientStatus', event.target.value)
                      }
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
                      value={overviewFilters.owner}
                      onChange={(event) => handleOverviewFilterChange('owner', event.target.value)}
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
                      value={overviewFilters.dateBy}
                      onChange={(event) => handleOverviewFilterChange('dateBy', event.target.value)}
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
                      value={overviewFilters.startDate}
                      onChange={(event) =>
                        handleOverviewFilterChange('startDate', event.target.value)
                      }
                    />
                  </label>
                  <label className="task-filter-field">
                    <span>Período Final</span>
                    <input
                      type="date"
                      value={overviewFilters.endDate}
                      onChange={(event) =>
                        handleOverviewFilterChange('endDate', event.target.value)
                      }
                    />
                  </label>
                  <button type="button" className="chip primary small" onClick={applyOverviewFilters}>
                    Aplicar
                  </button>
                  <button type="button" className="chip small" onClick={clearOverviewFilters}>
                    Limpar
                  </button>
                </section>

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
                      <span>{overviewPeriodLabel || '-'}</span>
                    </header>
                    <div className="performance-body">
                      <div className="metric metric-left">
                        <strong>{completedTasks}</strong>
                        <span>Tarefas Realizadas</span>
                      </div>
                      <div className="speedometer-wrap">
                        <span className="speedometer-title">Tarefas Concluídas</span>
                        <div
                          className="speedometer"
                          style={{
                            '--completed-angle': `${safeCompletionPercent * 1.8}deg`,
                            '--needle-angle': `${safeCompletionPercent * 1.8 - 90}deg`,
                          }}
                        >
                          <div className="speedometer-arc" />
                          <div className="speedometer-inner" />
                          <div className="speedometer-needle" />
                          <div className="speedometer-pin" />
                          <div className="speedometer-center">
                            <div className="speedometer-value">{safeCompletionPercent}%</div>
                          </div>
                        </div>
                      </div>
                      <div className="metric metric-right">
                        <strong>{overviewMetrics.pending}</strong>
                        <span>Tarefas Restantes</span>
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
                  {controlRowsData.map((group) => (
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
                          <button
                            type="button"
                            className="counter control-counter-btn"
                            onClick={() => openControlPanelDrilldown(group.group, item.name, 'action')}
                          >
                            {item.action}
                          </button>
                          <button
                            type="button"
                            className={`counter tone-${item.alert ? 'violet' : 'soft'} control-counter-btn`}
                            onClick={() =>
                              openControlPanelDrilldown(group.group, item.name, 'attention')
                            }
                          >
                            {item.alert}
                          </button>
                          <button
                            type="button"
                            className={`counter tone-${item.pending ? 'sand' : 'soft'} control-counter-btn`}
                            onClick={() => openControlPanelDrilldown(group.group, item.name, 'pending')}
                          >
                            {item.pending}
                          </button>
                          <button
                            type="button"
                            className={`counter tone-${item.done ? 'green' : 'soft'} control-counter-btn`}
                            onClick={() => openControlPanelDrilldown(group.group, item.name, 'done')}
                          >
                            {item.done}
                          </button>
                        </div>
                      ))}
                    </div>
                  ))}
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
            ) : isReportsLikeScreen || screen === 'tasks' ? (
              <div className="reports-view">
                <header className="reports-header">
                  <div>
                    <h4>
                      {screen === 'tasks'
                        ? isSolicitationReportMode
                          ? 'Relatórios > Solicitações'
                          : 'Relatórios > Tarefas'
                        : isSolicitationsScreen
                          ? 'Solicitações'
                          : 'Obrigações'}
                    </h4>
                    <p>
                      {screen === 'tasks'
                        ? isSolicitationReportMode
                          ? 'Solicitações cadastradas • visão detalhada por cliente e status'
                          : 'Tarefas cadastradas • visão detalhada por cliente e status'
                        : isSolicitationsScreen
                          ? 'Solicitações • visão detalhada por cliente e status'
                          : 'Obrigações • visão detalhada por cliente e status'}
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
                    <button
                      type="button"
                      className="chip tiny"
                      onClick={screen === 'tasks' ? applyTaskBlueprintFilters : applyTaskFilters}
                    >
                      Atualizar
                    </button>
                  </div>
                </header>

                {screen === 'tasks' ? (
                  <>
                    <div className="filters task-filters-grid">
                      <label className="task-filter-field">
                        <span>Obrigação</span>
                        <select
                          value={taskBlueprintFilters.obligation}
                          onChange={(event) =>
                            handleTaskBlueprintFilterChange('obligation', event.target.value)
                          }
                        >
                          {taskBlueprintObligationOptions.map((item) => (
                            <option key={item} value={item}>
                              {item}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="task-filter-field">
                        <span>UF</span>
                        <select
                          value={taskBlueprintFilters.uf}
                          onChange={(event) => handleTaskBlueprintFilterChange('uf', event.target.value)}
                        >
                          {taskBlueprintUfOptions.map((item) => (
                            <option key={item} value={item}>
                              {item}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="task-filter-field">
                        <span>Tributação</span>
                        <select
                          value={taskBlueprintFilters.tributacao}
                          onChange={(event) =>
                            handleTaskBlueprintFilterChange('tributacao', event.target.value)
                          }
                        >
                          {taskBlueprintTaxationOptions.map((item) => (
                            <option key={item} value={item}>
                              {item}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="task-filter-field">
                        <span>Parcelas</span>
                        <select
                          value={taskBlueprintFilters.installments}
                          onChange={(event) =>
                            handleTaskBlueprintFilterChange('installments', event.target.value)
                          }
                        >
                          {taskBlueprintInstallmentOptions.map((item) => (
                            <option key={item} value={item}>
                              {item}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="task-filter-field">
                        <span>Competência</span>
                        <select
                          value={taskBlueprintFilters.competence}
                          onChange={(event) =>
                            handleTaskBlueprintFilterChange('competence', event.target.value)
                          }
                        >
                          {taskBlueprintCompetenceOptions.map((item) => (
                            <option key={item} value={item}>
                              {item}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="task-filter-field">
                        <span>Por Data</span>
                        <select
                          value={taskBlueprintFilters.dateBy}
                          onChange={(event) => handleTaskBlueprintFilterChange('dateBy', event.target.value)}
                        >
                          {taskBlueprintDateFilterOptions.map((item) => (
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
                          value={taskBlueprintFilters.startDate}
                          onChange={(event) =>
                            handleTaskBlueprintFilterChange('startDate', event.target.value)
                          }
                        />
                      </label>
                      <label className="task-filter-field">
                        <span>Período Final</span>
                        <input
                          type="date"
                          value={taskBlueprintFilters.endDate}
                          onChange={(event) =>
                            handleTaskBlueprintFilterChange('endDate', event.target.value)
                          }
                        />
                      </label>
                      <button
                        type="button"
                        className="chip primary small"
                        onClick={applyTaskBlueprintFilters}
                      >
                        Aplicar
                      </button>
                      <button type="button" className="chip small" onClick={clearTaskBlueprintFilters}>
                        Limpar
                      </button>
                    </div>

                    <div className="report-search">
                      <input
                        type="text"
                        placeholder="Buscar por obrigação, UF, tributação, competência..."
                        value={taskBlueprintFilters.query}
                        onChange={(event) =>
                          handleTaskBlueprintFilterChange('query', event.target.value)
                        }
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') {
                            event.preventDefault()
                            applyTaskBlueprintFilters()
                          }
                        }}
                      />
                      <div className="report-icons">
                        <button
                          type="button"
                          className="icon-btn"
                          aria-label="Pesquisar"
                          onClick={applyTaskBlueprintFilters}
                        >
                          Buscar
                        </button>
                        <button
                          type="button"
                          className="icon-btn"
                          aria-label="Limpar filtros"
                          onClick={clearTaskBlueprintFilters}
                        >
                          Limpar
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="filters task-filters-grid">
                      <label className="task-filter-field">
                        <span>Tipos de tarefas</span>
                        <select
                          value={taskTypeFilterValue}
                          onChange={(event) => handleTaskFilterChange('taskType', event.target.value)}
                          disabled={isReportsLikeScreen}
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
                        <button
                          type="button"
                          className="icon-btn"
                          aria-label="Pesquisar"
                          onClick={applyTaskFilters}
                        >
                          Buscar
                        </button>
                        <button
                          type="button"
                          className="icon-btn"
                          aria-label="Limpar filtros"
                          onClick={clearTaskFilters}
                        >
                          Limpar
                        </button>
                      </div>
                    </div>
                  </>
                )}

                {screen === 'tasks' && taskBlueprintRows.length ? taskBlueprintsPanel : null}

                {isReportsLikeScreen ? (
                  <>
                    <div className="report-table">
                  <div className="report-head">
                    <span>No</span>
                    <span>Status</span>
                    <span>Tipo</span>
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
                            key={row.reportKey || `${row.reportSource}-${row.id}`}
                            style={{ '--delay': `${index * 0.05}s` }}
                            role="button"
                            tabIndex={0}
                            onClick={() => openTaskDetail(row.id, row.reportSource || 'task')}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault()
                                openTaskDetail(row.id, row.reportSource || 'task')
                              }
                            }}
                          >
                            <span>{row.id}</span>
                            <span className={`status-pill ${displayStatus.tag}`} title={displayStatus.status}>
                              {displayStatus.status}
                            </span>
                            <span title={row.taskType || (row.reportSource === 'solicitation' ? 'Solicitação' : 'Tarefa')}>
                              {row.taskType || (row.reportSource === 'solicitation' ? 'Solicitação' : 'Tarefa')}
                            </span>
                            <span title={getDepartmentLabel(row.dept)}>{getDepartmentLabel(row.dept)}</span>
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
                  </>
                ) : null}
              </div>
            ) : screen === 'task-detail' ? (
              <div className="task-detail-view">
                <header className="task-detail-header card">
                  <div className="task-detail-title">
                    <button type="button" className="chip small" onClick={goBackToTasks}>
                      Voltar para Obrigações
                    </button>
                    <h4>{selectedTask ? selectedTask.subject : `${selectedEntityLabel} não encontrada`}</h4>
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
                      <h5>
                        {isSelectedSolicitation ? 'Informações da Solicitação' : 'Informações da tarefa'}
                      </h5>
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
                        <span>
                          {isSelectedSolicitation
                            ? 'Anexar arquivo da solicitação'
                            : 'Anexar arquivo da tarefa'}
                        </span>
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
                                Download
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
                          onClick={handleTaskFinalize}
                        >
                          Finalizar
                        </button>
                        <button type="button" className="chip tiny" onClick={handleTaskDispense}>
                          Dispensar
                        </button>
                        {canManageSelectedTaskRecord ? (
                          <button type="button" className="chip tiny" onClick={handleTaskEdit}>
                            {taskEditMode ? 'Salvar edição' : 'Editar'}
                          </button>
                        ) : null}
                        {canManageSelectedTaskRecord ? (
                          <button type="button" className="danger-outline" onClick={handleTaskDelete}>
                            Excluir
                          </button>
                        ) : null}
                        <button
                          type="button"
                          className={`chip tiny task-email-button ${isTaskEmailSent ? 'sent' : ''}`}
                          onClick={handleTaskSendEmail}
                          disabled={taskEmailSending}
                          title={
                            selectedTaskRecipientEmail
                              ? `Enviar para ${selectedTaskRecipientEmail}`
                              : 'Cliente sem e-mail cadastrado'
                          }
                        >
                          {taskEmailSending
                            ? 'Enviando...'
                            : isTaskEmailSent
                              ? 'E-mail enviado'
                              : 'Enviar por E-mail'}
                        </button>
                      </div>
                      {selectedTask.emailSentAt ? (
                        <p className="task-email-meta">
                          Enviado para <strong>{selectedTask.emailSentTo || selectedTaskRecipientEmail}</strong> em{' '}
                          {selectedTask.emailSentAt}
                        </p>
                      ) : null}

                      <div className="task-action-log">
                        <h6>
                          {isSelectedSolicitation ? 'Histórico da solicitação' : 'Histórico da tarefa'}
                        </h6>
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
                    <p>{`A ${selectedEntityLabelLower} selecionada não foi encontrada.`}</p>
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
                    <div className="settings-logo-panel">
                      <div className="settings-logo-head">
                        <h6>Logo da empresa</h6>
                        <p>Formatos aceitos: PNG, JPG, JPEG, SVG, WEBP e outros formatos de imagem.</p>
                      </div>
                      <div className="settings-logo-grid">
                        <label className="settings-field">
                          <span>Anexar logo</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleSettingsLogoSelect}
                            disabled={settingsLogoLoading || !canManageTenantBranding}
                          />
                        </label>
                        <div className="settings-logo-preview">
                          {settingsLogoDraftDataUrl || companyLogoDataUrl ? (
                            <img
                              src={settingsLogoDraftDataUrl || companyLogoDataUrl}
                              alt={settingsLogoDraftName || companyLogoName || 'Logo'}
                            />
                          ) : (
                            <span>Sem logo cadastrada</span>
                          )}
                        </div>
                      </div>
                      <div className="settings-actions-row settings-logo-actions">
                        <button
                          type="button"
                          className="chip small"
                          onClick={handleSettingsLogoRemove}
                          disabled={
                            !canManageTenantBranding ||
                            (!companyLogoDataUrl && !settingsLogoDraftDataUrl)
                          }
                        >
                          Remover
                        </button>
                        <button
                          type="button"
                          className="primary small"
                          onClick={handleSettingsLogoSave}
                          disabled={
                            !canManageTenantBranding || !settingsLogoDraftDataUrl || settingsLogoLoading
                          }
                        >
                          Salvar logo
                        </button>
                      </div>
                      {settingsLogoFeedback ? (
                        <p className="settings-feedback">{settingsLogoFeedback}</p>
                      ) : null}
                      {!canManageTenantBranding ? (
                        <p className="settings-feedback">
                          Somente o administrador do tenant pode alterar a logo.
                        </p>
                      ) : null}
                    </div>

                    <form className="settings-form-grid" onSubmit={handleSettingsUserSave}>
                      {!canManageTenantUsers ? (
                        <p className="settings-feedback">
                          Você tem acesso somente de visualização ao seu cadastro.
                        </p>
                      ) : null}
                      <label className="settings-field">
                        <span>Nome</span>
                        <input
                          type="text"
                          value={userForm.nome}
                          onChange={(event) => handleSettingsUserChange('nome', event.target.value)}
                          placeholder="Nome do usuário"
                          disabled={!canManageTenantUsers}
                        />
                      </label>
                      <label className="settings-field">
                        <span>Departamento</span>
                        <select
                          value={userForm.departamento}
                          onChange={(event) =>
                            handleSettingsUserChange('departamento', event.target.value)
                          }
                          disabled={!canManageTenantUsers}
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
                          disabled={!canManageTenantUsers}
                        />
                      </label>
                      <label className="settings-field">
                        <span>E-mail (login)</span>
                        <input
                          type="email"
                          value={userForm.email}
                          onChange={(event) => handleSettingsUserChange('email', event.target.value)}
                          placeholder="usuario@empresa.com"
                          disabled={!canManageTenantUsers}
                        />
                      </label>
                      <label className="settings-field">
                        <span>Senha</span>
                        <input
                          type="text"
                          value={userForm.senha}
                          onChange={(event) => handleSettingsUserChange('senha', event.target.value)}
                          placeholder="Senha de acesso"
                          disabled={!canManageTenantUsers}
                        />
                      </label>
                      <label className="settings-field settings-user-clients-field">
                        <span>Clientes</span>
                        <div className="multi-select" ref={userClientsRef}>
                          <div
                            className={`multi-trigger ${userClientsOpen ? 'open' : ''}`}
                            role="button"
                            tabIndex={0}
                            onClick={() => {
                              if (canManageTenantUsers && selectedUserDepartment) {
                                setUserClientsOpen((prev) => !prev)
                              }
                            }}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault()
                                if (canManageTenantUsers && selectedUserDepartment) {
                                  setUserClientsOpen((prev) => !prev)
                                }
                              }
                            }}
                          >
                            {selectedUserClientLabels.length ? (
                              <div className="multi-tags">
                                {selectedUserClientIds.map((clientId) => {
                                  const currentClient = settingsUserAvailableClients.find(
                                    (client) => String(client.id) === String(clientId),
                                  )
                                  const clientName = currentClient?.nome || `Cliente #${clientId}`
                                  return (
                                    <span className="tag-pill" key={`settings-user-client-${clientId}`}>
                                      {clientName}
                                      <button
                                        type="button"
                                        onClick={(event) => {
                                          event.stopPropagation()
                                          toggleSettingsUserClient(clientId)
                                        }}
                                        disabled={!canManageTenantUsers}
                                      >
                                        ×
                                      </button>
                                    </span>
                                  )
                                })}
                              </div>
                            ) : (
                              <span className="placeholder">
                                {selectedUserDepartment
                                  ? 'Selecione os clientes...'
                                  : 'Selecione um departamento primeiro'}
                              </span>
                            )}
                            <span className="caret" />
                          </div>
                          {userClientsOpen && selectedUserDepartment ? (
                            <div className="multi-menu">
                              {settingsUserAvailableClients.length ? (
                                settingsUserAvailableClients.map((client) => (
                                  <button
                                    type="button"
                                    className={`multi-option ${
                                      selectedUserClientIds.includes(String(client.id)) ? 'selected' : ''
                                    }`}
                                    key={`settings-user-client-option-${client.id}`}
                                    onClick={() => toggleSettingsUserClient(client.id)}
                                    disabled={!canManageTenantUsers}
                                  >
                                    <span className="check" />
                                    {client.nome}
                                  </button>
                                ))
                              ) : (
                                <div className="multi-empty">Nenhum cliente disponível para o departamento.</div>
                              )}
                            </div>
                          ) : null}
                        </div>
                      </label>
                      <div className="settings-actions-row">
                        <button
                          type="button"
                          className="chip small"
                          onClick={clearSettingsUserForm}
                          disabled={!canManageTenantUsers}
                        >
                          Limpar
                        </button>
                        <button type="submit" className="primary small" disabled={!canManageTenantUsers}>
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
                        <span>Clientes</span>
                        <span>Telefone</span>
                        <span>E-mail (login)</span>
                        <span>Senha</span>
                        <span>Ações</span>
                      </div>
                      <div className="settings-users-body">
                        {settingsUsersVisibleRows.map((user) => (
                          <div className="settings-users-row" key={user.id}>
                            <span title={user.nome}>{user.nome}</span>
                            <span title={user.departamento || '-'}>{user.departamento || '-'}</span>
                            <span
                              title={
                                Array.isArray(user.clientIds) && user.clientIds.length
                                  ? user.clientIds
                                      .map((clientId) =>
                                        clientsForCurrentUser.find(
                                          (client) => String(client.id) === String(clientId),
                                        )?.nome,
                                      )
                                      .filter(Boolean)
                                      .join(', ')
                                  : '-'
                              }
                            >
                              {Array.isArray(user.clientIds) && user.clientIds.length
                                ? user.clientIds
                                    .map((clientId) =>
                                      clientsForCurrentUser.find(
                                        (client) => String(client.id) === String(clientId),
                                      )?.nome,
                                    )
                                    .filter(Boolean)
                                    .join(', ')
                                : '-'}
                            </span>
                            <span title={user.telefone || '-'}>{user.telefone || '-'}</span>
                            <span title={user.email}>{user.email}</span>
                            <span title={user.senha}>{user.senha}</span>
                            <span className="settings-users-actions">
                              {canManageTenantUsers ? (
                                <>
                                  <button
                                    type="button"
                                    className="link-btn"
                                    onClick={() => editSettingsUser(user)}
                                  >
                                    Editar
                                  </button>
                                  <button
                                    type="button"
                                    className="link-btn danger"
                                    onClick={() => removeSettingsUser(user.id)}
                                  >
                                    Excluir
                                  </button>
                                </>
                              ) : (
                                <span>-</span>
                              )}
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
                          <select
                            value={String(getDayOfMonthFromIso(settingsTaskForm.actionDate))}
                            onChange={(event) =>
                              handleSettingsTaskChange(
                                'actionDate',
                                setIsoDateDay(settingsTaskForm.actionDate, event.target.value),
                              )
                            }
                          >
                            {monthDayOptions.map((day) => (
                              <option key={`settings-action-day-${day}`} value={day}>
                                {day}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="settings-field">
                          <span>
                            Meta <strong className="req">*</strong>
                          </span>
                          <select
                            value={String(getDayOfMonthFromIso(settingsTaskForm.metaDate))}
                            onChange={(event) =>
                              handleSettingsTaskChange(
                                'metaDate',
                                setIsoDateDay(settingsTaskForm.metaDate, event.target.value),
                              )
                            }
                          >
                            {monthDayOptions.map((day) => (
                              <option key={`settings-meta-day-${day}`} value={day}>
                                {day}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="settings-field">
                          <span>
                            Vencimento <strong className="req">*</strong>
                          </span>
                          <select
                            value={String(getDayOfMonthFromIso(settingsTaskForm.dueDate))}
                            onChange={(event) =>
                              handleSettingsTaskChange(
                                'dueDate',
                                setIsoDateDay(settingsTaskForm.dueDate, event.target.value),
                              )
                            }
                          >
                            {monthDayOptions.map((day) => (
                              <option key={`settings-due-day-${day}`} value={day}>
                                {day}
                              </option>
                            ))}
                          </select>
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
                            Departamento <strong className="req">*</strong>
                          </span>
                          <select
                            value={settingsTaskForm.departmentScope}
                            onChange={(event) =>
                              handleSettingsTaskChange('departmentScope', event.target.value)
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
                      </div>

                      <div className="settings-form-grid settings-task-scope">
                        <label className="settings-field">
                          <span>UF</span>
                          <select
                            value={settingsTaskForm.ufScope}
                            onChange={(event) => handleSettingsTaskChange('ufScope', event.target.value)}
                          >
                            {brazilUfOptions.map((uf) => (
                              <option key={uf} value={uf}>
                                {uf}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="settings-field">
                          <span>Tributação</span>
                          <div className="multi-select" ref={settingsTaskTaxRef}>
                            <div
                              className={`multi-trigger ${settingsTaskTaxOpen ? 'open' : ''}`}
                              role="button"
                              tabIndex={0}
                              onClick={() => setSettingsTaskTaxOpen((prev) => !prev)}
                              onKeyDown={(event) => {
                                if (event.key === 'Enter' || event.key === ' ') {
                                  event.preventDefault()
                                  setSettingsTaskTaxOpen((prev) => !prev)
                                }
                              }}
                            >
                              {selectedSettingsTaskTaxations.length ? (
                                <div className="multi-tags">
                                  {selectedSettingsTaskTaxations.map((taxation) => (
                                    <span className="tag-pill" key={taxation}>
                                      {taxation}
                                      <button
                                        type="button"
                                        onClick={(event) => {
                                          event.stopPropagation()
                                          toggleSettingsTaskTaxation(taxation)
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
                            {settingsTaskTaxOpen ? (
                              <div className="multi-menu">
                                {settingsTaskTaxationOptions.map((option) => (
                                  <button
                                    type="button"
                                    className={`multi-option ${
                                      selectedSettingsTaskTaxations.includes(option) ? 'selected' : ''
                                    }`}
                                    key={option}
                                    onClick={() => toggleSettingsTaskTaxation(option)}
                                  >
                                    <span className="check" />
                                    {option}
                                  </button>
                                ))}
                              </div>
                            ) : null}
                          </div>
                        </label>
                      </div>

                      <div className="settings-inline-toggle">
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

                      <label className="settings-field">
                        <span>Convidados</span>
                        <input
                          type="text"
                          value={settingsTaskForm.guests}
                          onChange={(event) => handleSettingsTaskChange('guests', event.target.value)}
                          placeholder="Nomes separados por vírgula"
                        />
                      </label>

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

                <div className="filters task-filters-grid">
                  <label className="task-filter-field">
                    <span>Status</span>
                    <select
                      value={clientTableFilters.status}
                      onChange={(event) => handleClientTableFilterChange('status', event.target.value)}
                    >
                      {clientStatusFilterOptions.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="task-filter-field">
                    <span>Grupo</span>
                    <select
                      value={clientTableFilters.grupo}
                      onChange={(event) => handleClientTableFilterChange('grupo', event.target.value)}
                    >
                      {clientGroupFilterOptions.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="task-filter-field">
                    <span>Visibilidade</span>
                    <select
                      value={clientTableFilters.visibilidade}
                      onChange={(event) =>
                        handleClientTableFilterChange('visibilidade', event.target.value)
                      }
                    >
                      {clientVisibilityFilterOptions.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="task-filter-field">
                    <span>UF</span>
                    <select
                      value={clientTableFilters.uf}
                      onChange={(event) => handleClientTableFilterChange('uf', event.target.value)}
                    >
                      {clientUfFilterOptions.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="task-filter-field">
                    <span>Tributação</span>
                    <select
                      value={clientTableFilters.tributacao}
                      onChange={(event) =>
                        handleClientTableFilterChange('tributacao', event.target.value)
                      }
                    >
                      {clientTaxationFilterOptions.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="task-filter-field">
                    <span>Documento</span>
                    <select
                      value={clientTableFilters.docType}
                      onChange={(event) => handleClientTableFilterChange('docType', event.target.value)}
                    >
                      {clientDocTypeFilterOptions.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button type="button" className="chip primary small" onClick={applyClientTableFilters}>
                    Aplicar
                  </button>
                  <button type="button" className="chip small" onClick={clearClientTableFilters}>
                    Limpar
                  </button>
                </div>

                <div className="report-search">
                  <input
                    type="text"
                    placeholder="Buscar por nome, apelido, documento, contato, telefone, e-mail..."
                    value={clientTableFilters.query}
                    onChange={(event) => handleClientTableFilterChange('query', event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault()
                        applyClientTableFilters()
                      }
                    }}
                  />
                  <div className="report-icons">
                    <button
                      type="button"
                      className="icon-btn"
                      aria-label="Pesquisar"
                      onClick={applyClientTableFilters}
                    >
                      Buscar
                    </button>
                    <button
                      type="button"
                      className="icon-btn"
                      aria-label="Limpar filtros"
                      onClick={clearClientTableFilters}
                    >
                      Limpar
                    </button>
                  </div>
                </div>

                <div className="client-table card">
                  <div className="client-select-all">
                    <label>
                      <input
                        type="checkbox"
                        ref={selectAllRef}
                        checked={
                          filteredClients.length > 0 &&
                          filteredClients.every((client) =>
                            selectedClientIds.includes(String(client.id)),
                          )
                        }
                        onChange={toggleSelectAll}
                        disabled={!filteredClients.length}
                      />
                      Selecionar todos
                    </label>
                    <div className="bulk-actions">
                      <button
                        type="button"
                        className="chip small"
                        disabled={!canManageClients || !selectedClientIds.length}
                        onClick={openBulkModal}
                        title={
                          canManageClients
                            ? 'Editar clientes selecionados'
                            : 'Apenas administrador pode editar clientes'
                        }
                      >
                        Editar em lote
                      </button>
                      <button
                        type="button"
                        className="chip small"
                        disabled={!canManageClientTaskGeneration || !selectedClientIds.length}
                        onClick={generateTasksForSelectedClients}
                        title={
                          canManageClientTaskGeneration
                            ? 'Gerar tarefas para clientes selecionados'
                            : 'Apenas administrador pode gerar tarefas em lote'
                        }
                      >
                        Gerar tarefas em lote
                      </button>
                      <button
                        type="button"
                        className="danger-outline"
                        disabled={!canManageClientTaskGeneration || !selectedClientIds.length}
                        onClick={deleteTasksForSelectedClients}
                        title={
                          canManageClientTaskGeneration
                            ? 'Excluir tarefas dos clientes selecionados'
                            : 'Apenas administrador pode excluir tarefas em lote'
                        }
                      >
                        Excluir tarefas em lote
                      </button>
                      <button
                        type="button"
                        className="danger-outline"
                        disabled={!canManageClients || !selectedClientIds.length}
                        onClick={requestBulkDelete}
                        title={
                          canManageClients
                            ? 'Excluir clientes selecionados'
                            : 'Apenas administrador pode excluir clientes'
                        }
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
                    {filteredClients.length ? (
                      filteredClients.map((client) => (
                      <div className="client-row" key={client.id}>
                        <span>
                          <input
                            type="checkbox"
                            checked={selectedClientIds.includes(String(client.id))}
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
                            className="link-btn icon generate"
                            onClick={() => generateTasksForClient(client)}
                            aria-label="Gerar tarefas"
                            title={
                              canManageClientTaskGeneration
                                ? 'Gerar tarefas'
                                : 'Apenas administrador pode gerar tarefas'
                            }
                            disabled={!canManageClientTaskGeneration}
                          >
                            <svg viewBox="0 0 24 24" aria-hidden="true">
                              <path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            className="link-btn icon danger"
                            onClick={() => deleteTasksForClient(client)}
                            aria-label="Excluir tarefas"
                            title={
                              canManageClientTaskGeneration
                                ? 'Excluir tarefas'
                                : 'Apenas administrador pode excluir tarefas'
                            }
                            disabled={!canManageClientTaskGeneration}
                          >
                            <svg viewBox="0 0 24 24" aria-hidden="true">
                              <path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z" />
                              <path d="M9 16h6" />
                            </svg>
                          </button>
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
                            title={canManageClients ? 'Editar' : 'Apenas administrador pode editar clientes'}
                            disabled={!canManageClients}
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
                            title={canManageClients ? 'Excluir' : 'Apenas administrador pode excluir clientes'}
                            disabled={!canManageClients}
                          >
                            <svg viewBox="0 0 24 24" aria-hidden="true">
                              <path d="M4 7h16" />
                              <path d="M9 7V5h6v2" />
                              <path d="M7 7l1 12h8l1-12" />
                            </svg>
                          </button>
                        </span>
                      </div>
                      ))
                    ) : (
                      <div className="client-row client-row-empty">
                        <span>#</span>
                        <span>Sem clientes para os filtros aplicados</span>
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
              </div>
            ) : null}
          </div>

          {superTenantEditorOpen ? (
            <div
              className="modal-backdrop"
              onMouseDown={handleModalBackdropMouseDown}
              onClick={(event) => handleModalBackdropClick(event, closeSuperTenantEditor)}
            >
              <div className="modal-card super-tenant-editor-modal" onClick={(event) => event.stopPropagation()}>
                <header className="modal-header">
                  <h3>Tenant</h3>
                  <button className="modal-close" type="button" onClick={closeSuperTenantEditor}>
                    ×
                  </button>
                </header>

                <form className="client-form" onSubmit={handleSuperTenantEditorSave}>
                  <div className="form-grid">
                    <label className="field">
                      <span>Nome do tenant</span>
                      <input
                        type="text"
                        value={superTenantEditorForm.name}
                        onChange={(event) =>
                          setSuperTenantEditorForm((prev) => ({ ...prev, name: event.target.value }))
                        }
                        disabled={superTenantEditorMode !== 'edit'}
                        required
                      />
                    </label>
                    <label className="field">
                      <span>Slug</span>
                      <input
                        type="text"
                        value={superTenantEditorForm.slug}
                        onChange={(event) =>
                          setSuperTenantEditorForm((prev) => ({ ...prev, slug: event.target.value }))
                        }
                        disabled={superTenantEditorMode !== 'edit'}
                      />
                    </label>
                  </div>

                  <div className="form-grid">
                    <label className="field">
                      <span>Admin do tenant</span>
                      <input
                        type="text"
                        value={superTenantEditorForm.adminName}
                        onChange={(event) =>
                          setSuperTenantEditorForm((prev) => ({ ...prev, adminName: event.target.value }))
                        }
                        disabled={superTenantEditorMode !== 'edit'}
                        placeholder="Nome do admin"
                      />
                    </label>
                    <label className="field">
                      <span>E-mail admin</span>
                      <input
                        type="email"
                        value={superTenantEditorForm.adminEmail}
                        onChange={(event) =>
                          setSuperTenantEditorForm((prev) => ({ ...prev, adminEmail: event.target.value }))
                        }
                        disabled={superTenantEditorMode !== 'edit'}
                        placeholder="admin@tenant.com"
                        required
                      />
                    </label>
                  </div>

                  <div className="form-grid">
                    <label className="field">
                      <span>Senha admin</span>
                      <input
                        type="password"
                        value={superTenantEditorMode === 'edit' ? superTenantEditorForm.adminPassword : '********'}
                        onChange={(event) =>
                          setSuperTenantEditorForm((prev) => ({ ...prev, adminPassword: event.target.value }))
                        }
                        disabled={superTenantEditorMode !== 'edit'}
                        placeholder={
                          superTenantEditorMode === 'edit'
                            ? 'Digite para redefinir'
                            : 'Oculta por segurança'
                        }
                      />
                    </label>
                    <label className="field">
                      <span>Status</span>
                      <input
                        type="text"
                        value={superTenantEditorForm.status === 'ACTIVE' ? 'Ativo' : 'Inativo'}
                        disabled
                      />
                    </label>
                  </div>

                  <div className="form-grid">
                    <label className="field">
                      <span>Criado em</span>
                      <input
                        type="text"
                        value={formatIsoDateTimeToBr(superTenantEditorForm.createdAt) || '-'}
                        disabled
                      />
                    </label>
                    <label className="field">
                      <span>Última atualização</span>
                      <input
                        type="text"
                        value={formatIsoDateTimeToBr(superTenantEditorForm.updatedAt) || '-'}
                        disabled
                      />
                    </label>
                  </div>

                  <div className="super-tenant-editor-actions">
                    {superTenantEditorMode !== 'edit' ? (
                      <button
                        type="button"
                        className="chip"
                        onClick={enableSuperTenantEditorEdit}
                      >
                        Editar
                      </button>
                    ) : null}
                    {superTenantEditorMode === 'edit' ? (
                      <>
                        <button type="submit" className="chip primary" disabled={isApiLoading}>
                          Salvar
                        </button>
                        <button type="button" className="chip" onClick={cancelSuperTenantEditorEdit}>
                          Cancelar
                        </button>
                      </>
                    ) : null}
                    <button
                      type="button"
                      className="danger-outline"
                      onClick={handleSuperTenantDelete}
                      disabled={isApiLoading}
                    >
                      Excluir
                    </button>
                  </div>
                </form>
              </div>
            </div>
          ) : null}

          {createOpen ? (
            <div
              className="modal-backdrop"
              onMouseDown={handleModalBackdropMouseDown}
              onClick={(event) => handleModalBackdropClick(event, () => setCreateOpen(false))}
            >
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
                  <button className="create-option" type="button" onClick={openSolicitationModal}>
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
                  {canCreateTaskBlueprints ? (
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
                  ) : null}
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
            <div
              className="modal-backdrop"
              onMouseDown={handleModalBackdropMouseDown}
              onClick={(event) => handleModalBackdropClick(event, () => setTaskCreateOpen(false))}
            >
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
                      <select
                        value={String(getDayOfMonthFromIso(settingsTaskForm.actionDate))}
                        onChange={(event) =>
                          handleSettingsTaskChange(
                            'actionDate',
                            setIsoDateDay(settingsTaskForm.actionDate, event.target.value),
                          )
                        }
                      >
                        {monthDayOptions.map((day) => (
                          <option key={`modal-action-day-${day}`} value={day}>
                            {day}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="settings-field">
                      <span>
                        Meta <strong className="req">*</strong>
                      </span>
                      <select
                        value={String(getDayOfMonthFromIso(settingsTaskForm.metaDate))}
                        onChange={(event) =>
                          handleSettingsTaskChange(
                            'metaDate',
                            setIsoDateDay(settingsTaskForm.metaDate, event.target.value),
                          )
                        }
                      >
                        {monthDayOptions.map((day) => (
                          <option key={`modal-meta-day-${day}`} value={day}>
                            {day}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="settings-field">
                      <span>
                        Vencimento <strong className="req">*</strong>
                      </span>
                      <select
                        value={String(getDayOfMonthFromIso(settingsTaskForm.dueDate))}
                        onChange={(event) =>
                          handleSettingsTaskChange(
                            'dueDate',
                            setIsoDateDay(settingsTaskForm.dueDate, event.target.value),
                          )
                        }
                      >
                        {monthDayOptions.map((day) => (
                          <option key={`modal-due-day-${day}`} value={day}>
                            {day}
                          </option>
                        ))}
                      </select>
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
                        Departamento <strong className="req">*</strong>
                      </span>
                      <select
                        value={settingsTaskForm.departmentScope}
                        onChange={(event) =>
                          handleSettingsTaskChange('departmentScope', event.target.value)
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
                  </div>

                  <div className="settings-form-grid settings-task-scope">
                    <label className="settings-field">
                      <span>UF</span>
                      <select
                        value={settingsTaskForm.ufScope}
                        onChange={(event) => handleSettingsTaskChange('ufScope', event.target.value)}
                      >
                        {brazilUfOptions.map((uf) => (
                          <option key={uf} value={uf}>
                            {uf}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="settings-field">
                      <span>Tributação</span>
                      <div className="multi-select" ref={settingsTaskTaxRef}>
                        <div
                          className={`multi-trigger ${settingsTaskTaxOpen ? 'open' : ''}`}
                          role="button"
                          tabIndex={0}
                          onClick={() => setSettingsTaskTaxOpen((prev) => !prev)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault()
                              setSettingsTaskTaxOpen((prev) => !prev)
                            }
                          }}
                        >
                          {selectedSettingsTaskTaxations.length ? (
                            <div className="multi-tags">
                              {selectedSettingsTaskTaxations.map((taxation) => (
                                <span className="tag-pill" key={taxation}>
                                  {taxation}
                                  <button
                                    type="button"
                                    onClick={(event) => {
                                      event.stopPropagation()
                                      toggleSettingsTaskTaxation(taxation)
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
                        {settingsTaskTaxOpen ? (
                          <div className="multi-menu">
                            {settingsTaskTaxationOptions.map((option) => (
                              <button
                                type="button"
                                className={`multi-option ${
                                  selectedSettingsTaskTaxations.includes(option) ? 'selected' : ''
                                }`}
                                key={option}
                                onClick={() => toggleSettingsTaskTaxation(option)}
                              >
                                <span className="check" />
                                {option}
                              </button>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </label>
                  </div>

                  <div className="settings-inline-toggle">
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

                  <label className="settings-field">
                    <span>Convidados</span>
                    <input
                      type="text"
                      value={settingsTaskForm.guests}
                      onChange={(event) => handleSettingsTaskChange('guests', event.target.value)}
                      placeholder="Nomes separados por vírgula"
                    />
                  </label>

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

          {solicitationOpen ? (
            <div
              className="modal-backdrop"
              onMouseDown={handleModalBackdropMouseDown}
              onClick={(event) =>
                handleModalBackdropClick(event, () => {
                  setSolicitationOpen(false)
                  clearSolicitationForm()
                })
              }
            >
              <div className="modal-card wide solicitation-modal" onClick={(event) => event.stopPropagation()}>
                <header className="modal-header">
                  <h3>Nova Solicitação</h3>
                  <button
                    className="modal-close"
                    type="button"
                    onClick={() => {
                      setSolicitationOpen(false)
                      clearSolicitationForm()
                    }}
                  >
                    ×
                  </button>
                </header>

                <form className="settings-task-form solicitation-form" onSubmit={handleSolicitationSave}>
                  <div className="settings-form-grid solicitation-top-grid">
                    <label className="settings-field">
                      <span>
                        Departamento <strong className="req">*</strong>
                      </span>
                      <select
                        value={solicitationForm.departamento}
                        onChange={(event) => handleSolicitationChange('departamento', event.target.value)}
                      >
                        <option value="">Selecione...</option>
                        {solicitationDepartmentOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="settings-field">
                      <span>Processo</span>
                      <input
                        list={solicitationProcessOptions.length ? 'solicitation-process-options' : undefined}
                        type="text"
                        value={solicitationForm.processo}
                        onChange={(event) => handleSolicitationChange('processo', event.target.value)}
                        autoComplete="off"
                        placeholder=""
                      />
                      <datalist id="solicitation-process-options">
                        {solicitationProcessOptions.map((option) => (
                          <option key={option} value={option} />
                        ))}
                      </datalist>
                    </label>
                    <label className="settings-field solicitation-stage-field">
                      <span>Etapa</span>
                      <select
                        value={solicitationForm.etapa}
                        onChange={(event) => handleSolicitationChange('etapa', event.target.value)}
                      >
                        <option value="">Selecione...</option>
                        {solicitationStageOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="settings-field solicitation-subject-field">
                      <span>
                        Assunto <strong className="req">*</strong>
                      </span>
                      <input
                        type="text"
                        value={solicitationForm.assunto}
                        onChange={(event) => handleSolicitationChange('assunto', event.target.value)}
                        placeholder="Descreva a nova solicitação"
                      />
                    </label>
                    <label className="settings-field solicitation-client-search-field">
                      <span>Pesquisar Clientes</span>
                      <input
                        type="text"
                        value={solicitationClientSearch}
                        onChange={(event) => setSolicitationClientSearch(event.target.value)}
                        placeholder="Digite para buscar e selecionar"
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' && solicitationClientSearchResults.length) {
                            event.preventDefault()
                            addSolicitationClientBySearch(solicitationClientSearchResults[0].id)
                          }
                        }}
                      />
                      {solicitationClientSearchResults.length ? (
                        <div className="solicitation-search-results">
                          {solicitationClientSearchResults.map((client) => {
                            const isSelected = solicitationForm.clientIds.includes(String(client.id))
                            return (
                              <button
                                key={client.id}
                                type="button"
                                className={`solicitation-search-option ${isSelected ? 'selected' : ''}`}
                                onClick={() => addSolicitationClientBySearch(client.id)}
                              >
                                <span>{client.nome}</span>
                                <small>{client.inscricao || client.email || client.status}</small>
                              </button>
                            )
                          })}
                        </div>
                      ) : null}
                    </label>
                  </div>

                  <div className="settings-clients-box">
                    <div className="settings-clients-top">
                      <span>
                        Cliente(s) <strong className="req">*</strong>
                      </span>
                      <label>
                        <input
                          type="checkbox"
                          checked={solicitationForm.includeDisabledClients}
                          onChange={(event) =>
                            handleSolicitationChange('includeDisabledClients', event.target.checked)
                          }
                        />
                        Exibir clientes desativados
                      </label>
                    </div>
                    <div className="settings-clients-list">
                      {solicitationClients.length ? (
                        solicitationClients.map((client) => (
                          <label key={client.id} className="settings-client-item">
                            <input
                              type="checkbox"
                              checked={solicitationForm.clientIds.includes(String(client.id))}
                              onChange={() => toggleSolicitationClient(client.id)}
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

                  <div className="settings-form-grid solicitation-dates-grid">
                    <label className="settings-field">
                      <span>
                        Ação <strong className="req">*</strong>
                      </span>
                      <input
                        type="date"
                        value={solicitationForm.actionDate}
                        onChange={(event) => handleSolicitationChange('actionDate', event.target.value)}
                      />
                    </label>
                    <label className="settings-field">
                      <span>
                        Meta <strong className="req">*</strong>
                      </span>
                      <input
                        type="date"
                        value={solicitationForm.metaDate}
                        onChange={(event) => handleSolicitationChange('metaDate', event.target.value)}
                      />
                    </label>
                    <label className="settings-field">
                      <span>
                        Prazo <strong className="req">*</strong>
                      </span>
                      <input
                        type="date"
                        value={solicitationForm.dueDate}
                        onChange={(event) => handleSolicitationChange('dueDate', event.target.value)}
                      />
                    </label>
                  </div>

                  <label className="settings-field">
                    <span>Enviar arquivos</span>
                    <input type="file" multiple onChange={handleSolicitationAttachments} />
                  </label>
                  {solicitationForm.attachments.length ? (
                    <div className="settings-attachments">
                      {solicitationForm.attachments.map((file) => (
                        <span key={`${file.name}-${file.size}`} className="settings-attachment-pill">
                          {file.name}
                          <button
                            type="button"
                            onClick={() => removeSolicitationAttachment(file.name, file.size)}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  ) : null}

                  <label className="settings-field">
                    <span>
                      Andamento <strong className="req">*</strong>
                    </span>
                    <textarea
                      rows={4}
                      value={solicitationForm.andamento}
                      onChange={(event) => handleSolicitationChange('andamento', event.target.value)}
                      placeholder="Descreva o andamento da solicitação."
                    />
                  </label>

                  <div className="settings-form-grid solicitation-people-grid">
                    <label className="settings-field">
                      <span>
                        Responsável <strong className="req">*</strong>
                      </span>
                      <input
                        list="solicitation-owner-options"
                        type="text"
                        value={solicitationForm.responsavel}
                        onChange={(event) => handleSolicitationChange('responsavel', event.target.value)}
                        placeholder="Selecione..."
                      />
                      <datalist id="solicitation-owner-options">
                        {settingsOwnerOptions.map((option) => (
                          <option key={option} value={option} />
                        ))}
                      </datalist>
                    </label>
                    <label className="settings-field">
                      <span>Convidados</span>
                      <input
                        type="text"
                        value={solicitationForm.convidados}
                        onChange={(event) => handleSolicitationChange('convidados', event.target.value)}
                        placeholder="Selecione..."
                      />
                    </label>
                  </div>

                  <div className="solicitation-checks-grid">
                    <label>
                      <input
                        type="checkbox"
                        checked={solicitationForm.iAmResponsible}
                        onChange={(event) => handleSolicitationChange('iAmResponsible', event.target.checked)}
                      />
                      Sou o responsável
                    </label>
                    <label>
                      <input
                        type="checkbox"
                        checked={solicitationForm.notifyGuests}
                        onChange={(event) => handleSolicitationChange('notifyGuests', event.target.checked)}
                      />
                      Notificar convidados por e-mail
                    </label>
                    <label>
                      <input
                        type="checkbox"
                        checked={solicitationForm.notifyOpen}
                        onChange={(event) => handleSolicitationChange('notifyOpen', event.target.checked)}
                      />
                      Notificar ao abrir
                    </label>
                    <label>
                      <input
                        type="checkbox"
                        checked={solicitationForm.notifyEnd}
                        onChange={(event) => handleSolicitationChange('notifyEnd', event.target.checked)}
                      />
                      Notificar ao finalizar
                    </label>
                    <label>
                      <input
                        type="checkbox"
                        checked={solicitationForm.replicateSubtasks}
                        onChange={(event) =>
                          handleSolicitationChange('replicateSubtasks', event.target.checked)
                        }
                      />
                      Replicar para subatendimentos
                    </label>
                    <label>
                      <input
                        type="checkbox"
                        checked={solicitationForm.iAmAuthorizer}
                        onChange={(event) => handleSolicitationChange('iAmAuthorizer', event.target.checked)}
                      />
                      Sou o autorizador
                    </label>
                  </div>

                  <div className="settings-actions-row">
                    <button
                      type="button"
                      className="chip small"
                      onClick={() => {
                        setSolicitationOpen(false)
                        clearSolicitationForm()
                      }}
                    >
                      Cancelar
                    </button>
                    <button type="submit" className="primary small">
                      Confirmar
                    </button>
                  </div>
                </form>
                {solicitationFeedback ? <p className="settings-feedback">{solicitationFeedback}</p> : null}
              </div>
            </div>
          ) : null}

          {clientTaskGenerateOpen ? (
            <div
              className="modal-backdrop"
              onMouseDown={handleModalBackdropMouseDown}
              onClick={(event) => handleModalBackdropClick(event, closeClientTaskGenerateModal)}
            >
              <div
                className="modal-card wide client-task-generate-modal"
                onClick={(event) => event.stopPropagation()}
              >
                <header className="modal-header">
                  <div>
                    <h3>{clientTaskGenerateMode === 'delete' ? 'Excluir tarefas' : 'Gerar tarefas'}</h3>
                    <p className="client-task-generate-subtitle">
                      {clientTaskGenerateSingleClient ? (
                        <>
                          Cliente: <strong>{clientTaskGenerateSingleClient.nome}</strong>
                          {clientTaskGenerateSingleClient.uf
                            ? ` • UF ${String(clientTaskGenerateSingleClient.uf).toUpperCase()}`
                            : ''}
                          {clientTaskGenerateSingleClient.tributacao
                            ? ` • ${clientTaskGenerateSingleClient.tributacao}`
                            : ''}
                        </>
                      ) : clientTaskGenerateClientsCount > 1 ? (
                        <>
                          Clientes selecionados: <strong>{clientTaskGenerateClientsCount}</strong>
                        </>
                      ) : (
                        `Selecione o período e as tarefas que deseja ${
                          clientTaskGenerateMode === 'delete' ? 'excluir' : 'gerar'
                        }.`
                      )}
                    </p>
                  </div>
                  <button className="modal-close" type="button" onClick={closeClientTaskGenerateModal}>
                    ×
                  </button>
                </header>

                <form
                  className="settings-task-form"
                  onSubmit={(event) => {
                    event.preventDefault()
                    confirmClientTaskGeneration()
                  }}
                >
                  <div className="settings-form-grid client-task-generate-dates">
                    <label className="settings-field">
                      <span>
                        Data inicial <strong className="req">*</strong>
                      </span>
                      <input
                        type="date"
                        value={clientTaskGenerateForm.startDate}
                        onChange={(event) =>
                          handleClientTaskGenerateFormChange('startDate', event.target.value)
                        }
                      />
                    </label>
                    <label className="settings-field">
                      <span>
                        Data final <strong className="req">*</strong>
                      </span>
                      <input
                        type="date"
                        value={clientTaskGenerateForm.endDate}
                        onChange={(event) =>
                          handleClientTaskGenerateFormChange('endDate', event.target.value)
                        }
                      />
                    </label>
                    <div className="client-task-generate-summary-card">
                      <span>Tarefas selecionadas</span>
                      <strong>{clientTaskGenerateSelectedIds.length}</strong>
                      <small>
                        {clientTaskGenerateAvailableBlueprints.length} compatível(is) para{' '}
                        {clientTaskGenerateClientsCount === 1 ? 'este cliente' : 'os clientes selecionados'}
                      </small>
                    </div>
                  </div>

                  <section className="client-task-generate-list-card">
                    <div className="client-task-generate-list-head">
                      <label>
                        <input
                          type="checkbox"
                          checked={clientTaskGenerateAllSelected}
                          onChange={toggleClientTaskGenerateAllBlueprints}
                          disabled={!clientTaskGenerateAvailableBlueprints.length}
                        />
                        Selecionar todas
                      </label>
                      <span>{clientTaskGenerateAvailableBlueprints.length} tarefa(s) disponível(is)</span>
                    </div>

                    <div className="client-task-generate-list">
                      {clientTaskGenerateAvailableBlueprints.length ? (
                        clientTaskGenerateAvailableBlueprints.map((blueprint) => {
                          const blueprintTaxations = (
                            Array.isArray(blueprint.tributacaoScopes)
                              ? blueprint.tributacaoScopes
                              : blueprint.tributacaoScope
                                ? [blueprint.tributacaoScope]
                                : []
                          )
                            .map((item) => String(item || '').trim())
                            .filter(Boolean)
                          return (
                            <label className="client-task-generate-item" key={blueprint.id}>
                              <input
                                type="checkbox"
                                checked={clientTaskGenerateSelectedIds.includes(blueprint.id)}
                                onChange={() => toggleClientTaskGenerateBlueprint(blueprint.id)}
                              />
                              <div className="client-task-generate-item-content">
                                <strong>{blueprint.subject || blueprint.obligation}</strong>
                                <small>
                                  {[
                                    blueprint.departmentScope || 'Sem departamento',
                                    blueprint.ufScope || 'Todos',
                                    blueprintTaxations.length
                                      ? blueprintTaxations.join(', ')
                                      : 'Todas as tributações',
                                    blueprint.competenceMode || 'Mesmo mês',
                                  ].join(' • ')}
                                </small>
                              </div>
                            </label>
                          )
                        })
                      ) : (
                        <p className="client-task-generate-empty">
                          Nenhuma tarefa cadastrada compatível com UF, tributação e grupos do cliente.
                        </p>
                      )}
                    </div>
                  </section>

                  {clientTaskGenerateFeedback ? (
                    <p className="settings-feedback">{clientTaskGenerateFeedback}</p>
                  ) : null}

                  <div className="settings-actions-row">
                    <button type="button" className="chip small" onClick={closeClientTaskGenerateModal}>
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="primary small"
                      disabled={!clientTaskGenerateAvailableBlueprints.length}
                    >
                      {clientTaskGenerateMode === 'delete'
                        ? 'Excluir mensalmente'
                        : 'Gerar mensalmente'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          ) : null}

          {clientOpen ? (
            <div
              className="modal-backdrop"
              onMouseDown={handleModalBackdropMouseDown}
              onClick={(event) => handleModalBackdropClick(event, () => setClientOpen(false))}
            >
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
                        placeholder={
                          clientForm.docType === 'CNPJ'
                            ? '00.000.000/0000-00'
                            : clientForm.docType === 'CPF'
                              ? '000.000.000-00'
                              : ''
                        }
                        value={clientForm.inscricao}
                        onChange={(event) => handleClientChange('inscricao', event.target.value)}
                        inputMode={clientForm.docType === 'CNPJ' || clientForm.docType === 'CPF' ? 'numeric' : 'text'}
                        maxLength={clientForm.docType === 'CNPJ' ? 18 : clientForm.docType === 'CPF' ? 14 : undefined}
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
                      <label>Competência inicial</label>
                      <input
                        type="text"
                        placeholder="MM/AAAA"
                        value={clientForm.competenceStart || ''}
                        onChange={(event) =>
                          handleClientChange('competenceStart', event.target.value)
                        }
                        maxLength={7}
                        inputMode="numeric"
                        readOnly={isReadOnly}
                      />
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
                      <label>CEP</label>
                      <input
                        type="text"
                        placeholder="00000-000"
                        value={clientForm.cep || ''}
                        onChange={(event) => {
                          handleClientChange('cep', event.target.value)
                          if (clientCepLookupMessage) {
                            setClientCepLookupMessage('')
                          }
                        }}
                        onBlur={(event) => handleClientCepBlur(event.target.value)}
                        inputMode="numeric"
                        maxLength={9}
                        readOnly={isReadOnly}
                      />
                    </div>
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
                  {clientCepLookupMessage ? (
                    <p className={`client-cep-feedback ${clientCepLookupLoading ? 'loading' : ''}`}>
                      {clientCepLookupMessage}
                    </p>
                  ) : null}
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
                  <div className="form-grid">
                    <div className="field full">
                      <label>Check-List</label>
                      <div className="multi-select" ref={checklistRef}>
                        <div
                          className={`multi-trigger ${checklistOpen ? 'open' : ''}`}
                          role="button"
                          tabIndex={0}
                          onClick={() => setChecklistOpen((prev) => !prev)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault()
                              setChecklistOpen((prev) => !prev)
                            }
                          }}
                        >
                          {selectedChecklist.length ? (
                            <div className="multi-tags">
                              {selectedChecklist.map((item) => (
                                <span className="tag-pill" key={item}>
                                  {item}
                                  <button
                                    type="button"
                                    onClick={(event) => {
                                      event.stopPropagation()
                                      toggleClientChecklist(item)
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
                        {checklistOpen ? (
                          <div className="multi-menu">
                            {clientChecklistOptions.map((option) => (
                              <button
                                type="button"
                                className={`multi-option ${
                                  selectedChecklist.includes(option) ? 'selected' : ''
                                }`}
                                key={option}
                                onClick={() => toggleClientChecklist(option)}
                              >
                                <span className="check" />
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
            <div
              className="modal-backdrop"
              onMouseDown={handleModalBackdropMouseDown}
              onClick={(event) => handleModalBackdropClick(event, cancelDelete)}
            >
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
            <div
              className="modal-backdrop"
              onMouseDown={handleModalBackdropMouseDown}
              onClick={(event) => handleModalBackdropClick(event, () => setBulkOpen(false))}
            >
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




