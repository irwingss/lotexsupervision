// GitHub Integration for Supervisiones X
// Handles reading and updating Excel files in GitHub repository

class GitHubIntegration {
    constructor(config = {}) {
        // Use hardcoded GitHub configuration from github-config.js
        if (typeof GITHUB_CONFIG !== 'undefined') {
            this.owner = GITHUB_CONFIG.owner;
            this.repo = GITHUB_CONFIG.repo;
            this.token = GITHUB_CONFIG.token;
            this.branch = GITHUB_CONFIG.branch;
            this.uploadsPath = GITHUB_CONFIG.uploadsPath;
            this.backupPath = GITHUB_CONFIG.backupPath;
            this.autoSync = GITHUB_CONFIG.autoSync;
            this.commitMessages = GITHUB_CONFIG.commitMessages;
            
            // Default file path (fallback only, actual active file is managed by ExcelManager)
            this.defaultFilePath = GITHUB_CONFIG.uploadsPath + GITHUB_CONFIG.defaultExcelFile;
        } else {
            // Fallback configuration if github-config.js is not loaded
            console.warn('GITHUB_CONFIG not found, using fallback configuration');
            this.owner = 'tu-usuario-github';
            this.repo = 'App_Seguimiento_LoteX';
            this.token = 'ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';
            this.branch = 'main';
            this.uploadsPath = 'public/uploads/';
            this.backupPath = 'public/backups/';
            this.autoSync = true;
            this.defaultFilePath = 'public/uploads/muestra_final.xlsx';
            this.commitMessages = {
                upload: (fileName, pointCount) => `Upload new Excel file: ${fileName} (${pointCount} points)`,
                update: (fileName, user) => `Update progress data in ${fileName} by ${user}`,
                backup: (fileName) => `Backup created for ${fileName}`,
                sync: () => `Auto-sync from Supervisiones X app - ${new Date().toLocaleString()}`
            };
        }
        
        this.apiBase = 'https://api.github.com';
        
        // Override with config if provided (for testing purposes)
        if (config.owner) this.owner = config.owner;
        if (config.repo) this.repo = config.repo;
        if (config.token) this.token = config.token;
        if (config.branch) this.branch = config.branch;
        if (config.filePath) this.filePath = config.filePath;
        
        // Validate configuration
        this.validateConfig();
    }

    // Validate GitHub configuration
    validateConfig() {
        if (typeof validateGitHubConfig === 'function') {
            const isValid = validateGitHubConfig();
            if (!isValid) {
                console.warn('⚠️ GitHub configuration needs to be updated in github-config.js');
            }
            return isValid;
        }
        
        // Basic validation if validateGitHubConfig function is not available
        const hasPlaceholders = this.owner.includes('tu-usuario') || 
                               this.token.includes('xxxx') || 
                               this.owner === 'tu-usuario-github';
        
        if (hasPlaceholders) {
            console.warn('⚠️ Please update GitHub configuration with real values');
            return false;
        }
        
        return true;
    }

    // Configure GitHub repository details (legacy method, now uses hardcoded config)
    configure(owner, repo, token, branch = 'main', filePath = 'data/supervisiones_data.xlsx') {
        console.warn('configure() method is deprecated. Configuration is now hardcoded in github-config.js');
        // Only allow override for testing
        if (owner && repo && token) {
            this.owner = owner;
            this.repo = repo;
            this.token = token;
            this.branch = branch;
            this.filePath = filePath;
        }
    }

    // Check if GitHub is properly configured
    isConfigured() {
        return !!(this.owner && this.repo && this.token);
    }

    // Get current active Excel file path (from ExcelManager)
    getCurrentExcelFilePath() {
        const currentExcelFile = localStorage.getItem('supervisionesX_currentExcel');
        if (currentExcelFile && currentExcelFile !== 'muestra_final.xlsx') {
            return `${this.uploadsPath}${currentExcelFile}`;
        }
        return this.defaultFilePath;
    }

    // Get repository information
    async getRepoInfo() {
        if (!this.isConfigured()) {
            throw new Error('GitHub not configured. Please set owner, repo, and token.');
        }

        const response = await fetch(`${this.apiBase}/repos/${this.owner}/${this.repo}`, {
            headers: {
                'Authorization': `token ${this.token}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to get repository info: ${response.statusText}`);
        }

        return await response.json();
    }

    // Get file content from GitHub
    async getFileContent(filePath = this.filePath) {
        if (!this.isConfigured()) {
            throw new Error('GitHub not configured');
        }

        try {
            const response = await fetch(
                `${this.apiBase}/repos/${this.owner}/${this.repo}/contents/${filePath}?ref=${this.branch}`,
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
    async updateFile(content, filePath = this.config.filePath, message = 'Update supervisiones data', sha = null) {
        if (!this.isConfigured()) {
            throw new Error('GitHub not configured');
        }

        // Convert content to base64
        const base64Content = btoa(content);

        const body = {
            message: message,
            content: base64Content,
            branch: this.branch
        };

        // If SHA is provided, include it for updating existing file
        if (sha) {
            body.sha = sha;
        }

        try {
            const response = await fetch(
                `${this.apiBase}/repos/${this.owner}/${this.repo}/contents/${filePath}`,
                {
                    method: 'PUT',
                    headers: {
                        'Authorization': `token ${this.token}`,
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
            const message = commitMessage || this.commitMessages.update(currentFileName, userName);
            
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
            const filePath = `${this.uploadsPath}${fileName}`;
            const message = commitMessage || this.commitMessages.upload(fileName, excelData.length);
            
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

    // List all commits for the data file
    async getFileHistory(filePath = this.filePath) {
        if (!this.isConfigured()) {
            throw new Error('GitHub not configured');
        }

        try {
            const response = await fetch(
                `${this.apiBase}/repos/${this.owner}/${this.repo}/commits?path=${filePath}&per_page=10`,
                {
                    headers: {
                        'Authorization': `token ${this.token}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                }
            );

            if (!response.ok) {
                throw new Error(`Failed to get file history: ${response.statusText}`);
            }

            const commits = await response.json();
            return commits.map(commit => ({
                sha: commit.sha,
                message: commit.commit.message,
                date: commit.commit.author.date,
                author: commit.commit.author.name
            }));
        } catch (error) {
            console.error('Error getting file history:', error);
            throw error;
        }
    }

    // Sync local data with GitHub
    async syncData(localData) {
        try {
            console.log('Starting data synchronization with GitHub...');
            
            // Create backup first
            await this.createBackup(localData);
            
            // Save current data to GitHub
            const result = await this.saveExcelData(localData, 
                `Data sync from Supervisiones X - ${new Date().toLocaleString()}`);
            
            console.log('Data synchronization completed successfully');
            return result;
        } catch (error) {
            console.error('Error during data synchronization:', error);
            throw error;
        }
    }

    // Test GitHub connection
    async testConnection() {
        try {
            const repoInfo = await this.getRepoInfo();
            return {
                success: true,
                message: `Connected to ${repoInfo.full_name}`,
                repoInfo: {
                    name: repoInfo.name,
                    fullName: repoInfo.full_name,
                    private: repoInfo.private,
                    defaultBranch: repoInfo.default_branch
                }
            };
        } catch (error) {
            return {
                success: false,
                message: error.message,
                error: error
            };
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GitHubIntegration;
} else {
    window.GitHubIntegration = GitHubIntegration;
}
