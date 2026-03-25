import cron from 'node-cron';
import Submission from '../models/submission.model.js';
import { deleteFileFromSupabase } from '../services/supabase.js';

/**
 * CONSOLIDATED SUBMISSION CLEANUP CRON JOBS
 * 
 * Purpose: Manage storage and submission statuses automatically.
 * 1. Audio Cleanup: Delete files older than 2 days.
 * 2. Handwriting Cleanup: Delete files and reset status after 7 days.
 */

export const startSubmissionCleanupCron = () => {
    
    // --- TASK 1: AUDIO CLEANUP (Runs daily at 3:00 AM) ---
    cron.schedule('0 3 * * *', async () => {
        try {
            console.log('\n🗑️ [CRON] Running 48-hour audio cleanup...');
            const twoDaysAgo = new Date();
            twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

            const submissions = await Submission.find({
                type: 'audio',
                fileUrl: { $exists: true, $ne: null },
                submittedAt: { $lt: twoDaysAgo }
            });

            console.log(`🔍 [CRON] Found ${submissions.length} audio files to delete.`);

            let deletedCount = 0;
            for (const sub of submissions) {
                try {
                    await deleteFileFromSupabase(sub.fileUrl);
                    sub.fileUrl = null;
                    sub.status = 'deleted';
                    await sub.save();
                    deletedCount++;
                } catch (err) {
                    console.error(`❌ [CRON] Failed audio cleanup for ${sub._id}:`, err.message);
                }
            }
            console.log(`✅ [CRON] Cleaned up ${deletedCount} audio submissions`);
        } catch (error) {
            console.error('❌ [CRON] Audio cleanup error:', error);
        }
    });

    // --- TASK 2: HANDWRITING CLEANUP (Runs daily at 2:00 AM) ---
    cron.schedule('0 2 * * *', async () => {
        try {
            console.log('\n🔄 [CRON] Running weekly handwriting cleanup and reset...');
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

            // Find handwriting submissions older than 7 days
            const submissions = await Submission.find({
                type: { $regex: /^handwriting$/i },
                submittedAt: { $lt: oneWeekAgo }
            });

            console.log(`🔍 [CRON] Found ${submissions.length} handwriting submissions to process.`);

            let processedCount = 0;
            for (const sub of submissions) {
                try {
                    // 1. Delete physical file if it exists
                    if (sub.fileUrl) {
                        await deleteFileFromSupabase(sub.fileUrl);
                    }

                    // 2. Reset / Delete status in DB
                    sub.fileUrl = null;
                    sub.status = 'deleted'; // Consistently mark as deleted if file is gone
                    sub.obtainedMarks = 0;
                    sub.feedback = '';
                    sub.tags = [];
                    
                    await sub.save();
                    processedCount++;
                } catch (err) {
                    console.error(`❌ [CRON] Failed handwriting cleanup for ${sub._id}:`, err.message);
                }
            }
            console.log(`✅ [CRON] Processed ${processedCount} handwriting submissions`);
        } catch (error) {
            console.error('❌ [CRON] Handwriting cleanup error:', error);
        }
    });

    console.log('✅ Consolidated submission cleanup cron jobs initialized');
};

/**
 * Manual trigger for testing
 */
export const manualCleanupAll = async (type = 'all') => {
    const results = {};
    
    if (type === 'all' || type === 'audio') {
        const twoDaysAgo = new Date();
        twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
        const audio = await Submission.find({ type: 'audio', fileUrl: { $ne: null }, submittedAt: { $lt: twoDaysAgo } });
        for (const sub of audio) {
            await deleteFileFromSupabase(sub.fileUrl);
            sub.fileUrl = null;
            sub.status = 'deleted';
            await sub.save();
        }
        results.audio = audio.length;
    }

    if (type === 'all' || type === 'handwriting') {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const hw = await Submission.find({ type: { $regex: /^handwriting$/i }, submittedAt: { $lt: oneWeekAgo } });
        for (const sub of hw) {
            if (sub.fileUrl) await deleteFileFromSupabase(sub.fileUrl);
            sub.fileUrl = null;
            sub.status = 'deleted';
            sub.obtainedMarks = 0;
            sub.feedback = '';
            sub.tags = [];
            await sub.save();
        }
        results.handwriting = hw.length;
    }

    return results;
};
