const { Octokit } = require('@octokit/rest');

// GitHub configuration from environment variables
const GITHUB_TOKEN = process.env.TOKEN_GITHUB_API;
const GITHUB_OWNER = process.env.GITHUB_OWNER;
const GITHUB_REPO = process.env.GITHUB_REPO;
const GITHUB_BRANCH = process.env.GITHUB_BRANCH || 'main';
const GITHUB_FILE_PATH = process.env.GITHUB_FILE_PATH || 'uploads';

// Initialize Octokit
const octokit = new Octokit({
    auth: GITHUB_TOKEN,
});

// Helper function to get file content from GitHub
async function getFileFromGitHub(path) {
    try {
        const response = await octokit.rest.repos.getContent({
            owner: GITHUB_OWNER,
            repo: GITHUB_REPO,
            path: path,
            ref: GITHUB_BRANCH,
        });
        
        if (response.data.type === 'file') {
            return {
                content: Buffer.from(response.data.content, 'base64').toString('utf8'),
                sha: response.data.sha
            };
        }
        return null;
    } catch (error) {
        if (error.status === 404) {
            return null; // File doesn't exist
        }
        throw error;
    }
}

// Helper function to create or update file in GitHub
async function createOrUpdateFileInGitHub(path, content, message, sha = null) {
    const params = {
        owner: GITHUB_OWNER,
        repo: GITHUB_REPO,
        path: path,
        message: message,
        content: Buffer.from(content).toString('base64'),
        branch: GITHUB_BRANCH,
    };
    
    if (sha) {
        params.sha = sha;
    }
    
    return await octokit.rest.repos.createOrUpdateFileContents(params);
}

// Helper function to delete file from GitHub
async function deleteFileFromGitHub(path, message) {
    try {
        // First get the file to get its SHA
        const fileData = await getFileFromGitHub(path);
        if (!fileData) {
            throw new Error('File not found');
        }
        
        return await octokit.rest.repos.deleteFile({
            owner: GITHUB_OWNER,
            repo: GITHUB_REPO,
            path: path,
            message: message,
            sha: fileData.sha,
            branch: GITHUB_BRANCH,
        });
    } catch (error) {
        throw new Error(`Error deleting file: ${error.message}`);
    }
}

// Get directory contents from GitHub
async function getDirectoryContents(path = GITHUB_FILE_PATH) {
    try {
        const response = await octokit.rest.repos.getContent({
            owner: GITHUB_OWNER,
            repo: GITHUB_REPO,
            path: path,
            ref: GITHUB_BRANCH,
        });
        
        if (Array.isArray(response.data)) {
            return response.data;
        }
        return [];
    } catch (error) {
        if (error.status === 404) {
            return []; // Directory doesn't exist
        }
        throw error;
    }
}

// Create supervision folder in GitHub by creating template files
async function createSupervisionInGitHub(name) {
    try {
        const supervisionPath = `${GITHUB_FILE_PATH}/${name}`;
        
        // Check if supervision already exists
        const existingContents = await getDirectoryContents(supervisionPath);
        if (existingContents.length > 0) {
            throw new Error('Supervision already exists');
        }
        
        // Template files to create
        const templateFiles = [
            { name: 'muestra_final.txt', content: '' },
            { name: 'pafs.txt', content: '' },
            { name: 'pd.txt', content: '' },
            { name: 'locaciones.txt', content: '' }
        ];
        
        // Create each template file
        const promises = templateFiles.map(file => {
            const filePath = `${supervisionPath}/${file.name}`;
            return createOrUpdateFileInGitHub(
                filePath,
                file.content,
                `Create ${file.name} for supervision ${name}`
            );
        });
        
        await Promise.all(promises);
        
        return { success: true, message: `Supervision "${name}" created successfully in GitHub` };
    } catch (error) {
        console.error('Error creating supervision in GitHub:', error);
        throw new Error(`Error creating supervision: ${error.message}`);
    }
}

// Delete supervision folder from GitHub by deleting all its files
async function deleteSupervisionFromGitHub(name) {
    try {
        const supervisionPath = `${GITHUB_FILE_PATH}/${name}`;
        
        // Get all files in the supervision folder
        const contents = await getDirectoryContents(supervisionPath);
        
        if (contents.length === 0) {
            throw new Error('Supervision not found');
        }
        
        // Delete all files in the supervision folder
        const deletePromises = contents
            .filter(item => item.type === 'file')
            .map(file => deleteFileFromGitHub(file.path, `Delete ${file.name} from supervision ${name}`));
        
        await Promise.all(deletePromises);
        
        return { success: true, message: `Supervision "${name}" deleted successfully from GitHub` };
    } catch (error) {
        console.error('Error deleting supervision from GitHub:', error);
        throw new Error(`Error deleting supervision: ${error.message}`);
    }
}

// Get list of supervisions from GitHub
async function getSupervisionsList() {
    try {
        const contents = await getDirectoryContents(GITHUB_FILE_PATH);
        
        const supervisions = contents
            .filter(item => item.type === 'dir')
            .map(dir => ({
                name: dir.name,
                type: 'directory',
                url: dir.html_url
            }));
        
        return supervisions;
    } catch (error) {
        console.error('Error getting supervisions list from GitHub:', error);
        return [];
    }
}

// Get files in a supervision folder
async function getSupervisionFiles(supervisionName) {
    try {
        const supervisionPath = `${GITHUB_FILE_PATH}/${supervisionName}`;
        const contents = await getDirectoryContents(supervisionPath);
        
        const files = contents
            .filter(item => item.type === 'file')
            .map(file => ({
                name: file.name,
                size: file.size,
                downloadUrl: file.download_url,
                path: file.path
            }));
        
        return files;
    } catch (error) {
        console.error('Error getting supervision files from GitHub:', error);
        return [];
    }
}

// Upload file to supervision folder in GitHub
async function uploadFileToSupervision(supervisionName, fileName, fileContent) {
    try {
        const filePath = `${GITHUB_FILE_PATH}/${supervisionName}/${fileName}`;
        
        // Check if file already exists
        const existingFile = await getFileFromGitHub(filePath);
        
        const result = await createOrUpdateFileInGitHub(
            filePath,
            fileContent,
            existingFile ? `Update ${fileName} in supervision ${supervisionName}` : `Add ${fileName} to supervision ${supervisionName}`,
            existingFile ? existingFile.sha : null
        );
        
        return { 
            success: true, 
            message: `File "${fileName}" ${existingFile ? 'updated' : 'uploaded'} successfully`,
            url: result.data.content.html_url
        };
    } catch (error) {
        console.error('Error uploading file to GitHub:', error);
        throw new Error(`Error uploading file: ${error.message}`);
    }
}

module.exports = {
    getFileFromGitHub,
    createOrUpdateFileInGitHub,
    deleteFileFromGitHub,
    getDirectoryContents,
    createSupervisionInGitHub,
    deleteSupervisionFromGitHub,
    getSupervisionsList,
    getSupervisionFiles,
    uploadFileToSupervision
};
