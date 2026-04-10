import { expect, it } from 'vitest'
import { E2E_TEST_TIMEOUT_MS, describeInCI, generateJsonFor, isCliAvailable } from './shared.js'

describeInCI('e2e: mv', () => {
  it.skipIf(!isCliAvailable('mv'))('generates docs from mv --help', async () => {
    const generated = await generateJsonFor('mv')

    expect(generated.name).toBe('mv')
    expect(generated.usage?.toLowerCase()).toContain('mv')
  }, E2E_TEST_TIMEOUT_MS)
})
