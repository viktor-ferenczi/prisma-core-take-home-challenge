import type { Field } from './Field'

/**
 * Parsed query
 *
 * Its structure must match the object returned
 * by the parser generated from the grammar.
 *
 */
export interface Query {
  columns: string[]
  condition: Condition
}

export interface Condition {
  column: string
  operator: Operator
  literal: Field
}

type Operator = '=' | '>'
