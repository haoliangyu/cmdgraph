import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { execa } from 'execa'
import { describe } from 'vitest'

export type GeneratedDoc = {
  name: string
  usage?: string
  description?: string
  subcommands: string[]
}

export const describeInCI = describe
export const E2E_TEST_TIMEOUT_MS = 15000

export function isCliAvailable(command: string): boolean {
  const checker = process.platform === 'win32' ? 'where' : 'which'
  const result = spawnSync(checker, [command], { stdio: 'ignore' })
  return result.status === 0
}

function toSafeFileStem(command: string): string {
  return command.trim().replace(/\s+/g, '-').replace(/[^a-zA-Z0-9_-]/g, '').toLowerCase()
}

export async function generateJsonFor(command: string): Promise<GeneratedDoc> {
  const outDir = await mkdtemp(resolve(tmpdir(), `doclix-real-${command}-`))

  try {
    await execa('node', [
      './dist/index.js',
      'generate',
      command,
      '--max-depth=1',
      '--format=json',
      `--output=${outDir}`,
      '--timeout=8000',
    ])

    const jsonPath = resolve(outDir, `${toSafeFileStem(command)}.json`)
    const jsonContent = await readFile(jsonPath, 'utf8')
    return JSON.parse(jsonContent) as GeneratedDoc
  } finally {
    await rm(outDir, { recursive: true, force: true })
  }
}
