# Prisma Core Take Home Challenge

_Viktor Ferenczi, January 2025_

## How to run

`npm install`

Downloads the project dependencies. Run this command before any other.

`npm run example`

Script: `scripts/example.ts`

1. The script loads `regions.csv`
2. Executes a simple query: `PROJECT id, name FILTER id > 3`
3. Saves the result to `result.csv`
4. Prints the result on the console

`npm run test`

- Runs all the test cases
- Reads test data files from `src/__tests__/input`
- Writes actual output into `src/__tests__/actual` for easy investigation
- Uses expected output from `src/__tests__/expected` for verification in the end-to-end tests

Developed and tested on `node-v20.18.2-x64` on Windows 11 Pro.

## Usage

1. Create a `Table` instance by either loading data or building it.
2. Create an `Engine` instance for the table.
3. Call `engine.prepare` with your query statement, it returns a `Query` object.
4. Call `engine.execute` to run the prepared query, it returns a `Table` with the results.
5. Use the helper functions to save the result into a CSV file or print on the console.

## Implementation details

- [Parser generator](https://peggyjs.org)
- [Online grammar editor](https://peggyjs.org/online)
- [Query grammar](src/grammar/README.md)
- [RedBlackTree](https://data-structure-typed-docs.vercel.app/classes/RedBlackTree.html)
- [Test data](https://github.com/dr5hn/countries-states-cities-database/tree/master/csv)

## Simplifying assumptions

### CSV format

- Default CSV format as supported by the `csv` package.
- UTF-8 encoding, however it is a parameter of the file storage functions.
- The CSV files used for testing all start with a header row defining the column names, however the code allows for programmatic column names.
- Column names must conform to a reasonable identifier format, therefore arbitrary Unicode letters are disallowed: `/^[_A-Z][0-9_A-Z]*$/i`
- Only the `[0-9]` ASCII digits are considered for integer columns. Normalizing all digits from different languages would need much more work.

### Query syntax

- The query syntax is case-sensitive, including the keywords and column names.
- There is no support for query parameters (placeholders), therefore the queries have to prepared again even if changing only literal values.
- Any white-space, tab and newline character is allowed anywhere in the query syntax where white-space is required.
- Whitespace around the operators and literals is optional, but required before/after keywords.

### Query execution

- No Unicode normalization is applied to the data.
- The default collation is used while comparing and sorting string field values, also for the column index.
- The solution is optimized for loading the data into memory once, then running many prepared queries.
- Column indexes are created on demand while preparing queries, each column index is created only once.

### In-memory representation

- Integer values can be arbitrarily large, therefore they are stored as `bigint` instances.
- Once a table is fully loaded and prepared its contents must not be changed.
- There is one object in memory for each data field loaded, therefore the solution is not memory optimized and GC heavy.

## Trade-offs

While these trade-offs don't matter much for small data sets, they could make a big difference
as the amount of data loaded is approaching or exceeding the memory available for the runtime.

### Time

- Traded some code complexity in favor of column search indexes (binary trees) instead of relying on slow linear scan.
- The [RedBlackTree](https://data-structure-typed-docs.vercel.app/classes/RedBlackTree.html) data structure is used to implement the column indexes due to its fast insertion time. While an [AVLTree](https://data-structure-typed-docs.vercel.app/classes/AVLTree.html) may be faster to run range queries it would be slower to initialize.

### Space

- Used the streaming API for loading data from CSV instead of loading the whole file into memory, which consumes less memory and most likely faster due to improved cache consistency.
- Used the memory suboptimal, GC heavy approach of storing each data field loded as its separate object in favor of lower code complexity.

## Improvements

### Functionality

I would implement the following functionality in this order:

#### Query parameter

Consider the following queries:

- `PROJECT id, name FILTER id > 3`
- `PROJECT id, name FILTER id > 5`

The only difference is the literal value in the condition, but
the query has to be prepared again to run with a different value.
It requires reparsing almost the same query, which is a waste of time.
Using string substitution for this is error-prone and a well-known security anti-pattern.

The solution is to add support for query parameters in the syntax and on the `execute` call:

Statement:

Execute:

```
const query = engine.prepare("PROJECT id, name FILTER id > ?");
const result3 = engine.execute(query, 3);
const result5 = engine.execute(query, 5);
```

It needs minimal changes to the grammar and to the code accessing `query.condition.literal`.

#### Data types

For real-world use a few more common data types would be required:

- `boolean`
- `date` with configurable format, defaulting to the date part of ISO 8601
- `datetime` with configurable format, defaulting to ISO 8601 with time zone
- `number` to support floating point numbers, like geolocation and distances
- `decimal` to support fixed precision numbers, like prices

Implementing the above would mean extending the `TypeDetector` and providing the required field parsers.

The boolean type would require a bitmap index for a memory efficient implementation.

The type detection needs to be configurable, so developers don't have to work around it.

#### Operators

All conditional operators in the filter. It would need extending the `Operator` type, then following
the TypeScript compiler's error messages to the missing `switch` cases and implementing all of them.
The grammar would also need to be extended.

#### Conditional expressions

Full support for composite `FILTER` expressions. The grammar needs to be extended to provide an AST
of the conditional terms and support grouping in braces. All code handling `query.condition` needs
to be extended to walk the AST and process it accordingly. Preparing a single query potentially
needs creating multiple column indexes.

#### Database

A `Database` object would contain multiple `Table` instances, allowing for relational queries.
Each `Engine` would connect to a `Database` instance instead of a single table.

Tables can be added at runtime, for example temporary tables from resulting from queries or calculations.
Formal support for adding tables from computed data, so application code can produce data easily.

The query syntax would be extended with a leading `FROM` keyword to identify the source table(s).
For example to get the items of all receipts on a given day one could write:

```
FROM receipt, item
PROJECT item.receipt_id, item.item_number, item.amount, item.description
FILTER item.receipt_id = receipt.id AND receipt.date = ?
```

The `FROM` keyword is the first clause, so any future code intelligence tool would know which tables are
used before referencing any columns. It would be a great improvement over the classic SQL syntax.
For example Microsoft's LINQ (sequence processing in C# with SQL like syntax) is using this approach.

Implement the `AS` keyword to allow for renaming source tables and disambiguate the name of output columns.
Prohibit duplicate column names. Result tables must have valid column names, so they can be used in a subsequent query.

It would need extending the grammar by the `FROM` clause the optional table reference in column names.
I suggest requiring the table reference in all column references if multiple source tables are listed.
It would help avoiding any future name collisions as new columns are added to the existing tables.

#### Result ordering

The grammar would be extended with an `ORDER` clause. For example:

```
FROM receipt, item
PROJECT item.receipt_id, item.item_number, item.amount, item.description
FILTER item.receipt_id = receipt.id AND receipt.date = ?
ORDER -item.receipt_id, item.sequence_number
```

Putting a `-` sign in front of the column reference would reverse the ordering over that column.

The ordering would be implemented at the end of the `execute` call by sorting `result.rows`.
Most likely running a quicksort on the result set is the simplest solution. However, it
could be optimized by using the column index for the first `ORDER` column if we happen
to have that index already created.

#### Explain query

Gather statistics on query execution and make it available via an `explain` method.
It does all the planning, but does not actually provide a result set.
Instead, it returns the query plan and statistics.
This information will help developers in optimizing their queries.

#### Features not to implement

- Arithmetic, window functions, grouping, stored functions and procedures: These can be implemented by application code.
- More complex data types: They can be stored separately in more suitable storage and referenced by some ID.
- Full column statistics (histogram) and complex query planning: Developers are supposed to simplify or split complex queries.

### Optimization

Once the algorithmic complexity is got right, the worst remaining enemy of performance is excessive memory allocation.
It is usually a combination of frequent, unnoticed memory allocations which often involves a lot of data copying.

Often overlooked, frequent sources of these allocations:

- Closure allocation (language feature)
- Array reallocation on extending their size (implementation detail)
- Copying due to reading files into memory (not using memory mapped files)
- High GC load due to the large number of objects allocated (modern generational GC helps a lot, but not infinitely)

#### Query planner

This becomes relevant once complex `FILTER` expressions are implemented.

The existing search indexes already provide the minimum and maximum values for each indexed column.
Some simple query planning can eliminate any unnecessary computation based on that information.

Any condition which is known to be always true or false for all rows does not need to be executed.
Such trivial results should be checked first before evaluating any other condition, so they turn
into constants which can be lowered along the expression tree to minimize the work need to be done.

#### Query parallelism

Since the source tables and column indexes are read-only, they can be used from multiple threads at the same time.
The evaluation of a `FILTER` expression tree opens up some room for parallelism without having to use excessive
synchronization. Whether to use parallelism or not should be decided by the query plan. Sorting the result set
could be made mostly parallel if it contains enough rows to be worth the complication.

#### Data loading, in-memory layout

These changes should allow for operating on large data files, potentially exceeding the size of the memory
available for the runtime. The number of in-memory objects visible to the GC will be much lower while having
better cache consistency. All these are the expense of some on-demand loading and parsing (recomputation).

- Use memory mapping instead of regularly reading the file. However, it would make the code platform dependent, so this has to be optional.
- Estimate the row count before loading any data. Count the first 1000 rows, then estimate based on file size and current offset.
- Preallocate an array and store the file offset of each data row for later reference by a zero based row index.
- Load rows and parse any non-string field values on demand. This is the recomputation we have to pay for saving memory.
- Add an optional cache of parsed rows to help with narrow repeated queries. Limit the cache size by randomly removing items once a maximum memory consumption is reached.
- Column indexes should still be created in-memory for performance.
- Column indexes must store zero based row indices instead of (references to) entire rows.

This optimization works only for the data loaded from disk. It does not work for in-memory temporary tables,
which are result from former queries or built by application code. However, some kind of compression may be
possible in those cases as well, but it would likely conflict with the OS provided memory compression features.

## Production readiness

In order to make this code production ready the following steps need to be done:

1. Package for distribution via `npm`, use a unique namespace for the module.
2. Build a few simple example applications. Doing so would verify that no essential features were missed.
3. Add tests to reach 100% branch coverage, including any error handling clauses as well.
4. Make sure no lint errors and warnings remain in the code.
5. Normalize code formatting to minimize future diffs.
6. Add the necessary CI/CD configuration and scripts to test PRs and build releases automatically on merge.
7. Make sure that it runs on the latest stable language versions and interoperable with the latest stable library versions.
8. Make sure no package versions with known critical security issues are used. Update the dependency versions as needed.
9. Generate documentation from the docstrings in the source code. Add any necessary explanation and a straightforward summary of features at the top. Reference the example applications as well.
10. Introduce a script to automatically publish the documentation on each new release.
11. Set up a support channel to receive bug reports and feature suggestions. GitHub issues or similar. Discord channel for discussion.
