import { expect, it } from 'vitest'
import { E2E_TEST_TIMEOUT_MS, describeInCI, isCliAvailable, generateJsonFor } from './shared.js'

describeInCI('e2e: pip', () => {
  it.skipIf(!isCliAvailable('pip'))('generates docs from pip --help', async () => {
    const command = 'pip'
    const generated = await generateJsonFor(command)

    expect(generated.name).toBeTruthy()
    expect(generated.usage ?? generated.description).toBeTruthy()
  }, E2E_TEST_TIMEOUT_MS)
})
