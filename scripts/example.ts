import { Engine } from '../src/Engine'
import { loadCsvWithHeader, saveCsvWithHeader } from '../src/CsvStorage'
import { printCsvWithHeader } from '../src/CsvPrinter'

loadCsvWithHeader('scripts/regions.csv').then((table) => {
  const engine = new Engine(table)

  const query = engine.prepare('PROJECT id, name FILTER id > 3')
  const result = engine.execute(query)

  saveCsvWithHeader(result, 'scripts/result.csv').then(() => {
    printCsvWithHeader(result)
  })
})
