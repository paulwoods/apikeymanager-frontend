import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { Route, Routes } from 'react-router'
import { expect, test, vi } from 'vitest'
import { renderWithProviders } from '../test/render'
import { server } from '../test/server'
import ApplicationDetailPage from './ApplicationDetailPage'

const APPLICATION_ID = '019f8204-7124-772f-882f-dd3f3e83b73e'

function keyOwner(email: string) {
  return {
    id: crypto.randomUUID(),
    applicationId: APPLICATION_ID,
    email,
    dateCreated: '2026-07-20T12:00:00Z',
    createdBy: 'STUB-OPERATOR-AUTH-NOT-WIRED',
    dateUpdated: '2026-07-20T12:00:00Z',
    updatedBy: 'STUB-OPERATOR-AUTH-NOT-WIRED',
  }
}

function applicationReturns(name: string) {
  server.use(
    http.get(`/api/applications/${APPLICATION_ID}`, () =>
      HttpResponse.json({
        id: APPLICATION_ID,
        name,
        dateCreated: '2026-07-20T12:00:00Z',
        createdBy: 'STUB-OPERATOR-AUTH-NOT-WIRED',
        dateUpdated: '2026-07-20T12:00:00Z',
        updatedBy: 'STUB-OPERATOR-AUTH-NOT-WIRED',
      }),
    ),
  )
}

function keyOwnersReturn(...emails: string[]) {
  server.use(
    http.get(`/api/applications/${APPLICATION_ID}/key-owners`, () =>
      HttpResponse.json({ content: emails.map(keyOwner) }),
    ),
  )
}

function renderDetail() {
  return renderWithProviders(
    <Routes>
      <Route path="/applications/:applicationId" element={<ApplicationDetailPage />} />
    </Routes>,
    { route: `/applications/${APPLICATION_ID}` },
  )
}

test('shows the application it belongs to', async () => {
  applicationReturns('Billing')
  keyOwnersReturn()

  renderDetail()

  expect(await screen.findByRole('heading', { name: 'Billing' })).toBeInTheDocument()
})

test('lists the key owners of the application', async () => {
  applicationReturns('Billing')
  keyOwnersReturn('alice@corp.com', 'bob@corp.com')

  renderDetail()

  const list = await screen.findByRole('list', { name: /key owners/i })
  expect(within(list).getAllByRole('listitem')).toHaveLength(2)
  expect(within(list).getByText('alice@corp.com')).toBeInTheDocument()
})

test('shows an empty state when the application has no key owners', async () => {
  applicationReturns('Billing')
  keyOwnersReturn()

  renderDetail()

  expect(await screen.findByText(/no key owners yet/i)).toBeInTheDocument()
})

test('adds a key owner and shows it in the refreshed list', async () => {
  applicationReturns('Billing')
  const emails: string[] = []
  server.use(
    http.get(`/api/applications/${APPLICATION_ID}/key-owners`, () =>
      HttpResponse.json({ content: emails.map(keyOwner) }),
    ),
    http.post(`/api/applications/${APPLICATION_ID}/key-owners`, async ({ request }) => {
      const body = (await request.json()) as { email: string }
      emails.push(body.email)
      return HttpResponse.json(keyOwner(body.email), { status: 201 })
    }),
  )

  renderDetail()
  await screen.findByText(/no key owners yet/i)

  await userEvent.type(screen.getByRole('textbox', { name: /email/i }), 'alice@corp.com')
  await userEvent.click(screen.getByRole('button', { name: /add key owner/i }))

  const list = await screen.findByRole('list', { name: /key owners/i })
  expect(within(list).getByText('alice@corp.com')).toBeInTheDocument()
})

/** A malformed address should not become a request. */
test('rejects a malformed email without calling the API', async () => {
  applicationReturns('Billing')
  keyOwnersReturn()
  const create = vi.fn()
  server.use(
    http.post(`/api/applications/${APPLICATION_ID}/key-owners`, () => {
      create()
      return HttpResponse.json(keyOwner('unused'), { status: 201 })
    }),
  )

  renderDetail()
  await screen.findByText(/no key owners yet/i)

  await userEvent.type(screen.getByRole('textbox', { name: /email/i }), 'not-an-email')
  await userEvent.click(screen.getByRole('button', { name: /add key owner/i }))

  expect(await screen.findByText(/enter a valid email/i)).toBeInTheDocument()
  expect(create).not.toHaveBeenCalled()
})

test('surfaces a duplicate-email conflict from the API', async () => {
  applicationReturns('Billing')
  keyOwnersReturn('alice@corp.com')
  server.use(
    http.post(`/api/applications/${APPLICATION_ID}/key-owners`, () =>
      HttpResponse.json(
        {
          title: 'Key owner already exists',
          status: 409,
          detail: "A key owner with email 'alice@corp.com' already exists in this application",
        },
        { status: 409, headers: { 'Content-Type': 'application/problem+json' } },
      ),
    ),
  )

  renderDetail()
  await screen.findByRole('list', { name: /key owners/i })

  await userEvent.type(screen.getByRole('textbox', { name: /email/i }), 'alice@corp.com')
  await userEvent.click(screen.getByRole('button', { name: /add key owner/i }))

  expect(await screen.findByRole('alert')).toHaveTextContent(/already exists/i)
})

test('withdraws a key owner and refreshes the list', async () => {
  applicationReturns('Billing')
  let emails = ['alice@corp.com']
  server.use(
    http.get(`/api/applications/${APPLICATION_ID}/key-owners`, () =>
      HttpResponse.json({ content: emails.map(keyOwner) }),
    ),
    http.delete(`/api/applications/${APPLICATION_ID}/key-owners/:id`, () => {
      emails = []
      return new HttpResponse(null, { status: 204 })
    }),
  )

  renderDetail()
  const list = await screen.findByRole('list', { name: /key owners/i })

  await userEvent.click(within(list).getByRole('button', { name: /withdraw alice@corp\.com/i }))

  await waitFor(() => expect(screen.getByText(/no key owners yet/i)).toBeInTheDocument())
})
