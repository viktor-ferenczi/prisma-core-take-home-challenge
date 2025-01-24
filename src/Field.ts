// Accepted field types for compilation
export type Field = string | bigint

// Accepted filed type names for runtime use
export type FieldType = 'string' | 'bigint'

// Parser to convert field values
export type FieldParser = (string) => Field

// Database row (defined here to reduce module dependencies)
export type Row = Field[]

/**
 * Returns a function to convert textual field values to their in-memory representation.
 * If the field type is string, then undefined is returned, since no parsing is required.
 * It eliminates the unnecessary runtime load of an identity function. (Minor optimization.)
 *
 * @param type Field type (same for the whole column)
 * @return Field parser, undefined if no parsing is required (string type)
 */
export function getFieldParser(type: FieldType): FieldParser | undefined {
  switch (type) {
    case 'string':
      return undefined

    case 'bigint':
      return (value: string) => BigInt(value)

    default:
      return type // never
  }
}
