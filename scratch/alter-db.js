const { createClient } = require("@libsql/client");

const url = "libsql://glassquote-khan-shanawaz.aws-ap-south-1.turso.io";
const authToken = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODEzMzE5MDAsImlkIjoiMDE5ZWJmYTctODYwMS03ODBkLTgwMzgtMTBhMjU2NTNmZDY4IiwicmlkIjoiZjBhN2M4MTMtMTgyYS00YzRjLTg1ZjEtMjZlNWRmMjJhNjdkIn0.-XJMdBrnP9jumN18a7yNIKsHfD0QZMkWf787iEAi0bN_tQtB8qBAbF-dKWAZyZIkV7p8cI--JQHpZd10PWbWCA";

const client = createClient({ url, authToken });

async function main() {
  try {
    await client.execute("ALTER TABLE projects ADD COLUMN tasks TEXT;");
    console.log("Successfully added 'tasks' column to projects table on Turso!");
  } catch (err) {
    console.error("Error altering table:", err.message);
  } finally {
    process.exit(0);
  }
}

main();
