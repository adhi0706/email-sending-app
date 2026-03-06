import express from 'express';
import multer from 'multer';
import csv from 'csv-parser';
import stream from 'stream';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

let memoryClients = [];

// Memory store middleware for file uploads using Multer 
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Retrieve all clients
router.get('/', requireAuth, async (req, res) => {
    try {
        const clients = [...memoryClients].sort((a, b) => a.slno - b.slno);
        res.json(clients);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete all clients
router.delete('/', requireAuth, async (req, res) => {
    try {
        memoryClients = [];
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

                // Append and assign an id like MongoDB did implicitly
                const newClients = results.map((r, i) => ({
                    ...r,
                    _id: Date.now().toString() + i
                }));
                // Filter duplicates by email roughly
                newClients.forEach(nc => {
                    const exists = memoryClients.find(mc => mc.email === nc.email);
                    if (!exists) {
                        memoryClients.push(nc);
                    }
                });

                res.status(200).json({
                    message: 'Upload successful',
                    count: newClients.length
                });
            } catch (err) {
                res.status(500).json({ error: err.message });
            }
        });
});

export default router;
