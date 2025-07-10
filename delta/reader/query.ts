import { CdfTableProvider, RawCursor, RawQueryBuilder } from "../native.js";
import { DeltaTable } from "../table.js";

/**
 * Query builder is an API that exposes Apache DataFusion SQL as a convenient
 * way to read from the table.
 * @experimental this API might be removed in the future, use at your own risk
 *
 * @example
 * ```ts
 * const table = new DeltaTable("...");
 * await table.load();
 *
 * const qb = new QueryBuilder().register("my_table", table);
 * const query = qb.sql("select * from my_table");
 *
 * await query.show();
 * ```
 */
export class QueryBuilder {
  /** @internal */
  private readonly qb: RawQueryBuilder;

  constructor() {
    this.qb = new RawQueryBuilder();
  }

  /**
   * Register the given {@link DeltaTable} into the DataFusion SessionContext using the provided `tableName`
   *
   * Once called, the provided `deltaTable` will be referenceable in SQL queries so long as
   * another table of the same name is not registered over it.
   */
  register(tableName: string, deltaTable: DeltaTable | CdfTableProvider): this {
    if (deltaTable instanceof DeltaTable) {
      this.qb.register(tableName, deltaTable._table);
    } else {
      this.qb.register(tableName, deltaTable);
    }
    return this;
  }

  /** Prepares the sql query to be executed. */
  sql(sqlQuery: string): CursorImpl {
    const rawCursor = this.qb.sql(sqlQuery);
    return new CursorImpl(rawCursor);
  }
}

// /**
//  * @experimental this API might be removed in the future, use at your own risk
//  */
// export interface Cursor {
//   /** Print the first 25 rows returned by the SQL query */
//   show(): Promise<void>;

//   /**
//    * Execute the given SQL command within the DataFusion SessionContext of this instance.
//    *
//    * @remarks
//    * The function returns the rows as a continuous, newline delimited, stream of JSON strings
//    * it is especially suited to deal with large results set.
//    */
//   stream(): ReadableStream<Buffer>;

//   /**
//    * Execute the given SQL command within the DataFusion SessionContext of this instance.
//    *
//    * @remarks
//    * Since this function returns a materialized JS Buffer,
//    * it may result unexpected memory consumption for queries which return large data
//    * sets.
//    */
//   fetchAll(): Promise<Buffer>;
// }

// export class Cursor {
//   constructor(readonly rawCursor: RawCursor) {}

//   /** Print the first 25 rows returned by the SQL query */
//   show(): Promise<void> {
//     console.log("showing cursor data", this.rawCursor);
//     return this.rawCursor.show();
//   }

//   /**
//    * Execute the given SQL command within the DataFusion SessionContext of this instance.
//    *
//    * @remarks
//    * The function returns the rows as a continuous, newline delimited, stream of JSON strings
//    * it is especially suited to deal with large results set.
//    */
//   stream(): ReadableStream<Buffer> {
//     return this.rawCursor.stream();
//   }

//   /**
//    * Execute the given SQL command within the DataFusion SessionContext of this instance.
//    *
//    * @remarks
//    * Since this function returns a materialized JS Buffer,
//    * it may result unexpected memory consumption for queries which return large data
//    * sets.
//    */
//   fetchAll(): Promise<Buffer> {
//     return this.rawCursor.fetchAll();
//   }
// }

/**
 * @experimental this API might be removed in the future, use at your own risk
 */
export interface Cursor {
  /** Print the first 25 rows returned by the SQL query */
  show(): Promise<void>;

  /**
   * Execute the given SQL command within the DataFusion SessionContext of this instance.
   *
   * @remarks
   * The function returns the rows as a continuous, newline delimited, stream of JSON strings
   * it is especially suited to deal with large results set.
   */
  stream(): ReadableStream<Buffer>;

  /**
   * Execute the given SQL command within the DataFusion SessionContext of this instance.
   *
   * @remarks
   * Since this function returns a materialized JS Buffer,
   * it may result unexpected memory consumption for queries which return large data
   * sets.
   */
  fetchAll(): Promise<Buffer>;
}

/** @internal */
export class CursorImpl implements Cursor {
  constructor(readonly rawCursor: RawCursor) {}

  show(): Promise<void> {
    return this.rawCursor.show();
  }

  stream(): ReadableStream<Buffer> {
    return this.rawCursor.stream();
  }

  fetchAll(): Promise<Buffer> {
    return this.rawCursor.fetchAll();
  }
}
