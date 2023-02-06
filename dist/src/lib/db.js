"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.batchUpsert = exports.batchUpsertWithClient = exports.pool = void 0;
const pg_1 = require("pg");
exports.pool = new pg_1.Pool({
    database: "postgres",
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
    port: 5432,
    ssl: false,
});
const batchUpsertWithClient = async (data, table, keys, client) => {
    const where = keys.reduce((acc, { field, value }, i) => {
        const isLastElement = i === keys.length - 1;
        if (isLastElement) {
            return `${acc} ${field} = $${i + 1}`;
        }
        return `${acc} ${field} = $${i + 1} AND`;
    }, "WHERE ");
    await client.query(`DELETE FROM ${table} ${where}`, keys.map((k) => k.value));
    let counter = 1;
    let copyResult;
    if (data[0]) {
        const fields = Object.keys(data[0]);
        const queryString = `
    INSERT INTO ${table} (${fields.join(", ")})
    VALUES
    ${data
            .map((d) => `(${fields
            .map((f) => {
            const val = `$${counter}`;
            counter += 1;
            return val;
        })
            .join(", ")})`)
            .join(", ")}
  `;
        copyResult = await client.query(queryString, data.map((d) => fields.map((f) => d[f])).flat());
    }
};
exports.batchUpsertWithClient = batchUpsertWithClient;
const batchUpsert = async (data, table, keyField, keyValue) => {
    const client = await exports.pool.connect();
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
                .map((d) => `(${fields
                .map((f) => {
                const val = `$${counter}`;
                counter += 1;
                return val;
            })
                .join(", ")})`)
                .join(", ")}
  `;
            copyResult = await client.query(queryString, data.map((d) => fields.map((f) => d[f])).flat());
        }
        await client.query("COMMIT");
        return copyResult || null;
    }
    catch (err) {
        await client.query("ROLLBACK");
        throw err;
    }
    finally {
        client.release();
    }
};
exports.batchUpsert = batchUpsert;
