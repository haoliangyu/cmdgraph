import { access, readFile } from 'node:fs/promises'
import { constants } from 'node:fs'
import { resolve } from 'node:path'
import type { OutputFormat } from '../formatters/formats.js'

type PrimitiveRecord = Record<string, unknown>

export interface GenerateResolvedFlags {
  'max-depth'?: number
  format?: OutputFormat[]
  output?: string
  timeout?: number
  concurrency?: number
  parser?: string
  'output-root-command-name'?: string
  'output-html-title'?: string
  'output-html-project-link'?: string
  'output-html-readme'?: string
  'output-llms-txt-base-url'?: string
  'output-sitemap-base-url'?: string
  config?: string
}

export const DEFAULT_CONFIG_FILE_PATH = './cmdgraph.config.json'

export const DEFAULT_GENERATE_FLAGS: Omit<GenerateResolvedFlags, 'max-depth'> = {
  format: ['json'],
  output: './docs',
  timeout: 5000,
  concurrency: 4,
  config: DEFAULT_CONFIG_FILE_PATH,
}

const APPLYABLE_FLAG_KEYS: Array<keyof Omit<GenerateResolvedFlags, 'config'>> = [
  'max-depth',
  'format',
  'output',
  'timeout',
  'concurrency',
  'parser',
  'output-root-command-name',
  'output-html-title',
  'output-html-project-link',
  'output-html-readme',
  'output-llms-txt-base-url',
  'output-sitemap-base-url',
]

function asRecord(value: unknown): PrimitiveRecord | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return undefined
  }

  return value as PrimitiveRecord
}

function getString(record: PrimitiveRecord, ...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = record[key]
    if (value === undefined) {
      continue
    }

    if (typeof value !== 'string') {
      throw new Error(`Expected a string for config key "${key}"`)
    }

    return value
  }

  return undefined
}

function getNumber(record: PrimitiveRecord, ...keys: string[]): number | undefined {
  for (const key of keys) {
    const value = record[key]
    if (value === undefined) {
      continue
    }

    if (typeof value !== 'number') {
      throw new Error(`Expected a number for config key "${key}"`)
    }

    return value
  }

  return undefined
}

function getFormatValue(record: PrimitiveRecord, ...keys: string[]): OutputFormat[] | undefined {
  for (const key of keys) {
    const value = record[key]
    if (value === undefined) {
      continue
    }

    if (typeof value === 'string') {
      return [value as OutputFormat]
    }

    if (Array.isArray(value) && value.every((entry) => typeof entry === 'string')) {
      return value as OutputFormat[]
    }

    throw new Error(`Expected a string or string[] for config key "${key}"`)
  }

  return undefined
}

export function parseGenerateConfigObject(rawConfig: unknown): Partial<GenerateResolvedFlags> {
  const root = asRecord(rawConfig)
  if (!root) {
    throw new Error('Configuration root must be a JSON object')
  }

  const crawler = asRecord(root.crawler) ?? {}
  const output = asRecord(root.output) ?? {}
  const outputHtml = asRecord(output.html) ?? {}
  const outputLlms = asRecord(output['llms-txt'] ?? output.llmsTxt) ?? {}
  const outputSitemap = asRecord(output.sitemap) ?? {}

  const parsed: Partial<GenerateResolvedFlags> = {}

  parsed['max-depth'] =
    getNumber(root, 'max-depth', 'maxDepth') ??
    getNumber(crawler, 'max-depth', 'maxDepth')

  parsed.timeout =
    getNumber(root, 'timeout') ??
    getNumber(crawler, 'timeout')

  parsed.concurrency =
    getNumber(root, 'concurrency') ??
    getNumber(crawler, 'concurrency')

  parsed.parser =
    getString(root, 'parser') ??
    getString(crawler, 'parser')

  parsed.format =
    getFormatValue(root, 'format', 'formats') ??
    getFormatValue(output, 'format', 'formats')

  if (root.output !== undefined && typeof root.output !== 'string' && !asRecord(root.output)) {
    throw new Error('Expected a string for config key "output"')
  }

  parsed.output =
    (typeof root.output === 'string' ? root.output : undefined) ??
    getString(output, 'output', 'directory', 'dir', 'path')

  parsed['output-root-command-name'] =
    getString(root, 'output-root-command-name', 'outputRootCommandName') ??
    getString(output, 'root-command-name', 'rootCommandName')

  parsed['output-html-title'] =
    getString(root, 'output-html-title', 'outputHtmlTitle') ??
    getString(outputHtml, 'title')

  parsed['output-html-project-link'] =
    getString(root, 'output-html-project-link', 'outputHtmlProjectLink') ??
    getString(outputHtml, 'project-link', 'projectLink')

  parsed['output-html-readme'] =
    getString(root, 'output-html-readme', 'outputHtmlReadme') ??
    getString(outputHtml, 'readme')

  parsed['output-llms-txt-base-url'] =
    getString(root, 'output-llms-txt-base-url', 'outputLlmsTxtBaseUrl') ??
    getString(outputLlms, 'base-url', 'baseUrl')

  parsed['output-sitemap-base-url'] =
    getString(root, 'output-sitemap-base-url', 'outputSitemapBaseUrl') ??
    getString(outputSitemap, 'base-url', 'baseUrl')

  return parsed
}

export function getProvidedLongFlagNames(argv: string[]): Set<string> {
  const provided = new Set<string>()

  for (const token of argv) {
    if (!token.startsWith('--')) {
      continue
    }

    const body = token.slice(2)
    const equalsIndex = body.indexOf('=')
    const flagName = equalsIndex >= 0 ? body.slice(0, equalsIndex) : body
    if (flagName.length > 0) {
      provided.add(flagName)
    }
  }

  return provided
}

export function pickCliGenerateOverrides(
  parsedFlags: GenerateResolvedFlags,
  providedLongFlags: Set<string>,
): Partial<GenerateResolvedFlags> {
  const overrides: Partial<GenerateResolvedFlags> = {}

  for (const key of APPLYABLE_FLAG_KEYS) {
    if (providedLongFlags.has(key)) {
      const value = parsedFlags[key]
      if (value !== undefined) {
        ;(overrides as Record<string, unknown>)[key] = value
      }
    }
  }

  return overrides
}

export async function loadGenerateConfigFlags(
  configPath: string,
  options: { required: boolean },
): Promise<Partial<GenerateResolvedFlags>> {
  const resolvedPath = resolve(configPath)

  try {
    await access(resolvedPath, constants.F_OK)
  } catch {
    if (options.required) {
      throw new Error(`Config file not found: ${resolvedPath}`)
    }

    return {}
  }

  let raw: string
  try {
    raw = await readFile(resolvedPath, 'utf8')
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    throw new Error(`Failed to read config file ${resolvedPath}: ${message}`)
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    throw new Error(`Invalid JSON in config file ${resolvedPath}: ${message}`)
  }

  try {
    return parseGenerateConfigObject(parsed)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    throw new Error(`Invalid config in ${resolvedPath}: ${message}`)
  }
}