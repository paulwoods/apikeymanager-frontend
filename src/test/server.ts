import { setupServer } from 'msw/node'

/**
 * Intercepts at the network layer rather than mocking the query client, so tests
 * exercise the real TanStack Query code path — caching, invalidation and error handling
 * included.
 *
 * Handlers are declared per test. Anything unhandled fails loudly (see setup.ts) so a
 * forgotten stub surfaces as an error rather than a silent hang.
 */
export const server = setupServer()
