import { expect, it } from 'vitest'
import { E2E_TEST_TIMEOUT_MS, describeInCI, firstAvailableCli, generateJsonFor } from './shared.js'

const typerCandidate = firstAvailableCli(['fastapi', 'httpx', 'safety'])

describeInCI('e2e: typer', () => {
  it.skipIf(!typerCandidate)('generates docs from a Typer-based CLI --help', async () => {
    const command = typerCandidate ?? ''
    const generated = await generateJsonFor(command)

    expect(generated.name).toBeTruthy()
    expect(generated.usage?.toLowerCase()).toContain(command.split(/\s+/)[0] ?? '')
  }, E2E_TEST_TIMEOUT_MS)
})
