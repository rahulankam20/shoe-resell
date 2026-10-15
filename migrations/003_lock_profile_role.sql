-- SOLEVAULT hotfix: stop signed-in users from writing their own profile row.
--
-- The old profiles_self_update / profiles_self_insert policies (002) let any
-- signed-in user send PATCH /rest/v1/profiles?id=eq.<their id> {"role":"admin"}
-- with the public anon key and become an administrator. Profiles are written
-- only by the API, which uses the service role and never takes `role` from the
-- request body. Safe to run more than once.

DROP POLICY IF EXISTS "profiles_self_update" ON profiles;
DROP POLICY IF EXISTS "profiles_self_insert" ON profiles;

-- Only two roles exist. NOT VALID skips existing rows so this cannot fail on a
-- live database; audit existing admins with the query at the end.
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('customer', 'admin')) NOT VALID;

-- After running, review every administrator and demote anyone unexpected:
-- SELECT id, email, created_at FROM profiles WHERE role = 'admin' ORDER BY created_at;
