import { expect, it } from 'vitest'
import { E2E_TEST_TIMEOUT_MS, describeInCI, generateJsonFor, isCliAvailable } from './shared.js'

describeInCI('e2e: commandlineparser', () => {
  it.skipIf(!isCliAvailable('dotnet-clp'))('generates docs from dotnet-clp --help', async () => {
    const generated = await generateJsonFor('dotnet-clp')
    const synopsis = (generated.usage ?? generated.description ?? '').toLowerCase()

    expect(generated.name.toLowerCase()).toContain('dotnet-clp')
    expect(synopsis.includes('dotnet-clp')).toBe(true)
    expect(Array.isArray(generated.subcommands)).toBe(true)
  }, E2E_TEST_TIMEOUT_MS)
})
