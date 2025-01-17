import sql from "mssql";

export const config = {
  user: 'mc365',
  password: 'tkadbrdhmc1!',
  server: '20.41.118.57',
  database: 'tsfmc_mailsystem',
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
