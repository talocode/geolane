#!/usr/bin/env node
import {
  runGeoAudit,
  runCrawlerAccess,
  runLlmsTxt,
  runCitationReadiness,
  runCompare,
  getGeoLanePricing,
  getGeoLaneCapabilities,
  analyzeCitationReadiness,
  scoreLlmsTxt,
  generateLlmsTxt,
  parseRobotsForBot,
} from './engine.js'

function usage(): never {
  console.error(`GeoLane — AI Search Visibility Intelligence

Usage:
  geolane audit --url <url>
  geolane crawlers --url <url>
  geolane llms-txt --url <url>
  geolane citation --url <url>
  geolane compare --a <url> --b <url>
  geolane pricing
  geolane capabilities
  geolane --help
`)
  process.exit(1)
}

function parseArgs(): Record<string, string> & { command: string } {
  const args = process.argv.slice(2)
  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') usage()
  const command = args[0]
  const parsed: Record<string, string> = {}
  for (let i = 1; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].slice(2)
      const val = args[i + 1]
      if (val && !val.startsWith('--')) {
        parsed[key] = val
        i++
      } else {
        parsed[key] = 'true'
      }
    }
  }
  return { command, ...parsed }
}

async function main() {
  try {
    const args = parseArgs()
    const { command } = args

    switch (command) {
      case 'audit': {
        if (!args.url) {
          console.error('Error: --url is required')
          process.exit(1)
        }
        const result = await runGeoAudit(args.url)
        process.stdout.write(JSON.stringify(result, null, 2) + '\n')
        break
      }
      case 'crawlers': {
        if (!args.url) {
          console.error('Error: --url is required')
          process.exit(1)
        }
        const result = await runCrawlerAccess(args.url)
        process.stdout.write(JSON.stringify(result, null, 2) + '\n')
        break
      }
      case 'llms-txt': {
        if (!args.url) {
          console.error('Error: --url is required')
          process.exit(1)
        }
        const result = await runLlmsTxt(args.url)
        process.stdout.write(JSON.stringify(result, null, 2) + '\n')
        break
      }
      case 'citation': {
        if (!args.url) {
          console.error('Error: --url is required')
          process.exit(1)
        }
        const result = await runCitationReadiness(args.url)
        process.stdout.write(JSON.stringify(result, null, 2) + '\n')
        break
      }
      case 'compare': {
        if (!args.a || !args.b) {
          console.error('Error: --a and --b are required')
          process.exit(1)
        }
        const result = await runCompare(args.a, args.b)
        process.stdout.write(JSON.stringify(result, null, 2) + '\n')
        break
      }
      case 'pricing': {
        process.stdout.write(JSON.stringify(getGeoLanePricing(), null, 2) + '\n')
        break
      }
      case 'capabilities': {
        process.stdout.write(JSON.stringify(getGeoLaneCapabilities(), null, 2) + '\n')
        break
      }
      default:
        usage()
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`Error: ${message}`)
    process.exit(1)
  }
}

// Keep pure offline helpers reachable for advanced use (tree-shaken from CLI output)
void analyzeCitationReadiness
void scoreLlmsTxt
void generateLlmsTxt
void parseRobotsForBot

main()
