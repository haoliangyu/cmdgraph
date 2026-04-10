import { expect, it } from 'vitest'
import { E2E_TEST_TIMEOUT_MS, describeInCI, firstAvailableCli, generateJsonFor } from './shared.js'

const yargsCandidate = firstAvailableCli(['nyc', 'jest', 'webpack', 'webpack-cli'])

describeInCI('e2e: yargs', () => {
  it.skipIf(!yargsCandidate)('generates docs from a yargs-based CLI --help', async () => {
    const command = yargsCandidate ?? ''
    const generated = await generateJsonFor(command)

    expect(generated.name).toBeTruthy()
    expect(generated.usage?.toLowerCase()).toContain(command.split(/\s+/)[0] ?? '')
  }, E2E_TEST_TIMEOUT_MS)
})
