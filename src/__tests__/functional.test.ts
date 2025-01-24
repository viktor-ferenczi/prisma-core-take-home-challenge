import { Engine } from '../Engine'
import { loadTable } from './testTools'

describe('functional', () => {
  test('table-columns', async () => {
    const table = await loadTable('small')
    expect(table.columns.map((column) => column.name)).toStrictEqual(['id', 'name', 'wikiDataId'])
  })

  test('result-column-count', async () => {
    const table = await loadTable('small')
    const engine = new Engine(table)

    expect(engine.execute(engine.prepare('PROJECT id FILTER id = 0')).columns.length).toBe(1)
    expect(engine.execute(engine.prepare('PROJECT id FILTER id = 1')).columns.length).toBe(1)

    expect(engine.execute(engine.prepare('PROJECT name, id FILTER id = 0')).columns.length).toBe(2)
    expect(engine.execute(engine.prepare('PROJECT id, name FILTER id = 1')).columns.length).toBe(2)

    expect(engine.execute(engine.prepare('PROJECT id, name, wikiDataId FILTER id > 1')).columns.length).toBe(3)
  })

  test('result-row-count', async () => {
    const table = await loadTable('small')
    const engine = new Engine(table)

    expect(engine.execute(engine.prepare('PROJECT name FILTER id = 0')).rows.length).toBe(0)
    expect(engine.execute(engine.prepare('PROJECT name FILTER id = 1')).rows.length).toBe(1)
    expect(engine.execute(engine.prepare('PROJECT name FILTER id > 4')).rows.length).toBe(2)
  })

  test('result-row-count-long', async () => {
    const table = await loadTable('unicode')
    const engine = new Engine(table)

    expect(engine.execute(engine.prepare('PROJECT name FILTER id > 0')).rows.length).toBe(300)
    expect(engine.execute(engine.prepare('PROJECT name FILTER id > 100')).rows.length).toBe(249)
  })
})
