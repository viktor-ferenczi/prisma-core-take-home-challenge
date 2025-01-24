import { Range, RedBlackTree } from 'data-structure-typed'
import type { Column } from './Column'
import type { Field, Row } from './Field'

/**
 * Search index for a single column
 */
export class ColumnIndex<K extends Field = Field> {
  // Red-Black tree with O(log(N)) time complexity for insertion and lookup
  // Key: Distinct field values in the column
  // Value: List of rows with the same key value in table row order
  private readonly index: RedBlackTree<K, Row[]>

  constructor(
    private readonly column: Column,
    rows: Row[],
  ) {
    // Build the index from the table rows
    this.index = this.buildIndex(rows)
  }

  private buildIndex(rows: Row[]): RedBlackTree<K, Row[]> {
    const index = new RedBlackTree<K, Row[]>()

    // The field in each row is selected by the column position
    const position = this.column.position

    for (const row of rows) {
      const key = row[position] as K

      const entry = index.get(key)
      if (entry === undefined) {
        index.add(key, [row])
        continue
      }

      entry.push(row)
    }

    return index
  }

  /**
   * Search for an exact key (=)
   *
   * Returns all matching rows.
   * Returns an empty list if there are no matching rows.
   *
   * @param key Exact key to search for
   */
  search(key: K): Row[] {
    return this.filterRows(this.index.search(key) as K[])
  }

  /**
   * Search for a range of keys (>)
   *
   * Returns all rows with a key greater than the one specified.
   * Returns an empty list if there are no matching rows.
   *
   * @param key Key to use as a low mark for the search
   */
  search_gt(key: K): Row[] {
    const range = new Range<K>(key, this.index.getRightMost(), false, true)
    return this.filterRows(this.index.rangeSearch(range) as K[])
  }

  private filterRows(keys: K[]): Row[] {
    return keys.map((key) => this.index.get(key)).flat()
  }
}
