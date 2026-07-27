-- Promote the first registered user to admin (dev convenience).
-- Safe to re-run: only updates rows that are still USER.
UPDATE users SET role = 'ADMIN' WHERE id = (SELECT MIN(id) FROM users) AND role = 'USER';
