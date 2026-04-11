import { expect, it } from 'vitest'
import { E2E_TEST_TIMEOUT_MS, describeInCI, generateJsonFor, isCliAvailable } from './shared.js'

describeInCI('e2e: gradle', () => {
  it.skipIf(!isCliAvailable('gradle'))('generates docs from gradle --help', async () => {
    const generated = await generateJsonFor('gradle', { maxDepth: 2, timeoutMs: 12000 })

    expect(generated.name).toBe('gradle')
    expect(generated.usage?.toLowerCase()).toContain('gradle')
    expect(generated.subcommands.length).toBeGreaterThan(0)
  }, E2E_TEST_TIMEOUT_MS)
})
