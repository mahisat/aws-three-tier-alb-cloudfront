import { useCallback, useEffect, useState } from 'react'
import { fetchHealth, fetchSystemStatus, type SystemStatus } from './api/status'

export function StatusPage() {
  const [status, setStatus] = useState<SystemStatus | null>(null)
  const [healthUptime, setHealthUptime] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastChecked, setLastChecked] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [systemStatus, health] = await Promise.all([fetchSystemStatus(), fetchHealth()])
      setStatus(systemStatus)
      setHealthUptime(health.uptime)
      setLastChecked(new Date().toLocaleString())
    } catch (err) {
      setStatus(null)
      setHealthUptime(null)
      setError(err instanceof Error ? err.message : 'Failed to load status')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return (
    <div className="status-page">
      <header className="status-header">
        <h1>System Status</h1>
        <p>
          Confirms traffic through <strong>CloudFront</strong> and the{' '}
          <strong>Application Load Balancer</strong> to your API on EC2.
        </p>
      </header>

      {error && (
        <div className="todo-error" role="alert">
          {error}
        </div>
      )}

      <section className="status-card status-card-highlight">
        <h2>Deploy message</h2>
        <p className="status-deploy-message">
          {loading && !status ? 'Loading…' : status?.deployMessage ?? '—'}
        </p>
        <p className="todo-muted status-hint">
          To test backend CI/CD: edit{' '}
          <code>backend/src/config/deployMessage.ts</code>, push to <code>main</code>, then refresh
          this page after the workflow succeeds.
        </p>
      </section>

      <section className="status-grid">
        <div className="status-card">
          <h3>API status</h3>
          <p className="status-value">{status?.health ?? (loading ? '…' : '—')}</p>
        </div>
        <div className="status-card">
          <h3>ALB health check</h3>
          <p className="status-value">
            {healthUptime != null ? `ok (${Math.floor(healthUptime)}s uptime)` : loading ? '…' : '—'}
          </p>
          <p className="todo-muted">From <code>/health</code> via CloudFront</p>
        </div>
        <div className="status-card">
          <h3>Backend host</h3>
          <p className="status-value status-mono">{status?.hostname ?? (loading ? '…' : '—')}</p>
          <p className="todo-muted">Useful when ASG runs more than one instance</p>
        </div>
        <div className="status-card">
          <h3>Environment</h3>
          <p className="status-value">{status?.nodeEnv ?? (loading ? '…' : '—')}</p>
        </div>
      </section>

      <section className="status-card">
        <h3>Request path</h3>
        <p className="status-mono">{status?.architecture ?? 'CloudFront → ALB → Auto Scaling Group → EC2'}</p>
        {lastChecked && <p className="todo-muted">Last checked: {lastChecked}</p>}
        <button type="button" className="status-refresh" onClick={() => void refresh()} disabled={loading}>
          {loading ? 'Refreshing…' : 'Refresh status'}
        </button>
      </section>
    </div>
  )
}
