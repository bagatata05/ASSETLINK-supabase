
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkTasks() {
    console.log('Checking maintenance_tasks...');
    const { data, error } = await supabase
        .from('maintenance_tasks')
        .select('*');
    
    if (error) {
        console.error('Error fetching tasks:', error);
        return;
    }
    
    console.log(`Found ${data.length} tasks:`);
    data.forEach(t => {
        console.log(`- Asset: ${t.asset_name}, Assigned To: ${t.assigned_to_name}, Email: ${t.assigned_to_email}, Status: ${t.status}, Scheduled: ${t.scheduled_start_date}`);
    });
}

checkTasks();
