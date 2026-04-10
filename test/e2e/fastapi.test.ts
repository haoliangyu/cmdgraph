import { expect, it } from 'vitest'
import { E2E_TEST_TIMEOUT_MS, describeInCI, isCliAvailable, generateJsonFor } from './shared.js'

describeInCI('e2e: fastapi', () => {
  it.skipIf(!isCliAvailable('fastapi'))('generates docs from a FastAPI CLI --help', async () => {
    const command = 'fastapi'
    const generated = await generateJsonFor(command)

    expect(generated.name).toBeTruthy()
    expect(generated.usage ?? generated.description).toBeTruthy()
  }, E2E_TEST_TIMEOUT_MS)
})
