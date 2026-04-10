import { expect, it } from 'vitest'
import { E2E_TEST_TIMEOUT_MS, describeInCI, generateJsonFor, isCliAvailable } from './shared.js'

describeInCI('e2e: jq', () => {
  it.skipIf(!isCliAvailable('jq'))('generates docs from jq --help', async () => {
    const generated = await generateJsonFor('jq')

    expect(generated.name).toBe('jq')
    expect(generated.usage?.toLowerCase()).toContain('jq')
  }, E2E_TEST_TIMEOUT_MS)
})
