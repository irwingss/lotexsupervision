// GitHub Integration for Supervisiones X - Vercel Compatible
// Handles reading and updating Excel files in GitHub repository
// Works with both development (local) and production (Vercel) environments

class GitHubIntegration {
    constructor() {
        this.config = null;
        this.isConfigured = false;
        this.loadConfig();
    }

    loadConfig() {
        try {
            // First, try to use Vercel environment variables (for production)
            if (this.isVercelEnvironment()) {
                console.log('Running in Vercel environment, using API for configuration');
                this.config = {
                    // These will be loaded via API call to Vercel serverless function
                    token: null,
                    owner: null,
                    repo: null,
                    branch: 'main',
                    filePath: 'data/supervisiones_data.xlsx'
                };
                this.loadVercelConfig();
                return;
            }
            
            // Try to load from github-config.js (for development)
            if (typeof GITHUB_CONFIG !== 'undefined') {
                this.config = {
                    token: GITHUB_CONFIG.token,
                    owner: GITHUB_CONFIG.owner,
                    repo: GITHUB_CONFIG.repo,
                    branch: GITHUB_CONFIG.branch || 'main',
                    filePath: GITHUB_CONFIG.uploadsPath + GITHUB_CONFIG.defaultExcelFile
                };
                this.isConfigured = this.validateConfig();
                console.log('Using GITHUB_CONFIG from file');
            } else {
                // Try to load from localStorage
                const storedConfig = localStorage.getItem('supervisionesX_github_config');
                if (storedConfig) {
                    this.config = JSON.parse(storedConfig);
                    this.isConfigured = this.validateConfig();
                    console.log('Using stored configuration from localStorage');
                }
            }
        } catch (error) {
            console.warn('Could not load GitHub configuration:', error);
            this.isConfigured = false;
        }
    }

    isVercelEnvironment() {
        // Check if we're running in Vercel environment
        return window.location.hostname.includes('vercel.app') || 
               window.location.hostname.includes('.vercel.app');
    }

    async loadVercelConfig() {
        try {
            // Call Vercel serverless function to get GitHub configuration
            const response = await fetch('/api/github-config');
            if (response.ok) {
                const config = await response.json();
                this.config = {
                    ...this.config,
                    ...config
                };
                this.isConfigured = this.validateConfig();
                console.log('Successfully loaded configuration from Vercel API');
            } else {
                console.warn('Failed to load configuration from Vercel API');
                this.isConfigured = false;
            }
        } catch (error) {
            console.error('Error loading Vercel configuration:', error);
            this.isConfigured = false;
        }
    }

    validateConfig() {
        if (!this.config) return false;
        
        const hasRequiredFields = !!(this.config.token && this.config.owner && this.config.repo);
        const hasPlaceholders = this.config.owner?.includes('tu-usuario') || 
                               this.config.token?.includes('xxxx') || 
                               this.config.owner === 'tu-usuario-github';
        
        if (!hasRequiredFields || hasPlaceholders) {
            console.warn('⚠️ GitHub configuration is incomplete or has placeholder values');
            return false;
        }
        
        return true;
    }

    isConfigured() {
        return this.isConfigured && this.config && this.config.token;
    }

    // Get current active Excel file path
    getCurrentExcelFilePath() {
        const currentExcelFile = localStorage.getItem('supervisionesX_currentExcel');
        if (currentExcelFile && currentExcelFile !== 'muestra_final.xlsx') {
            return `public/uploads/${currentExcelFile}`;
        }
        return this.config?.filePath || 'public/uploads/muestra_final.xlsx';
    }

    // Get repository information
    async getRepoInfo() {
        if (!this.isConfigured()) {
            throw new Error('GitHub not configured. Please set owner, repo, and token.');
        }

        const response = await fetch(`https://api.github.com/repos/${this.config.owner}/${this.config.repo}`, {
            headers: {
                'Authorization': `token ${this.config.token}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to get repository info: ${response.statusText}`);
        }

        return await response.json();
    }

    // Get file content from GitHub
    async getFileContent(filePath = null) {
        if (!this.isConfigured()) {
            throw new Error('GitHub not configured');
        }

        const targetPath = filePath || this.getCurrentExcelFilePath();

        try {
            const response = await fetch(
                `https://api.github.com/repos/${this.config.owner}/${this.config.repo}/contents/${targetPath}?ref=${this.config.branch}`,
                {
                    headers: {
                        'Authorization': `token ${this.config.token}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                }
            );

            if (response.status === 404) {
                // File doesn't exist, return null
                return null;
            }

            if (!response.ok) {
                throw new Error(`Failed to get file: ${response.statusText}`);
            }

            const data = await response.json();
            
            // Decode base64 content
            const content = atob(data.content.replace(/\s/g, ''));
            
            return {
                content: content,
                sha: data.sha,
                path: data.path,
                size: data.size
            };
        } catch (error) {
            console.error('Error getting file content:', error);
            throw error;
        }
    }

    // Update or create file in GitHub
    async updateFile(content, filePath = null, message = 'Update supervisiones data', sha = null) {
        if (!this.isConfigured()) {
            throw new Error('GitHub not configured');
        }

        const targetPath = filePath || this.getCurrentExcelFilePath();

        // Convert content to base64
        const base64Content = btoa(content);

        const body = {
            message: message,
            content: base64Content,
            branch: this.config.branch
        };

        // If SHA is provided, include it for updating existing file
        if (sha) {
            body.sha = sha;
        }

        try {
            const response = await fetch(
                `https://api.github.com/repos/${this.config.owner}/${this.config.repo}/contents/${targetPath}`,
                {
                    method: 'PUT',
                    headers: {
                        'Authorization': `token ${this.config.token}`,
                        'Accept': 'application/vnd.github.v3+json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(body)
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Failed to update file: ${errorData.message || response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error updating file:', error);
            throw error;
        }
    }

    // Load Excel data from GitHub
    async loadExcelData() {
        try {
            const fileData = await this.getFileContent();
            
            if (!fileData) {
                console.log('Excel file not found in repository, using local data');
                return null;
            }

            // Convert content to array buffer for SheetJS
            const arrayBuffer = new ArrayBuffer(fileData.content.length);
            const view = new Uint8Array(arrayBuffer);
            for (let i = 0; i < fileData.content.length; i++) {
                view[i] = fileData.content.charCodeAt(i);
            }

            // Parse Excel file
            const workbook = XLSX.read(arrayBuffer, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);

            return {
                data: jsonData,
                sha: fileData.sha,
                lastModified: new Date().toISOString()
            };
        } catch (error) {
            console.error('Error loading Excel data from GitHub:', error);
            return null;
        }
    }

    // Save Excel data to GitHub (uses current active Excel file)
    async saveExcelData(data, commitMessage = null, userName = 'Usuario') {
        if (!this.isConfigured()) {
            throw new Error('GitHub not configured');
        }

        try {
            // Get current active Excel file path
            const currentFilePath = this.getCurrentExcelFilePath();
            const currentFileName = currentFilePath.split('/').pop();
            
            // Generate commit message if not provided
            const message = commitMessage || `Update progress data in ${currentFileName} by ${userName}`;
            
            // Get current file SHA if it exists
            let currentSha = null;
            try {
                const currentFile = await this.getFileContent(currentFilePath);
                if (currentFile) {
                    currentSha = currentFile.sha;
                }
            } catch (error) {
                // File doesn't exist, that's ok
                console.log(`File ${currentFilePath} does not exist, will create new file`);
            }

            // Convert data to Excel format
            const ws = XLSX.utils.json_to_sheet(data);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Supervisiones");
            const excelBuffer = XLSX.write(wb, { type: 'binary', bookType: 'xlsx' });

            // Update file in GitHub
            const result = await this.updateFile(excelBuffer, currentFilePath, message, currentSha);
            
            console.log(`Successfully saved data to GitHub: ${currentFilePath}`, result);
            return result;
        } catch (error) {
            console.error('Error saving Excel data to GitHub:', error);
            throw error;
        }
    }

    // Upload new Excel file with specific filename to GitHub
    async uploadExcelFile(excelData, fileName, commitMessage = null) {
        if (!this.isConfigured()) {
            throw new Error('GitHub not configured');
        }

        try {
            const filePath = `public/uploads/${fileName}`;
            const message = commitMessage || `Upload new Excel file: ${fileName} (${excelData.length} points)`;
            
            // Check if file already exists
            let currentSha = null;
            try {
                const existingFile = await this.getFileContent(filePath);
                if (existingFile) {
                    currentSha = existingFile.sha;
                    console.log(`File ${fileName} exists, will update it`);
                }
            } catch (error) {
                console.log(`File ${fileName} does not exist, will create new file`);
            }

            // Convert data to Excel format
            const ws = XLSX.utils.json_to_sheet(excelData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Supervisiones");
            const excelBuffer = XLSX.write(wb, { type: 'binary', bookType: 'xlsx' });

            // Upload file to GitHub
            const result = await this.updateFile(excelBuffer, filePath, message, currentSha);
            
            console.log(`Successfully uploaded ${fileName} to GitHub:`, result);
            return {
                success: true,
                fileName: fileName,
                filePath: filePath,
                result: result
            };
        } catch (error) {
            console.error(`Error uploading Excel file ${fileName} to GitHub:`, error);
            throw error;
        }
    }

    // Create a backup of current data
    async createBackup(data) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupPath = `backups/supervisiones_backup_${timestamp}.xlsx`;
        
        try {
            // Convert data to Excel format
            const ws = XLSX.utils.json_to_sheet(data);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Supervisiones");
            const excelBuffer = XLSX.write(wb, { type: 'binary', bookType: 'xlsx' });

            // Save backup
            await this.updateFile(excelBuffer, backupPath, `Backup created on ${new Date().toLocaleString()}`);
            
            console.log('Backup created successfully:', backupPath);
            return backupPath;
        } catch (error) {
            console.error('Error creating backup:', error);
            throw error;
        }
    }

    // Test GitHub connection
    async testConnection() {
        try {
            if (!this.isConfigured()) {
                return {
                    success: false,
                    message: 'GitHub not configured'
                };
            }

            const repoInfo = await this.getRepoInfo();
            return {
                success: true,
                message: `Connected to ${repoInfo.full_name}`,
                repoInfo: repoInfo
            };
        } catch (error) {
            return {
                success: false,
                message: `Connection failed: ${error.message}`
            };
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GitHubIntegration;
}
