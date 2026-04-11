import { expect, it } from 'vitest'
import { E2E_TEST_TIMEOUT_MS, describeInCI, generateJsonFor, isCliAvailable } from './shared.js'

describeInCI('e2e: system-commandline', () => {
  it.skipIf(!isCliAvailable('dotnet-scmd'))('generates docs from dotnet-scmd --help', async () => {
    const generated = await generateJsonFor('dotnet-scmd')
    const synopsis = (generated.usage ?? generated.description ?? '').toLowerCase()

    expect(generated.name.toLowerCase()).toContain('dotnet-scmd')
    expect(synopsis.includes('dotnet-scmd')).toBe(true)
    expect(Array.isArray(generated.subcommands)).toBe(true)
  }, E2E_TEST_TIMEOUT_MS)
})
