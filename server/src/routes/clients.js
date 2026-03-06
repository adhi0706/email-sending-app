import express from 'express';
import multer from 'multer';
import csv from 'csv-parser';
import stream from 'stream';
import Client from '../models/Client.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Memory store middleware for file uploads using Multer 
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Retrieve all clients
router.get('/', requireAuth, async (req, res) => {
    try {
        const clients = await Client.find().sort({ slno: 1 });
        res.json(clients);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete all clients
router.delete('/', requireAuth, async (req, res) => {
    try {
        await Client.deleteMany({});
        res.json({ message: 'All clients have been removed' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Upload CSV array of clients
router.post('/upload', requireAuth, upload.single('csvFile'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No CSV file provided' });
    }

    const results = [];
    const bufferStream = new stream.PassThrough();
    bufferStream.end(req.file.buffer);

    let parseError = null;

    bufferStream
        .pipe(csv())
        .on('data', (data) => {
            // Validate headers exist: 'slno', 'name', 'email', 'company'
            if (data.slno && data.name && data.email && data.company) {
                results.push({
                    slno: Number(data.slno),
                    name: data.name,
                    email: data.email,
                    company: data.company
                });
            }
        })
        .on('end', async () => {
            try {
                if (parseError) throw parseError;

                // Optionally clear old data, but usually users append or clear explicitly
                // await Client.deleteMany({}); 

                // Bulk insert array cleanly
                const docs = await Client.insertMany(results, { ordered: false });
                res.status(200).json({
                    message: 'Upload successful',
                    count: docs.length
                });
            } catch (err) {
                // Return 200 indicating partial pass if duplicate emails exist, but log error array
                if (err.code === 11000) {
                    return res.status(200).json({ message: "Partial upload. Some duplicates ignored." });
                }
                res.status(500).json({ error: err.message });
            }
        });
});

export default router;
