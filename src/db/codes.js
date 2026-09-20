export async function nextCode(conn, table, column, prefix) {
  const [rows] = await conn.query(
    `SELECT \`${column}\` AS code FROM \`${table}\` WHERE \`${column}\` LIKE ? ORDER BY CAST(SUBSTRING(\`${column}\`, ?) AS UNSIGNED) DESC LIMIT 1`,
    [`${prefix}%`, prefix.length + 1]
  );
  if (!rows.length) return `${prefix}001`;
  const current = Number(String(rows[0].code).replace(/\D/g, '')) || 0;
  return `${prefix}${String(current + 1).padStart(3, '0')}`;
}
