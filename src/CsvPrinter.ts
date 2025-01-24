import { Readable } from 'node:stream'
import { stringify } from 'csv'
import type { Table } from './Table'
import type { Row } from './Field'

/**
 * Prints a header row containing the column names, then all rows of the table in CSV format.
 *
 * @param table Table to print
 */
export function printCsvWithHeader(table: Table): void {
  const header = table.columns.map((column) => column.name)
  printCsv([header])
  printCsv(table.rows)
}

function printCsv(rows: Row[]): void {
  Readable.from(stringify(rows)).pipe(process.stdout)
}
