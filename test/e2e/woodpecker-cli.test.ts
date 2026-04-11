import { expect, it } from 'vitest'
import { E2E_TEST_TIMEOUT_MS, describeInCI, generateJsonFor, isCliAvailable } from './shared.js'

describeInCI('e2e: woodpecker-cli', () => {
  it.skipIf(!isCliAvailable('woodpecker-cli'))('generates docs from woodpecker-cli --help', async () => {
    const generated = await generateJsonFor('woodpecker-cli')
    const synopsis = (generated.usage ?? generated.description ?? '').toLowerCase()

    expect(generated.name.toLowerCase()).toContain('woodpecker')
    expect(synopsis.includes('woodpecker')).toBe(true)
    expect(Array.isArray(generated.subcommands)).toBe(true)
  }, E2E_TEST_TIMEOUT_MS)
})
