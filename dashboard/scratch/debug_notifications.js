import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const envContent = readFileSync(resolve(__dirname, '../.env'), 'utf-8')
const env = {}
envContent.split('\n').forEach(line => {
    const [key, ...vals] = line.split('=')
    if (key && vals.length) env[key.trim()] = vals.join('=').trim()
})

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY)

async function debug() {
    // Test 1: Try a raw RPC or simple count
    console.log('=== TEST: Counting notifications ===')
    const { count, error: countErr } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
    console.log('Count:', count, 'Error:', countErr)

    // Test 2: Check if there's a 'users' table that might be involved
    console.log('\n=== TEST: Does a "users" table exist? ===')
    const { data: usersData, error: usersErr } = await supabase
        .from('users')
        .select('*')
        .limit(1)
    console.log('Users error:', usersErr)
    console.log('Users data:', usersData)

    // Test 3: Check profiles table (which we know works)
    console.log('\n=== TEST: Profiles table (control) ===')
    const { data: profileData, error: profileErr } = await supabase
        .from('profiles')
        .select('email, role')
        .limit(3)
    console.log('Profiles error:', profileErr)
    console.log('Profiles data:', profileData)
}

debug()
