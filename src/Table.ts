import { Column } from './Column'
import { DataError } from './Errors'
import { getFieldParser } from './Field'
import type { FieldParser, Row } from './Field'

/**
 * Represents a data table (recordset)
 *
 * Use cases:
 * - Unprepared table to load CSV data into, the columns collect information for data type detection
 * - Prepared table ready to be queried, the columns contain the data in their respective types
 * - Query result with the projected columns of known data types and the output rows of the query
 *
 * It is possible to feed a query result into a new Engine object to run further queries.
 *
 */
export class Table {
  // Columns of the table
  columns: Column[]

  // Data rows
  rows: Row[]

  // False: The table is receiving data, column types has not been detected, data has not been converted
  // True: The table has been prepared by an Engine, data types are detected, data has been converted
  // A table should not be modified once prepared.
  prepared: boolean

  constructor(columnNames: string[]) {
    this.columns = columnNames.map((name, position) => new Column(name, position))
    this.rows = []
    this.prepared = false
  }

  /**
   * Appends a new data row to the table from textual (CSV) source.
   *
   * @param row Row to append, must contain only string fields, the number of fields must match the number of columns
   * @throw DataError On trying to feed a row with the incorrect number of fields or into a prepared table
   */
  pushRow(row: string[]) {
    if (this.prepared) {
      throw new DataError('Table has already been prepared, no new rows can be loaded')
    }

    if (row.length !== this.columns.length) {
      throw new DataError(
        `The number of fields in the row (${row.length}) does not ` +
          `match the number of columns in the table (${this.columns.length})`,
      )
    }

    this.rows.push(row)

    for (const column of this.columns) {
      column.typeDetector.check(row[column.position])
    }
  }

  /**
   * Prepares the table before use by a query engine.
   *
   * - Detects column types based on the data loaded.
   * - Converts data in the columns which are not strings.
   *
   * This method does NOT create any search indexes.
   * They are created inside the Engine instance during statement preparation.
   *
   * Table columns and data contents should not be changed once the table is prepared.
   * There is no way to "unprepare" a table.
   *
   */
  prepare() {
    if (this.prepared) {
      return
    }

    this.detectColumnTypes()
    this.convertColumns()

    this.prepared = true
  }

  /**
   * Finds a column by name.
   *
   * It is a linear scan for simplicity, because we don't expect
   * too many (>1000) columns in a table.
   * It could be optimized by building a Map on table preparation
   * at the expense of slightly higher memory consumption.
   *
   * @param columnName Column name to look for
   * @return Column instance if found, otherwise undefined
   */
  findColumnByName(columnName: string): Column | undefined {
    return this.columns.find((column) => column.name == columnName)
  }

  private detectColumnTypes(): void {
    // Column instances are replaced with new ones, containing the detected type.
    // They don't have a type detector anymore.
    const columns = this.columns.map(
      (column: Column) => new Column(column.name, column.position, column.typeDetector.detectedType),
    )
    this.columns.splice(0, this.columns.length, ...columns)
  }

  private convertColumns() {
    for (const column of this.columns) {
      const parser = getFieldParser(column.type)

      // No need to convert string valued columns
      if (parser !== undefined) {
        this.convertColumn(column.position, parser)
      }
    }
  }

  private convertColumn(position: number, parser: FieldParser) {
    for (const row of this.rows) {
      row[position] = parser(row[position])
    }
  }
}
