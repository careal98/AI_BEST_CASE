import sql from "mssql";

export const config = {
  user: process.env.DB_USER || "mc365",
  password: process.env.DB_PASSWORD || "tkadbrdhmc1!",
  server: process.env.DB_SERVER || "20.41.118.57",
  database: process.env.DB_NAME || "tsfmc_mailsystem",
  port: 1433,
  options: {
    encrypt: true,
    trustServerCertificate: true,
  },
};
export async function connectDB(query) {
  try {
    await sql.connect(config);
    const result = await sql.query(query);
    return result.recordset;
  } catch (err) {
    console.error("Error fetching data:", err);
  }
}
