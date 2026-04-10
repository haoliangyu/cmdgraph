import { expect, it } from 'vitest'
import { E2E_TEST_TIMEOUT_MS, describeInCI, generateJsonFor, isCliAvailable } from './shared.js'

describeInCI('e2e: git', () => {
  it.skipIf(!isCliAvailable('git'))('generates docs from git --help', async () => {
    const generated = await generateJsonFor('git')

    expect(generated.name).toBe('git')
    expect(generated.usage?.toLowerCase()).toContain('git')
    expect(generated.subcommands.length).toBeGreaterThan(0)
  }, E2E_TEST_TIMEOUT_MS)
})
