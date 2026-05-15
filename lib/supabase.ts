import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hmzszthtmcnchvolbliz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhtenN6dGh0bWNuY2h2b2xibGl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4MDI1MjAsImV4cCI6MjA5NDM3ODUyMH0.6Jq8Z9LHFNxkQOzLuJITAKS8KGIlbfrAz76wTCRnJ74';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
