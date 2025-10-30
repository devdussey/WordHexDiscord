import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// CORS helper
export function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
  };
}

// Handle CORS preflight
export function handleCors(req, res) {
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return true;
  }

  // Set CORS headers for all requests
  Object.entries(corsHeaders()).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  return false;
}
