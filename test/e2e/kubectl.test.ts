import { expect, it } from 'vitest'
import { E2E_TEST_TIMEOUT_MS, describeInCI, generateJsonFor, isCliAvailable } from './shared.js'

describeInCI('e2e: kubectl', () => {
  it.skipIf(!isCliAvailable('kubectl'))('generates docs from kubectl --help', async () => {
    const generated = await generateJsonFor('kubectl')

    expect(generated.name).toBe('kubectl')
    expect(generated.usage?.toLowerCase()).toContain('kubectl')
    expect(generated.subcommands.length).toBeGreaterThan(0)
  }, E2E_TEST_TIMEOUT_MS)
})
