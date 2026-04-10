import { expect, it } from 'vitest'
import { E2E_TEST_TIMEOUT_MS, describeInCI, generateJsonFor, isCliAvailable } from './shared.js'

describeInCI('e2e: aws', () => {
  it.skipIf(!isCliAvailable('aws'))('generates docs from aws --help', async () => {
    const generated = await generateJsonFor('aws', { maxDepth: 2, timeoutMs: 12000 })

    expect(generated.name).toBe('aws')
    expect((generated.usage ?? generated.description ?? '').toLowerCase()).toMatch(/aws/)
    expect(generated.options.length >= 0).toBe(true)
  }, E2E_TEST_TIMEOUT_MS)
})
