import { Engine } from '../Engine'
import { hasSameContent, loadTable, saveResult } from './testTools'

const suite = 'end-to-end'

async function testEndToEnd(name: string, statement: string): Promise<void> {
  const table = await loadTable(name)
  const engine = new Engine(table)

  const query = engine.prepare(statement)
  const result = engine.execute(query)
  await saveResult(suite, name, result)

  await hasSameContent(suite, name)
}

describe(suite, () => {
  test('small', async () => {
    await testEndToEnd('small', 'PROJECT wikiDataId, id, name FILTER wikiDataId > "Q460"')
  })

  test('bigint', async () => {
    await testEndToEnd(
      'bigint',
      'PROJECT id, name FILTER id > ' + '55555555555555555555555555555555555555555555555555555555555555555555555555554',
    )
  })

  test('unicode', async () => {
    await testEndToEnd('unicode', 'PROJECT name FILTER name > "Këlcyrë"')
  })
})
