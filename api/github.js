// Dynamic import for Vercel compatibility
let Octokit = null;

// Function to get Octokit class
async function getOctokit() {
    if (!Octokit) {
        const octokitModule = await import('@octokit/rest');
        Octokit = octokitModule.Octokit;
    }
    return Octokit;
}

// GitHub configuration from environment variables
const GITHUB_TOKEN = process.env.TOKEN_GITHUB_API;
const GITHUB_OWNER = process.env.GITHUB_OWNER;
const GITHUB_REPO = process.env.GITHUB_REPO;
const GITHUB_BRANCH = process.env.GITHUB_BRANCH || 'main';
const GITHUB_FILE_PATH = process.env.GITHUB_FILE_PATH || 'uploads';

// Debug logging for environment variables
console.log('GitHub Config:', {
    hasToken: !!GITHUB_TOKEN,
    tokenLength: GITHUB_TOKEN ? GITHUB_TOKEN.length : 0,
    owner: GITHUB_OWNER,
    repo: GITHUB_REPO,
    branch: GITHUB_BRANCH,
    filePath: GITHUB_FILE_PATH
});

// Validate required environment variables
if (!GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO) {
    console.error('Missing required GitHub environment variables:', {
        TOKEN_GITHUB_API: !!GITHUB_TOKEN,
        GITHUB_OWNER: !!GITHUB_OWNER,
        GITHUB_REPO: !!GITHUB_REPO
    });
    throw new Error('Missing required GitHub environment variables');
}

// Initialize Octokit instance (will be created dynamically)
let octokit = null;

// Function to get initialized Octokit instance
async function getOctokitInstance() {
    if (!octokit) {
        const OctokitClass = await getOctokit();
        octokit = new OctokitClass({
            auth: GITHUB_TOKEN,
        });
    }
    return octokit;
}

// Helper function to get file content from GitHub
async function getFileFromGitHub(path) {
    try {
        const octokitInstance = await getOctokitInstance();
        const response = await octokitInstance.rest.repos.getContent({
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
    
    const octokitInstance = await getOctokitInstance();
    return await octokitInstance.rest.repos.createOrUpdateFileContents(params);
}

// Helper function to delete file from GitHub
async function deleteFileFromGitHub(path, message) {
    try {
        // First get the file to get its SHA
        const fileData = await getFileFromGitHub(path);
        if (!fileData) {
            throw new Error('File not found');
        }
        
        const octokitInstance = await getOctokitInstance();
        return await octokitInstance.rest.repos.deleteFile({
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
        const octokitInstance = await getOctokitInstance();
        const response = await octokitInstance.rest.repos.getContent({
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
    console.log(`Creating supervision "${name}" in GitHub...`);
    console.log('GitHub config check:', {
        hasToken: !!GITHUB_TOKEN,
        owner: GITHUB_OWNER,
        repo: GITHUB_REPO,
        branch: GITHUB_BRANCH,
        filePath: GITHUB_FILE_PATH
    });
    
    try {
        const supervisionPath = `${GITHUB_FILE_PATH}/${name}`;
        console.log(`Supervision path: ${supervisionPath}`);
        
        // Check if supervision already exists
        console.log('Checking if supervision already exists...');
        const existingContents = await getDirectoryContents(supervisionPath);
        console.log(`Existing contents found: ${existingContents.length} items`);
        
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
        
        console.log(`Creating ${templateFiles.length} template files...`);
        
        // Create each template file
        const promises = templateFiles.map(file => {
            const filePath = `${supervisionPath}/${file.name}`;
            console.log(`Creating file: ${filePath}`);
            return createOrUpdateFileInGitHub(
                filePath,
                file.content,
                `Create ${file.name} for supervision ${name}`
            );
        });
        
        await Promise.all(promises);
        console.log('All template files created successfully');
        
        return { success: true, message: `Supervision "${name}" created successfully in GitHub` };
    } catch (error) {
        console.error('Error creating supervision in GitHub:', {
            message: error.message,
            status: error.status,
            response: error.response?.data,
            stack: error.stack
        });
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
