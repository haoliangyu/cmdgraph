#!/usr/bin/env node

import { execute } from '@oclif/core'

execute({ dir: import.meta.url }).catch((error) => {
  console.error(error)
  process.exit(1)
})