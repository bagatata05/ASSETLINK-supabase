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

const testAssetId = '4656053d-7bd0-4a8a-96df-25abe81c2436'

async function debug() {
    console.log('=== TEST: Query repair_requests by asset_id ===')
    console.log(`Searching for asset_id = "${testAssetId}"`)
    
    const { data: byId, error: e1 } = await supabase
        .from('repair_requests')
        .select('id, asset_id, asset_name, status')
        .eq('asset_id', testAssetId)

    console.log('Results:', byId?.length, 'Error:', e1)
    console.log('Data:', JSON.stringify(byId, null, 2))

    console.log('\n=== TEST: Query repair_requests by asset_name ===')
    const { data: byName, error: e2 } = await supabase
        .from('repair_requests')
        .select('id, asset_id, asset_name, status')
        .eq('asset_name', 'Tables')

    console.log('Results:', byName?.length, 'Error:', e2)
    console.log('Data:', JSON.stringify(byName, null, 2))

    console.log('\n=== TEST: Query with JOIN ===')
    const { data: withJoin, error: e3 } = await supabase
        .from('repair_requests')
        .select('*, maintenance_tasks (*)')
        .eq('asset_id', testAssetId)

    console.log('Results:', withJoin?.length, 'Error:', e3)
    if (withJoin) {
        withJoin.forEach(r => {
            console.log(`  repair id: ${r.id}, tasks: ${JSON.stringify(r.maintenance_tasks?.length)}`)
        })
    }
}

debug()
