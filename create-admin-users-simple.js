import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const adminUsers = [
  {
    username: 'Dussey',
    discord_id: '331958570201513987',
    password: 'Allycat1!'
  },
  {
    username: 'Lily',
    discord_id: '1209565744019279974',
    password: 'Allycat1!'
  }
];

async function createAdminUsers() {
  console.log('🔐 Creating admin users...\n');

  try {
    for (const admin of adminUsers) {
      console.log(`📝 Creating user: ${admin.username}`);

      // Check if user already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id, username')
        .eq('discord_id', admin.discord_id)
        .single();

      if (existingUser) {
        console.log(`   ⚠️  User already exists with ID: ${existingUser.id}`);
        console.log(`   Updating password...`);

        // Update existing user password
        const passwordHash = await bcrypt.hash(admin.password, 10);
        const { error: updateError } = await supabase
          .from('users')
          .update({
            password_hash: passwordHash
          })
          .eq('id', existingUser.id);

        if (updateError) {
          console.log(`   ❌ Failed to update user: ${updateError.message}`);
          continue;
        }

        console.log(`   ✓ Password updated for ${admin.username}\n`);
        continue;
      }

      // Hash password
      const passwordHash = await bcrypt.hash(admin.password, 10);

      // Create user
      const { data: user, error: userError } = await supabase
        .from('users')
        .insert({
          discord_id: admin.discord_id,
          username: admin.username,
          password_hash: passwordHash,
          coins: 0,
          gems: 0,
          cosmetics: []
        })
        .select()
        .single();

      if (userError) {
        console.log(`   ❌ Failed to create user: ${userError.message}`);
        continue;
      }

      console.log(`   ✓ User created with ID: ${user.id}`);

      // Create player stats
      const { error: statsError } = await supabase
        .from('player_stats')
        .insert({
          user_id: user.id,
          total_matches: 0,
          total_wins: 0,
          total_score: 0,
          total_words: 0,
          best_score: 0,
          win_streak: 0,
          best_win_streak: 0
        });

      if (statsError) {
        console.log(`   ⚠️  Failed to create player stats: ${statsError.message}`);
      } else {
        console.log(`   ✓ Player stats created`);
      }

      console.log(`   ✓ User ${admin.username} created successfully!\n`);
    }

    console.log('✅ User creation complete!\n');
    console.log('📝 Admin Accounts Created:');
    adminUsers.forEach(admin => {
      console.log(`   - Username: ${admin.username}`);
      console.log(`     Discord ID: ${admin.discord_id}`);
      console.log(`     Password: ${admin.password}`);
      console.log('');
    });

    console.log('🔐 You can now log in with username and password at https://wordhex.vercel.app');

  } catch (error) {
    console.error('\n❌ Error creating users:', error.message);
    process.exit(1);
  }
}

createAdminUsers();
