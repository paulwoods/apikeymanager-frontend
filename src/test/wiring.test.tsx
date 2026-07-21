import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { expect, test } from 'vitest'
import { server } from './server'

/**
 * Proves the scaffold's riskiest wiring: that MSW intercepts at the network layer and
 * TanStack Query renders what comes back. If this passes, the data layer for every
 * feature test is sound.
 */
function Probe() {
  const { data } = useQuery({
    queryKey: ['probe'],
    queryFn: async () => {
      const response = await fetch('/api/probe')
      return (await response.json()) as { name: string }
    },
  })

  return <span>{data?.name ?? 'loading'}</span>
}

test('MSW intercepts the request and TanStack Query renders the result', async () => {
  server.use(http.get('/api/probe', () => HttpResponse.json({ name: 'Billing' })))

  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={queryClient}>
      <Probe />
    </QueryClientProvider>,
  )

  expect(await screen.findByText('Billing')).toBeInTheDocument()
})
