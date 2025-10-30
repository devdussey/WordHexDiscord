import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function resetDatabase() {
  console.log('🔄 Resetting database...\n');

  try {
    // First, check what's in the database
    console.log('📊 Current database state:');

    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, username, created_at');

    if (usersError) throw usersError;
    console.log(`   Users: ${users?.length || 0}`);

    const { data: stats, error: statsError } = await supabase
      .from('player_stats')
      .select('user_id');

    if (statsError) throw statsError;
    console.log(`   Player Stats: ${stats?.length || 0}`);

    const { data: sessions, error: sessionsError } = await supabase
      .from('game_sessions')
      .select('id');

    if (sessionsError) throw sessionsError;
    console.log(`   Game Sessions: ${sessions?.length || 0}`);

    const { data: records, error: recordsError } = await supabase
      .from('server_records')
      .select('id');

    if (recordsError) throw recordsError;
    console.log(`   Server Records: ${records?.length || 0}\n`);

    // Delete in order (respecting foreign keys)
    console.log('🗑️  Deleting data...');

    // Delete game sessions first
    const { error: deleteSessionsError } = await supabase
      .from('game_sessions')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (deleteSessionsError) throw deleteSessionsError;
    console.log('   ✓ Deleted all game sessions');

    // Delete server records
    const { error: deleteRecordsError } = await supabase
      .from('server_records')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (deleteRecordsError) throw deleteRecordsError;
    console.log('   ✓ Deleted all server records');

    // Delete player stats
    const { error: deleteStatsError } = await supabase
      .from('player_stats')
      .delete()
      .neq('user_id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (deleteStatsError) throw deleteStatsError;
    console.log('   ✓ Deleted all player stats');

    // Delete users last
    const { error: deleteUsersError } = await supabase
      .from('users')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (deleteUsersError) throw deleteUsersError;
    console.log('   ✓ Deleted all users');

    console.log('\n✅ Database reset complete! All user data has been cleared.');

  } catch (error) {
    console.error('\n❌ Error resetting database:', error.message);
    process.exit(1);
  }
}

resetDatabase();
