import mongoose from 'mongoose';

const emailDraftSchema = new mongoose.Schema({
    subject: {
        type: String,
        required: true
    },
    body: {
        type: String,
        required: true
    }
}, { timestamps: true });

export default mongoose.model('EmailDraft', emailDraftSchema);
