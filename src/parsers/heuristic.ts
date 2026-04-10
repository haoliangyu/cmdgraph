import type { CLIParser } from '../core/parser.js'
import type { ParsedCommand } from '../types.js'

function findSectionEnd(lines: string[], start: number): number {
  let end = lines.length
  for (let i = start + 1; i < lines.length; i += 1) {
    if (/^\s*[A-Za-z][A-Za-z ]+:\s*$/.test(lines[i])) {
      end = i
      break
    }
  }

  return end
}

function sectionRange(lines: string[], heading: string): [number, number] | null {
  const start = lines.findIndex((line) => new RegExp(`^\\s*${heading}:?\\s*$`, 'i').test(line))
  if (start === -1) {
    return null
  }

  return [start + 1, findSectionEnd(lines, start)]
}

function sectionRangesByMatcher(
  lines: string[],
  matcher: (heading: string) => boolean,
): Array<[number, number]> {
  const ranges: Array<[number, number]> = []

  for (let i = 0; i < lines.length; i += 1) {
    const headingMatch = lines[i].match(/^\s*([A-Za-z][A-Za-z ]+):\s*$/)
    if (!headingMatch) {
      continue
    }

    const heading = headingMatch[1]?.trim() ?? ''
    if (!matcher(heading)) {
      continue
    }

    ranges.push([i + 1, findSectionEnd(lines, i)])
  }

  return ranges
}

function parseOptions(lines: string[]): ParsedCommand['options'] {
  const options: ParsedCommand['options'] = []

  for (const raw of lines) {
    const line = raw.trim()
    if (!line || !line.startsWith('-')) {
      continue
    }

    const columns = line.split(/\s{2,}|\t+/).filter(Boolean)
    if (columns.length >= 2) {
      let flag = columns[0] ?? ''
      let index = 1

      // Some CLIs render aliases in separate columns, e.g. "-h  --help  Show help".
      while (index < columns.length && columns[index]?.startsWith('-')) {
        flag += ` ${columns[index]}`
        index += 1
      }

      const description = columns.slice(index).join(' ')
      options.push({
        flag: flag.trim(),
        description: description.trim(),
      })
      continue
    }

    options.push({ flag: line, description: '' })
  }

  return options
}

function parseSubcommands(lines: string[]): string[] {
  const subcommands = new Set<string>()

  for (const raw of lines) {
    const line = raw.trim()
    if (!line) {
      continue
    }

    if (/^-/.test(line)) {
      continue
    }

    const normalized = line.replace(/^\*\s+/, '')
    const match = normalized.match(
      /^([A-Za-z0-9][\w:-]*)(?:\s*,\s*[\w:-]+)?(?:\s+(?:<[^>]+>|\[[^\]]+\]))*(?:\s{2,}|\t+).+$/,
    )
    const token = match?.[1]
    if (!token) {
      continue
    }

    if (/^[<\[]/.test(token)) {
      continue
    }

    subcommands.add(token)
  }

  return [...subcommands]
}

function collectSectionLines(lines: string[], ranges: Array<[number, number]>): string[] {
  return ranges.flatMap(([start, end]) => lines.slice(start, end))
}

function isKnownSectionHeading(line: string): boolean {
  return /^(usage|options?|flags?|commands?|available commands|core commands|additional commands|global flags?):$/i.test(
    line,
  )
}

function isSectionHeading(line: string): boolean {
  const trimmed = line.trim()
  return /^[A-Za-z][A-Za-z ]+:\s*$/.test(trimmed) || /^[A-Z][A-Z ]+$/.test(trimmed)
}

function extractUsage(lines: string[]): string | undefined {
  const usageIndex = lines.findIndex((line) => /^\s*usage(?:\s*:.*)?\s*$/i.test(line))
  if (usageIndex === -1) {
    return undefined
  }

  const usageLine = lines[usageIndex].trim()
  const firstLine = usageLine.replace(/^usage\s*:/i, '').trim()
  const usageParts: string[] = []

  if (firstLine && !/^usage$/i.test(firstLine)) {
    usageParts.push(firstLine)
  }

  for (let i = usageIndex + 1; i < lines.length; i += 1) {
    const raw = lines[i]
    const trimmed = raw.trim()

    if (!trimmed) {
      if (usageParts.length > 0) {
        break
      }

      continue
    }

    if (isSectionHeading(trimmed)) {
      break
    }

    if (/^\s/.test(raw) || usageParts.length === 0) {
      usageParts.push(trimmed)
      continue
    }

    break
  }

  if (usageParts.length === 0) {
    return undefined
  }

  return usageParts.join(' ')
}

function extractName(lines: string[]): string {
  const usage = extractUsage(lines)
  if (usage) {
    const tokens = usage.split(/\s+/).filter(Boolean)
    for (const token of tokens) {
      const candidate = token.replace(/^\$/, '')
      if (!candidate || /^[<\[]/.test(candidate)) {
        continue
      }

      return candidate
    }
  }

  const firstLine = lines.find((line) => line.trim().length > 0)
  return firstLine?.trim().split(/\s+/)[0] ?? 'unknown'
}

function extractDescription(lines: string[]): string | undefined {
  const usageIndex = lines.findIndex((line) => /^\s*usage(?:\s*:.*)?\s*$/i.test(line))
  const start = usageIndex >= 0 ? usageIndex + 1 : 0

  for (let i = start; i < lines.length; i += 1) {
    const raw = lines[i]
    const line = raw.trim()
    if (!line) {
      continue
    }

    if (/^[A-Za-z][A-Za-z ]+:\s*$/.test(line) && isKnownSectionHeading(line)) {
      continue
    }

    if (/^\s*usage\s*:/i.test(line)) {
      continue
    }

    if (line.startsWith('-')) {
      continue
    }

    if (usageIndex >= 0 && /^\s/.test(raw)) {
      continue
    }

    return line
  }

  return undefined
}

export class HeuristicParser implements CLIParser {
  public readonly name = 'heuristic'

  detect(helpText: string): boolean {
    void helpText
    return true
  }

  parse(helpText: string): ParsedCommand {
    const lines = helpText.split(/\r?\n/)
    const optionsRanges = sectionRangesByMatcher(lines, (heading) =>
      /(^|\s)(options|flags)($|\s)/i.test(heading),
    )
    const commandRanges = sectionRangesByMatcher(lines, (heading) => /command/i.test(heading))

    const optionsLines = collectSectionLines(lines, optionsRanges)
    const sectionCommandLines = collectSectionLines(lines, commandRanges)
    const fallbackCommandLines = lines.filter((line) => /^\s{2,}[A-Za-z0-9][\w:-]*\s{2,}.+$/.test(line))

    const subcommands = parseSubcommands(sectionCommandLines)
    const parsedSubcommands = subcommands.length > 0 ? subcommands : parseSubcommands(fallbackCommandLines)

    const legacyOptionsRange = sectionRange(lines, 'Options') ?? sectionRange(lines, 'Flags')
    const legacyOptionsLines = legacyOptionsRange ? lines.slice(legacyOptionsRange[0], legacyOptionsRange[1]) : []
    const parsedOptions = parseOptions(optionsLines.length > 0 ? optionsLines : legacyOptionsLines)

    return {
      name: extractName(lines),
      description: extractDescription(lines),
      usage: extractUsage(lines),
      options: parsedOptions,
      subcommands: parsedSubcommands,
    }
  }
}

export const heuristicParser = new HeuristicParser()
