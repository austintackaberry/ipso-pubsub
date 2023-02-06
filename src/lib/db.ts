import { Pool, PoolClient, QueryResult } from "pg";

export const pool = new Pool({
  database: "postgres",
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
  port: 5432,
  ssl: false,
});

interface WhereKey {
  field: string;
  value: string;
}

export const batchUpsertWithClient = async <T extends Record<keyof T, any>>(
  data: T[],
  table: string,
  keys: WhereKey[],
  client: PoolClient
) => {
  const where = keys.reduce((acc, { field, value }, i) => {
    const isLastElement = i === keys.length - 1;
    if (isLastElement) {
      return `${acc} ${field} = $${i + 1}`;
    }
    return `${acc} ${field} = $${i + 1} AND`;
  }, "WHERE ");
  await client.query(
    `DELETE FROM ${table} ${where}`,
    keys.map((k) => k.value)
  );
  let counter = 1;
  let copyResult;
  if (data[0]) {
    const fields = Object.keys(data[0]);
    const queryString = `
    INSERT INTO ${table} (${fields.join(", ")})
    VALUES
    ${data
      .map(
        (d: any) =>
          `(${fields
            .map((f) => {
              const val = `$${counter}`;
              counter += 1;
              return val;
            })
            .join(", ")})`
      )
      .join(", ")}
  `;
    copyResult = await client.query(
      queryString,
      data.map((d: any) => fields.map((f) => d[f])).flat()
    );
  }
};

export const batchUpsert = async <T extends Record<keyof T, any>>(
  data: T[],
  table: string,
  keyField: string,
  keyValue: string
): Promise<QueryResult | null> => {
  const client = await pool.connect();

  await client.query("BEGIN");
  let counter = 1;
  try {
    await client.query(`DELETE FROM ${table} WHERE ${keyField} = $1`, [
      keyValue,
    ]);
    let copyResult;
    if (data[0]) {
      const fields = Object.keys(data[0]);
      const queryString = `
    INSERT INTO ${table} (${fields.join(", ")})
    VALUES
    ${data
      .map(
        (d: any) =>
          `(${fields
            .map((f) => {
              const val = `$${counter}`;
              counter += 1;
              return val;
            })
            .join(", ")})`
      )
      .join(", ")}
  `;
      copyResult = await client.query(
        queryString,
        data.map((d: any) => fields.map((f) => d[f])).flat()
      );
    }
    await client.query("COMMIT");
    return copyResult || null;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};
