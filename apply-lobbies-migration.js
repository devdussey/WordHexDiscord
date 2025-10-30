import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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

async function applyMigration() {
  console.log('🔄 Applying lobbies migration...\n');

  try {
    // Read migration file
    const migrationPath = join(__dirname, 'supabase', 'migrations', '20251030200000_create_lobbies_table.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');

    // Split SQL into individual statements (excluding comments)
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📋 Found ${statements.length} SQL statements to execute\n`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i] + ';';

      // Skip comment blocks
      if (stmt.trim().startsWith('/*') || stmt.trim() === ';') {
        continue;
      }

      try {
        const { error } = await supabase.rpc('exec_sql', { sql: stmt });

        if (error) {
          // If exec_sql RPC doesn't exist, we need to execute via SQL directly
          // This is a workaround since Supabase doesn't have a direct SQL execution method in JS client
          console.warn('⚠️  Cannot execute SQL via JS client. Please run the migration manually in Supabase SQL Editor.');
          console.warn('   Migration file: supabase/migrations/20251030200000_create_lobbies_table.sql');
          break;
        }

        console.log(`✓ Statement ${i + 1} executed successfully`);
      } catch (err) {
        console.error(`❌ Error executing statement ${i + 1}:`, err.message);
      }
    }

    console.log('\n✅ Migration application complete!');
    console.log('\n📝 Next steps:');
    console.log('   1. Verify tables were created in Supabase Dashboard');
    console.log('   2. If tables were not created, run the SQL manually in Supabase SQL Editor');
    console.log('   3. Test the multiplayer functionality');

  } catch (error) {
    console.error('\n❌ Error applying migration:', error.message);
    console.log('\n💡 Manual application required:');
    console.log('   1. Go to Supabase Dashboard → SQL Editor');
    console.log('   2. Copy contents of: supabase/migrations/20251030200000_create_lobbies_table.sql');
    console.log('   3. Paste and run in SQL Editor');
    process.exit(1);
  }
}

applyMigration();
