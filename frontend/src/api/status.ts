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

type ApiSuccessBody<T> = {
  success: true
  data: T
  date?: string
}

type ApiErrorBody = {
  success: false
  error: { message: string }
}

async function parseJson<T>(response: Response): Promise<T> {
  const body = (await response.json()) as ApiSuccessBody<T> | ApiErrorBody
  if (!response.ok || body.success !== true) {
    const message =
      body.success === false ? body.error.message : `Request failed (${response.status})`
    throw new Error(message)
  }
  return body.data
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
