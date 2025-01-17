import sql from "mssql";

export const config = {
  user: process.env.VITE_DB_USER,
  password: process.env.VITE_DB_PASSWORD,
  server: process.env.VITE_DB_SERVER,
  database: process.env.VITE_DB_NAME,
  port: 1433,
  options: {
    encrypt: true,
    trustServerCertificate: true,
  },
};
export async function connectDB(query) {
  try {
    console.dir(config)
    await sql.connect(config);
    const result = await sql.query(query);
    return result.recordset;
  } catch (err) {
    console.error("Error fetching data:", err);
  }
}
