import { DataError } from './Errors'
import type { FieldType } from './Field'

/**
 * Detects the column type by gradually narrowing down the set of possible
 * data types while textual raw data is loaded (for example from CSV).
 *
 * One instance is created for each Column of a Table on construction.
 * The detected type is used on Table preparation, then the type detector
 * instance is destroyed when the Column instance gets replaced.
 *
 */
export class TypeDetector {
  private seenAny = false
  private seenOnlyIntegers = true

  check(value: string): void {
    this.seenAny = true

    if (!this.seenOnlyIntegers) {
      return
    }

    this.seenOnlyIntegers = /^[0-9]+$/.test(value)
  }

  get detectedType(): FieldType {
    if (!this.seenAny) {
      throw new DataError('Cannot detect column type without data')
    }

    return this.seenOnlyIntegers ? 'bigint' : 'string'
  }
}
