import { getApiRoot } from '../config/api'

export interface HealthPayload {
  status: string
  uptime: number
}

export interface SystemStatus {
  deployMessage: string
  health: string
  hostname: string
  uptimeSeconds: number
  architecture: string
  nodeEnv: string
}

interface ApiSuccess<T> {
  success: boolean
  data: T
  date?: string
}

async function parseJson<T>(response: Response): Promise<T> {
  const body = (await response.json()) as ApiSuccess<T> | { success: false; error: { message: string } }
  if (!response.ok || !body.success) {
    const message =
      'success' in body && body.success === false
        ? body.error.message
        : `Request failed (${response.status})`
    throw new Error(message)
  }
  return (body as ApiSuccess<T>).data
}

export async function fetchSystemStatus(): Promise<SystemStatus> {
  const response = await fetch(`${getApiRoot()}/status`)
  return parseJson<SystemStatus>(response)
}

export async function fetchHealth(): Promise<HealthPayload> {
  const root = getApiRoot()
  const healthPath = root.startsWith('/') ? '/health' : `${root.replace(/\/api$/, '')}/health`
  const response = await fetch(healthPath)
  return parseJson<HealthPayload>(response)
}
