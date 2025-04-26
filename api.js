// LinkedIn API Service

class LinkedInAPI {
    constructor(auth, config) {
        this.auth = auth;
        this.config = config;
        this.apiBase = config.apiBaseUrl;
    }

    // Helper method for API requests
    async apiRequest(endpoint, method = 'GET', data = null) {
        const token = this.auth.getToken();
        if (!token) {
            throw new Error('Not authenticated');
        }

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
            const response = await fetch(`${this.apiBase}${endpoint}`, options);

            if (!response.ok) {
                throw new Error(`API request failed: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API request error:', error);
            throw error;
        }
    }

    // Get current user's profile
    async getProfile() {
        return this.apiRequest('/me?projection=(id,firstName,lastName,profilePicture(displayImage~:playableStreams))');
    }

    // Get user's recent posts
    async getPosts() {
        // In a real implementation, this would use LinkedIn's UGC API
        // For demo purposes, we'll simulate the response
        return this.simulatePostsResponse();
    }

    // Get scheduled posts
    async getScheduledPosts() {
        // In a real implementation, this would use LinkedIn's UGC API with filters
        // For demo purposes, we'll simulate the response
        return this.simulateScheduledPostsResponse();
    }

    // Create a new post
    async createPost(postData) {
        // In a real implementation, this would send to LinkedIn's UGC API
        // For demo purposes, we'll simulate the response
        return this.simulateCreatePostResponse(postData);
    }

    // Update an existing post
    async updatePost(postId, postData) {
        // In a real implementation, this would update via LinkedIn's UGC API
        // For demo purposes, we'll simulate the response
        return this.simulateUpdatePostResponse(postId, postData);
    }

    // Delete a post
    async deletePost(postId) {
        // In a real implementation, this would delete via LinkedIn's UGC API
        // For demo purposes, we'll simulate the response
        return this.simulateDeletePostResponse(postId);
    }

    // SIMULATION METHODS FOR DEMO PURPOSES
    // These would be replaced with actual API calls in a production app

    simulatePostsResponse() {
        // Simulate a delayed API response
        return new Promise((resolve) => {
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

                resolve(samplePosts);
            }, 800); // Simulate network delay
        });
    }

    simulateScheduledPostsResponse() {
        // Simulate a delayed API response
        return new Promise((resolve) => {
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

                resolve(samplePosts);
            }, 800); // Simulate network delay
        });
    }

    simulateCreatePostResponse(postData) {
        // Simulate a delayed API response
        return new Promise((resolve) => {
            setTimeout(() => {
                // Add an ID and creation date to the post data
                const response = {
                    ...postData,
                    id: `linkedin_${Date.now()}`,
                    createdAt: new Date().toISOString()
                };

                resolve(response);
            }, 800); // Simulate network delay
        });
    }

    simulateUpdatePostResponse(postId, postData) {
        // Simulate a delayed API response
        return new Promise((resolve) => {
            setTimeout(() => {
                // Return the updated post data
                const response = {
                    ...postData,
                    id: postId,
                    updatedAt: new Date().toISOString()
                };

                resolve(response);
            }, 800); // Simulate network delay
        });
    }

    simulateDeletePostResponse(postId) {
        // Simulate a delayed API response
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({ success: true, id: postId });
            }, 800); // Simulate network delay
        });
    }
}

// Initialize the API service after auth is loaded
let api;
document.addEventListener('DOMContentLoaded', () => {
    // Wait for auth to be initialized
    const authCheckInterval = setInterval(() => {
        if (window.auth) {
            api = new LinkedInAPI(auth, config);
            clearInterval(authCheckInterval);
        }
    }, 100);
});
