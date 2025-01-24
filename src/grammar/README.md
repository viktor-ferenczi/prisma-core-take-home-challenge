# Grammar

[Query grammar](query.pegjs)

Peggy parser generator: https://peggyjs.org

Online grammar editor: https://peggyjs.org/online

## Example query

```
PROJECT col1, col2 FILTER col3 > "value"
```

## Example parser output

```js
{
  columns: [
    'col1',
    'col2'
  ],
  condition: {
    column: 'col3',
    operator: '>',
    literal: '"value"'
  }
}
```

The structure of the returned object must match `Query` interface.

## Remarks

The `query.js` module is generated, please do not modify it.
It is committed into the repository for reference, should the
generated code change due to a new version of the `peggy` package.

No TypeScript types used in the grammar, so the online grammar editor can still be used.
