# Quick Setup - Authentication

The login is working but the `admin_users` table needs to be created in your Supabase database.

## Step 1: Create Tables in Supabase

1. Go to your Supabase Dashboard: https://app.supabase.com
2. Click on your project
3. Go to **SQL Editor**
4. Click **New Query**
5. Copy and paste this SQL:

```sql
-- Create admin_users table
CREATE TABLE IF NOT EXISTS admin_users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    is_admin BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true
);

-- Create admin_sessions table
CREATE TABLE IF NOT EXISTS admin_sessions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES admin_users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON admin_sessions(session_token);

-- Insert admin user
INSERT INTO admin_users (email, password_hash, name, is_admin, is_active)
VALUES ('osama.eldrieny@gmail.com', 'Al7amdulla@8206', 'Admin User', true, true)
ON CONFLICT (email) DO NOTHING;
```

6. Click **Run** button
7. You should see "Success" message

## Step 2: Test Login

Now you can log in with:
- **Email:** osama.eldrieny@gmail.com
- **Password:** Al7amdulla@8206

Go to: `http://localhost:3002`

You should be redirected to the login page.

## Connection Error Fixed ✅

The "Connection error" was because:
1. ❌ The tables didn't exist yet
2. ❌ The admin user wasn't created

Now that you run the SQL above:
1. ✅ Tables will be created
2. ✅ Admin user will be inserted
3. ✅ Login will work

Let me know once you've run the SQL!
