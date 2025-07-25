// Debug endpoint to check environment variables and GitHub connection
module.exports = async (req, res) => {
    try {
        // Check environment variables
        const envCheck = {
            NODE_ENV: process.env.NODE_ENV,
            hasToken: !!process.env.TOKEN_GITHUB_API,
            tokenLength: process.env.TOKEN_GITHUB_API ? process.env.TOKEN_GITHUB_API.length : 0,
            owner: process.env.GITHUB_OWNER,
            repo: process.env.GITHUB_REPO,
            branch: process.env.GITHUB_BRANCH || 'main',
            filePath: process.env.GITHUB_FILE_PATH || 'uploads'
        };

        console.log('Environment check:', envCheck);

        // Try to initialize Octokit
        let octokitStatus = 'not_initialized';
        try {
            const { Octokit } = require('@octokit/rest');
            const octokit = new Octokit({
                auth: process.env.TOKEN_GITHUB_API,
            });
            
            // Test GitHub API connection
            const user = await octokit.rest.users.getAuthenticated();
            octokitStatus = {
                status: 'connected',
                user: user.data.login,
                permissions: user.data.permissions
            };
        } catch (error) {
            octokitStatus = {
                status: 'error',
                message: error.message,
                code: error.status
            };
        }

        res.json({
            success: true,
            environment: envCheck,
            github: octokitStatus,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Debug endpoint error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            stack: error.stack
        });
    }
};
