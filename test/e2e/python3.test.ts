import { expect, it } from 'vitest'
import { E2E_TEST_TIMEOUT_MS, describeInCI, generateJsonFor, isCliAvailable } from './shared.js'

describeInCI('e2e: argparse', () => {
  it.skipIf(!isCliAvailable('python3'))('generates docs from python3 -m venv --help', async () => {
    const generated = await generateJsonFor('python3 -m venv')

    expect(['venv', 'python3']).toContain(generated.name)
    expect((generated.usage ?? generated.description ?? '').toLowerCase()).toMatch(/venv|python3/)
    expect(generated.options.some((option) => option.flag.includes('-h'))).toBe(true)
  }, E2E_TEST_TIMEOUT_MS)
})
