#!/usr/bin/env node

const args = process.argv.slice(2)

function printRootHelp() {
  console.log(`doclix-fixture CLI

Usage:
  fixture [command]

Available Commands:
  config      Manage configuration
  user        Manage users

Global Flags:
  -h, --help  Show help
`)
}

function printConfigHelp() {
  console.log(`Manage configuration values

Usage:
  fixture config [command]

Commands:
  set         Set a key value
  get         Get a key value
`)
}

function printUserHelp() {
  console.log(`Manage users

Usage:
  fixture user [command]

Commands:
  list        List users
`)
}

if (args.includes('--help')) {
  if (args[0] === 'config') {
    printConfigHelp()
    process.exit(0)
  }

  if (args[0] === 'user') {
    printUserHelp()
    process.exit(0)
  }

  printRootHelp()
  process.exit(0)
}

process.exit(0)
