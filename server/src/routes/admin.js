import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Register Admin (First-time setup or create explicitly)
router.post('/register', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if exists
        const existingAdmin = await Admin.findOne({ email });
        if (existingAdmin) {
            return res.status(400).json({ error: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newAdmin = new Admin({ email, password: hashedPassword });
        await newAdmin.save();

        const token = jwt.sign({ id: newAdmin._id, email: newAdmin.email }, process.env.JWT_SECRET || 'fallback_secret');
        res.json({ user: { email: newAdmin.email, id: newAdmin._id }, token });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const admin = await Admin.findOne({ email });

        if (!admin) return res.status(400).json({ error: 'Invalid credentials' });

        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

        const token = jwt.sign({ id: admin._id, email: admin.email }, process.env.JWT_SECRET || 'fallback_secret');
        res.json({ user: { email: admin.email, id: admin._id }, token });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Protect user fetch route as an example of middleware use
router.get('/me', requireAuth, (req, res) => {
    res.json({ user: req.admin });
});

export default router;
