
import { supabase } from './dashboard/src/lib/supabase';

async function testNotification() {
    console.log('--- Notification System Test ---');
    const testEmail = 'principal@test.com'; // Replace with a real email if needed
    
    const { data, error } = await supabase.from('notifications').insert([{
        user_email: testEmail.toLowerCase(),
        title: 'Test Notification',
        message: 'If you see this, insertion is working.',
        type: 'info',
        is_read: false,
        created_at: new Date().toISOString()
    }]).select();

    if (error) {
        console.error('❌ INSERT FAILED:', error.code, error.message);
        if (error.code === '42501') {
            console.error('💡 RLS Violation detected. You need to add an INSERT policy.');
        }
    } else {
        console.log('✅ INSERT SUCCESSFUL:', data);
    }
}

testNotification();
