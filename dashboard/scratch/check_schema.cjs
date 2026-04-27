
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkSchema() {
    console.log('Checking repair_requests columns...');
    const { data, error } = await supabase
        .from('repair_requests')
        .select('*')
        .limit(1);
    
    if (error) {
        console.error('Error:', error);
        return;
    }
    
    if (data && data.length > 0) {
        console.log('Available columns in repair_requests:', Object.keys(data[0]));
    } else {
        console.log('No data in repair_requests to check columns.');
    }

    console.log('\nChecking maintenance_tasks columns...');
    const { data: data2, error: error2 } = await supabase
        .from('maintenance_tasks')
        .select('*')
        .limit(1);
    
    if (error2) {
        console.error('Error:', error2);
        return;
    }
    
    if (data2 && data2.length > 0) {
        console.log('Available columns in maintenance_tasks:', Object.keys(data2[0]));
    }
}

checkSchema();
