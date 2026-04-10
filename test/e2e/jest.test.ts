import { expect, it } from 'vitest'
import { E2E_TEST_TIMEOUT_MS, describeInCI, isCliAvailable, generateJsonFor } from './shared.js'

describeInCI('e2e: yargs', () => {
  it.skipIf(!isCliAvailable('jest'))('generates docs from Jest CLI --help', async () => {
    const command = 'jest'
    const generated = await generateJsonFor(command)

    expect(generated.name).toBeTruthy()
    expect(generated.usage?.toLowerCase()).toContain(command.split(/\s+/)[0] ?? '')
  }, E2E_TEST_TIMEOUT_MS)
})
