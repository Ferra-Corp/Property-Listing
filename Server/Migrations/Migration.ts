import path from "node:path";
import fs from "fs/promises";
import { Database } from "../Configurations/Database.js";
import { fileURLToPath } from "node:url";
import { ErrorMsg, Info } from "../Source/Utilities/Logger.js";

const __filename = fileURLToPath(import.meta.url),
  __dirname = path.dirname(__filename);

const db = new Database();

async function MigrationTable() {
  const migrationFilePath = path.join(
    __dirname,
    "SQL Tables",
    "000_migrations_table.sql",
  );

  try {
    const sqlString = "SELECT 1 FROM migrations";

    await db.query(sqlString);
    Info("Migration table already exists");
  } catch (error) {
    const sqlString = await fs.readFile(migrationFilePath, {
      encoding: "utf-8",
    });

    await db.query(sqlString);
    Info("Migration Table created successfully");
  }
}

async function InsertIntoMigrationTable(tableName: string): Promise<void> {
  const sqlString = "INSERT INTO migrations(name) VALUES($1)";
  await db.query(sqlString, [tableName]);
}

async function TableExists(tableName: string): Promise<boolean> {
  const sqlString = `SELECT * FROM migrations WHERE name=$1`,
    sqlQuery = await db.query(sqlString, [tableName]);

  const rows = sqlQuery?.rows || sqlQuery;
  return Array.isArray(rows) && rows.length > 0;
}

async function SQLTables() {
  const sqlTablesFilePath = path.join(__dirname, "SQL Tables");

  try {
    const tableDirectory = (await fs.readdir(sqlTablesFilePath)).sort();
    tableDirectory.shift();

    for (let sqlFile of tableDirectory) {
      try {
        const tableExists = await TableExists(sqlFile);

        if (tableExists) {
          Info(`${sqlFile} already created skipping...`);
          continue;
        }

        const sql = await fs.readFile(path.join(sqlTablesFilePath, sqlFile), {
          encoding: "utf-8",
        });

        await db.query(sql);

        Info(`${sqlFile} created successfully`);

        await InsertIntoMigrationTable(sqlFile);
      } catch (error) {
        ErrorMsg(new Error(`Error creating ${sqlFile}`));
        ErrorMsg(error as Error);
        break;
      }
    }
  } catch (error) {
    ErrorMsg(error as Error);
  }
}

(async () => {
  try {
    Info("Migration execution....");
    await MigrationTable();
    await SQLTables();
    await db.close();
    Info("Tables created successfully");
    process.exit(0);
  } catch (error) {
    ErrorMsg(error as Error);
    process.exit(1);
  }
})();
