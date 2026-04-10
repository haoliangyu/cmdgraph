import { expect, it } from 'vitest'
import { E2E_TEST_TIMEOUT_MS, describeInCI, generateJsonFor, isCliAvailable } from './shared.js'

describeInCI('e2e: cargo', () => {
  it.skipIf(!isCliAvailable('cargo'))('generates docs from cargo --help', async () => {
    const generated = await generateJsonFor('cargo')

    expect(generated.name).toBe('cargo')
    expect(generated.usage?.toLowerCase()).toContain('cargo')
    expect(generated.subcommands.length).toBeGreaterThan(0)
  }, E2E_TEST_TIMEOUT_MS)
})
