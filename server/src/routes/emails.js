import express from 'express';
import nodemailer from 'nodemailer';
import multer from 'multer';
import { requireAuth } from '../middleware/auth.js';
import OpenAI from 'openai';
import EmailDraft from '../models/EmailDraft.js';
import Client from '../models/Client.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Generate email using AI
router.post('/generate', requireAuth, async (req, res) => {
    try {
        const { prompt } = req.body;

        if (!process.env.AI_API_KEY) {
            return res.status(500).json({ error: 'AI_API_KEY is missing from environment variables.' });
        }

        const openai = new OpenAI({ apiKey: process.env.AI_API_KEY });

        const completion = await openai.chat.completions.create({
            messages: [{ role: 'user', content: `Generate a professional email based on this description: ${prompt}. Leave placeholders like {{name}}, {{email}}, or {{company}} if needed.` }],
            model: 'gpt-3.5-turbo',
        });

        res.json({ generatedContent: completion.choices[0].message.content });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delay helper to create a pause between each batch execution
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Send emails to users securely with a delay constraint 
router.post('/send', requireAuth, upload.array('attachments'), async (req, res) => {
    let { clients, subject, body } = req.body;

    // In multipart/form-data, clients is sent as a JSON string
    if (typeof clients === 'string') {
        try {
            clients = JSON.parse(clients);
        } catch (e) {
            return res.status(400).json({ error: 'Invalid clients data format' });
        }
    }

    if (!clients || clients.length === 0) {
        return res.status(400).json({ error: 'No clients selected' });
    }

    if (clients.length > 100) {
        return res.status(400).json({ error: 'Maximum 100 emails per batch limit exceeded' });
    }

    // Use the admin's credential mappings
    const transporter = nodemailer.createTransport({
        service: 'gmail', // you can change service based on requirement
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    let sentCount = 0;
    let failedCount = 0;
    let failureLogs = [];

    // Map Express Multer files to Nodemailer Attachment format
    const attachments = (req.files || []).map(file => ({
        filename: file.originalname,
        content: file.buffer,
        contentType: file.mimetype
    }));

    for (let client of clients) {
        // Basic templating placeholder swaps
        let personalizedBody = body
            .replace(/{{name}}/g, client.name || '')
            .replace(/{{email}}/g, client.email || '')
            .replace(/{{company}}/g, client.company || '');

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: client.email,
            subject: subject,
            text: personalizedBody,
            attachments: attachments
        };

        try {
            await transporter.sendMail(mailOptions);
            sentCount++;
            // Wait for 2 seconds (2000 ms) as specified
            await delay(2000);
        } catch (error) {
            failedCount++;
            failureLogs.push({ client: client.email, error: error.message });
        }
    }

    res.json({
        message: 'Campaign completed',
        sent: sentCount,
        failed: failedCount,
        errors: failureLogs,
    });
});

// Drafts endpoints
router.post('/drafts', requireAuth, async (req, res) => {
    try {
        const draft = new EmailDraft({ subject: req.body.subject, body: req.body.body });
        await draft.save();
        res.json(draft);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/drafts', requireAuth, async (req, res) => {
    try {
        const drafts = await EmailDraft.find().sort({ createdAt: -1 });
        res.json(drafts);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/drafts/:id', requireAuth, async (req, res) => {
    try {
        await EmailDraft.findByIdAndDelete(req.params.id);
        res.json({ message: 'Deleted draft' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
