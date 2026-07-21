import { request } from '../api/http'

export type KeyOwner = {
  id: string
  applicationId: string
  email: string
  dateCreated: string
  createdBy: string
  dateUpdated: string
  updatedBy: string
}

// Key owners are addressed beneath their application: a KeyOwner belongs to exactly one
// tenant, so there is no way to ask for one without naming the application.
const base = (applicationId: string) => `/api/applications/${applicationId}/key-owners`

export async function fetchKeyOwners(applicationId: string): Promise<KeyOwner[]> {
  const paged = await request<{ content: KeyOwner[] }>(base(applicationId))
  return paged.content
}

export function createKeyOwner(applicationId: string, email: string): Promise<KeyOwner> {
  return request<KeyOwner>(base(applicationId), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })
}

/** Soft delete server-side: the KeyOwner is withdrawn from use, not discarded. */
export async function withdrawKeyOwner(applicationId: string, id: string): Promise<void> {
  await request<void>(`${base(applicationId)}/${id}`, { method: 'DELETE' })
}
