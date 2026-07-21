/** RFC 9457 problem document, as produced by the backend's ApiExceptionHandler. */
type ProblemDetail = { title?: string; detail?: string; status?: number }

export class ApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

/**
 * Prefers the problem document's `detail`, which carries the domain message — "An
 * Application named 'Billing' already exists" rather than a bare status code.
 */
async function toError(response: Response): Promise<ApiError> {
  try {
    const problem = (await response.json()) as ProblemDetail
    return new ApiError(
      problem.detail ?? problem.title ?? `Request failed (${response.status})`,
      response.status,
    )
  } catch {
    return new ApiError(`Request failed (${response.status})`, response.status)
  }
}

/**
 * Every call sends credentials: the backend authenticates operators with an httpOnly
 * session cookie, which the browser only attaches when asked to.
 */
export async function request<T>(url: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(url, { ...init, credentials: 'include' })

  if (!response.ok) {
    throw await toError(response)
  }

  // 204 carries no body — withdrawals answer with one, and parsing it would throw.
  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}
