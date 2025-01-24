import { parse, transform, stringify } from 'csv'
import { pipeline } from 'node:stream/promises'
import { Readable } from 'node:stream'
import { Table } from './Table'
import * as fs from 'node:fs'

/**
 * Loads a CSV file into memory. Expects a header row containing the column names.
 *
 * @param path Path to the CSV file
 * @param encoding Character encoding of the CSV file [utf-8]
 * @return Table with the data loaded (not prepared)
 */
export async function loadCsvWithHeader(path: string, encoding: BufferEncoding = 'utf-8'): Promise<Table> {
  let table: Table
  await pipeline(
    fs.createReadStream(path, encoding),
    parse(),
    transform((row) => {
      if (table === undefined) {
        table = new Table(row)
      } else {
        table.pushRow(row)
      }
    }),
  )
  return table
}

/**
 * Writes a CSV file with a header row containing the column names, then all rows of the table.
 *
 * @param table Table to save to disk
 * @param path Path to the CSV file (will be overwritten if exists)
 * @param encoding Character encoding of the CSV file [utf-8]
 */
export async function saveCsvWithHeader(table: Table, path: string, encoding: BufferEncoding = 'utf-8'): Promise<void> {
  const header = table.columns.map((column) => column.name)

  const stream = Readable.from(
    (async function* () {
      yield* Readable.from([header])
      yield* Readable.from(table.rows)
    })(),
  )

  await pipeline(stream, stringify(), fs.createWriteStream(path, encoding))
}
