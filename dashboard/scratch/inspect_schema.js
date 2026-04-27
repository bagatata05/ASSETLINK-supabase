import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

// Try to find .env file
dotenv.config({ path: path.resolve(process.cwd(), 'dashboard/.env') })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase credentials in .env')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

const tableName = process.argv[2] || 'profiles'

async function inspectSchema() {
    console.log(`Inspecting ${tableName} table...`)
    
    // Get columns using a hack (selecting one row)
    const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1)

    if (error) {
        console.error(`Error fetching ${tableName}:`, error)
    } else {
        if (data.length > 0) {
            console.log('Columns found:', Object.keys(data[0]))
        } else {
            console.log('Table is empty, trying to insert a dummy to see if it fails...')
            const { error: insertError } = await supabase
                .from(tableName)
                .insert([{ dummy: 'test' }])
            console.log('Insert attempt error (expected if columns mismatch):', insertError?.message)
        }
    }
}

inspectSchema()
