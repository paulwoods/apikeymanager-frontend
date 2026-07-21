import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { expect, test, vi } from 'vitest'
import { renderWithQueryClient } from '../test/render'
import { server } from '../test/server'
import ApplicationsPage from './ApplicationsPage'

function application(name: string) {
  return {
    id: crypto.randomUUID(),
    name,
    dateCreated: '2026-07-20T12:00:00Z',
    createdBy: 'STUB-OPERATOR-AUTH-NOT-WIRED',
    dateUpdated: '2026-07-20T12:00:00Z',
    updatedBy: 'STUB-OPERATOR-AUTH-NOT-WIRED',
  }
}

function listReturns(...names: string[]) {
  server.use(
    http.get('/api/applications', () => HttpResponse.json({ content: names.map(application) })),
  )
}

test('lists the applications returned by the API', async () => {
  listReturns('Billing', 'Reporting')

  renderWithQueryClient(<ApplicationsPage />)

  const list = await screen.findByRole('list', { name: /applications/i })
  expect(within(list).getAllByRole('listitem')).toHaveLength(2)
  expect(within(list).getByText('Billing')).toBeInTheDocument()
  expect(within(list).getByText('Reporting')).toBeInTheDocument()
})

test('shows an empty state when there are no applications', async () => {
  listReturns()

  renderWithQueryClient(<ApplicationsPage />)

  expect(await screen.findByText(/no applications yet/i)).toBeInTheDocument()
})

test('creates an application and shows it in the refreshed list', async () => {
  const names: string[] = []
  server.use(
    http.get('/api/applications', () =>
      HttpResponse.json({ content: names.map(application) }),
    ),
    http.post('/api/applications', async ({ request }) => {
      const body = (await request.json()) as { name: string }
      names.push(body.name)
      return HttpResponse.json(application(body.name), { status: 201 })
    }),
  )

  renderWithQueryClient(<ApplicationsPage />)
  await screen.findByText(/no applications yet/i)

  await userEvent.type(screen.getByRole('textbox', { name: /name/i }), 'Billing')
  await userEvent.click(screen.getByRole('button', { name: /create application/i }))

  const list = await screen.findByRole('list', { name: /applications/i })
  expect(within(list).getByText('Billing')).toBeInTheDocument()
})

/** Client-side validation should spare the API an obviously bad request. */
test('rejects a blank name without calling the API', async () => {
  listReturns()
  const create = vi.fn()
  server.use(
    http.post('/api/applications', () => {
      create()
      return HttpResponse.json(application('unused'), { status: 201 })
    }),
  )

  renderWithQueryClient(<ApplicationsPage />)
  await screen.findByText(/no applications yet/i)

  await userEvent.type(screen.getByRole('textbox', { name: /name/i }), '   ')
  await userEvent.click(screen.getByRole('button', { name: /create application/i }))

  expect(await screen.findByText(/name is required/i)).toBeInTheDocument()
  expect(create).not.toHaveBeenCalled()
})

/**
 * The partial unique index reaches the operator as a readable message. The API answers
 * RFC 9457, so the detail comes from the problem document rather than a generic string.
 */
test('surfaces a duplicate-name conflict from the API', async () => {
  listReturns('Billing')
  server.use(
    http.post('/api/applications', () =>
      HttpResponse.json(
        {
          type: 'about:blank',
          title: 'Application name already in use',
          status: 409,
          detail: "An Application named 'Billing' already exists",
        },
        { status: 409, headers: { 'Content-Type': 'application/problem+json' } },
      ),
    ),
  )

  renderWithQueryClient(<ApplicationsPage />)
  await screen.findByRole('list', { name: /applications/i })

  await userEvent.type(screen.getByRole('textbox', { name: /name/i }), 'Billing')
  await userEvent.click(screen.getByRole('button', { name: /create application/i }))

  expect(await screen.findByRole('alert')).toHaveTextContent(/already exists/i)
})

/** Withdrawing is a soft delete server-side; the UI just stops listing it. */
test('withdraws an application and refreshes the list', async () => {
  let names = ['Billing']
  server.use(
    http.get('/api/applications', () =>
      HttpResponse.json({ content: names.map(application) }),
    ),
    http.delete('/api/applications/:id', () => {
      names = []
      return new HttpResponse(null, { status: 204 })
    }),
  )

  renderWithQueryClient(<ApplicationsPage />)
  const list = await screen.findByRole('list', { name: /applications/i })

  await userEvent.click(within(list).getByRole('button', { name: /withdraw billing/i }))

  await waitFor(() => expect(screen.getByText(/no applications yet/i)).toBeInTheDocument())
})
