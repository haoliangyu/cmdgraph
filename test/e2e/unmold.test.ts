import { expect, it } from 'vitest'
import { describeInCI, isCliAvailable, generateJsonFor } from './shared.js'

describeInCI('e2e: yargs', () => {
  it.skipIf(!isCliAvailable('unmold'))('generates docs from Unmold CLI --help', async () => {
    const command = 'unmold'
    const generated = await generateJsonFor(command, { timeoutMs: 12000 })

    expect(generated.name).toBeTruthy()
    expect(generated.usage?.toLowerCase()).toContain(command.split(/\s+/)[0] ?? '')
  }, 30000)
})
