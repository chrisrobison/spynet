-- Admin Users Schema
-- This script creates tables for admin user management

-- Admin users table
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin', 'moderator', 'viewer')),
  is_active BOOLEAN DEFAULT TRUE,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX admin_users_username_idx ON admin_users(username);
CREATE INDEX admin_users_email_idx ON admin_users(email);
CREATE INDEX admin_users_role_idx ON admin_users(role);

-- Admin sessions table (for tracking active sessions)
CREATE TABLE IF NOT EXISTS admin_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_user_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  session_token TEXT UNIQUE NOT NULL,
  ip_address INET,
  user_agent TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX admin_sessions_admin_user_id_idx ON admin_sessions(admin_user_id);
CREATE INDEX admin_sessions_session_token_idx ON admin_sessions(session_token);
CREATE INDEX admin_sessions_expires_at_idx ON admin_sessions(expires_at);

-- Admin audit log (track all admin actions)
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_user_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  details JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX admin_audit_log_admin_user_id_idx ON admin_audit_log(admin_user_id);
CREATE INDEX admin_audit_log_action_idx ON admin_audit_log(action);
CREATE INDEX admin_audit_log_resource_type_idx ON admin_audit_log(resource_type);
CREATE INDEX admin_audit_log_created_at_idx ON admin_audit_log(created_at DESC);

-- Admin permissions table (fine-grained permissions)
CREATE TABLE IF NOT EXISTS admin_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_user_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  resource TEXT NOT NULL, -- e.g., 'players', 'zones', 'missions'
  can_read BOOLEAN DEFAULT TRUE,
  can_create BOOLEAN DEFAULT FALSE,
  can_update BOOLEAN DEFAULT FALSE,
  can_delete BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX admin_permissions_admin_user_id_idx ON admin_permissions(admin_user_id);
CREATE UNIQUE INDEX admin_permissions_user_resource_idx ON admin_permissions(admin_user_id, resource);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for admin_users
CREATE TRIGGER update_admin_users_updated_at
  BEFORE UPDATE ON admin_users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_admin_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM admin_sessions WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql;

-- Create a default super admin (password: changeme - hash for bcrypt)
-- NOTE: This is a placeholder. In production, use proper password hashing
INSERT INTO admin_users (username, password_hash, email, role)
VALUES (
  'admin',
  '$2b$10$rBV2KF9K3bZ3lMtCVQxfK.vXYJKZXJ3F.Gv0pD6XYZ1KV2bF9K3bZ', -- 'changeme'
  'admin@spynet.local',
  'super_admin'
) ON CONFLICT (username) DO NOTHING;

-- Grant default permissions to super admin
INSERT INTO admin_permissions (admin_user_id, resource, can_read, can_create, can_update, can_delete)
SELECT
  id,
  resource,
  TRUE,
  TRUE,
  TRUE,
  TRUE
FROM admin_users, (VALUES
  ('players'),
  ('factions'),
  ('zones'),
  ('missions'),
  ('qr_codes'),
  ('settings')
) AS resources(resource)
WHERE username = 'admin'
ON CONFLICT (admin_user_id, resource) DO NOTHING;

-- Output success message
DO $$
BEGIN
  RAISE NOTICE 'Admin users schema created successfully';
  RAISE NOTICE 'Default admin user: admin / changeme (CHANGE THIS PASSWORD!)';
END $$;
