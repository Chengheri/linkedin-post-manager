// LinkedIn API Configuration
const config = {
    clientId: '78sx18y82409uh', // Updated client ID
    // Use the GitHub Pages URL format: https://[username].github.io/linkedin-post-manager/
    redirectUri: window.location.href.includes('github.io')
        ? window.location.origin + '/linkedin-post-manager/index.html'  // GitHub Pages
        : window.location.origin + '/index.html', // Local development
    scope: 'r_emailaddress r_liteprofile w_member_social', // Required permissions
    apiBaseUrl: 'https://api.linkedin.com/v2',
    state: generateRandomString(16), // Random state for OAuth security
    authEndpoint: 'https://www.linkedin.com/oauth/v2/authorization',
    tokenEndpoint: 'https://www.linkedin.com/oauth/v2/accessToken',
    // Privacy policy URL - for LinkedIn app registration
    privacyPolicyUrl: window.location.href.includes('github.io')
        ? window.location.origin + '/linkedin-post-manager/privacy-policy.html' // GitHub Pages
        : window.location.origin + '/privacy-policy.html', // Local development
    lastUpdated: Date.now(), // Cache busting timestamp
};

// Generate a random string for the state parameter
function generateRandomString(length) {
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let text = '';
    for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

// Store state in session storage for validation
sessionStorage.setItem('linkedin_auth_state', config.state);
