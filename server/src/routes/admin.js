import express from 'express';
import jwt from 'jsonwebtoken';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

const DEFAULT_ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@example.com';
const DEFAULT_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

// Register Admin (Removed DB, always mock response for initial setup if needed)
router.post('/register', async (req, res) => {
    try {
        const { email, password } = req.body;
        // Mock successful setup
        const token = jwt.sign({ id: 'mock-id', email: email }, process.env.JWT_SECRET || 'fallback_secret');
        res.json({ user: { email: email, id: 'mock-id' }, token });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (email !== DEFAULT_ADMIN_EMAIL || password !== DEFAULT_ADMIN_PASSWORD) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: 'mock-id', email: email }, process.env.JWT_SECRET || 'fallback_secret');
        res.json({ user: { email: email, id: 'mock-id' }, token });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Protect user fetch route as an example of middleware use
router.get('/me', requireAuth, (req, res) => {
    res.json({ user: req.admin });
});

export default router;
