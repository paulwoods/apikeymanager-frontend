import { request } from '../api/http'

export type Application = {
  id: string
  name: string
  dateCreated: string
  createdBy: string
  dateUpdated: string
  updatedBy: string
}

export async function fetchApplications(): Promise<Application[]> {
  const paged = await request<{ content: Application[] }>('/api/applications')
  return paged.content
}

export function fetchApplication(id: string): Promise<Application> {
  return request<Application>(`/api/applications/${id}`)
}

export function createApplication(name: string): Promise<Application> {
  return request<Application>('/api/applications', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  })
}

/** Soft delete server-side: the Application is withdrawn from use, not discarded. */
export async function withdrawApplication(id: string): Promise<void> {
  await request<void>(`/api/applications/${id}`, { method: 'DELETE' })
}
