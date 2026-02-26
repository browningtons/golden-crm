import { useEffect, useMemo, useState } from 'react'

type Tab = 'dashboard' | 'pipeline' | 'contacts' | 'campaigns' | 'activity'
type Stage = 'new' | 'qualified' | 'trial' | 'paid' | 'at-risk' | 'churned'
type Source = 'organic' | 'app-store' | 'referral' | 'partner' | 'content'
type Channel = 'email' | 'sms' | 'push' | 'call'
type Outcome = 'positive' | 'neutral' | 'risk'

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
  notes: string
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
}

const STORAGE_KEY = 'golden-crm-customer-crm-v2'

const stageOrder: Stage[] = ['new', 'qualified', 'trial', 'paid', 'at-risk', 'churned']

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
    notes: 'Engagement dropped after first week of logging.',
  },
  {
    id: 'c-4',
    appId: 'family-finance-lite',
    segment: 'Partner referrals',
    name: 'Jordan Hale',
    email: 'jordan.hale@example.com',
    phone: '(801) 555-0199',
    stage: 'qualified',
    source: 'partner',
    createdAt: '2026-02-14',
    lastContact: '2026-02-24',
    nextFollowUp: '2026-03-01',
    monthlyValue: 19,
    usageScore: 63,
    owner: 'Paul',
    notes: 'Needs help importing prior payments.',
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
  {
    id: 'i-3',
    customerId: 'c-3',
    date: '2026-02-10',
    channel: 'sms',
    summary: 'Reactivation nudge after inactivity spike.',
    outcome: 'risk',
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
  },
  {
    id: 'm-3',
    appId: 'family-finance-lite',
    segment: 'Partner referrals',
    date: '2026-02-25',
    name: 'Referral Onboarding Drip',
    channel: 'sms',
    sent: 90,
    conversions: 15,
    revenue: 285,
  },
]

const uid = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function currency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
}

function normalizeApps(raw: unknown): ProductApp[] {
  if (!Array.isArray(raw)) return defaultApps

  const cleaned = raw
    .map((item) => {
      const app = item as Partial<ProductApp>
      const name = (app.name ?? '').trim()
      const id = (app.id ?? '').trim()
      const segments = Array.isArray(app.segments)
        ? app.segments.map((segment) => String(segment).trim()).filter(Boolean)
        : []

      if (!id || !name) return null
      return {
        id,
        name,
        description: (app.description ?? '').trim(),
        segments: segments.length > 0 ? segments : ['General'],
      }
    })
    .filter((value): value is ProductApp => Boolean(value))

  return cleaned.length > 0 ? cleaned : defaultApps
}

function loadState(): {
  apps: ProductApp[]
  customers: Customer[]
  interactions: Interaction[]
  campaigns: Campaign[]
} {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return {
        apps: defaultApps,
        customers: seedCustomers,
        interactions: seedInteractions,
        campaigns: seedCampaigns,
      }
    }

    const parsed = JSON.parse(raw) as {
      apps?: unknown
      customers?: Partial<Customer>[]
      interactions?: Partial<Interaction>[]
      campaigns?: Partial<Campaign>[]
    }

    const apps = normalizeApps(parsed.apps)
    const fallbackAppId = apps[0]?.id ?? 'default-app'
    const knownAppIds = new Set(apps.map((app) => app.id))

    const customers = Array.isArray(parsed.customers)
      ? parsed.customers
          .map((item): Customer | null => {
            const appIdCandidate = (item.appId ?? fallbackAppId).trim()
            const appId = knownAppIds.has(appIdCandidate) ? appIdCandidate : fallbackAppId
            const app = apps.find((value) => value.id === appId)
            const fallbackSegment = app?.segments[0] ?? 'General'

            if (!item.id || !item.name || !item.email) return null

            return {
              id: item.id,
              appId,
              segment: (item.segment ?? fallbackSegment).trim() || fallbackSegment,
              name: item.name,
              email: item.email,
              phone: item.phone ?? '',
              stage: (item.stage ?? 'new') as Stage,
              source: (item.source ?? 'organic') as Source,
              createdAt: item.createdAt ?? today,
              lastContact: item.lastContact ?? today,
              nextFollowUp: item.nextFollowUp ?? '',
              monthlyValue: Number(item.monthlyValue ?? 0),
              usageScore: Number(item.usageScore ?? 50),
              owner: item.owner ?? 'Unassigned',
              notes: item.notes ?? '',
            }
          })
          .filter((value): value is Customer => Boolean(value))
      : seedCustomers

    const customerIds = new Set(customers.map((customer) => customer.id))

    const interactions = Array.isArray(parsed.interactions)
      ? parsed.interactions
          .map((item): Interaction | null => {
            if (!item.id || !item.customerId || !customerIds.has(item.customerId)) return null

            return {
              id: item.id,
              customerId: item.customerId,
              date: item.date ?? today,
              channel: (item.channel ?? 'email') as Channel,
              summary: item.summary ?? '',
              outcome: (item.outcome ?? 'neutral') as Outcome,
            }
          })
          .filter((value): value is Interaction => Boolean(value))
      : seedInteractions

    const campaigns = Array.isArray(parsed.campaigns)
      ? parsed.campaigns
          .map((item): Campaign | null => {
            if (!item.id || !item.name) return null

            const appIdCandidate = (item.appId ?? fallbackAppId).trim()
            const appId = knownAppIds.has(appIdCandidate) ? appIdCandidate : fallbackAppId
            const app = apps.find((value) => value.id === appId)
            const fallbackSegment = app?.segments[0] ?? 'General'

            return {
              id: item.id,
              appId,
              segment: (item.segment ?? fallbackSegment).trim() || fallbackSegment,
              date: item.date ?? today,
              name: item.name,
              channel: (item.channel ?? 'email') as Channel,
              sent: Number(item.sent ?? 0),
              conversions: Number(item.conversions ?? 0),
              revenue: Number(item.revenue ?? 0),
            }
          })
          .filter((value): value is Campaign => Boolean(value))
      : seedCampaigns

    return {
      apps,
      customers: customers.length > 0 ? customers : seedCustomers,
      interactions,
      campaigns,
    }
  } catch {
    return {
      apps: defaultApps,
      customers: seedCustomers,
      interactions: seedInteractions,
      campaigns: seedCampaigns,
    }
  }
}

function persist(state: {
  apps: ProductApp[]
  customers: Customer[]
  interactions: Interaction[]
  campaigns: Campaign[]
}) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

function daysUntil(dateValue: string): number {
  if (!dateValue) return Number.POSITIVE_INFINITY
  const due = new Date(dateValue)
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

export default function App() {
  const initial = useMemo(loadState, [])
  const initialAppId = initial.apps[0]?.id ?? ''
  const initialSegment = initial.apps[0]?.segments[0] ?? 'General'

  const [dark, setDark] = useState(false)
  const [tab, setTab] = useState<Tab>('dashboard')

  const [apps, setApps] = useState<ProductApp[]>(initial.apps)
  const [customers, setCustomers] = useState<Customer[]>(initial.customers)
  const [interactions, setInteractions] = useState<Interaction[]>(initial.interactions)
  const [campaigns, setCampaigns] = useState<Campaign[]>(initial.campaigns)

  const [query, setQuery] = useState('')
  const [appFilter, setAppFilter] = useState<'all' | string>('all')
  const [segmentFilter, setSegmentFilter] = useState<'all' | string>('all')
  const [stageFilter, setStageFilter] = useState<'all' | Stage>('all')
  const [sourceFilter, setSourceFilter] = useState<'all' | Source>('all')

  const [appForm, setAppForm] = useState({
    name: '',
    description: '',
    segments: 'General',
  })

  const [customerForm, setCustomerForm] = useState({
    appId: initialAppId,
    segment: initialSegment,
    name: '',
    email: '',
    phone: '',
    source: 'organic' as Source,
    owner: 'Paul',
    monthlyValue: '29',
    notes: '',
  })

  const [interactionForm, setInteractionForm] = useState({
    customerId: initial.customers[0]?.id ?? '',
    date: today,
    channel: 'email' as Channel,
    summary: '',
    outcome: 'neutral' as Outcome,
  })

  const [campaignForm, setCampaignForm] = useState({
    appId: initialAppId,
    segment: initialSegment,
    date: today,
    name: '',
    channel: 'email' as Channel,
    sent: '',
    conversions: '',
    revenue: '',
  })

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
    nextInteractions: Interaction[],
    nextCampaigns: Campaign[]
  ) => {
    setApps(nextApps)
    setCustomers(nextCustomers)
    setInteractions(nextInteractions)
    setCampaigns(nextCampaigns)
    persist({
      apps: nextApps,
      customers: nextCustomers,
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

  const summary = useMemo(() => {
    const active = appScopedCustomers.filter((customer) => customer.stage !== 'churned')
    const paid = appScopedCustomers.filter((customer) => customer.stage === 'paid')
    const atRisk = appScopedCustomers.filter((customer) => customer.stage === 'at-risk')
    const totalMrr = paid.reduce((sum, customer) => sum + customer.monthlyValue, 0)

    const trialOrQualified = appScopedCustomers.filter(
      (customer) => customer.stage === 'trial' || customer.stage === 'qualified'
    ).length
    const conversionPct = trialOrQualified > 0 ? Math.round((paid.length / trialOrQualified) * 100) : 0

    const followUpDueSoon = appScopedCustomers.filter((customer) => daysUntil(customer.nextFollowUp) <= 7).length
    const followUpOverdue = appScopedCustomers.filter((customer) => daysUntil(customer.nextFollowUp) < 0).length

    return {
      activeLeads: active.length,
      paidCustomers: paid.length,
      atRisk: atRisk.length,
      mrr: totalMrr,
      conversionPct,
      followUpDueSoon,
      followUpOverdue,
    }
  }, [appScopedCustomers])

  const sourceBreakdown = useMemo(() => {
    return (Object.keys(sourceLabel) as Source[])
      .map((source) => ({
        source,
        count: appScopedCustomers.filter((customer) => customer.source === source).length,
      }))
      .sort((a, b) => b.count - a.count)
  }, [appScopedCustomers])

  const customerMap = useMemo(() => {
    return Object.fromEntries(customers.map((customer) => [customer.id, customer])) as Record<string, Customer>
  }, [customers])

  const scopedInteractions = useMemo(() => {
    return interactions.filter((interaction) => {
      const customer = customerMap[interaction.customerId]
      if (!customer) return false
      if (appFilter !== 'all' && customer.appId !== appFilter) return false
      if (segmentFilter !== 'all' && customer.segment !== segmentFilter) return false
      return true
    })
  }, [interactions, customerMap, appFilter, segmentFilter])

  const recentInteractions = useMemo(() => {
    return [...scopedInteractions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8)
  }, [scopedInteractions])

  const followUpQueue = useMemo(() => {
    return [...appScopedCustomers]
      .filter((customer) => customer.nextFollowUp)
      .sort((a, b) => a.nextFollowUp.localeCompare(b.nextFollowUp))
      .slice(0, 12)
  }, [appScopedCustomers])

  const scopedCampaigns = useMemo(() => {
    return campaigns.filter((campaign) => {
      if (appFilter !== 'all' && campaign.appId !== appFilter) return false
      if (segmentFilter !== 'all' && campaign.segment !== segmentFilter) return false
      return true
    })
  }, [campaigns, appFilter, segmentFilter])

  const appPortfolio = useMemo(() => {
    return apps.map((app) => {
      const appCustomers = customers.filter((customer) => customer.appId === app.id)
      const paid = appCustomers.filter((customer) => customer.stage === 'paid')
      const atRisk = appCustomers.filter((customer) => customer.stage === 'at-risk').length
      const mrr = paid.reduce((sum, customer) => sum + customer.monthlyValue, 0)
      return {
        app,
        total: appCustomers.length,
        paid: paid.length,
        atRisk,
        mrr,
      }
    })
  }, [apps, customers])

  const setCustomerStage = (id: string, nextStage: Stage) => {
    const nextCustomers = customers.map((customer) =>
      customer.id === id
        ? {
            ...customer,
            stage: nextStage,
          }
        : customer
    )
    saveAll(apps, nextCustomers, interactions, campaigns)
  }

  const setCustomerFollowUp = (id: string, nextDate: string) => {
    const nextCustomers = customers.map((customer) =>
      customer.id === id
        ? {
            ...customer,
            nextFollowUp: nextDate,
          }
        : customer
    )
    saveAll(apps, nextCustomers, interactions, campaigns)
  }

  const onCustomerAppChange = (nextAppId: string) => {
    const nextSegment = appById[nextAppId]?.segments[0] ?? 'General'
    setCustomerForm((previous) => ({
      ...previous,
      appId: nextAppId,
      segment: nextSegment,
    }))
  }

  const onCampaignAppChange = (nextAppId: string) => {
    const nextSegment = appById[nextAppId]?.segments[0] ?? 'General'
    setCampaignForm((previous) => ({
      ...previous,
      appId: nextAppId,
      segment: nextSegment,
    }))
  }

  const addApp = (event: React.FormEvent) => {
    event.preventDefault()

    const name = appForm.name.trim()
    if (!name) return

    const id = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')

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
    saveAll(nextApps, customers, interactions, campaigns)

    setCustomerForm((previous) => ({
      ...previous,
      appId: nextApp.id,
      segment: nextApp.segments[0],
    }))

    setCampaignForm((previous) => ({
      ...previous,
      appId: nextApp.id,
      segment: nextApp.segments[0],
    }))

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
        usageScore: 50,
        owner: customerForm.owner.trim() || 'Unassigned',
        notes: customerForm.notes.trim(),
      },
      ...customers,
    ]

    saveAll(apps, nextCustomers, interactions, campaigns)

    setCustomerForm((previous) => ({
      ...previous,
      name: '',
      email: '',
      phone: '',
      notes: '',
    }))

    if (!interactionForm.customerId) {
      setInteractionForm((previous) => ({ ...previous, customerId: nextCustomers[0].id }))
    }
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

    saveAll(apps, nextCustomers, nextInteractions, campaigns)
    setInteractionForm((previous) => ({ ...previous, summary: '' }))
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
      },
      ...campaigns,
    ]

    saveAll(apps, customers, interactions, nextCampaigns)

    setCampaignForm((previous) => ({
      ...previous,
      name: '',
      sent: '',
      conversions: '',
      revenue: '',
    }))
  }

  const conversionRate = (sent: number, conversions: number): string => {
    if (sent <= 0) return '0%'
    return `${Math.round((conversions / sent) * 100)}%`
  }

  return (
    <div data-theme={dark ? 'dark' : undefined}>
      <div className="app-shell">
        <header className="panel app-header">
          <div>
            <p className="eyebrow">Golden CRM</p>
            <h1>Multi-App Customer CRM</h1>
            <p className="lede">
              Operate acquisition, lifecycle, and retention for multiple apps and customer segments from one control plane.
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
            <p className="metric-value">{summary.activeLeads}</p>
          </article>
          <article className="panel metric-card">
            <p className="metric-label">Paid Customers</p>
            <p className="metric-value">{summary.paidCustomers}</p>
          </article>
          <article className="panel metric-card">
            <p className="metric-label">MRR</p>
            <p className="metric-value">{currency(summary.mrr)}</p>
          </article>
          <article className="panel metric-card">
            <p className="metric-label">Qualified/Trial to Paid</p>
            <p className="metric-value">{summary.conversionPct}%</p>
            <p className="metric-sub">
              At-risk: {summary.atRisk} · Due soon: {summary.followUpDueSoon} · Overdue: {summary.followUpOverdue}
            </p>
          </article>
        </section>

        <nav className="panel tab-nav" aria-label="CRM sections">
          {(['dashboard', 'pipeline', 'contacts', 'campaigns', 'activity'] as Tab[]).map((name) => (
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
              {appPortfolio.map(({ app, total, paid, atRisk, mrr }) => (
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
                  const customer = customerMap[interaction.customerId]
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
                  onChange={(event) => setAppForm((previous) => ({ ...previous, name: event.target.value }))}
                  placeholder="App name"
                  required
                />
                <input
                  value={appForm.description}
                  onChange={(event) =>
                    setAppForm((previous) => ({ ...previous, description: event.target.value }))
                  }
                  placeholder="Description"
                />
                <input
                  value={appForm.segments}
                  onChange={(event) =>
                    setAppForm((previous) => ({ ...previous, segments: event.target.value }))
                  }
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
                <select value={customerForm.appId} onChange={(event) => onCustomerAppChange(event.target.value)}>
                  {apps.map((app) => (
                    <option key={app.id} value={app.id}>
                      {app.name}
                    </option>
                  ))}
                </select>
                <select
                  value={customerForm.segment}
                  onChange={(event) =>
                    setCustomerForm((previous) => ({ ...previous, segment: event.target.value }))
                  }
                >
                  {(appById[customerForm.appId]?.segments ?? ['General']).map((segment) => (
                    <option key={segment} value={segment}>
                      {segment}
                    </option>
                  ))}
                </select>
                <input
                  value={customerForm.name}
                  onChange={(event) => setCustomerForm((previous) => ({ ...previous, name: event.target.value }))}
                  placeholder="Name"
                  required
                />
                <input
                  type="email"
                  value={customerForm.email}
                  onChange={(event) => setCustomerForm((previous) => ({ ...previous, email: event.target.value }))}
                  placeholder="Email"
                  required
                />
                <input
                  value={customerForm.phone}
                  onChange={(event) => setCustomerForm((previous) => ({ ...previous, phone: event.target.value }))}
                  placeholder="Phone"
                />
                <select
                  value={customerForm.source}
                  onChange={(event) =>
                    setCustomerForm((previous) => ({ ...previous, source: event.target.value as Source }))
                  }
                >
                  {(Object.keys(sourceLabel) as Source[]).map((source) => (
                    <option key={source} value={source}>
                      {sourceLabel[source]}
                    </option>
                  ))}
                </select>
                <input
                  value={customerForm.owner}
                  onChange={(event) => setCustomerForm((previous) => ({ ...previous, owner: event.target.value }))}
                  placeholder="Owner"
                />
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={customerForm.monthlyValue}
                  onChange={(event) =>
                    setCustomerForm((previous) => ({ ...previous, monthlyValue: event.target.value }))
                  }
                  placeholder="Monthly value"
                />
                <input
                  value={customerForm.notes}
                  onChange={(event) => setCustomerForm((previous) => ({ ...previous, notes: event.target.value }))}
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

        {tab === 'campaigns' && (
          <section className="panel section-card">
            <h2>Log Campaign</h2>
            <form className="entry-form" onSubmit={addCampaign}>
              <select value={campaignForm.appId} onChange={(event) => onCampaignAppChange(event.target.value)}>
                {apps.map((app) => (
                  <option key={app.id} value={app.id}>
                    {app.name}
                  </option>
                ))}
              </select>
              <select
                value={campaignForm.segment}
                onChange={(event) =>
                  setCampaignForm((previous) => ({ ...previous, segment: event.target.value }))
                }
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
                onChange={(event) => setCampaignForm((previous) => ({ ...previous, date: event.target.value }))}
                required
              />
              <input
                value={campaignForm.name}
                onChange={(event) => setCampaignForm((previous) => ({ ...previous, name: event.target.value }))}
                placeholder="Campaign name"
                required
              />
              <select
                value={campaignForm.channel}
                onChange={(event) =>
                  setCampaignForm((previous) => ({ ...previous, channel: event.target.value as Channel }))
                }
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
                onChange={(event) => setCampaignForm((previous) => ({ ...previous, sent: event.target.value }))}
                placeholder="Sent"
              />
              <input
                type="number"
                min="0"
                value={campaignForm.conversions}
                onChange={(event) =>
                  setCampaignForm((previous) => ({ ...previous, conversions: event.target.value }))
                }
                placeholder="Conversions"
              />
              <input
                type="number"
                min="0"
                value={campaignForm.revenue}
                onChange={(event) => setCampaignForm((previous) => ({ ...previous, revenue: event.target.value }))}
                placeholder="Revenue"
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
                      <td>{campaign.name}</td>
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
            <h2>Log Interaction</h2>
            <form className="entry-form" onSubmit={addInteraction}>
              <select
                value={interactionForm.customerId}
                onChange={(event) =>
                  setInteractionForm((previous) => ({ ...previous, customerId: event.target.value }))
                }
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
                onChange={(event) => setInteractionForm((previous) => ({ ...previous, date: event.target.value }))}
                required
              />
              <select
                value={interactionForm.channel}
                onChange={(event) =>
                  setInteractionForm((previous) => ({ ...previous, channel: event.target.value as Channel }))
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
                  setInteractionForm((previous) => ({ ...previous, outcome: event.target.value as Outcome }))
                }
              >
                <option value="positive">Positive</option>
                <option value="neutral">Neutral</option>
                <option value="risk">Risk</option>
              </select>
              <input
                value={interactionForm.summary}
                onChange={(event) =>
                  setInteractionForm((previous) => ({ ...previous, summary: event.target.value }))
                }
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
                    const customer = customerMap[interaction.customerId]
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
      </div>
    </div>
  )
}
