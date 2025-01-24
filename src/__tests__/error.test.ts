import { Engine } from '../Engine'
import { loadTable } from './testTools'
import { DataError, InvalidQueryError } from '../Errors'

describe('error', () => {
  test('syntax', async () => {
    const table = await loadTable('small')
    const engine = new Engine(table)

    expect(() => engine.prepare('')).toThrow(InvalidQueryError)
    expect(() => engine.prepare('PROJECT FILTER')).toThrow(InvalidQueryError)
    expect(() => engine.prepare('PROJECT id FILTER')).toThrow(InvalidQueryError)
    expect(() => engine.prepare('PROJECT FILTER id = 1')).toThrow(InvalidQueryError)
    expect(() => engine.prepare('PROJECT id name FILTER id = 1')).toThrow(InvalidQueryError)
    expect(() => engine.prepare('PROJECTid,nameFILTERid=1')).toThrow(InvalidQueryError)
    expect(() => engine.prepare('PROJECT id,nameFILTERid=1')).toThrow(InvalidQueryError)
    expect(() => engine.prepare('PROJECT id,name FILTERid=1')).toThrow(InvalidQueryError)

    engine.prepare('PROJECT id,name FILTER id=1')
    engine.prepare('PROJECT id,name FILTER id=1 ')
    engine.prepare(' PROJECT id,name FILTER id=1 ')
    engine.prepare('\tPROJECT id,name FILTER id=1\t')
    engine.prepare('\nPROJECT id,name FILTER id=1\n')
    engine.prepare('\nPROJECT\tid,name FILTER id=1\n')
    engine.prepare('\nPROJECT\tid,name\nFILTER id=1\n')
    engine.prepare('\nPROJECT\tid,name\nFILTER\t\nid=1\n')
  })

  test('column-name', async () => {
    const table = await loadTable('small')
    const engine = new Engine(table)

    expect(() => engine.prepare('PROJECT invalidColumnName FILTER id = 1')).toThrow(InvalidQueryError)
    expect(() => engine.prepare('PROJECT name FILTER invalidColumnName = 1')).toThrow(InvalidQueryError)
  })

  test('literal-type', async () => {
    const table = await loadTable('small')
    const engine = new Engine(table)

    expect(() => engine.prepare('PROJECT id FILTER id = "x"')).toThrow(InvalidQueryError)
    expect(() => engine.prepare('PROJECT id FILTER name = 1')).toThrow(InvalidQueryError)
  })

  test('invalid-column-name', async () => {
    try {
      await loadTable('invalid')
      throw new Error('Invalid column name not detected')
    } catch (e) {
      expect(e instanceof DataError).toBeTruthy()
    }
  })
})
