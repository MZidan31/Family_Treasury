import { createClient } from '@supabase/supabase-js'

// Ganti string di bawah ini dengan data dari Dashboard Supabase Anda
const supabaseUrl = 'https://bqwpahlhmmrcskficfca.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxd3BhaGxobW1yY3NrZmljZmNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzOTcxOTksImV4cCI6MjA4Mzk3MzE5OX0.Mlc4ABClIHoC6DmJzFpZBsa8tFwGzIqFdH99g0IvjwY'

export const supabase = createClient(supabaseUrl, supabaseKey)