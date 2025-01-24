import { mkdirSync, readFileSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { loadCsvWithHeader, saveCsvWithHeader } from '../CsvStorage'
import type { Table } from '../Table'

const testsDir = 'src/__tests__'
const inputDir = `${testsDir}/input`
const actualDir = `${testsDir}/actual`
const expectedDir = `${testsDir}/expected`

mkdirSync(actualDir, { recursive: true, mode: 0o664 })

export function formatActualPath(suite: string, name: string) {
  return `${actualDir}/${suite}.${name}.csv`
}

export function formatExpectedPath(suite: string, name: string) {
  return `${expectedDir}/${suite}.${name}.csv`
}

export async function loadTable(name: string) {
  return await loadCsvWithHeader(`${inputDir}/${name}.csv`)
}

export async function saveResult(suite: string, name: string, result: Table) {
  await saveCsvWithHeader(result, `${actualDir}/${suite}.${name}.csv`)
}

export async function hasSameContent(suite: string, name: string, encoding: BufferEncoding = 'utf-8'): Promise<void> {
  const [expected, actual] = await Promise.all([
    readFile(formatExpectedPath(suite, name), encoding),
    readFile(formatActualPath(suite, name), encoding),
  ])
  expect(normalizeNewlines(actual)).toStrictEqual(normalizeNewlines(expected))
}

function normalizeNewlines(text: string): string {
  return text.replaceAll(/\r\n/g, '\n')
}
