#!/usr/bin/env node

// This script creates the admin_users and admin_sessions tables and adds the admin user
// Run with: node setup_auth.js

import 'dotenv/config.js';
import { initializeDatabase } from './database.js';

async function setupAuth() {
    console.log('🔧 Setting up authentication tables...\n');

    try {
        const supabase = await initializeDatabase();
        
        if (!supabase) {
            console.error('❌ Failed to connect to Supabase. Check your environment variables.');
            process.exit(1);
        }

        // Create admin_users table
        console.log('📝 Creating admin_users table...');
        const { error: error1 } = await supabase.rpc('exec', {
            sql: `
                CREATE TABLE IF NOT EXISTS admin_users (
                    id SERIAL PRIMARY KEY,
                    email VARCHAR(255) UNIQUE NOT NULL,
                    password_hash VARCHAR(255) NOT NULL,
                    name VARCHAR(255),
                    is_admin BOOLEAN DEFAULT true,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    last_login TIMESTAMP,
                    is_active BOOLEAN DEFAULT true
                );
            `
        });

        if (error1) {
            console.warn('⚠️  admin_users table creation:', error1.message);
        } else {
            console.log('✅ admin_users table created');
        }

        // Create admin_sessions table
        console.log('📝 Creating admin_sessions table...');
        const { error: error2 } = await supabase.rpc('exec', {
            sql: `
                CREATE TABLE IF NOT EXISTS admin_sessions (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER REFERENCES admin_users(id) ON DELETE CASCADE,
                    session_token VARCHAR(255) UNIQUE NOT NULL,
                    ip_address VARCHAR(45),
                    user_agent TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    expires_at TIMESTAMP,
                    is_active BOOLEAN DEFAULT true
                );
            `
        });

        if (error2) {
            console.warn('⚠️  admin_sessions table creation:', error2.message);
        } else {
            console.log('✅ admin_sessions table created');
        }

        // Insert admin user
        console.log('📝 Creating admin user...');
        const { data, error: error3 } = await supabase
            .from('admin_users')
            .upsert({
                email: 'osama.eldrieny@gmail.com',
                password_hash: 'CHANGE_ME_IN_PRODUCTION',
                name: 'Admin User',
                is_admin: true,
                is_active: true
            }, { onConflict: 'email' })
            .select();

        if (error3) {
            console.error('❌ Error creating admin user:', error3.message);
            process.exit(1);
        }

        console.log('✅ Admin user created/updated');
        console.log('\n📊 Admin Account Details:');
        console.log('   Email: osama.eldrieny@gmail.com');
        console.log('   Password: Set in environment variables\n');

        // Verify admin user exists
        const { data: checkData, error: checkError } = await supabase
            .from('admin_users')
            .select('*')
            .eq('email', 'osama.eldrieny@gmail.com');

        if (checkError) {
            console.error('❌ Error verifying admin user:', checkError.message);
        } else if (checkData && checkData.length > 0) {
            console.log('✅ Verified: Admin user exists in database');
            console.log(`   ID: ${checkData[0].id}`);
            console.log(`   Email: ${checkData[0].email}`);
            console.log(`   Name: ${checkData[0].name}`);
            console.log(`   Active: ${checkData[0].is_active}`);
        } else {
            console.warn('⚠️  Admin user not found after creation');
        }

        console.log('\n🎉 Authentication setup complete!\n');
        process.exit(0);

    } catch (error) {
        console.error('❌ Setup failed:', error.message);
        console.error(error);
        process.exit(1);
    }
}

setupAuth();
