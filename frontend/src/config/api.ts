/**
 * API root (no trailing slash), e.g. `/api` or `http://localhost:5000/api`.
 */
export function getApiRoot(): string {
  const configured = import.meta.env.VITE_API_BASE_URL?.trim()

  if (!configured) {
    return '/api'
  }

  return configured.replace(/\/$/, '')
}

/**
 * Base URL for the todos API (includes `/todos`).
 */
export function getTodosApiBase(): string {
  return `${getApiRoot()}/todos`
}
