const express = require('express');
const path = require('path');
const cors = require('cors');
const multer = require('multer');
const supervisionAPI = require('./api/supervisions');

const app = express();
const PORT = process.env.PORT || 3000;

// Configure multer for file uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'text/plain' || file.originalname.endsWith('.txt')) {
            cb(null, true);
        } else {
            cb(new Error('Only TXT files are allowed'), false);
        }
    }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Add multer middleware to upload routes
app.use('/api/supervisions/:name/upload', upload.single('file'));

// Setup API routes
supervisionAPI.setupRoutes(app);

// Serve the main application
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Export for Vercel
module.exports = app;

// Start server only if not in Vercel
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Supervisiones X server running on http://localhost:${PORT}`);
        console.log('Admin password: admin.lotex2025');
        console.log('User password: lotex2025');
    });
}
