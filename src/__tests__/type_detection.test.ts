import { Engine } from '../Engine'
import { loadTable } from './testTools'
import type { FieldType } from '../Field'

async function testTypeDetection(name: string, expectedTypes: FieldType[]): Promise<void> {
  const table = await loadTable(name)

  expect(table.prepared).toBeFalsy()
  for (const column of table.columns) {
    expect(column.type).toBeUndefined()
  }

  const engine = new Engine(table)
  engine.prepare('PROJECT id FILTER id = 0')

  expect(table.prepared).toBeTruthy()
  const columnTypes = table.columns.map((column) => column.type)
  expect(columnTypes).toStrictEqual(expectedTypes)
}

describe('type-detection', () => {
  test('small', async () => {
    await testTypeDetection('small', ['bigint', 'string', 'string'])
  })

  test('bigint', async () => {
    await testTypeDetection('bigint', ['bigint', 'string', 'string'])
  })
})
