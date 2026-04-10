import { expect, it } from 'vitest'
import { describeInCI, isCliAvailable, generateJsonFor } from './shared.js'

describeInCI('e2e: yargs', () => {
  it.skipIf(!isCliAvailable('jest'))('generates docs from Jest CLI --help', async () => {
    const command = 'jest'
    const generated = await generateJsonFor(command, { maxDepth: 2, timeoutMs: 12000 })

    expect(generated.name).toBeTruthy()
    expect(generated.usage?.toLowerCase()).toContain(command.split(/\s+/)[0] ?? '')
  }, 30000)
})
