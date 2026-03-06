import mongoose from 'mongoose';

const clientSchema = new mongoose.Schema({
    slno: {
        type: Number,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        match: [/^\S+@\S+\.\S+$/, 'Please try a valid email']
    },
    company: {
        type: String,
        required: true
    }
}, { timestamps: true });

export default mongoose.model('Client', clientSchema);
