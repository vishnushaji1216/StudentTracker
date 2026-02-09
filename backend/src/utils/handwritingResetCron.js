import cron from 'node-cron';
import Submission from '../models/submission.model.js';

/**
 * HANDWRITING AUTO-RESET CRON JOB
 * 
 * Purpose: Automatically reset handwriting submissions to 'pending' status
 * after they are older than 7 days, so teachers are reminded to review
 * student handwriting weekly.
 * 
 * Schedule: Runs every day at 2:00 AM
 */

export const startHandwritingResetCron = () => {
  // Runs daily at 2:00 AM
  cron.schedule('0 2 * * *', async () => {
    try {
      console.log('\n🔄 [CRON] Running weekly handwriting reset...');

      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      // Find all handwriting submissions that:
      // 1. Are older than 7 days
      // 2. Currently have status 'graded'
      const result = await Submission.updateMany(
        {
          type: { $regex: /^handwriting$/i },
          status: { $in: ['graded', 'Graded'] },
          submittedAt: { $lt: oneWeekAgo }
        },
        {
          $set: { 
            status: 'pending',
            // Clear the old grading data so it needs fresh review
            obtainedMarks: 0,
            feedback: '',
            tags: []
          }
        }
      );

      console.log(`✅ [CRON] Reset ${result.modifiedCount} handwriting submissions to pending`);

    } catch (error) {
      console.error('❌ [CRON] Handwriting reset error:', error);
    }
  });

  console.log('✅ Handwriting auto-reset cron job initialized (runs daily at 2:00 AM)');
};

/**
 * ALTERNATIVE: Manual trigger function for testing
 * You can call this from an admin route to test the reset logic
 */
export const manualHandwritingReset = async () => {
  try {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const result = await Submission.updateMany(
      {
        type: { $regex: /^handwriting$/i },
        status: { $in: ['graded', 'Graded'] },
        submittedAt: { $lt: oneWeekAgo }
      },
      {
        $set: { 
          status: 'pending',
          obtainedMarks: 0,
          feedback: '',
          tags: []
        }
      }
    );

    return {
      success: true,
      count: result.modifiedCount,
      message: `Reset ${result.modifiedCount} handwriting submissions`
    };

  } catch (error) {
    console.error('Manual reset error:', error);
    return {
      success: false,
      message: error.message
    };
  }
};