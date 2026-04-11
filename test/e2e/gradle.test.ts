import { expect, it } from 'vitest'
import { E2E_TEST_TIMEOUT_MS, describeInCI, generateJsonFor, isCliAvailable } from './shared.js'

describeInCI('e2e: gradle', () => {
  it.skipIf(!isCliAvailable('gradle'))('generates docs from gradle --help', async () => {
    const generated = await generateJsonFor('gradle', { maxDepth: 2, timeoutMs: 12000 })
    const synopsis = (generated.usage ?? generated.description ?? '').toLowerCase()

    expect(generated.name.toLowerCase()).toContain('gradle')
    expect(synopsis.includes('gradle')).toBe(true)
    expect(Array.isArray(generated.subcommands)).toBe(true)
  }, E2E_TEST_TIMEOUT_MS)
})
