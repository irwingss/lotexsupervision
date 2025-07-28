const fs = require('fs').promises;
const path = require('path');
const multer = require('multer');

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

// Check if we're in production (Vercel) or development
const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL;
const useGitHub = isProduction && process.env.TOKEN_GITHUB_API;

// Lazy load GitHub module to avoid initialization errors
let github = null;
function getGitHubModule() {
    if (!github && useGitHub) {
        try {
            github = require('./github');
            console.log('GitHub module loaded successfully');
        } catch (error) {
            console.error('Failed to load GitHub module:', error.message);
            throw new Error(`GitHub integration failed: ${error.message}`);
        }
    }
    return github;
}

// Ensure uploads directory exists
async function ensureUploadsDir() {
    if (useGitHub) {
        // No need to ensure directory exists on GitHub
        return;
    }

    try {
        await fs.access(UPLOADS_DIR);
    } catch (error) {
        await fs.mkdir(UPLOADS_DIR, { recursive: true });
    }
}

// Get list of supervision folders
async function getSupervisions() {
    try {
        if (useGitHub) {
            const githubModule = getGitHubModule();
            return await githubModule.getSupervisionsList();
        }
        
        await ensureUploadsDir();
        const items = await fs.readdir(UPLOADS_DIR, { withFileTypes: true });
        const supervisions = items
            .filter(item => item.isDirectory())
            .map(item => ({
                name: item.name,
                type: 'directory'
            }));
        
        return supervisions;
    } catch (error) {
        console.error('Error reading supervisions:', error);
        return [];
    }
}

// Create a new supervision folder
async function createSupervision(name, files = []) {
    try {
        if (useGitHub) {
            const githubModule = getGitHubModule();
            return await githubModule.createSupervisionInGitHub(name, files);
        }
        
        await ensureUploadsDir();
        
        const supervisionPath = path.join(UPLOADS_DIR, name);
        
        // Check if folder already exists
        try {
            await fs.access(supervisionPath);
            throw new Error('Supervision already exists');
        } catch (error) {
            if (error.code !== 'ENOENT') {
                throw error;
            }
        }
        
        // Create the supervision folder
        await fs.mkdir(supervisionPath, { recursive: true });
        
        // Copy template files if they exist in uploads root
        const templateFiles = ['muestra_final.txt', 'pafs.txt', 'pd.txt', 'locaciones.txt'];
        
        for (const file of templateFiles) {
            const sourcePath = path.join(UPLOADS_DIR, file);
            const destPath = path.join(supervisionPath, file);
            
            try {
                await fs.access(sourcePath);
                await fs.copyFile(sourcePath, destPath);
            } catch (error) {
                // File doesn't exist, create empty file
                await fs.writeFile(destPath, '', 'utf8');
            }
        }
        
        return { success: true, message: `Supervision "${name}" created successfully` };
    } catch (error) {
        console.error('Error in createSupervision:', error);
        throw new Error(`Error creating supervision: ${error.message}`);
    }
}

// Delete a supervision folder
async function deleteSupervision(name) {
    try {
        if (useGitHub) {
            const githubModule = getGitHubModule();
            return await githubModule.deleteSupervisionFromGitHub(name);
        }
        
        const supervisionPath = path.join(UPLOADS_DIR, name);
        
        await fs.access(supervisionPath);
        await fs.rm(supervisionPath, { recursive: true, force: true });
        return { success: true, message: `Supervision "${name}" deleted successfully` };
    } catch (error) {
        console.error('Error in deleteSupervision:', error);
        throw new Error(`Error deleting supervision: ${error.message}`);
    }
}

// Get files in a supervision folder
async function getSupervisionFiles(supervisionName) {
    try {
        if (useGitHub) {
            const githubModule = getGitHubModule();
            return await githubModule.getSupervisionFiles(supervisionName);
        }
        
        const supervisionPath = path.join(UPLOADS_DIR, supervisionName);
        
        await fs.access(supervisionPath);
        const files = await fs.readdir(supervisionPath);
        const txtFiles = files.filter(file => file.endsWith('.txt'));
        
        const fileDetails = [];
        for (const file of txtFiles) {
            const filePath = path.join(supervisionPath, file);
            const stats = await fs.stat(filePath);
            fileDetails.push({
                name: file,
                size: stats.size,
                modified: stats.mtime
            });
        }
        
        return fileDetails;
    } catch (error) {
        throw new Error(`Error reading supervision files: ${error.message}`);
    }
}

// Upload file to supervision folder
async function uploadSupervisionFile(supervisionName, file, fileType) {
    try {
        // Define the target filename based on file type
        const targetFilename = `${fileType}.txt`;
        const fileContent = file.buffer.toString('utf8');
        
        if (useGitHub) {
            const githubModule = getGitHubModule();
            return await githubModule.uploadFileToSupervision(supervisionName, targetFilename, fileContent);
        }
        
        const supervisionPath = path.join(UPLOADS_DIR, supervisionName);
        
        await fs.access(supervisionPath);
        
        const targetPath = path.join(supervisionPath, targetFilename);
        
        // Write the file
        await fs.writeFile(targetPath, file.buffer);
        
        return { success: true, message: `File ${targetFilename} uploaded successfully` };
    } catch (error) {
        throw new Error(`Error uploading file: ${error.message}`);
    }
}

// Express.js route handlers
function setupRoutes(app) {
    // GET /api/supervisions - List all supervisions
    app.get('/api/supervisions', async (req, res) => {
        try {
            const supervisions = await getSupervisions();
            res.json(supervisions);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
    
    // POST /api/supervisions - Create new supervision
    app.post('/api/supervisions', async (req, res) => {
        try {
            const { name, files } = req.body;
            
            if (!name || !name.trim()) {
                return res.status(400).json({ error: 'Supervision name is required' });
            }
            
            // Parse files if provided
            const parsedFiles = files || [];
            
            const result = await createSupervision(name.trim(), parsedFiles);
            res.json(result);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    });
    
    // DELETE /api/supervisions/:name - Delete supervision
    app.delete('/api/supervisions/:name', async (req, res) => {
        try {
            const { name } = req.params;
            const result = await deleteSupervision(name);
            res.json(result);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    });
    
    // GET /api/supervisions/:name/files - Get files in supervision
    app.get('/api/supervisions/:name/files', async (req, res) => {
        try {
            const { name } = req.params;
            const files = await getSupervisionFiles(name);
            res.json(files);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    });
    
    // POST /api/supervisions/:name/upload - Upload file to supervision
    app.post('/api/supervisions/:name/upload', async (req, res) => {
        try {
            const { name } = req.params;
            const { fileType } = req.body;
            const file = req.file;
            
            if (!file) {
                return res.status(400).json({ error: 'No file uploaded' });
            }
            
            if (!fileType) {
                return res.status(400).json({ error: 'File type is required' });
            }
            
            const result = await uploadSupervisionFile(name, file, fileType);
            res.json(result);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    });
}

module.exports = {
    getSupervisions,
    createSupervision,
    deleteSupervision,
    getSupervisionFiles,
    uploadSupervisionFile,
    setupRoutes
};
