import bcrypt from 'bcryptjs';

/**
 * Create or update a portal login in `users`, linked to the given role name.
 * Roles are looked up from the `roles` table (not inserted).
 */
export async function upsertPortalUser(conn, {
  username,
  password,
  roleName,
  existingUserId = null
}) {
  const cleanUsername = String(username || '').trim();
  const cleanPassword = String(password || '');

  if (!cleanUsername && !cleanPassword) {
    return { userId: existingUserId || null, created: false, updated: false };
  }

  if (!existingUserId && (!cleanUsername || !cleanPassword)) {
    const err = new Error(
      cleanUsername
        ? 'Password is required when creating a portal login.'
        : 'Username and password are required to create a portal login.'
    );
    err.status = 400;
    throw err;
  }

  if (existingUserId && cleanUsername && !cleanPassword) {
    // username-only update allowed
  } else if (existingUserId && !cleanUsername && cleanPassword) {
    // password-only update allowed
  }

  const [roleRows] = await conn.query('SELECT id FROM roles WHERE name = ? LIMIT 1', [roleName]);
  if (!roleRows.length) {
    const err = new Error(`Role "${roleName}" is missing. Restart the API so roles can be seeded.`);
    err.status = 500;
    throw err;
  }
  const roleId = roleRows[0].id;

  if (!existingUserId) {
    const passwordHash = await bcrypt.hash(cleanPassword, 10);
    const [userResult] = await conn.query(
      'INSERT INTO users (username, password_hash, role_id, is_active) VALUES (?, ?, ?, 1)',
      [cleanUsername, passwordHash, roleId]
    );
    return { userId: userResult.insertId, created: true, updated: false };
  }

  const updates = [];
  const params = [];

  if (cleanUsername) {
    updates.push('username = ?');
    params.push(cleanUsername);
  }
  if (cleanPassword) {
    updates.push('password_hash = ?');
    params.push(await bcrypt.hash(cleanPassword, 10));
  }
  updates.push('role_id = ?');
  params.push(roleId);
  updates.push('is_active = 1');
  params.push(existingUserId);

  await conn.query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);
  return { userId: existingUserId, created: false, updated: true };
}

export async function deletePortalUser(conn, userId) {
  if (!userId) return;
  await conn.query('DELETE FROM users WHERE id = ?', [userId]);
}
