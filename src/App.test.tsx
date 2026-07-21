import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { expect, test } from 'vitest'
import App from './App'

test('renders the application shell', () => {
  render(
    <MemoryRouter>
      <App />
    </MemoryRouter>,
  )

  expect(screen.getByRole('heading', { level: 1, name: 'API Key Manager' })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Applications' })).toBeInTheDocument()
})
