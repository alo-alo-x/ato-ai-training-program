// ============================================
// Supabase Configuration
// ============================================

const SUPABASE_URL = 'https://voulsppunocjxoayegdn.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_38u3LbEVQS1eiAkxX9-SdA_Vgf0m1fd';

// Initialize the Supabase client (loaded from CDN in HTML)
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
