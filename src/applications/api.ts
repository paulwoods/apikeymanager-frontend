export type Application = {
  id: string
  name: string
  dateCreated: string
  createdBy: string
  dateUpdated: string
  updatedBy: string
}

/** The backend returns PagedModel; only the page contents matter to the UI so far. */
type PagedModel<T> = { content: T[] }

/** RFC 9457 problem document, as produced by the backend's ApiExceptionHandler. */
type ProblemDetail = { title?: string; detail?: string; status?: number }

export class ApiError extends Error {}

/**
 * Prefers the problem document's `detail`, which carries the domain message — "An
 * Application named 'Billing' already exists" rather than a bare status code.
 */
async function toError(response: Response): Promise<ApiError> {
  try {
    const problem = (await response.json()) as ProblemDetail
    return new ApiError(problem.detail ?? problem.title ?? `Request failed (${response.status})`)
  } catch {
    return new ApiError(`Request failed (${response.status})`)
  }
}

// credentials: 'include' throughout — the backend authenticates operators with an
// httpOnly session cookie, which the browser only attaches when asked to.
const withCredentials: RequestInit = { credentials: 'include' }

export async function fetchApplications(): Promise<Application[]> {
  const response = await fetch('/api/applications', withCredentials)
  if (!response.ok) {
    throw await toError(response)
  }
  const body = (await response.json()) as PagedModel<Application>
  return body.content
}

export async function createApplication(name: string): Promise<Application> {
  const response = await fetch('/api/applications', {
    ...withCredentials,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  })
  if (!response.ok) {
    throw await toError(response)
  }
  return (await response.json()) as Application
}

/** Soft delete server-side: the Application is withdrawn from use, not discarded. */
export async function withdrawApplication(id: string): Promise<void> {
  const response = await fetch(`/api/applications/${id}`, {
    ...withCredentials,
    method: 'DELETE',
  })
  if (!response.ok) {
    throw await toError(response)
  }
}
