// LinkedIn API Service

class LinkedInAPI {
    constructor(auth, config) {
        this.auth = auth || null;
        this.config = config || {};
        this.apiBase = config ? config.apiBaseUrl : 'https://api.linkedin.com/v2';

        // Debug log
        console.log('API service initialized with config', this.config);
        console.log('API initialized with auth object:', this.auth ? 'present' : 'missing');
    }

    // Helper method for API requests
    async apiRequest(endpoint, method = 'GET', data = null) {
        // Make sure we have up-to-date auth reference
        if (window.auth) {
            this.auth = window.auth;
            console.log('Updated auth reference from window.auth');
        } else if (localStorage.getItem('linkedin_manual_token')) {
            console.log('Creating auth reference from manual token');
            // Create a minimal auth object
            this.auth = {
                getToken: function() {
                    return localStorage.getItem('linkedin_manual_token');
                }
            };
        }

        const token = this.auth ? this.auth.getToken() : null;
        if (!token) {
            console.error('API Request Error: No authentication token available');
            throw new Error('Not authenticated');
        }

        console.log(`Making ${method} request to ${endpoint} with token:`, token.substring(0, 10) + '...');

        const options = {
            method,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            }
        };

        if (data && (method === 'POST' || method === 'PUT')) {
            options.body = JSON.stringify(data);
        }

        try {
            console.log(`Fetching ${this.apiBase}${endpoint} with options:`, options);
            const response = await fetch(`${this.apiBase}${endpoint}`, options);

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`API response error (${response.status}):`, errorText);
                throw new Error(`API request failed: ${response.status} - ${errorText}`);
            }

            const responseData = await response.json();
            console.log('API response success:', responseData);
            return responseData;
        } catch (error) {
            console.error('API request error:', error);
            throw error;
        }
    }

    // Get current user's profile
    async getProfile() {
        try {
            console.log('Fetching user profile');
            return this.apiRequest('/me?projection=(id,firstName,lastName,profilePicture(displayImage~:playableStreams))');
        } catch (error) {
            console.error('Error fetching profile:', error);
            // For demo, return a simulated profile
            return this.simulateProfileResponse();
        }
    }

    // Simulate profile response for testing
    simulateProfileResponse() {
        console.log('Using simulated profile response');
        return {
            id: 'simulated-user-id',
            firstName: {
                localized: {
                    'en_US': 'Demo'
                }
            },
            lastName: {
                localized: {
                    'en_US': 'User'
                }
            }
        };
    }

    // Get user's recent posts
    async getPosts() {
        try {
            console.log('Attempting to fetch posts from LinkedIn API');
            const token = this.auth.getToken();

            if (!token) {
                throw new Error('No authentication token available');
            }

            console.log('Using token:', token.substring(0, 10) + '...');

            // Try to get user profile first to get the user ID
            const profileEndpoint = '/me';
            console.log('Fetching user profile from:', this.apiBase + profileEndpoint);

            const profileResponse = await fetch(`${this.apiBase}${profileEndpoint}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                }
            });

            if (!profileResponse.ok) {
                const errorText = await profileResponse.text();
                console.error(`LinkedIn API profile error (${profileResponse.status}):`, errorText);
                console.log('Using simulated data instead');
                return this.simulatePostsResponse();
            }

            const profileData = await profileResponse.json();
            console.log('Profile data received:', profileData);

            // Get the user ID from the profile
            const userId = profileData.id;
            if (!userId) {
                console.error('Could not find user ID in profile response');
                return this.simulatePostsResponse();
            }

            // Now try to fetch the posts
            const postsEndpoint = `/shares?q=owners&owners=${encodeURIComponent(`urn:li:person:${userId}`)}`;
            console.log('Fetching posts from:', this.apiBase + postsEndpoint);

            const postsResponse = await fetch(`${this.apiBase}${postsEndpoint}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                }
            });

            if (!postsResponse.ok) {
                const errorText = await postsResponse.text();
                console.error(`LinkedIn API posts error (${postsResponse.status}):`, errorText);
                console.log('Using simulated data instead');
                return this.simulatePostsResponse();
            }

            const postsData = await postsResponse.json();
            console.log('Posts data received:', postsData);

            // Transform the LinkedIn API response to our app's format
            const formattedPosts = this.formatLinkedInPosts(postsData);
            console.log('Formatted posts:', formattedPosts);

            return formattedPosts.length > 0 ? formattedPosts : this.simulatePostsResponse();

        } catch (error) {
            console.log('Error fetching posts:', error.message);
            // In a real implementation, this would use LinkedIn's UGC API
            // For demo purposes, we'll simulate the response
            return this.simulatePostsResponse();
        }
    }

    // Format LinkedIn posts to match our app's data structure
    formatLinkedInPosts(apiResponse) {
        try {
            console.log('Raw LinkedIn API response:', JSON.stringify(apiResponse, null, 2));

            if (!apiResponse || !apiResponse.elements || !Array.isArray(apiResponse.elements)) {
                console.error('Invalid LinkedIn API response format');
                return [];
            }

            const formattedPosts = apiResponse.elements.map(post => {
                console.log('Processing LinkedIn post:', post);

                // Extract post information from LinkedIn API response
                const createdTime = post.created ? post.created.time : Date.now();

                // Extract content - handle different response formats
                let content = 'No content available';
                let title = 'LinkedIn Post';

                // Check for different content locations in the API response
                if (post.text && typeof post.text.text === 'string') {
                    content = post.text.text;
                } else if (post.text && typeof post.text === 'string') {
                    content = post.text;
                } else if (post.commentary && typeof post.commentary.text === 'string') {
                    content = post.commentary.text;
                } else if (post.message && typeof post.message.text === 'string') {
                    content = post.message.text;
                } else if (typeof post.content === 'string') {
                    content = post.content;
                }

                // Create a title from content or use a fallback
                if (content && content !== 'No content available') {
                    title = content.substring(0, 50) + (content.length > 50 ? '...' : '');
                } else if (post.title) {
                    title = post.title;
                } else if (post.subject) {
                    title = post.subject;
                }

                console.log('Extracted title:', title);
                console.log('Extracted content:', content.substring(0, 100) + (content.length > 100 ? '...' : ''));

                // Extract engagement metrics if available
                const likes = post.totalSocialActivityCounts ? (post.totalSocialActivityCounts.likes || 0) : 0;
                const comments = post.totalSocialActivityCounts ? (post.totalSocialActivityCounts.comments || 0) : 0;
                const shares = post.totalSocialActivityCounts ? (post.totalSocialActivityCounts.shares || 0) : 0;

                return {
                    id: `linkedin_${post.id || Date.now()}`,
                    title: title,
                    content: content,
                    status: 'published',
                    createdAt: new Date(createdTime).toISOString(),
                    scheduledDate: null,
                    engagement: {
                        likes: likes,
                        comments: comments,
                        shares: shares
                    }
                };
            });

            console.log('Formatted posts:', formattedPosts);
            return formattedPosts;
        } catch (error) {
            console.error('Error formatting LinkedIn posts:', error);
            return [];
        }
    }

    // Get scheduled posts
    async getScheduledPosts() {
        try {
            console.log('Attempting to fetch scheduled posts');
            // First try real API call
            //const scheduledPosts = await this.apiRequest('/ugcPosts?q=authors&authors=List(urn%3Ali%3Aperson%3A<id>)&status=SCHEDULED');
            //return scheduledPosts;

            // If that fails or for demo, throw to use simulation
            throw new Error('Using simulated scheduled posts for demo');
        } catch (error) {
            console.log('Using simulated scheduled posts response due to:', error.message);
            // In a real implementation, this would use LinkedIn's UGC API with filters
            // For demo purposes, we'll simulate the response
            return this.simulateScheduledPostsResponse();
        }
    }

    // Create a new post
    async createPost(postData) {
        try {
            console.log('Attempting to create post:', postData);
            // First try real API call
            //const createdPost = await this.apiRequest('/ugcPosts', 'POST', postData);
            //return createdPost;

            // If that fails or for demo, throw to use simulation
            throw new Error('Using simulated create post for demo');
        } catch (error) {
            console.log('Using simulated create post response due to:', error.message);
            // In a real implementation, this would send to LinkedIn's UGC API
            // For demo purposes, we'll simulate the response
            return this.simulateCreatePostResponse(postData);
        }
    }

    // Update an existing post
    async updatePost(postId, postData) {
        try {
            console.log('Attempting to update post:', postId);
            // First try real API call
            //const updatedPost = await this.apiRequest(`/ugcPosts/${postId}`, 'PUT', postData);
            //return updatedPost;

            // If that fails or for demo, throw to use simulation
            throw new Error('Using simulated update post for demo');
        } catch (error) {
            console.log('Using simulated update post response due to:', error.message);
            // In a real implementation, this would update via LinkedIn's UGC API
            // For demo purposes, we'll simulate the response
            return this.simulateUpdatePostResponse(postId, postData);
        }
    }

    // Delete a post
    async deletePost(postId) {
        try {
            console.log('Attempting to delete post:', postId);
            // First try real API call
            //await this.apiRequest(`/ugcPosts/${postId}`, 'DELETE');
            //return { success: true, id: postId };

            // If that fails or for demo, throw to use simulation
            throw new Error('Using simulated delete post for demo');
        } catch (error) {
            console.log('Using simulated delete post response due to:', error.message);
            // In a real implementation, this would delete via LinkedIn's UGC API
            // For demo purposes, we'll simulate the response
            return this.simulateDeletePostResponse(postId);
        }
    }

    // SIMULATION METHODS FOR DEMO PURPOSES
    // These would be replaced with actual API calls in a production app

    simulatePostsResponse() {
        // Simulate a delayed API response
        return new Promise((resolve) => {
            console.log('Generating simulated posts');
            setTimeout(() => {
                // Generate some sample posts with random engagement
                const samplePosts = [];
                const statuses = ['published', 'draft'];
                const now = new Date();

                for (let i = 1; i <= 5; i++) {
                    const createDate = new Date(now);
                    createDate.setDate(now.getDate() - i);

                    samplePosts.push({
                        id: `linkedin_${Date.now()}_${i}`,
                        title: `LinkedIn API Post ${i}`,
                        content: `This is content for post ${i} imported from LinkedIn API.`,
                        status: statuses[Math.floor(Math.random() * statuses.length)],
                        createdAt: createDate.toISOString(),
                        scheduledDate: null,
                        engagement: {
                            likes: Math.floor(Math.random() * 100),
                            comments: Math.floor(Math.random() * 30),
                            shares: Math.floor(Math.random() * 15)
                        }
                    });
                }

                console.log('Generated simulated posts:', samplePosts.length);
                resolve(samplePosts);
            }, 800); // Simulate network delay
        });
    }

    simulateScheduledPostsResponse() {
        // Simulate a delayed API response
        return new Promise((resolve) => {
            console.log('Generating simulated scheduled posts');
            setTimeout(() => {
                // Generate some sample scheduled posts
                const samplePosts = [];
                const now = new Date();

                for (let i = 1; i <= 3; i++) {
                    const scheduleDate = new Date(now);
                    scheduleDate.setDate(now.getDate() + i);
                    scheduleDate.setHours(9 + i, 0, 0, 0);

                    samplePosts.push({
                        id: `linkedin_scheduled_${Date.now()}_${i}`,
                        title: `Scheduled LinkedIn Post ${i}`,
                        content: `This is content for scheduled post ${i} imported from LinkedIn API.`,
                        status: 'scheduled',
                        createdAt: new Date().toISOString(),
                        scheduledDate: scheduleDate.toISOString(),
                        engagement: {
                            likes: 0,
                            comments: 0,
                            shares: 0
                        }
                    });
                }

                console.log('Generated simulated scheduled posts:', samplePosts.length);
                resolve(samplePosts);
            }, 800); // Simulate network delay
        });
    }

    simulateCreatePostResponse(postData) {
        // Simulate a delayed API response
        return new Promise((resolve) => {
            console.log('Simulating post creation');
            setTimeout(() => {
                // Add an ID and creation date to the post data
                const response = {
                    ...postData,
                    id: `linkedin_${Date.now()}`,
                    createdAt: new Date().toISOString()
                };

                console.log('Simulated post creation response:', response);
                resolve(response);
            }, 800); // Simulate network delay
        });
    }

    simulateUpdatePostResponse(postId, postData) {
        // Simulate a delayed API response
        return new Promise((resolve) => {
            console.log('Simulating post update for:', postId);
            setTimeout(() => {
                // Return the updated post data
                const response = {
                    ...postData,
                    id: postId,
                    updatedAt: new Date().toISOString()
                };

                console.log('Simulated post update response:', response);
                resolve(response);
            }, 800); // Simulate network delay
        });
    }

    simulateDeletePostResponse(postId) {
        // Simulate a delayed API response
        return new Promise((resolve) => {
            console.log('Simulating post deletion for:', postId);
            setTimeout(() => {
                console.log('Simulated successful deletion');
                resolve({ success: true, id: postId });
            }, 800); // Simulate network delay
        });
    }
}

// Make sure the API is initialized when auth changes
function initializeAPI() {
    console.log('Attempting to initialize API service');

    // DEBUG: Add more info about current state
    console.log('Current state check:');
    console.log('- window.auth exists:', !!window.auth);
    console.log('- window.config exists:', !!window.config);
    console.log('- manual token exists:', !!localStorage.getItem('linkedin_manual_token'));
    console.log('- access token exists:', !!localStorage.getItem('linkedin_access_token'));

    try {
        // Even if window.auth doesn't exist, create a minimal version that will be updated later
        if (!window.auth && localStorage.getItem('linkedin_manual_token')) {
            console.log('Creating temporary auth object from manual token');
            // Create a minimal mock auth object
            window.auth = {
                getToken: function() {
                    return localStorage.getItem('linkedin_manual_token');
                },
                isAuthenticated: function() {
                    return !!localStorage.getItem('linkedin_manual_token');
                }
            };
        }

        if (!window.config) {
            console.error('Config not available, cannot initialize API');
            console.log('Attempting to create minimal config');
            window.config = {
                apiBaseUrl: 'https://api.linkedin.com/v2'
            };
        }

        console.log('Creating new LinkedInAPI instance');
        window.api = new LinkedInAPI(window.auth || {}, window.config);
        console.log('API service initialized and assigned to window.api');
        return true;
    } catch (error) {
        console.error('Error initializing API:', error.message);
        console.error('Full error:', error);
        return false;
    }
}

// Initialize the API service whenever the page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, trying to initialize API');

    // First attempt at initialization
    if (initializeAPI()) {
        console.log('API initialized on page load');
        return;
    }

    // If not successful, wait for auth to be available
    console.log('Waiting for auth to be available');
    const authCheckInterval = setInterval(() => {
        if (window.auth) {
            console.log('Auth detected, initializing API service');
            if (initializeAPI()) {
                console.log('API service connected');
                clearInterval(authCheckInterval);
            }
        }
    }, 100);
});

// Add a global function to manually reinitialize API
window.reinitializeAPI = function() {
    console.log('Manual API reinitialization requested');
    return initializeAPI();
};
