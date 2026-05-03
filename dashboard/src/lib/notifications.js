const resendApiKey = import.meta.env.VITE_RESEND_API_KEY;

import { supabase } from './supabase';

/**
 * Sends an email notification using Resend API.
 * NOTE: For production, this should be moved to a backend (like Supabase Edge Functions)
 * to keep the API key secure and avoid CORS issues.
 */
export async function sendEmail({ to, subject, html }) {
    if (!resendApiKey) {
        console.log('[Notifications] Skip Email: No API Key');
        return { success: false, error: 'Missing API Key' };
    }

    try {
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${resendApiKey}`,
            },
            body: JSON.stringify({
                from: 'AssetLink <onboarding@resend.dev>',
                to: Array.isArray(to) ? to : [to],
                subject: `[AssetLink] ${subject}`,
                html: html,
            }),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to send email');
        
        console.log('[Notifications] Email sent successfully:', data.id);
        return { success: true, id: data.id };
    } catch (error) {
        console.error('[Notifications] Error sending email:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Pre-defined notification templates for AssetLink
 */
export const templates = {
    newReport: (report) => ({
        subject: `New Damage Report: ${report.asset_name}`,
        html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
                <div style="background-color: #0d2e2a; color: white; padding: 24px; text-align: center;">
                    <h1 style="margin: 0; font-size: 20px;">New Damage Protocol</h1>
                </div>
                <div style="padding: 24px; color: #374151;">
                    <p>A new damage report has been submitted and requires review.</p>
                    <div style="background-color: #f9fafb; padding: 16px; border-radius: 8px; margin: 20px 0;">
                        <p style="margin: 0 0 8px 0;"><strong>Asset:</strong> ${report.asset_name} (${report.asset_code})</p>
                        <p style="margin: 0 0 8px 0;"><strong>Priority:</strong> ${report.priority}</p>
                        <p style="margin: 0 0 8px 0;"><strong>Reported By:</strong> ${report.reported_by_name}</p>
                        <p style="margin: 8px 0 0 0;"><strong>Description:</strong> ${report.description}</p>
                    </div>
                    <p style="font-size: 14px; color: #6b7280;">Please log in to the Principal dashboard to assign a technician.</p>
                </div>
            </div>
        `
    }),
    taskAssigned: (task) => ({
        subject: `New Task Assigned: ${task.asset_name}`,
        html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
                <div style="background-color: #0d2e2a; color: white; padding: 24px; text-align: center;">
                    <h1 style="margin: 0; font-size: 20px;">Maintenance Assignment</h1>
                </div>
                <div style="padding: 24px; color: #374151;">
                    <p>A new maintenance task has been assigned to you.</p>
                    <div style="background-color: #f9fafb; padding: 16px; border-radius: 8px; margin: 20px 0;">
                        <p style="margin: 0 0 8px 0;"><strong>Asset:</strong> ${task.asset_name}</p>
                        <p style="margin: 0 0 8px 0;"><strong>Location:</strong> ${task.school_name}</p>
                        <p style="margin: 0 0 8px 0;"><strong>Priority:</strong> ${task.priority}</p>
                        <p style="margin: 8px 0 0 0;"><strong>Task Details:</strong> ${task.description}</p>
                    </div>
                    <p style="font-size: 14px; color: #6b7280;">Please review the task in your Service Record dashboard.</p>
                </div>
            </div>
        `
    }),
    reworkRequested: (report, feedback) => ({
        subject: `Rework Requested: ${report.asset_name}`,
        html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
                <div style="background-color: #991b1b; color: white; padding: 24px; text-align: center;">
                    <h1 style="margin: 0; font-size: 20px;">Rework Protocol Initiated</h1>
                </div>
                <div style="padding: 24px; color: #374151;">
                    <p>The teacher has reviewed the repair and requested additional work.</p>
                    <div style="background-color: #fef2f2; padding: 16px; border-radius: 8px; border: 1px solid #fee2e2; margin: 20px 0;">
                        <p style="margin: 0 0 8px 0; color: #991b1b;"><strong>Feedback:</strong></p>
                        <p style="margin: 0; font-style: italic;">"${feedback}"</p>
                    </div>
                    <p style="font-size: 14px; color: #6b7280;">The task status has been reset to "In Progress".</p>
                </div>
            </div>
        `
    }),
    repairVerified: (report) => ({
        subject: `Repair Verified: ${report.asset_name}`,
        html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
                <div style="background-color: #065f46; color: white; padding: 24px; text-align: center;">
                    <h1 style="margin: 0; font-size: 20px;">Repair Certified</h1>
                </div>
                <div style="padding: 24px; color: #374151;">
                    <p>The teacher has verified the repair and the case is now closed.</p>
                    <div style="background-color: #ecfdf5; padding: 16px; border-radius: 8px; border: 1px solid #d1fae5; margin: 20px 0;">
                        <p style="margin: 0 0 8px 0;"><strong>Asset:</strong> ${report.asset_name}</p>
                        <p style="margin: 0;"><strong>Status:</strong> Finalized & Certified</p>
                    </div>
                    <p style="font-size: 14px; color: #6b7280;">Great job! The digital restoration certificate is now available.</p>
                </div>
            </div>
        `
    })
};

/**
 * Creates an in-app notification in the Supabase database.
 */
export async function createInAppNotification({ user_email, title, message, type = 'info', link = null }) {
    console.log(`[Notifications] Attempting In-App Insert for: ${user_email}`, { title, type });
    try {
        // @ts-ignore - notifications table is newly created and not yet in types
        const { data, error } = await supabase.from('notifications')
            .insert([{
                user_email: user_email.toLowerCase(),
                title,
                message,
                type,
                link,
                is_read: false
            }])
            .select();

        if (error) {
            console.error('[Notifications] Database Insert Error:', error);
            throw error;
        }
        console.log('[Notifications] Success! Record created:', data?.[0]?.id);
        return { success: true };
    } catch (error) {
        console.error('[Notifications] Caught Exception during insert:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Notify principals about a new damage report.
 */
export async function notifyPrincipalOfNewReport(report, manualEmail = null) {
    try {
        let emails;
        
        if (manualEmail) {
            emails = [manualEmail];
        } else {
            // ✅ Case-insensitive role matching to handle "ADMIN", "Admin", or "admin"
            const { data: recipients, error } = await supabase
                .from('profiles')
                .select('email')
                .or('role.ilike.principal,role.ilike.admin');

            if (error) {
                console.error('[Notifications] Recipient Fetch Error:', error);
                throw error;
            }
            emails = recipients?.map(p => p.email).filter(Boolean);
            console.log(`[Notifications] Found ${emails.length} recipients for role Principal/Admin:`, emails);
        }

        if (!emails || emails.length === 0) {
            console.warn('[Notifications] ABORT: No recipients found for notification.');
            return { success: false, error: 'No recipients' };
        }

        const template = templates.newReport(report);
        
        // 🔔 Create In-App Notifications for all principals
        for (const email of emails) {
            await createInAppNotification({
                user_email: email,
                title: 'New Damage Report',
                message: `${report.reported_by_name} reported an issue with ${report.asset_name}.`,
                type: 'warning',
                link: '/repair-requests'
            });
        }

        return await sendEmail({
            to: emails,
            subject: template.subject,
            html: template.html
        });
    } catch (error) {
        console.error('[Notifications] notifyPrincipal failed:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Notify a technician about a new assignment.
 */
export async function notifyTechnicianOfAssignment(task) {
    if (!task.assigned_to_email) return { success: false, error: 'No email provided' };

    try {
        // 🔔 Create In-App Notification
        await createInAppNotification({
            user_email: task.assigned_to_email,
            title: 'New Task Assigned',
            message: `You have been assigned to repair ${task.asset_name} at ${task.school_name}.`,
            type: 'info',
            link: '/tasks'
        });

        const template = templates.taskAssigned(task);
        return await sendEmail({
            to: task.assigned_to_email,
            subject: template.subject,
            html: template.html
        });
    } catch (error) {
        console.error('[Notifications] notifyTechnician failed:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Notify a technician that rework has been requested.
 */
export async function notifyTechnicianOfRework(report, feedback) {
    if (!report.assigned_to_email) return { success: false, error: 'No email provided' };

    try {
        // 🔔 Create In-App Notification
        await createInAppNotification({
            user_email: report.assigned_to_email,
            title: 'Rework Requested',
            message: `Additional work is required for ${report.asset_name}. Feedback: ${feedback}`,
            type: 'error',
            link: '/tasks'
        });

        const template = templates.reworkRequested(report, feedback);
        return await sendEmail({
            to: report.assigned_to_email,
            subject: template.subject,
            html: template.html
        });
    } catch (error) {
        console.error('[Notifications] notifyRework failed:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Notify a technician that their repair has been verified and closed.
 */
export async function notifyTechnicianOfVerification(report) {
    if (!report.assigned_to_email) return { success: false, error: 'No email provided' };

    try {
        // 🔔 Create In-App Notification
        await createInAppNotification({
            user_email: report.assigned_to_email,
            title: 'Repair Verified',
            message: `Your repair for ${report.asset_name} has been verified and closed. Great job!`,
            type: 'success',
            link: '/tasks'
        });

        const template = templates.repairVerified(report);
        return await sendEmail({
            to: report.assigned_to_email,
            subject: template.subject,
            html: template.html
        });
    } catch (error) {
        console.error('[Notifications] notifyVerification failed:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Notify a teacher that their report has been approved and assigned.
 */
export async function notifyTeacherOfApproval(report) {
    if (!report.reported_by_email) return { success: false, error: 'No email provided' };

    try {
        // 🔔 Create In-App Notification
        await createInAppNotification({
            user_email: report.reported_by_email,
            title: 'Repair Approved',
            message: `Your report for ${report.asset_name} has been approved and assigned to ${report.assigned_to_name}.`,
            type: 'success',
            link: '/report-damage'
        });

        const template = {
            subject: `Repair Approved: ${report.asset_name}`,
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
                    <div style="background-color: #0d2e2a; color: white; padding: 24px; text-align: center;">
                        <h1 style="margin: 0; font-size: 20px;">Restoration Approved</h1>
                    </div>
                    <div style="padding: 24px; color: #374151;">
                        <p>Your damage report for <strong>${report.asset_name}</strong> has been approved and assigned to a technician.</p>
                        <div style="background-color: #f9fafb; padding: 16px; border-radius: 8px; margin: 20px 0;">
                            <p style="margin: 0 0 8px 0;"><strong>Assigned To:</strong> ${report.assigned_to_name}</p>
                            <p style="margin: 0;"><strong>Status:</strong> In Progress</p>
                        </div>
                        <p style="font-size: 14px; color: #6b7280;">You can track the progress in your Restoration Reports dashboard.</p>
                    </div>
                </div>
            `
        };
        return await sendEmail({
            to: report.reported_by_email,
            subject: template.subject,
            html: template.html
        });
    } catch (error) {
        console.error('[Notifications] notifyTeacher failed:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Notify a teacher that a repair is finished and needs verification.
 */
export async function notifyTeacherOfCompletion(report) {
    if (!report.reported_by_email) return { success: false, error: 'No email provided' };

    try {
        // 🔔 Create In-App Notification
        await createInAppNotification({
            user_email: report.reported_by_email,
            title: 'Repair Ready for Verification',
            message: `The maintenance for ${report.asset_name} is complete. Please verify the work to close the case.`,
            type: 'info',
            link: '/report-damage'
        });

        const template = {
            subject: `Repair Complete: ${report.asset_name}`,
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
                    <div style="background-color: #065f46; color: white; padding: 24px; text-align: center;">
                        <h1 style="margin: 0; font-size: 20px;">Repair Complete</h1>
                    </div>
                    <div style="padding: 24px; color: #374151;">
                        <p>The repair for <strong>${report.asset_name}</strong> is now finished.</p>
                        <div style="background-color: #f0fdf4; padding: 16px; border-radius: 8px; margin: 20px 0;">
                            <p style="margin: 0;"><strong>Status:</strong> Pending Your Verification</p>
                        </div>
                        <p style="font-size: 14px; color: #6b7280;">Please log in to verify the repair and close the case.</p>
                    </div>
                </div>
            `
        };
        return await sendEmail({
            to: report.reported_by_email,
            subject: template.subject,
            html: template.html
        });
    } catch (error) {
        console.error('[Notifications] notifyTeacherCompletion failed:', error);
        return { success: false, error: error.message };
    }
}
