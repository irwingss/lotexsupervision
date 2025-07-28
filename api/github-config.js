// Vercel Serverless Function to provide GitHub configuration
// This function securely provides GitHub configuration using Vercel environment variables

export default function handler(req, res) {
    // Only allow GET requests
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Get GitHub configuration from Vercel environment variables
        const config = {
            token: process.env.TOKEN_GITHUB_API,
            owner: process.env.GITHUB_OWNER || 'default-owner',
            repo: process.env.GITHUB_REPO || 'App_Seguimiento_LoteX',
            branch: process.env.GITHUB_BRANCH || 'main',
            filePath: process.env.GITHUB_FILE_PATH || 'public/uploads'
        };

        // Validate that we have the required token
        if (!config.token) {
            return res.status(500).json({ 
                error: 'GitHub token not configured in Vercel environment variables' 
            });
        }

        // Don't expose the full token in logs, just indicate it's present
        console.log('GitHub config requested - token present:', !!config.token);

        // Return configuration (token will be used by client)
        res.status(200).json(config);
    } catch (error) {
        console.error('Error providing GitHub configuration:', error);
        res.status(500).json({ 
            error: 'Failed to provide GitHub configuration' 
        });
    }
}
