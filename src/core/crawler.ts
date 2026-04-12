import pLimit from 'p-limit'
import { runHelpCommand } from './executor.js'
import { createDefaultParserRegistry, ParserRegistry } from './parser-registry.js'
import type { CommandNode, ParsedCommand } from '../types.js'

export interface CrawlOptions {
  concurrency?: number
  maxDepth?: number
  timeoutMs: number
  parserName?: string
  parserRegistry?: ParserRegistry
  executor?: (commandPath: string[], timeoutMs: number) => Promise<string>
  onWarning?: (message: string) => void
}

function toMinimalParsed(commandPath: string[]): ParsedCommand {
  const name = commandPath[commandPath.length - 1] ?? commandPath.join(' ')
  return {
    name,
    aliases: [],
    arguments: [],
    examples: [],
    options: [],
    subcommands: [],
  }
}

function isLikelyDynamicSubcommand(token: string): boolean {
  return /^[:<{[]/.test(token)
}

function normalizePath(path: string[]): string {
  return path.join(' ')
}

function resolveNodeName(parsedName: string | undefined, commandPath: string[], normalizedPath: string): string {
  const candidate = parsedName?.trim()
  if (candidate && candidate.toLowerCase() !== 'unknown') {
    return candidate
  }

  return commandPath[commandPath.length - 1] || normalizedPath
}

export async function crawlCommandTree(rootCommand: string, options: CrawlOptions): Promise<CommandNode> {
  const {
    concurrency = 4,
    maxDepth,
    timeoutMs,
    parserName,
    parserRegistry = createDefaultParserRegistry(),
    executor = runHelpCommand,
    onWarning,
  } = options

  const seen = new Set<string>()
  const limit = pLimit(concurrency)

  const visit = async (commandPath: string[], depth: number): Promise<CommandNode> => {
    const normalizedPath = normalizePath(commandPath)
    seen.add(normalizedPath)

    let parsed: ParsedCommand
    try {
      const helpText = await limit(() => executor(commandPath, timeoutMs))
      const parser = parserRegistry.select(helpText, parserName)
      parsed = parser.parse(helpText)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      onWarning?.(`Skipping \"${normalizedPath}\": ${message}`)
      parsed = toMinimalParsed(commandPath)
    }

    const node: CommandNode = {
      ...parsed,
      name: resolveNodeName(parsed.name, commandPath, normalizedPath),
      path: [...commandPath],
      children: [],
    }

    if (maxDepth !== undefined && depth >= maxDepth) {
      return node
    }

    const childTasks: Array<Promise<CommandNode>> = []

    for (const subcommandToken of parsed.subcommands) {
      if (isLikelyDynamicSubcommand(subcommandToken)) {
        continue
      }

      const subcommandParts = subcommandToken.split(/\s+/).filter(Boolean)
      if (subcommandParts.length === 0) {
        continue
      }

      const childPath = [...commandPath, ...subcommandParts]
      const normalizedChild = normalizePath(childPath)

      if (seen.has(normalizedChild)) {
        continue
      }

      seen.add(normalizedChild)
      childTasks.push(visit(childPath, depth + 1))
    }

    if (childTasks.length > 0) {
      node.children = await Promise.all(childTasks)
    }

    return node
  }

  return visit(rootCommand.split(/\s+/).filter(Boolean), 0)
}
