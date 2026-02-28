import { useEffect, useMemo, useState } from 'react'

type Tab = 'dashboard' | 'pipeline' | 'contacts' | 'tasks' | 'campaigns' | 'activity'
type Stage = 'new' | 'qualified' | 'trial' | 'paid' | 'at-risk' | 'churned'
type Source = 'organic' | 'app-store' | 'referral' | 'partner' | 'content'
type Channel = 'email' | 'sms' | 'push' | 'call'
type Outcome = 'positive' | 'neutral' | 'risk'
type TaskStatus = 'todo' | 'doing' | 'done'
type TaskPriority = 'low' | 'medium' | 'high'
type CsvKind = 'contacts' | 'tasks' | 'campaigns'

type ProductApp = {
  id: string
  name: string
  description: string
  segments: string[]
}

type Customer = {
  id: string
  appId: string
  segment: string
  name: string
  email: string
  phone: string
  stage: Stage
  source: Source
  createdAt: string
  lastContact: string
  nextFollowUp: string
  monthlyValue: number
  usageScore: number
  owner: string
  labels: string[]
  notes: string
}

type Task = {
  id: string
  appId: string
  segment: string
  customerId: string | null
  title: string
  status: TaskStatus
  priority: TaskPriority
  owner: string
  dueDate: string
  labels: string[]
  notes: string
  createdAt: string
}

type Interaction = {
  id: string
  customerId: string
  date: string
  channel: Channel
  summary: string
  outcome: Outcome
}

type Campaign = {
  id: string
  appId: string
  segment: string
  date: string
  name: string
  channel: Channel
  sent: number
  conversions: number
  revenue: number
  notes: string
}

type Snapshot = {
  apps: ProductApp[]
  customers: Customer[]
  tasks: Task[]
  interactions: Interaction[]
  campaigns: Campaign[]
}

type CsvPreview = {
  kind: CsvKind
  applyMode: 'dry-run' | 'apply'
  created: number
  updated: number
  errors: string[]
  warnings: string[]
  processedAt: string
}

const STORAGE_KEY_V3 = 'golden-crm-customer-crm-v3'
const STORAGE_KEY_V2 = 'golden-crm-customer-crm-v2'
const MULTI_DELIMITER = '|'

const stageOrder: Stage[] = ['new', 'qualified', 'trial', 'paid', 'at-risk', 'churned']
const taskStatusOrder: TaskStatus[] = ['todo', 'doing', 'done']

const stageLabel: Record<Stage, string> = {
  new: 'New',
  qualified: 'Qualified',
  trial: 'Trial',
  paid: 'Paid',
  'at-risk': 'At Risk',
  churned: 'Churned',
}

const sourceLabel: Record<Source, string> = {
  organic: 'Organic',
  'app-store': 'App Store',
  referral: 'Referral',
  partner: 'Partner',
  content: 'Content',
}

const taskStatusLabel: Record<TaskStatus, string> = {
  todo: 'To Do',
  doing: 'Doing',
  done: 'Done',
}

const csvSpecs: Record<
  CsvKind,
  {
    headers: string[]
    required: string[]
    helperColumns: string[]
    description: string
    sample: string
    templatePath: string
  }
> = {
  contacts: {
    headers: [
      'app_id',
      'segment',
      'name',
      'email',
      'phone',
      'stage',
      'source',
      'owner',
      'monthly_value',
      'usage_score',
      'next_follow_up',
      'labels',
      'notes',
    ],
    required: ['app_id', 'name', 'email'],
    helperColumns: ['labels'],
    description: 'Import or upsert customer records by app + email.',
    sample:
      'co-parent-core,Newly separated,Mia Carter,mia@example.com,(801) 555-0110,trial,app-store,Paul,29,72,2026-03-05,onboarding|needs-invite,Trial user needs second parent invite',
    templatePath: 'import-templates/contacts_template.csv',
  },
  tasks: {
    headers: [
      'app_id',
      'segment',
      'customer_email',
      'title',
      'status',
      'priority',
      'owner',
      'due_date',
      'labels',
      'notes',
    ],
    required: ['app_id', 'title', 'status', 'priority'],
    helperColumns: ['labels'],
    description: 'Import CRM tasks. Optionally associate to a customer via email.',
    sample:
      'co-parent-core,High-conflict,avery.thomas@example.com,Call inactive account,doing,high,Paul,2026-03-02,retention|risk,Usage dropped below threshold',
    templatePath: 'import-templates/tasks_template.csv',
  },
  campaigns: {
    headers: ['app_id', 'segment', 'date', 'name', 'channel', 'sent', 'conversions', 'revenue', 'notes'],
    required: ['app_id', 'segment', 'date', 'name', 'channel'],
    helperColumns: [],
    description: 'Import campaign performance rows for attribution and reporting.',
    sample:
      'co-parent-pro,Trial upgrades,2026-03-01,Trial to Paid Email,email,220,23,897,Version B with social proof won',
    templatePath: 'import-templates/campaigns_template.csv',
  },
}

const today = new Date().toISOString().slice(0, 10)

const defaultApps: ProductApp[] = [
  {
    id: 'co-parent-core',
    name: 'Co-Parent Core',
    description: 'Expense splitting and custody tracking for separated parents.',
    segments: ['Newly separated', 'High-conflict', 'Mediation-referred'],
  },
  {
    id: 'co-parent-pro',
    name: 'Co-Parent Pro',
    description: 'Premium reporting and automation for advanced users.',
    segments: ['Trial upgrades', 'Power users', 'Annual-plan prospects'],
  },
  {
    id: 'family-finance-lite',
    name: 'Family Finance Lite',
    description: 'Lightweight family payment coordination experience.',
    segments: ['Budget-focused', 'Single-parent household', 'Partner referrals'],
  },
]

const seedCustomers: Customer[] = [
  {
    id: 'c-1',
    appId: 'co-parent-core',
    segment: 'Newly separated',
    name: 'Mia Carter',
    email: 'mia.carter@example.com',
    phone: '(801) 555-0110',
    stage: 'trial',
    source: 'app-store',
    createdAt: '2026-02-05',
    lastContact: '2026-02-22',
    nextFollowUp: '2026-02-28',
    monthlyValue: 29,
    usageScore: 72,
    owner: 'Paul',
    labels: ['onboarding'],
    notes: 'Completed setup but did not invite second parent yet.',
  },
  {
    id: 'c-2',
    appId: 'co-parent-pro',
    segment: 'Trial upgrades',
    name: 'Noah Bennett',
    email: 'noah.bennett@example.com',
    phone: '(385) 555-0131',
    stage: 'paid',
    source: 'referral',
    createdAt: '2026-01-15',
    lastContact: '2026-02-23',
    nextFollowUp: '2026-03-03',
    monthlyValue: 39,
    usageScore: 84,
    owner: 'Paul',
    labels: ['upsell-ready'],
    notes: 'Mediator referral. Strong annual-plan candidate.',
  },
  {
    id: 'c-3',
    appId: 'co-parent-core',
    segment: 'High-conflict',
    name: 'Avery Thomas',
    email: 'avery.thomas@example.com',
    phone: '(801) 555-0188',
    stage: 'at-risk',
    source: 'organic',
    createdAt: '2026-01-27',
    lastContact: '2026-02-10',
    nextFollowUp: '2026-02-27',
    monthlyValue: 29,
    usageScore: 41,
    owner: 'Paul',
    labels: ['risk'],
    notes: 'Engagement dropped after first week of logging.',
  },
]

const seedTasks: Task[] = [
  {
    id: 't-1',
    appId: 'co-parent-core',
    segment: 'High-conflict',
    customerId: 'c-3',
    title: 'Review reactivation sequence for inactive users',
    status: 'doing',
    priority: 'high',
    owner: 'Paul',
    dueDate: '2026-03-03',
    labels: ['retention', 'risk'],
    notes: 'A/B test SMS timing + push backup.',
    createdAt: '2026-02-26',
  },
  {
    id: 't-2',
    appId: 'co-parent-pro',
    segment: 'Trial upgrades',
    customerId: 'c-2',
    title: 'Create annual plan save-offer flow',
    status: 'todo',
    priority: 'medium',
    owner: 'Paul',
    dueDate: '2026-03-05',
    labels: ['upsell'],
    notes: 'Target day 14+ trial cohort.',
    createdAt: '2026-02-27',
  },
]

const seedInteractions: Interaction[] = [
  {
    id: 'i-1',
    customerId: 'c-1',
    date: '2026-02-22',
    channel: 'push',
    summary: 'Sent reminder to invite second parent.',
    outcome: 'neutral',
  },
  {
    id: 'i-2',
    customerId: 'c-2',
    date: '2026-02-23',
    channel: 'email',
    summary: 'Shared annual plan comparison and savings.',
    outcome: 'positive',
  },
]

const seedCampaigns: Campaign[] = [
  {
    id: 'm-1',
    appId: 'co-parent-core',
    segment: 'Newly separated',
    date: '2026-02-21',
    name: 'Trial to Paid Prompt',
    channel: 'email',
    sent: 120,
    conversions: 11,
    revenue: 429,
    notes: 'Included setup checklist CTA.',
  },
  {
    id: 'm-2',
    appId: 'co-parent-core',
    segment: 'High-conflict',
    date: '2026-02-24',
    name: 'Missing Expense Reminder',
    channel: 'push',
    sent: 340,
    conversions: 48,
    revenue: 0,
    notes: 'Retention-focused utility push.',
  },
]

const defaultSnapshot: Snapshot = {
  apps: defaultApps,
  customers: seedCustomers,
  tasks: seedTasks,
  interactions: seedInteractions,
  campaigns: seedCampaigns,
}

const uid = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function parseDelimitedList(value: string): string[] {
  return value
    .split(MULTI_DELIMITER)
    .map((item) => item.trim())
    .filter(Boolean)
}

function currency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
}

function isIsoDate(value: string): boolean {
  if (!value) return true
  return /^\d{4}-\d{2}-\d{2}$/.test(value)
}

function isStage(value: string): value is Stage {
  return stageOrder.includes(value as Stage)
}

function isSource(value: string): value is Source {
  return Object.prototype.hasOwnProperty.call(sourceLabel, value)
}

function isTaskStatus(value: string): value is TaskStatus {
  return taskStatusOrder.includes(value as TaskStatus)
}

function isTaskPriority(value: string): value is TaskPriority {
  return ['low', 'medium', 'high'].includes(value)
}

function isChannel(value: string): value is Channel {
  return ['email', 'sms', 'push', 'call'].includes(value)
}

function daysUntil(dateValue: string): number {
  if (!dateValue) return Number.POSITIVE_INFINITY
  const due = new Date(dateValue)
  if (Number.isNaN(due.getTime())) return Number.POSITIVE_INFINITY
  const now = new Date()
  due.setHours(0, 0, 0, 0)
  now.setHours(0, 0, 0, 0)
  const diff = due.getTime() - now.getTime()
  return Math.round(diff / (1000 * 60 * 60 * 24))
}

function followUpClass(dateValue: string): string {
  const days = daysUntil(dateValue)
  if (days < 0) return 'badge alert'
  if (days <= 7) return 'badge warning'
  return 'badge'
}

function parseCsv(text: string): {
  headers: string[]
  rows: Record<string, string>[]
  errors: string[]
} {
  const matrix: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false

  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')

  for (let i = 0; i < normalized.length; i += 1) {
    const char = normalized[i]
    const next = normalized[i + 1]

    if (char === '"') {
      if (inQuotes && next === '"') {
        field += '"'
        i += 1
      } else {
        inQuotes = !inQuotes
      }
      continue
    }

    if (char === ',' && !inQuotes) {
      row.push(field)
      field = ''
      continue
    }

    if (char === '\n' && !inQuotes) {
      row.push(field)
      field = ''
      const hasData = row.some((value) => value.trim().length > 0)
      if (hasData) matrix.push(row)
      row = []
      continue
    }

    field += char
  }

  row.push(field)
  if (row.some((value) => value.trim().length > 0)) matrix.push(row)

  if (inQuotes) {
    return {
      headers: [],
      rows: [],
      errors: ['Unclosed quote detected in CSV input.'],
    }
  }

  if (matrix.length === 0) {
    return {
      headers: [],
      rows: [],
      errors: ['CSV appears empty. Add headers and at least one row.'],
    }
  }

  const headers = matrix[0].map((header) => header.trim().toLowerCase())
  const rows = matrix.slice(1).map((values) => {
    const record: Record<string, string> = {}
    headers.forEach((header, index) => {
      record[header] = (values[index] ?? '').trim()
    })
    return record
  })

  return { headers, rows, errors: [] }
}

function normalizeApps(raw: unknown): ProductApp[] {
  if (!Array.isArray(raw)) return defaultApps

  const cleaned = raw
    .map((item) => {
      const app = item as Partial<ProductApp>
      const id = String(app.id ?? '').trim()
      const name = String(app.name ?? '').trim()
      if (!id || !name) return null

      const segments = Array.isArray(app.segments)
        ? app.segments.map((segment) => String(segment).trim()).filter(Boolean)
        : []

      return {
        id,
        name,
        description: String(app.description ?? '').trim(),
        segments: segments.length > 0 ? segments : ['General'],
      }
    })
    .filter((value): value is ProductApp => Boolean(value))

  return cleaned.length > 0 ? cleaned : defaultApps
}

function loadState(): Snapshot {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_V3) ?? localStorage.getItem(STORAGE_KEY_V2)
    if (!raw) return defaultSnapshot

    const parsed = JSON.parse(raw) as Partial<Snapshot>

    return {
      apps: normalizeApps(parsed.apps),
      customers: Array.isArray(parsed.customers)
        ? (parsed.customers as Customer[])
        : defaultSnapshot.customers,
      tasks: Array.isArray(parsed.tasks) ? (parsed.tasks as Task[]) : defaultSnapshot.tasks,
      interactions: Array.isArray(parsed.interactions)
        ? (parsed.interactions as Interaction[])
        : defaultSnapshot.interactions,
      campaigns: Array.isArray(parsed.campaigns)
        ? (parsed.campaigns as Campaign[])
        : defaultSnapshot.campaigns,
    }
  } catch {
    return defaultSnapshot
  }
}

function persist(snapshot: Snapshot) {
  localStorage.setItem(STORAGE_KEY_V3, JSON.stringify(snapshot))
}

export default function App() {
  const initial = useMemo(loadState, [])
  const firstApp = initial.apps[0]
  const firstSegment = firstApp?.segments[0] ?? 'General'
  const baseUrl = import.meta.env.BASE_URL

  const [dark, setDark] = useState(false)
  const [tab, setTab] = useState<Tab>('dashboard')

  const [apps, setApps] = useState<ProductApp[]>(initial.apps)
  const [customers, setCustomers] = useState<Customer[]>(initial.customers)
  const [tasks, setTasks] = useState<Task[]>(initial.tasks)
  const [interactions, setInteractions] = useState<Interaction[]>(initial.interactions)
  const [campaigns, setCampaigns] = useState<Campaign[]>(initial.campaigns)

  const [query, setQuery] = useState('')
  const [appFilter, setAppFilter] = useState<'all' | string>('all')
  const [segmentFilter, setSegmentFilter] = useState<'all' | string>('all')
  const [stageFilter, setStageFilter] = useState<'all' | Stage>('all')
  const [sourceFilter, setSourceFilter] = useState<'all' | Source>('all')
  const [taskStatusFilter, setTaskStatusFilter] = useState<'all' | TaskStatus>('all')

  const [appForm, setAppForm] = useState({
    name: '',
    description: '',
    segments: 'General',
  })

  const [customerForm, setCustomerForm] = useState({
    appId: firstApp?.id ?? '',
    segment: firstSegment,
    name: '',
    email: '',
    phone: '',
    source: 'organic' as Source,
    owner: 'Paul',
    monthlyValue: '29',
    usageScore: '50',
    labels: '',
    notes: '',
  })

  const [taskForm, setTaskForm] = useState({
    appId: firstApp?.id ?? '',
    segment: firstSegment,
    customerEmail: '',
    title: '',
    status: 'todo' as TaskStatus,
    priority: 'medium' as TaskPriority,
    owner: 'Paul',
    dueDate: today,
    labels: '',
    notes: '',
  })

  const [campaignForm, setCampaignForm] = useState({
    appId: firstApp?.id ?? '',
    segment: firstSegment,
    date: today,
    name: '',
    channel: 'email' as Channel,
    sent: '',
    conversions: '',
    revenue: '',
    notes: '',
  })

  const [interactionForm, setInteractionForm] = useState({
    customerId: initial.customers[0]?.id ?? '',
    date: today,
    channel: 'email' as Channel,
    summary: '',
    outcome: 'neutral' as Outcome,
  })

  const [importKind, setImportKind] = useState<CsvKind>('contacts')
  const [importText, setImportText] = useState('')
  const [importPreview, setImportPreview] = useState<CsvPreview | null>(null)

  const appById = useMemo(() => {
    return Object.fromEntries(apps.map((app) => [app.id, app])) as Record<string, ProductApp>
  }, [apps])

  const allSegments = useMemo(() => {
    return Array.from(new Set(apps.flatMap((app) => app.segments))).sort((a, b) => a.localeCompare(b))
  }, [apps])

  const segmentOptions = useMemo(() => {
    if (appFilter === 'all') return allSegments
    return appById[appFilter]?.segments ?? []
  }, [appFilter, appById, allSegments])

  useEffect(() => {
    if (segmentFilter !== 'all' && !segmentOptions.includes(segmentFilter)) {
      setSegmentFilter('all')
    }
  }, [segmentFilter, segmentOptions])

  const saveAll = (
    nextApps: ProductApp[],
    nextCustomers: Customer[],
    nextTasks: Task[],
    nextInteractions: Interaction[],
    nextCampaigns: Campaign[]
  ) => {
    setApps(nextApps)
    setCustomers(nextCustomers)
    setTasks(nextTasks)
    setInteractions(nextInteractions)
    setCampaigns(nextCampaigns)
    persist({
      apps: nextApps,
      customers: nextCustomers,
      tasks: nextTasks,
      interactions: nextInteractions,
      campaigns: nextCampaigns,
    })
  }

  const appScopedCustomers = useMemo(() => {
    return customers.filter((customer) => {
      if (appFilter !== 'all' && customer.appId !== appFilter) return false
      if (segmentFilter !== 'all' && customer.segment !== segmentFilter) return false
      return true
    })
  }, [customers, appFilter, segmentFilter])

  const filteredCustomers = useMemo(() => {
    const lowered = query.trim().toLowerCase()
    return appScopedCustomers.filter((customer) => {
      if (stageFilter !== 'all' && customer.stage !== stageFilter) return false
      if (sourceFilter !== 'all' && customer.source !== sourceFilter) return false
      if (!lowered) return true

      return (
        customer.name.toLowerCase().includes(lowered) ||
        customer.email.toLowerCase().includes(lowered) ||
        customer.phone.toLowerCase().includes(lowered) ||
        customer.segment.toLowerCase().includes(lowered)
      )
    })
  }, [appScopedCustomers, query, stageFilter, sourceFilter])

  const customersByStage = useMemo(
    () =>
      stageOrder.reduce<Record<Stage, Customer[]>>(
        (acc, stage) => {
          acc[stage] = filteredCustomers.filter((customer) => customer.stage === stage)
          return acc
        },
        {
          new: [],
          qualified: [],
          trial: [],
          paid: [],
          'at-risk': [],
          churned: [],
        }
      ),
    [filteredCustomers]
  )

  const customerById = useMemo(() => {
    return Object.fromEntries(customers.map((customer) => [customer.id, customer])) as Record<string, Customer>
  }, [customers])

  const emailToCustomer = useMemo(() => {
    return Object.fromEntries(
      customers.map((customer) => [`${customer.appId}::${customer.email.toLowerCase()}`, customer])
    ) as Record<string, Customer>
  }, [customers])

  const scopedTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (appFilter !== 'all' && task.appId !== appFilter) return false
      if (segmentFilter !== 'all' && task.segment !== segmentFilter) return false
      if (taskStatusFilter !== 'all' && task.status !== taskStatusFilter) return false
      return true
    })
  }, [tasks, appFilter, segmentFilter, taskStatusFilter])

  const scopedInteractions = useMemo(() => {
    return interactions.filter((interaction) => {
      const customer = customerById[interaction.customerId]
      if (!customer) return false
      if (appFilter !== 'all' && customer.appId !== appFilter) return false
      if (segmentFilter !== 'all' && customer.segment !== segmentFilter) return false
      return true
    })
  }, [interactions, customerById, appFilter, segmentFilter])

  const scopedCampaigns = useMemo(() => {
    return campaigns.filter((campaign) => {
      if (appFilter !== 'all' && campaign.appId !== appFilter) return false
      if (segmentFilter !== 'all' && campaign.segment !== segmentFilter) return false
      return true
    })
  }, [campaigns, appFilter, segmentFilter])

  const summary = useMemo(() => {
    const paid = appScopedCustomers.filter((customer) => customer.stage === 'paid')
    const atRisk = appScopedCustomers.filter((customer) => customer.stage === 'at-risk')
    const openTasks = scopedTasks.filter((task) => task.status !== 'done')
    const mrr = paid.reduce((sum, customer) => sum + customer.monthlyValue, 0)

    const trialOrQualified = appScopedCustomers.filter(
      (customer) => customer.stage === 'trial' || customer.stage === 'qualified'
    ).length

    const conversionPct = trialOrQualified > 0 ? Math.round((paid.length / trialOrQualified) * 100) : 0
    const dueSoon = appScopedCustomers.filter((customer) => daysUntil(customer.nextFollowUp) <= 7).length
    const overdue = appScopedCustomers.filter((customer) => daysUntil(customer.nextFollowUp) < 0).length

    return {
      leads: appScopedCustomers.length,
      paid: paid.length,
      atRisk: atRisk.length,
      mrr,
      conversionPct,
      dueSoon,
      overdue,
      openTasks: openTasks.length,
    }
  }, [appScopedCustomers, scopedTasks])

  const sourceBreakdown = useMemo(() => {
    return (Object.keys(sourceLabel) as Source[])
      .map((source) => ({
        source,
        count: appScopedCustomers.filter((customer) => customer.source === source).length,
      }))
      .sort((a, b) => b.count - a.count)
  }, [appScopedCustomers])

  const followUpQueue = useMemo(() => {
    return [...appScopedCustomers]
      .filter((customer) => customer.nextFollowUp)
      .sort((a, b) => a.nextFollowUp.localeCompare(b.nextFollowUp))
      .slice(0, 12)
  }, [appScopedCustomers])

  const recentInteractions = useMemo(() => {
    return [...scopedInteractions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10)
  }, [scopedInteractions])

  const appPortfolio = useMemo(() => {
    return apps.map((app) => {
      const appCustomers = customers.filter((customer) => customer.appId === app.id)
      const paid = appCustomers.filter((customer) => customer.stage === 'paid')
      const appTasks = tasks.filter((task) => task.appId === app.id && task.status !== 'done')

      return {
        app,
        total: appCustomers.length,
        paid: paid.length,
        atRisk: appCustomers.filter((customer) => customer.stage === 'at-risk').length,
        mrr: paid.reduce((sum, customer) => sum + customer.monthlyValue, 0),
        openTasks: appTasks.length,
      }
    })
  }, [apps, customers, tasks])

  const conversionRate = (sent: number, conversions: number): string => {
    if (sent <= 0) return '0%'
    return `${Math.round((conversions / sent) * 100)}%`
  }

  const onAppSelectionChange = (nextAppId: string) => {
    const nextSegment = appById[nextAppId]?.segments[0] ?? 'General'

    setCustomerForm((prev) => ({ ...prev, appId: nextAppId, segment: nextSegment }))
    setTaskForm((prev) => ({ ...prev, appId: nextAppId, segment: nextSegment }))
    setCampaignForm((prev) => ({ ...prev, appId: nextAppId, segment: nextSegment }))
  }

  const addApp = (event: React.FormEvent) => {
    event.preventDefault()
    const name = appForm.name.trim()
    if (!name) return

    const id = slugify(name)
    if (!id || apps.some((app) => app.id === id)) return

    const segments = Array.from(
      new Set(
        appForm.segments
          .split(',')
          .map((segment) => segment.trim())
          .filter(Boolean)
      )
    )

    const nextApp: ProductApp = {
      id,
      name,
      description: appForm.description.trim(),
      segments: segments.length > 0 ? segments : ['General'],
    }

    const nextApps = [nextApp, ...apps]
    saveAll(nextApps, customers, tasks, interactions, campaigns)

    onAppSelectionChange(nextApp.id)
    setAppFilter(nextApp.id)
    setSegmentFilter('all')

    setAppForm({
      name: '',
      description: '',
      segments: 'General',
    })
  }

  const addCustomer = (event: React.FormEvent) => {
    event.preventDefault()
    if (!customerForm.name.trim() || !customerForm.email.trim()) return

    const app = appById[customerForm.appId]
    if (!app) return

    const segment = customerForm.segment.trim() || app.segments[0] || 'General'

    const nextCustomers = [
      {
        id: uid(),
        appId: customerForm.appId,
        segment,
        name: customerForm.name.trim(),
        email: customerForm.email.trim().toLowerCase(),
        phone: customerForm.phone.trim(),
        stage: 'new' as Stage,
        source: customerForm.source,
        createdAt: today,
        lastContact: today,
        nextFollowUp: today,
        monthlyValue: Number(customerForm.monthlyValue) || 0,
        usageScore: Number(customerForm.usageScore) || 50,
        owner: customerForm.owner.trim() || 'Unassigned',
        labels: parseDelimitedList(customerForm.labels),
        notes: customerForm.notes.trim(),
      },
      ...customers,
    ]

    saveAll(apps, nextCustomers, tasks, interactions, campaigns)
    setCustomerForm((prev) => ({
      ...prev,
      name: '',
      email: '',
      phone: '',
      labels: '',
      notes: '',
    }))

    if (!interactionForm.customerId) {
      setInteractionForm((prev) => ({ ...prev, customerId: nextCustomers[0].id }))
    }
  }

  const addTask = (event: React.FormEvent) => {
    event.preventDefault()
    if (!taskForm.title.trim()) return

    const app = appById[taskForm.appId]
    if (!app) return

    const segment = taskForm.segment.trim() || app.segments[0] || 'General'
    const customerKey = `${taskForm.appId}::${taskForm.customerEmail.trim().toLowerCase()}`
    const linkedCustomer = taskForm.customerEmail ? emailToCustomer[customerKey] : undefined

    const nextTasks = [
      {
        id: uid(),
        appId: taskForm.appId,
        segment,
        customerId: linkedCustomer?.id ?? null,
        title: taskForm.title.trim(),
        status: taskForm.status,
        priority: taskForm.priority,
        owner: taskForm.owner.trim() || 'Unassigned',
        dueDate: taskForm.dueDate,
        labels: parseDelimitedList(taskForm.labels),
        notes: taskForm.notes.trim(),
        createdAt: today,
      },
      ...tasks,
    ]

    saveAll(apps, customers, nextTasks, interactions, campaigns)
    setTaskForm((prev) => ({
      ...prev,
      customerEmail: '',
      title: '',
      labels: '',
      notes: '',
    }))
  }

  const addCampaign = (event: React.FormEvent) => {
    event.preventDefault()
    if (!campaignForm.name.trim()) return

    const app = appById[campaignForm.appId]
    if (!app) return

    const segment = campaignForm.segment.trim() || app.segments[0] || 'General'

    const nextCampaigns = [
      {
        id: uid(),
        appId: campaignForm.appId,
        segment,
        date: campaignForm.date,
        name: campaignForm.name.trim(),
        channel: campaignForm.channel,
        sent: Number(campaignForm.sent) || 0,
        conversions: Number(campaignForm.conversions) || 0,
        revenue: Number(campaignForm.revenue) || 0,
        notes: campaignForm.notes.trim(),
      },
      ...campaigns,
    ]

    saveAll(apps, customers, tasks, interactions, nextCampaigns)
    setCampaignForm((prev) => ({
      ...prev,
      name: '',
      sent: '',
      conversions: '',
      revenue: '',
      notes: '',
    }))
  }

  const addInteraction = (event: React.FormEvent) => {
    event.preventDefault()
    if (!interactionForm.customerId || !interactionForm.summary.trim()) return

    const nextInteractions = [
      {
        id: uid(),
        customerId: interactionForm.customerId,
        date: interactionForm.date,
        channel: interactionForm.channel,
        summary: interactionForm.summary.trim(),
        outcome: interactionForm.outcome,
      },
      ...interactions,
    ]

    const nextCustomers = customers.map((customer) =>
      customer.id === interactionForm.customerId
        ? {
            ...customer,
            lastContact: interactionForm.date,
          }
        : customer
    )

    saveAll(apps, nextCustomers, tasks, nextInteractions, campaigns)
    setInteractionForm((prev) => ({ ...prev, summary: '' }))
  }

  const setCustomerStage = (customerId: string, stage: Stage) => {
    const nextCustomers = customers.map((customer) =>
      customer.id === customerId
        ? {
            ...customer,
            stage,
          }
        : customer
    )
    saveAll(apps, nextCustomers, tasks, interactions, campaigns)
  }

  const setCustomerFollowUp = (customerId: string, dateValue: string) => {
    const nextCustomers = customers.map((customer) =>
      customer.id === customerId
        ? {
            ...customer,
            nextFollowUp: dateValue,
          }
        : customer
    )
    saveAll(apps, nextCustomers, tasks, interactions, campaigns)
  }

  const setTaskStatus = (taskId: string, status: TaskStatus) => {
    const nextTasks = tasks.map((task) =>
      task.id === taskId
        ? {
            ...task,
            status,
          }
        : task
    )
    saveAll(apps, customers, nextTasks, interactions, campaigns)
  }

  const runCsvImport = (applyMode: 'dry-run' | 'apply') => {
    const spec = csvSpecs[importKind]
    const parsed = parseCsv(importText)
    const errors = [...parsed.errors]
    const warnings: string[] = []

    if (parsed.headers.length > 0) {
      spec.required.forEach((requiredHeader) => {
        if (!parsed.headers.includes(requiredHeader)) {
          errors.push(`Missing required header \`${requiredHeader}\`.`)
        }
      })
    }

    let nextApps = [...apps]
    let nextCustomers = [...customers]
    let nextTasks = [...tasks]
    let nextCampaigns = [...campaigns]
    let created = 0
    let updated = 0

    const appLookup = () => Object.fromEntries(nextApps.map((app) => [app.id, app])) as Record<string, ProductApp>

    parsed.rows.forEach((row, index) => {
      const line = index + 2

      const ensureAppAndSegment = (appIdRaw: string, segmentRaw: string) => {
        const appId = appIdRaw.trim()
        if (!appId) {
          errors.push(`Row ${line}: app_id is required.`)
          return null
        }

        const app = appLookup()[appId]
        if (!app) {
          errors.push(`Row ${line}: app_id \`${appId}\` not found.`)
          return null
        }

        const segment = segmentRaw.trim() || app.segments[0] || 'General'
        if (!app.segments.includes(segment)) {
          warnings.push(`Row ${line}: segment \`${segment}\` was added to app \`${app.name}\`.`)
          const updatedApps = nextApps.map((candidate) =>
            candidate.id === app.id
              ? {
                  ...candidate,
                  segments: [...candidate.segments, segment],
                }
              : candidate
          )
          nextApps = updatedApps
        }

        return { appId, segment }
      }

      if (importKind === 'contacts') {
        const appSegment = ensureAppAndSegment(row.app_id ?? '', row.segment ?? '')
        if (!appSegment) return

        const name = (row.name ?? '').trim()
        const email = (row.email ?? '').trim().toLowerCase()
        if (!name || !email) {
          errors.push(`Row ${line}: name and email are required.`)
          return
        }

        const stageRaw = (row.stage ?? 'new').trim().toLowerCase()
        const sourceRaw = (row.source ?? 'organic').trim().toLowerCase()

        if (!isStage(stageRaw)) {
          errors.push(`Row ${line}: invalid stage \`${stageRaw}\`.`)
          return
        }
        if (!isSource(sourceRaw)) {
          errors.push(`Row ${line}: invalid source \`${sourceRaw}\`.`)
          return
        }

        const followUp = (row.next_follow_up ?? '').trim()
        if (!isIsoDate(followUp)) {
          errors.push(`Row ${line}: next_follow_up must be YYYY-MM-DD.`)
          return
        }

        const monthly = Number((row.monthly_value ?? '0').trim() || '0')
        const usage = Number((row.usage_score ?? '50').trim() || '50')
        if (!Number.isFinite(monthly) || !Number.isFinite(usage)) {
          errors.push(`Row ${line}: monthly_value and usage_score must be numbers.`)
          return
        }

        const existingIndex = nextCustomers.findIndex(
          (customer) => customer.appId === appSegment.appId && customer.email === email
        )

        const payload: Customer = {
          id: existingIndex >= 0 ? nextCustomers[existingIndex].id : uid(),
          appId: appSegment.appId,
          segment: appSegment.segment,
          name,
          email,
          phone: (row.phone ?? '').trim(),
          stage: stageRaw,
          source: sourceRaw,
          createdAt: existingIndex >= 0 ? nextCustomers[existingIndex].createdAt : today,
          lastContact: existingIndex >= 0 ? nextCustomers[existingIndex].lastContact : today,
          nextFollowUp: followUp,
          monthlyValue: monthly,
          usageScore: usage,
          owner: (row.owner ?? '').trim() || 'Unassigned',
          labels: parseDelimitedList(row.labels ?? ''),
          notes: (row.notes ?? '').trim(),
        }

        if (existingIndex >= 0) {
          const updatedCustomers = [...nextCustomers]
          updatedCustomers[existingIndex] = payload
          nextCustomers = updatedCustomers
          updated += 1
        } else {
          nextCustomers = [payload, ...nextCustomers]
          created += 1
        }
      }

      if (importKind === 'tasks') {
        const appSegment = ensureAppAndSegment(row.app_id ?? '', row.segment ?? '')
        if (!appSegment) return

        const title = (row.title ?? '').trim()
        if (!title) {
          errors.push(`Row ${line}: title is required.`)
          return
        }

        const statusRaw = (row.status ?? 'todo').trim().toLowerCase()
        const priorityRaw = (row.priority ?? 'medium').trim().toLowerCase()

        if (!isTaskStatus(statusRaw)) {
          errors.push(`Row ${line}: invalid task status \`${statusRaw}\`.`)
          return
        }
        if (!isTaskPriority(priorityRaw)) {
          errors.push(`Row ${line}: invalid task priority \`${priorityRaw}\`.`)
          return
        }

        const dueDate = (row.due_date ?? '').trim()
        if (!isIsoDate(dueDate)) {
          errors.push(`Row ${line}: due_date must be YYYY-MM-DD.`)
          return
        }

        let customerId: string | null = null
        const customerEmail = (row.customer_email ?? '').trim().toLowerCase()
        if (customerEmail) {
          const linked = nextCustomers.find(
            (customer) => customer.appId === appSegment.appId && customer.email === customerEmail
          )
          if (!linked) {
            warnings.push(`Row ${line}: customer_email \`${customerEmail}\` not found. Task left unlinked.`)
          } else {
            customerId = linked.id
          }
        }

        const task: Task = {
          id: uid(),
          appId: appSegment.appId,
          segment: appSegment.segment,
          customerId,
          title,
          status: statusRaw,
          priority: priorityRaw,
          owner: (row.owner ?? '').trim() || 'Unassigned',
          dueDate,
          labels: parseDelimitedList(row.labels ?? ''),
          notes: (row.notes ?? '').trim(),
          createdAt: today,
        }

        nextTasks = [task, ...nextTasks]
        created += 1
      }

      if (importKind === 'campaigns') {
        const appSegment = ensureAppAndSegment(row.app_id ?? '', row.segment ?? '')
        if (!appSegment) return

        const name = (row.name ?? '').trim()
        const date = (row.date ?? '').trim()
        const channelRaw = (row.channel ?? '').trim().toLowerCase()

        if (!name || !date || !channelRaw) {
          errors.push(`Row ${line}: date, name, and channel are required.`)
          return
        }

        if (!isIsoDate(date)) {
          errors.push(`Row ${line}: date must be YYYY-MM-DD.`)
          return
        }

        if (!isChannel(channelRaw)) {
          errors.push(`Row ${line}: invalid channel \`${channelRaw}\`.`)
          return
        }

        const sent = Number((row.sent ?? '0').trim() || '0')
        const conversions = Number((row.conversions ?? '0').trim() || '0')
        const revenue = Number((row.revenue ?? '0').trim() || '0')
        if (!Number.isFinite(sent) || !Number.isFinite(conversions) || !Number.isFinite(revenue)) {
          errors.push(`Row ${line}: sent, conversions, and revenue must be numbers.`)
          return
        }

        if (conversions > sent && sent > 0) {
          warnings.push(`Row ${line}: conversions exceed sent. Check source data.`)
        }

        const campaign: Campaign = {
          id: uid(),
          appId: appSegment.appId,
          segment: appSegment.segment,
          date,
          name,
          channel: channelRaw,
          sent,
          conversions,
          revenue,
          notes: (row.notes ?? '').trim(),
        }

        nextCampaigns = [campaign, ...nextCampaigns]
        created += 1
      }
    })

    const preview: CsvPreview = {
      kind: importKind,
      applyMode,
      created,
      updated,
      errors,
      warnings,
      processedAt: new Date().toISOString(),
    }

    setImportPreview(preview)

    if (applyMode === 'apply' && errors.length === 0) {
      saveAll(nextApps, nextCustomers, nextTasks, interactions, nextCampaigns)
    }
  }

  return (
    <div data-theme={dark ? 'dark' : undefined}>
      <div className="app-shell">
        <header className="panel app-header">
          <div>
            <p className="eyebrow">Golden CRM</p>
            <h1>Multi-App Customer CRM</h1>
            <p className="lede">
              Best-in-class lifecycle operations for multiple apps and segments, with a deterministic CSV import contract.
            </p>
          </div>
          <div className="header-actions">
            <button className="btn ghost" onClick={() => setDark((value) => !value)}>
              {dark ? 'Light mode' : 'Dark mode'}
            </button>
          </div>
        </header>

        <section className="panel controls">
          <label>
            Search
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Name, email, phone, segment"
            />
          </label>
          <label>
            App
            <select value={appFilter} onChange={(event) => setAppFilter(event.target.value)}>
              <option value="all">All apps</option>
              {apps.map((app) => (
                <option key={app.id} value={app.id}>
                  {app.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Segment
            <select value={segmentFilter} onChange={(event) => setSegmentFilter(event.target.value)}>
              <option value="all">All segments</option>
              {segmentOptions.map((segment) => (
                <option key={segment} value={segment}>
                  {segment}
                </option>
              ))}
            </select>
          </label>
          <label>
            Stage
            <select value={stageFilter} onChange={(event) => setStageFilter(event.target.value as 'all' | Stage)}>
              <option value="all">All stages</option>
              {stageOrder.map((stage) => (
                <option key={stage} value={stage}>
                  {stageLabel[stage]}
                </option>
              ))}
            </select>
          </label>
          <label>
            Source
            <select value={sourceFilter} onChange={(event) => setSourceFilter(event.target.value as 'all' | Source)}>
              <option value="all">All sources</option>
              {(Object.keys(sourceLabel) as Source[]).map((source) => (
                <option key={source} value={source}>
                  {sourceLabel[source]}
                </option>
              ))}
            </select>
          </label>
        </section>

        <section className="metric-grid">
          <article className="panel metric-card">
            <p className="metric-label">Active Leads</p>
            <p className="metric-value">{summary.leads}</p>
          </article>
          <article className="panel metric-card">
            <p className="metric-label">Paid Customers</p>
            <p className="metric-value">{summary.paid}</p>
          </article>
          <article className="panel metric-card">
            <p className="metric-label">MRR</p>
            <p className="metric-value">{currency(summary.mrr)}</p>
          </article>
          <article className="panel metric-card">
            <p className="metric-label">Open Tasks</p>
            <p className="metric-value">{summary.openTasks}</p>
            <p className="metric-sub">
              At-risk: {summary.atRisk} · Due soon: {summary.dueSoon} · Overdue: {summary.overdue}
            </p>
          </article>
        </section>

        <nav className="panel tab-nav" aria-label="CRM sections">
          {(['dashboard', 'pipeline', 'contacts', 'tasks', 'campaigns', 'activity'] as Tab[]).map((name) => (
            <button
              key={name}
              className={`tab-btn ${tab === name ? 'active' : ''}`}
              onClick={() => setTab(name)}
            >
              {name[0].toUpperCase() + name.slice(1)}
            </button>
          ))}
        </nav>

        {tab === 'dashboard' && (
          <section className="dashboard-stack">
            <div className="portfolio-grid">
              {appPortfolio.map(({ app, total, paid, atRisk, mrr, openTasks }) => (
                <article key={app.id} className="panel app-card">
                  <h2>{app.name}</h2>
                  <p className="muted">{app.description}</p>
                  <div className="line-item compact">
                    <span>Customers</span>
                    <strong>{total}</strong>
                  </div>
                  <div className="line-item compact">
                    <span>Paid</span>
                    <strong>{paid}</strong>
                  </div>
                  <div className="line-item compact">
                    <span>At-risk</span>
                    <strong>{atRisk}</strong>
                  </div>
                  <div className="line-item compact">
                    <span>Open tasks</span>
                    <strong>{openTasks}</strong>
                  </div>
                  <div className="line-item compact">
                    <span>MRR</span>
                    <strong>{currency(mrr)}</strong>
                  </div>
                  <div className="tags-wrap">
                    {app.segments.map((segment) => (
                      <span key={segment} className="tag">
                        {segment}
                      </span>
                    ))}
                  </div>
                </article>
              ))}
            </div>

            <div className="dashboard-grid">
              <article className="panel section-card">
                <h2>Follow-Up Queue</h2>
                {followUpQueue.length === 0 && <p className="muted">No follow-ups scheduled.</p>}
                {followUpQueue.map((customer) => (
                  <div key={customer.id} className="line-item">
                    <div>
                      <strong>{customer.name}</strong>
                      <p>
                        {appById[customer.appId]?.name ?? 'Unknown App'} · {customer.segment} · {stageLabel[customer.stage]}
                      </p>
                    </div>
                    <span className={followUpClass(customer.nextFollowUp)}>
                      {customer.nextFollowUp || 'No date'}
                    </span>
                  </div>
                ))}
              </article>

              <article className="panel section-card">
                <h2>Source Mix</h2>
                {sourceBreakdown.map((item) => (
                  <div key={item.source} className="line-item">
                    <span>{sourceLabel[item.source]}</span>
                    <strong>{item.count}</strong>
                  </div>
                ))}
              </article>

              <article className="panel section-card">
                <h2>Recent Interactions</h2>
                {recentInteractions.length === 0 && <p className="muted">No activity yet.</p>}
                {recentInteractions.map((interaction) => {
                  const customer = customerById[interaction.customerId]
                  return (
                    <div key={interaction.id} className="line-item">
                      <div>
                        <strong>{customer?.name ?? 'Unknown'}</strong>
                        <p>
                          {interaction.channel.toUpperCase()} · {interaction.summary}
                        </p>
                      </div>
                      <span className={`badge ${interaction.outcome === 'risk' ? 'alert' : ''}`}>
                        {interaction.date}
                      </span>
                    </div>
                  )
                })}
              </article>
            </div>
          </section>
        )}

        {tab === 'pipeline' && (
          <section className="board-grid">
            {stageOrder.map((stage) => (
              <article key={stage} className="panel board-col">
                <header className="board-col-head">
                  <h2>{stageLabel[stage]}</h2>
                  <span className="badge">{customersByStage[stage].length}</span>
                </header>
                <div className="card-list">
                  {customersByStage[stage].length === 0 && <p className="muted">No customers in this stage.</p>}
                  {customersByStage[stage].map((customer) => (
                    <article className="mini-card" key={customer.id}>
                      <p className="mini-title">{customer.name}</p>
                      <p className="muted">
                        {appById[customer.appId]?.name ?? 'Unknown App'} · {customer.segment}
                      </p>
                      <p className="muted">
                        {sourceLabel[customer.source]} · Owner: {customer.owner} · Value: {currency(customer.monthlyValue)}
                      </p>
                      <p className="muted">Usage score: {customer.usageScore}</p>
                      <label>
                        Move stage
                        <select
                          value={customer.stage}
                          onChange={(event) => setCustomerStage(customer.id, event.target.value as Stage)}
                        >
                          {stageOrder.map((nextStage) => (
                            <option key={nextStage} value={nextStage}>
                              {stageLabel[nextStage]}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label>
                        Next follow-up
                        <input
                          type="date"
                          value={customer.nextFollowUp}
                          onChange={(event) => setCustomerFollowUp(customer.id, event.target.value)}
                        />
                      </label>
                    </article>
                  ))}
                </div>
              </article>
            ))}
          </section>
        )}

        {tab === 'contacts' && (
          <section className="form-stack">
            <article className="panel section-card">
              <h2>Add Product App</h2>
              <form className="entry-form" onSubmit={addApp}>
                <input
                  value={appForm.name}
                  onChange={(event) => setAppForm((prev) => ({ ...prev, name: event.target.value }))}
                  placeholder="App name"
                  required
                />
                <input
                  value={appForm.description}
                  onChange={(event) => setAppForm((prev) => ({ ...prev, description: event.target.value }))}
                  placeholder="Description"
                />
                <input
                  value={appForm.segments}
                  onChange={(event) => setAppForm((prev) => ({ ...prev, segments: event.target.value }))}
                  placeholder="Segments (comma separated)"
                />
                <button className="btn primary" type="submit">
                  Save App
                </button>
              </form>
            </article>

            <article className="panel section-card">
              <h2>Add Customer</h2>
              <form className="entry-form" onSubmit={addCustomer}>
                <select value={customerForm.appId} onChange={(event) => onAppSelectionChange(event.target.value)}>
                  {apps.map((app) => (
                    <option key={app.id} value={app.id}>
                      {app.name}
                    </option>
                  ))}
                </select>
                <select
                  value={customerForm.segment}
                  onChange={(event) => setCustomerForm((prev) => ({ ...prev, segment: event.target.value }))}
                >
                  {(appById[customerForm.appId]?.segments ?? ['General']).map((segment) => (
                    <option key={segment} value={segment}>
                      {segment}
                    </option>
                  ))}
                </select>
                <input
                  value={customerForm.name}
                  onChange={(event) => setCustomerForm((prev) => ({ ...prev, name: event.target.value }))}
                  placeholder="Name"
                  required
                />
                <input
                  type="email"
                  value={customerForm.email}
                  onChange={(event) => setCustomerForm((prev) => ({ ...prev, email: event.target.value }))}
                  placeholder="Email"
                  required
                />
                <input
                  value={customerForm.phone}
                  onChange={(event) => setCustomerForm((prev) => ({ ...prev, phone: event.target.value }))}
                  placeholder="Phone"
                />
                <select
                  value={customerForm.source}
                  onChange={(event) => setCustomerForm((prev) => ({ ...prev, source: event.target.value as Source }))}
                >
                  {(Object.keys(sourceLabel) as Source[]).map((source) => (
                    <option key={source} value={source}>
                      {sourceLabel[source]}
                    </option>
                  ))}
                </select>
                <input
                  value={customerForm.owner}
                  onChange={(event) => setCustomerForm((prev) => ({ ...prev, owner: event.target.value }))}
                  placeholder="Owner"
                />
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={customerForm.monthlyValue}
                  onChange={(event) => setCustomerForm((prev) => ({ ...prev, monthlyValue: event.target.value }))}
                  placeholder="Monthly value"
                />
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={customerForm.usageScore}
                  onChange={(event) => setCustomerForm((prev) => ({ ...prev, usageScore: event.target.value }))}
                  placeholder="Usage score"
                />
                <input
                  value={customerForm.labels}
                  onChange={(event) => setCustomerForm((prev) => ({ ...prev, labels: event.target.value }))}
                  placeholder={`Labels (${MULTI_DELIMITER} delimited)`}
                />
                <input
                  value={customerForm.notes}
                  onChange={(event) => setCustomerForm((prev) => ({ ...prev, notes: event.target.value }))}
                  placeholder="Notes"
                />
                <button className="btn primary" type="submit">
                  Save Customer
                </button>
              </form>

              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>App</th>
                      <th>Segment</th>
                      <th>Stage</th>
                      <th>Source</th>
                      <th>Owner</th>
                      <th>Value</th>
                      <th>Follow-Up</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCustomers.map((customer) => (
                      <tr key={customer.id}>
                        <td>
                          <strong>{customer.name}</strong>
                          <div className="muted">{customer.email}</div>
                        </td>
                        <td>{appById[customer.appId]?.name ?? '-'}</td>
                        <td>{customer.segment}</td>
                        <td>{stageLabel[customer.stage]}</td>
                        <td>{sourceLabel[customer.source]}</td>
                        <td>{customer.owner}</td>
                        <td>{currency(customer.monthlyValue)}</td>
                        <td>{customer.nextFollowUp || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>
          </section>
        )}

        {tab === 'tasks' && (
          <section className="panel section-card">
            <h2>Task Workspace</h2>
            <form className="entry-form" onSubmit={addTask}>
              <select value={taskForm.appId} onChange={(event) => onAppSelectionChange(event.target.value)}>
                {apps.map((app) => (
                  <option key={app.id} value={app.id}>
                    {app.name}
                  </option>
                ))}
              </select>
              <select
                value={taskForm.segment}
                onChange={(event) => setTaskForm((prev) => ({ ...prev, segment: event.target.value }))}
              >
                {(appById[taskForm.appId]?.segments ?? ['General']).map((segment) => (
                  <option key={segment} value={segment}>
                    {segment}
                  </option>
                ))}
              </select>
              <input
                value={taskForm.customerEmail}
                onChange={(event) => setTaskForm((prev) => ({ ...prev, customerEmail: event.target.value }))}
                placeholder="Customer email (optional)"
              />
              <input
                value={taskForm.title}
                onChange={(event) => setTaskForm((prev) => ({ ...prev, title: event.target.value }))}
                placeholder="Task title"
                required
              />
              <select
                value={taskForm.status}
                onChange={(event) => setTaskForm((prev) => ({ ...prev, status: event.target.value as TaskStatus }))}
              >
                {taskStatusOrder.map((status) => (
                  <option key={status} value={status}>
                    {taskStatusLabel[status]}
                  </option>
                ))}
              </select>
              <select
                value={taskForm.priority}
                onChange={(event) =>
                  setTaskForm((prev) => ({ ...prev, priority: event.target.value as TaskPriority }))
                }
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
              <input
                value={taskForm.owner}
                onChange={(event) => setTaskForm((prev) => ({ ...prev, owner: event.target.value }))}
                placeholder="Owner"
              />
              <input
                type="date"
                value={taskForm.dueDate}
                onChange={(event) => setTaskForm((prev) => ({ ...prev, dueDate: event.target.value }))}
              />
              <input
                value={taskForm.labels}
                onChange={(event) => setTaskForm((prev) => ({ ...prev, labels: event.target.value }))}
                placeholder={`Labels (${MULTI_DELIMITER} delimited)`}
              />
              <input
                value={taskForm.notes}
                onChange={(event) => setTaskForm((prev) => ({ ...prev, notes: event.target.value }))}
                placeholder="Notes"
              />
              <button className="btn primary" type="submit">
                Save Task
              </button>
            </form>

            <div className="table-controls">
              <label>
                Task status filter
                <select
                  value={taskStatusFilter}
                  onChange={(event) => setTaskStatusFilter(event.target.value as 'all' | TaskStatus)}
                >
                  <option value="all">All</option>
                  {taskStatusOrder.map((status) => (
                    <option key={status} value={status}>
                      {taskStatusLabel[status]}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>App</th>
                    <th>Segment</th>
                    <th>Status</th>
                    <th>Priority</th>
                    <th>Owner</th>
                    <th>Due</th>
                    <th>Customer</th>
                  </tr>
                </thead>
                <tbody>
                  {scopedTasks.map((task) => (
                    <tr key={task.id}>
                      <td>
                        <strong>{task.title}</strong>
                        <div className="muted">{task.notes || '-'}</div>
                      </td>
                      <td>{appById[task.appId]?.name ?? '-'}</td>
                      <td>{task.segment}</td>
                      <td>
                        <select
                          value={task.status}
                          onChange={(event) => setTaskStatus(task.id, event.target.value as TaskStatus)}
                        >
                          {taskStatusOrder.map((status) => (
                            <option key={status} value={status}>
                              {taskStatusLabel[status]}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>{task.priority}</td>
                      <td>{task.owner}</td>
                      <td>{task.dueDate || '-'}</td>
                      <td>{task.customerId ? customerById[task.customerId]?.email ?? '-' : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {tab === 'campaigns' && (
          <section className="panel section-card">
            <h2>Campaign Performance</h2>
            <form className="entry-form" onSubmit={addCampaign}>
              <select value={campaignForm.appId} onChange={(event) => onAppSelectionChange(event.target.value)}>
                {apps.map((app) => (
                  <option key={app.id} value={app.id}>
                    {app.name}
                  </option>
                ))}
              </select>
              <select
                value={campaignForm.segment}
                onChange={(event) => setCampaignForm((prev) => ({ ...prev, segment: event.target.value }))}
              >
                {(appById[campaignForm.appId]?.segments ?? ['General']).map((segment) => (
                  <option key={segment} value={segment}>
                    {segment}
                  </option>
                ))}
              </select>
              <input
                type="date"
                value={campaignForm.date}
                onChange={(event) => setCampaignForm((prev) => ({ ...prev, date: event.target.value }))}
                required
              />
              <input
                value={campaignForm.name}
                onChange={(event) => setCampaignForm((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="Campaign name"
                required
              />
              <select
                value={campaignForm.channel}
                onChange={(event) => setCampaignForm((prev) => ({ ...prev, channel: event.target.value as Channel }))}
              >
                <option value="email">Email</option>
                <option value="sms">SMS</option>
                <option value="push">Push</option>
                <option value="call">Call</option>
              </select>
              <input
                type="number"
                min="0"
                value={campaignForm.sent}
                onChange={(event) => setCampaignForm((prev) => ({ ...prev, sent: event.target.value }))}
                placeholder="Sent"
              />
              <input
                type="number"
                min="0"
                value={campaignForm.conversions}
                onChange={(event) => setCampaignForm((prev) => ({ ...prev, conversions: event.target.value }))}
                placeholder="Conversions"
              />
              <input
                type="number"
                min="0"
                value={campaignForm.revenue}
                onChange={(event) => setCampaignForm((prev) => ({ ...prev, revenue: event.target.value }))}
                placeholder="Revenue"
              />
              <input
                value={campaignForm.notes}
                onChange={(event) => setCampaignForm((prev) => ({ ...prev, notes: event.target.value }))}
                placeholder="Notes"
              />
              <button className="btn primary" type="submit">
                Save Campaign
              </button>
            </form>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>App</th>
                    <th>Segment</th>
                    <th>Name</th>
                    <th>Channel</th>
                    <th>Sent</th>
                    <th>CVR</th>
                    <th>Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {scopedCampaigns.map((campaign) => (
                    <tr key={campaign.id}>
                      <td>{campaign.date}</td>
                      <td>{appById[campaign.appId]?.name ?? '-'}</td>
                      <td>{campaign.segment}</td>
                      <td>
                        <strong>{campaign.name}</strong>
                        <div className="muted">{campaign.notes || '-'}</div>
                      </td>
                      <td>{campaign.channel.toUpperCase()}</td>
                      <td>{campaign.sent}</td>
                      <td>{conversionRate(campaign.sent, campaign.conversions)}</td>
                      <td>{currency(campaign.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {tab === 'activity' && (
          <section className="panel section-card">
            <h2>Interaction Log</h2>
            <form className="entry-form" onSubmit={addInteraction}>
              <select
                value={interactionForm.customerId}
                onChange={(event) => setInteractionForm((prev) => ({ ...prev, customerId: event.target.value }))}
              >
                <option value="">Select customer</option>
                {filteredCustomers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name} ({appById[customer.appId]?.name ?? 'Unknown App'})
                  </option>
                ))}
              </select>
              <input
                type="date"
                value={interactionForm.date}
                onChange={(event) => setInteractionForm((prev) => ({ ...prev, date: event.target.value }))}
                required
              />
              <select
                value={interactionForm.channel}
                onChange={(event) =>
                  setInteractionForm((prev) => ({ ...prev, channel: event.target.value as Channel }))
                }
              >
                <option value="email">Email</option>
                <option value="sms">SMS</option>
                <option value="push">Push</option>
                <option value="call">Call</option>
              </select>
              <select
                value={interactionForm.outcome}
                onChange={(event) =>
                  setInteractionForm((prev) => ({ ...prev, outcome: event.target.value as Outcome }))
                }
              >
                <option value="positive">Positive</option>
                <option value="neutral">Neutral</option>
                <option value="risk">Risk</option>
              </select>
              <input
                value={interactionForm.summary}
                onChange={(event) => setInteractionForm((prev) => ({ ...prev, summary: event.target.value }))}
                placeholder="Interaction summary"
                required
              />
              <button className="btn primary" type="submit">
                Save Interaction
              </button>
            </form>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>App</th>
                    <th>Customer</th>
                    <th>Segment</th>
                    <th>Channel</th>
                    <th>Outcome</th>
                    <th>Summary</th>
                  </tr>
                </thead>
                <tbody>
                  {scopedInteractions.map((interaction) => {
                    const customer = customerById[interaction.customerId]
                    return (
                      <tr key={interaction.id}>
                        <td>{interaction.date}</td>
                        <td>{customer ? appById[customer.appId]?.name ?? '-' : '-'}</td>
                        <td>{customer?.name ?? 'Unknown'}</td>
                        <td>{customer?.segment ?? '-'}</td>
                        <td>{interaction.channel.toUpperCase()}</td>
                        <td>{interaction.outcome}</td>
                        <td>{interaction.summary}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}

        <section className="panel section-card importer-card">
          <h2>CSV Importer</h2>
          <p className="muted">
            Use comma-separated CSV. Helper columns are pipe-delimited (`{MULTI_DELIMITER}`), for
            example: <code>{`label-a${MULTI_DELIMITER}label-b`}</code>.
          </p>

          <div className="importer-controls">
            <label>
              Import type
              <select value={importKind} onChange={(event) => setImportKind(event.target.value as CsvKind)}>
                <option value="contacts">Contacts</option>
                <option value="tasks">Tasks</option>
                <option value="campaigns">Campaigns</option>
              </select>
            </label>
          </div>

          <div className="spec-box">
            <p>
              <strong>Headers:</strong> {csvSpecs[importKind].headers.join(', ')}
            </p>
            <p>
              <strong>Required:</strong> {csvSpecs[importKind].required.join(', ')}
            </p>
            <p>
              <strong>Helper columns:</strong>{' '}
              {csvSpecs[importKind].helperColumns.length > 0
                ? csvSpecs[importKind].helperColumns.join(', ')
                : 'None'}
            </p>
            <p>
              <strong>Description:</strong> {csvSpecs[importKind].description}
            </p>
            <p>
              <strong>Sample row:</strong> {csvSpecs[importKind].sample}
            </p>
            <p>
              <a
                className="inline-link"
                href={`${baseUrl}${csvSpecs[importKind].templatePath}`}
                target="_blank"
                rel="noreferrer"
              >
                Download {importKind} template
              </a>
            </p>
          </div>

          <textarea
            value={importText}
            onChange={(event) => setImportText(event.target.value)}
            placeholder={`Paste ${importKind} CSV here...`}
            rows={8}
          />

          <div className="importer-actions">
            <button className="btn ghost" onClick={() => runCsvImport('dry-run')}>
              Dry Run
            </button>
            <button className="btn primary" onClick={() => runCsvImport('apply')}>
              Apply Import
            </button>
          </div>

          {importPreview && (
            <article className="import-result">
              <p>
                <strong>{importPreview.applyMode === 'dry-run' ? 'Dry Run' : 'Apply'}:</strong>{' '}
                {importPreview.created} created · {importPreview.updated} updated
              </p>
              <p className="muted">Processed: {importPreview.processedAt}</p>

              {importPreview.warnings.length > 0 && (
                <div>
                  <p className="warning-title">Warnings</p>
                  <ul>
                    {importPreview.warnings.map((warning) => (
                      <li key={warning}>{warning}</li>
                    ))}
                  </ul>
                </div>
              )}

              {importPreview.errors.length > 0 && (
                <div>
                  <p className="error-title">Errors</p>
                  <ul>
                    {importPreview.errors.map((error) => (
                      <li key={error}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </article>
          )}
        </section>
      </div>
    </div>
  )
}
