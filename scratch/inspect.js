const { createClient } = require("@libsql/client");

const url = "libsql://glassquote-khan-shanawaz.aws-ap-south-1.turso.io";
const authToken = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODEzMzE5MDAsImlkIjoiMDE5ZWJmYTctODYwMS03ODBkLTgwMzgtMTBhMjU2NTNmZDY4IiwicmlkIjoiZjBhN2M4MTMtMTgyYS00YzRjLTg1ZjEtMjZlNWRmMjJhNjdkIn0.-XJMdBrnP9jumN18a7yNIKsHfD0QZMkWf787iEAi0bN_tQtB8qBAbF-dKWAZyZIkV7p8cI--JQHpZd10PWbWCA";

const client = createClient({ url, authToken });

async function main() {
  try {
    const res = await client.execute("PRAGMA table_info(projects);");
    console.log("Projects table columns:", res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

main();
