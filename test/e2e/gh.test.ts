import { expect, it } from 'vitest'
import { E2E_TEST_TIMEOUT_MS, describeInCI, generateJsonFor, isCliAvailable } from './shared.js'

describeInCI('e2e: gh', () => {
  it.skipIf(!isCliAvailable('gh'))('generates docs from gh --help', async () => {
    const generated = await generateJsonFor('gh')

    expect(generated.name).toBe('gh')
    expect(generated.usage?.toLowerCase()).toContain('gh')
    expect(generated.subcommands.length).toBeGreaterThan(0)
  }, E2E_TEST_TIMEOUT_MS)
})
