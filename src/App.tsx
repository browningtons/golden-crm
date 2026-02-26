import { useMemo, useState } from 'react'

type TaskStatus = 'todo' | 'doing' | 'done'
type TaskPriority = 'low' | 'medium' | 'high'
type AppTab = 'tasks' | 'projects' | 'activity'

type Task = {
  id: string
  title: string
  assignee: string
  project: string
  dueDate: string
  status: TaskStatus
  priority: TaskPriority
  monthlyValue: number
}

type ActivityItem = {
  id: string
  message: string
  when: string
  tone: 'neutral' | 'good' | 'alert'
}

const statusOrder: TaskStatus[] = ['todo', 'doing', 'done']
const statusLabel: Record<TaskStatus, string> = {
  todo: 'To Do',
  doing: 'Doing',
  done: 'Done',
}

const priorityLabel: Record<TaskPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
}

const wipLimits: Record<TaskStatus, number> = {
  todo: 12,
  doing: 5,
  done: 999,
}

const seedTasks: Task[] = [
  {
    id: 'task-1',
    title: 'Design monthly co-parent expense closeout PDF',
    assignee: 'Paul',
    project: 'Billing UX',
    dueDate: '2026-03-05',
    status: 'doing',
    priority: 'high',
    monthlyValue: 2400,
  },
  {
    id: 'task-2',
    title: 'Launch onboarding SMS for second-parent invite',
    assignee: 'Paul',
    project: 'Lifecycle CRM',
    dueDate: '2026-03-06',
    status: 'todo',
    priority: 'high',
    monthlyValue: 1800,
  },
  {
    id: 'task-3',
    title: 'Add payment history filter by reimbursement status',
    assignee: 'Paul',
    project: 'Product Core',
    dueDate: '2026-03-09',
    status: 'doing',
    priority: 'medium',
    monthlyValue: 1300,
  },
  {
    id: 'task-4',
    title: 'Partner outreach email to mediation firms',
    assignee: 'Paul',
    project: 'Growth',
    dueDate: '2026-03-10',
    status: 'todo',
    priority: 'medium',
    monthlyValue: 900,
  },
  {
    id: 'task-5',
    title: 'Push reminder for unlogged monthly expenses',
    assignee: 'Paul',
    project: 'Lifecycle CRM',
    dueDate: '2026-03-12',
    status: 'done',
    priority: 'low',
    monthlyValue: 700,
  },
]

const activityFeed: ActivityItem[] = [
  { id: 'a1', message: 'Upgrade conversion moved from 4.8% to 6.1%', when: 'Today, 9:14 AM', tone: 'good' },
  { id: 'a2', message: 'One onboarding journey has a 22% drop after invite step', when: 'Today, 7:55 AM', tone: 'alert' },
  { id: 'a3', message: 'Two new legal-referral partners added', when: 'Yesterday, 5:32 PM', tone: 'neutral' },
  { id: 'a4', message: 'WIP in Doing column is at limit (5/5)', when: 'Yesterday, 2:10 PM', tone: 'alert' },
]

function currency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
}

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('tasks')
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | TaskStatus>('all')
  const [priorityFilter, setPriorityFilter] = useState<'all' | TaskPriority>('all')
  const [tasks, setTasks] = useState<Task[]>(seedTasks)
  const [dark, setDark] = useState(false)

  const filteredTasks = useMemo(() => {
    const lowered = query.trim().toLowerCase()
    return tasks.filter((task) => {
      if (statusFilter !== 'all' && task.status !== statusFilter) return false
      if (priorityFilter !== 'all' && task.priority !== priorityFilter) return false
      if (!lowered) return true

      return (
        task.title.toLowerCase().includes(lowered) ||
        task.project.toLowerCase().includes(lowered) ||
        task.assignee.toLowerCase().includes(lowered)
      )
    })
  }, [tasks, query, statusFilter, priorityFilter])

  const tasksByStatus = useMemo(() => {
    return statusOrder.reduce<Record<TaskStatus, Task[]>>(
      (acc, status) => {
        acc[status] = filteredTasks.filter((task) => task.status === status)
        return acc
      },
      { todo: [], doing: [], done: [] }
    )
  }, [filteredTasks])

  const completionRate = useMemo(() => {
    if (tasks.length === 0) return 0
    const done = tasks.filter((task) => task.status === 'done').length
    return Math.round((done / tasks.length) * 100)
  }, [tasks])

  const projectedValue = useMemo(
    () => tasks.reduce((sum, task) => sum + task.monthlyValue, 0),
    [tasks]
  )

  const moveTask = (taskId: string, nextStatus: TaskStatus) => {
    setTasks((current) =>
      current.map((task) =>
        task.id === taskId
          ? {
              ...task,
              status: nextStatus,
            }
          : task
      )
    )
  }

  return (
    <div data-theme={dark ? 'dark' : undefined}>
      <div className="app-shell">
        <header className="app-header panel">
          <div>
            <p className="eyebrow">Mission Control</p>
            <h1>Golden CRM Dashboard</h1>
            <p className="lede">
              A React + TSX operating dashboard modeled after your task management style.
            </p>
          </div>
          <div className="header-actions">
            <button className="btn ghost" onClick={() => setDark((v) => !v)}>
              {dark ? 'Light mode' : 'Dark mode'}
            </button>
            <button className="btn primary">Create Task</button>
          </div>
        </header>

        <section className="metric-grid">
          <article className="panel metric-card">
            <p className="metric-label">Active Tasks</p>
            <p className="metric-value">{tasks.length}</p>
          </article>
          <article className="panel metric-card">
            <p className="metric-label">Completion Rate</p>
            <p className="metric-value">{completionRate}%</p>
          </article>
          <article className="panel metric-card">
            <p className="metric-label">Projected Monthly Impact</p>
            <p className="metric-value">{currency(projectedValue)}</p>
          </article>
        </section>

        <nav className="panel tab-nav" aria-label="Dashboard sections">
          {(['tasks', 'projects', 'activity'] as AppTab[]).map((tab) => (
            <button
              key={tab}
              className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab[0].toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>

        {activeTab === 'tasks' && (
          <>
            <section className="panel filters">
              <label>
                Search
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search title, project, assignee"
                />
              </label>
              <label>
                Status
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value as 'all' | TaskStatus)}
                >
                  <option value="all">All</option>
                  <option value="todo">To Do</option>
                  <option value="doing">Doing</option>
                  <option value="done">Done</option>
                </select>
              </label>
              <label>
                Priority
                <select
                  value={priorityFilter}
                  onChange={(event) => setPriorityFilter(event.target.value as 'all' | TaskPriority)}
                >
                  <option value="all">All</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </label>
            </section>

            <section className="board-grid">
              {statusOrder.map((status) => {
                const columnTasks = tasksByStatus[status]
                const atLimit = columnTasks.length >= wipLimits[status]

                return (
                  <article className="panel board-col" key={status}>
                    <header className="board-col-head">
                      <div>
                        <h2>{statusLabel[status]}</h2>
                        <p>
                          {columnTasks.length} task{columnTasks.length === 1 ? '' : 's'}
                        </p>
                      </div>
                      <span className={`wip-chip ${atLimit ? 'alert' : ''}`}>
                        WIP {Math.min(columnTasks.length, wipLimits[status])}/{wipLimits[status]}
                      </span>
                    </header>

                    <div className="task-list">
                      {columnTasks.length === 0 && <p className="empty">No tasks in this lane.</p>}
                      {columnTasks.map((task) => (
                        <article key={task.id} className="task-card">
                          <div className="task-card-top">
                            <p className="task-project">{task.project}</p>
                            <span className={`priority-pill ${task.priority}`}>
                              {priorityLabel[task.priority]}
                            </span>
                          </div>
                          <h3>{task.title}</h3>
                          <p className="task-meta">
                            {task.assignee} · Due {task.dueDate} · {currency(task.monthlyValue)}
                          </p>
                          <div className="task-actions">
                            {status !== 'todo' && (
                              <button className="btn ghost" onClick={() => moveTask(task.id, 'todo')}>
                                To Do
                              </button>
                            )}
                            {status !== 'doing' && (
                              <button className="btn ghost" onClick={() => moveTask(task.id, 'doing')}>
                                Doing
                              </button>
                            )}
                            {status !== 'done' && (
                              <button className="btn ghost" onClick={() => moveTask(task.id, 'done')}>
                                Done
                              </button>
                            )}
                          </div>
                        </article>
                      ))}
                    </div>
                  </article>
                )
              })}
            </section>
          </>
        )}

        {activeTab === 'projects' && (
          <section className="project-grid">
            <article className="panel">
              <h2>Lifecycle CRM</h2>
              <p>Parent invite, onboarding, and monthly closeout journeys.</p>
              <p className="project-stat">3 active tasks · {currency(3800)} potential monthly lift</p>
            </article>
            <article className="panel">
              <h2>Billing UX</h2>
              <p>Shared expense logs, receipts, and dispute-ready reporting.</p>
              <p className="project-stat">1 active task · {currency(2400)} potential monthly lift</p>
            </article>
            <article className="panel">
              <h2>Growth</h2>
              <p>Referral channels with mediators, attorneys, and support groups.</p>
              <p className="project-stat">1 active task · {currency(900)} potential monthly lift</p>
            </article>
          </section>
        )}

        {activeTab === 'activity' && (
          <section className="panel activity-feed">
            <h2>Recent Activity</h2>
            <ul>
              {activityFeed.map((item) => (
                <li key={item.id} className={`activity-item ${item.tone}`}>
                  <div>
                    <p>{item.message}</p>
                    <span>{item.when}</span>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  )
}
