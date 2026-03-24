// ============================================
// Supabase Configuration
// ============================================

const SUPABASE_URL = 'https://voulsppunocjxoayegdn.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_38u3LbEVQS1eiAkxX9-SdA_Vgf0m1fd';

// Initialize the Supabase client (loaded from CDN in HTML)
// Store on window so script.js can access it without shadowing
window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
