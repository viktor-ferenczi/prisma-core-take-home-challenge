import { TypeDetector } from './TypeDetector'
import type { Field, FieldType } from './Field'
import { DataError } from './Errors'

/**
 * Represents a table column.
 *
 * While loading CSV rows the typeDetector is defined and type is undefined.
 * Once the table is prepared the type is defined and typeDetector is undefined.
 *
 */
export class Column {
  public readonly typeDetector: TypeDetector

  constructor(
    // Name of the column
    public readonly name: string,

    // Position of the column in the table (zero based index)
    public readonly position: number,

    // Type once detected, otherwise undefined
    public readonly type?: FieldType,
  ) {
    // The column name must be a valid identifier
    if (!/^[_A-Z][0-9_A-Z]*$/i.test(name)) {
      throw new DataError(`Invalid column name "${name}"`)
    }

    // Create a type detector for raw data (CSV) loading
    if (type === undefined) {
      this.typeDetector = new TypeDetector()
    }
  }

  /**
   * Checks whether the literal value passed has the exact same time as the column.
   */
  hasSameTypeAs(field: Field): boolean {
    return (typeof field as FieldType) === this.type
  }
}
