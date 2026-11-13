/**
 * Career AI Centralized API Client
 *
 * Provides resilient, typed HTTP communication with robust error handling,
 * content-type inspection (preventing HTML-as-JSON syntax crashes),
 * and automatic Bearer token injection.
 */

export class ApiError extends Error {
  public status: number
  public statusText: string
  public isHtmlResponse: boolean
  public detail?: string

  constructor(status: number, message: string, isHtmlResponse = false, detail?: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.statusText = message
    this.isHtmlResponse = isHtmlResponse
    this.detail = detail
  }
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('token')
  const headers = new Headers(options.headers || {})

  // Set default Content-Type for JSON unless sending FormData
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  // Attach authorization token if present and not already provided
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const url = endpoint.startsWith('http') || endpoint.startsWith('/') ? endpoint : `/api/${endpoint}`

  let res: Response
  try {
    res = await fetch(url, {
      ...options,
      headers
    })
  } catch (netErr: any) {
    throw new ApiError(0, `Network failure: Unable to reach ${url}. Please verify connection.`)
  }

  const contentType = (res.headers.get('content-type') || '').toLowerCase()
  const isHtml = contentType.includes('text/html')

  // Handle SPA fallback or static web server returning HTML for an API route
  if (isHtml) {
    if (res.status === 405) {
      throw new ApiError(
        405,
        `Method ${options.method || 'GET'} Not Allowed on ${endpoint}.`,
        true
      )
    }
    throw new ApiError(
      res.status,
      `API endpoint returned HTML (HTTP ${res.status}) instead of expected JSON. The backend server is offline or the route does not exist.`,
      true
    )
  }

  if (res.status === 405) {
    throw new ApiError(405, `HTTP 405: Method ${options.method || 'GET'} Not Allowed on ${endpoint}.`)
  }

  if (res.status === 404) {
    throw new ApiError(404, `HTTP 404: Endpoint ${endpoint} not found.`)
  }

  const text = await res.text()
  let data: any = null

  if (text.trim().length > 0) {
    try {
      data = JSON.parse(text)
    } catch {
      throw new ApiError(
        res.status,
        `Invalid JSON returned by server: ${text.slice(0, 100)}`
      )
    }
  }

  if (!res.ok) {
    const errorDetail = data?.detail || data?.message || `Request failed with status ${res.status}`
    throw new ApiError(res.status, errorDetail, false, data?.detail)
  }

  return data as T
}
