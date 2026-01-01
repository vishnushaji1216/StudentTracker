import mongoose from 'mongoose';

const AnnouncementSchema = new mongoose.Schema({
    sender: {
        role: { type: String, default: 'Admin'},
        id: { type: String}
    },
    targetAudience: {
        type: String,
        enum: ['Everyone', 'Teachers', 'Parents'],
        required: true
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    isUrgent: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.model('Announcement', AnnouncementSchema);