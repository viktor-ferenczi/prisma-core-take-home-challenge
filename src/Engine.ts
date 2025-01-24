import { parse, SyntaxError } from './grammar/query'
import { ColumnIndex } from './ColumnIndex'
import { InvalidQueryError } from './Errors'
import type { Query, Condition } from './Query'
import type { Table } from './Table'
import type { Row } from './Field'

/**
 * Simple query engine
 *
 * Allows for running simple projection with filtering queries on a single table.
 *
 * The engine prepares the table (detecting column types, converting values as needed)
 * the first time a query statement is prepared.
 *
 * Queries expected to be prepared before use. Search indexes are dynamically created
 * as required by the filter conditions found during query preparation.
 *
 */
export class Engine {
  // Table to query
  private readonly table: Table

  // Dynamically created column indexes by column name (created only once for each column)
  private readonly indexes: Map<string, ColumnIndex>

  constructor(table: Table) {
    this.table = table
    this.indexes = new Map<string, ColumnIndex>()
  }

  /**
   * Prepares a query statement.
   *
   * Parses the statement, validates it and creates the column index the filter
   * condition will use if the index does not exist yet.
   *
   * Supported query syntax:
   * PROJECT column1, column2, ... FILTER column = literal
   * PROJECT column1, column2, ... FILTER column > literal
   *
   * The column names must match the column names of the table used by the engine.
   * The data type of the literal value must match the filter column's data type.
   *
   * InvalidQueryError will be thrown on syntax error or if any of the above assuptions fail.
   * DataError will be thrown if the type of the columns in the table cannot be detected.
   *
   * @param statement Query statement (text) according to the supported syntax
   * @return Prepared query (valid for execution on the same Engine instance)
   * @throw InvalidQueryError
   * @throw DataError
   */
  prepare(statement: string): Query {
    this.table.prepare()

    try {
      const query = parse(statement, { grammarSource: 'query' }) as Query
      this.validateQuery(query)
      this.prepareIndex(query.condition)
      return query
    } catch (e) {
      if (e instanceof SyntaxError) {
        throw new InvalidQueryError(e.format([{ source: 'query', text: statement }]))
      }
      throw e
    }
  }

  private validateQuery(query: Query): void {
    for (const columnName of query.columns) {
      if (this.table.findColumnByName(columnName) === undefined) {
        throw new InvalidQueryError(`Invalid column name "${columnName}"`)
      }
    }
  }

  private prepareIndex(condition: Condition): void {
    const name = condition.column

    const column = this.table.findColumnByName(name)
    if (column === undefined) {
      throw new InvalidQueryError(`Invalid column name "${name}"`)
    }

    if (!column.hasSameTypeAs(condition.literal)) {
      throw new InvalidQueryError(`Condition on column "${name}" uses an incompatible literal`)
    }

    let index = this.indexes.get(name)
    if (index === undefined) {
      index = new ColumnIndex(column, this.table.rows)
      this.indexes.set(name, index)
    }
  }

  /**
   * Executes a prepared query
   *
   * The query must be executed on the same Engine instance it was prepared on.
   * Currently, this is not verified at runtime, so be careful while using multiple engines.
   *
   * If you want to run further queries on the Table returned, then create a new Engine instance
   * for that table and prepare separate queries there. This engine cannot be used to query the
   * resulting Table object.
   *
   * @param query The prepared query to execute
   * @return Table with the query results
   */
  execute(query: Query): Table {
    const matchingRows = this.findRows(query)
    const [columns, projectedRows] = this.projectRows(matchingRows, query.columns)
    return {
      columns: columns,
      rows: projectedRows,
      prepared: true,
    } as Table
  }

  private findRows(query: Query): Row[] {
    const condition = query.condition
    const index = this.indexes.get(condition.column)

    switch (condition.operator) {
      case '=':
        return index.search(condition.literal)

      case '>':
        return index.search_gt(condition.literal)

      default:
        return condition.operator // never
    }
  }

  private projectRows(matchingRows: Row[], queryColumns: string[]) {
    const projectedColumns = queryColumns.map((name) => this.table.findColumnByName(name))
    const positions = projectedColumns.map((column) => column.position)
    const projectedRows = matchingRows.map((row) => positions.map((pos) => row[pos]))
    return [projectedColumns, projectedRows]
  }
}
