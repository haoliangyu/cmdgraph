import { expect, it } from 'vitest'
import { E2E_TEST_TIMEOUT_MS, describeInCI, generateJsonFor, isCliAvailable } from './shared.js'

describeInCI('e2e: cp', () => {
  it.skipIf(!isCliAvailable('cp'))('generates docs from cp --help', async () => {
    const generated = await generateJsonFor('cp')

    expect(generated.name).toBe('cp')
    expect(generated.usage?.toLowerCase()).toContain('cp')
  }, E2E_TEST_TIMEOUT_MS)
})
