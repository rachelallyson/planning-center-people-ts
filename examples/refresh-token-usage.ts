import { 
  createPcoClient, 
  getPeople, 
  type TokenResponse, 
  type TokenRefreshCallback 
} from '../src';

// Example: Using refresh tokens with automatic token refresh

/**
 * Example 1: Basic refresh token setup with callback
 */
async function basicRefreshTokenExample() {
  // Token refresh callback - this is called whenever tokens are refreshed
  const onTokenRefresh: TokenRefreshCallback = async (newTokens: TokenResponse) => {
    console.log('Tokens refreshed successfully!');
    console.log('New access token:', newTokens.access_token);
    console.log('New refresh token:', newTokens.refresh_token);
    console.log('Expires in:', newTokens.expires_in, 'seconds');
    
    // In a real application, you would save these tokens to your database
    // await saveTokensToDatabase(userId, newTokens);
  };

  // Create client with refresh token support
  const client = createPcoClient({
    accessToken: 'your-initial-access-token',
    refreshToken: 'your-refresh-token',
    appId: 'your-app-id', // Required for token refresh
    appSecret: 'your-app-secret', // Required for token refresh
    onTokenRefresh, // Callback for handling token updates
  });

  try {
    // Make API calls - if the access token is expired, it will be automatically refreshed
    const people = await getPeople(client);
    console.log('Retrieved people:', people.data.length);
  } catch (error) {
    console.error('API call failed:', error);
  }
}

/**
 * Example 2: Advanced refresh token handling with database storage
 */
interface UserTokens {
  userId: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}

class TokenManager {
  private tokens: Map<string, UserTokens> = new Map();

  async saveTokens(userId: string, tokenResponse: TokenResponse): Promise<void> {
    const expiresAt = new Date(Date.now() + tokenResponse.expires_in * 1000);
    
    this.tokens.set(userId, {
      userId,
      accessToken: tokenResponse.access_token,
      refreshToken: tokenResponse.refresh_token || this.tokens.get(userId)?.refreshToken || '',
      expiresAt,
    });

    console.log(`Tokens saved for user ${userId}, expires at ${expiresAt.toISOString()}`);
  }

  async getTokens(userId: string): Promise<UserTokens | null> {
    return this.tokens.get(userId) || null;
  }

  createTokenRefreshCallback(userId: string): TokenRefreshCallback {
    return async (newTokens: TokenResponse) => {
      await this.saveTokens(userId, newTokens);
    };
  }
}

async function advancedRefreshTokenExample() {
  const tokenManager = new TokenManager();
  const userId = 'user-123';

  // Simulate loading existing tokens from database
  const existingTokens = await tokenManager.getTokens(userId);
  
  if (!existingTokens) {
    throw new Error('No existing tokens found for user');
  }

  // Create client with refresh token support
  const client = createPcoClient({
    accessToken: existingTokens.accessToken,
    refreshToken: existingTokens.refreshToken,
    appId: 'your-app-id',
    appSecret: 'your-app-secret',
    onTokenRefresh: tokenManager.createTokenRefreshCallback(userId),
  });

  try {
    // Make multiple API calls - tokens will be refreshed automatically as needed
    const [people, households] = await Promise.all([
      getPeople(client),
      getPeople(client, { include: ['household'] }),
    ]);

    console.log('Retrieved people:', people.data.length);
    console.log('Retrieved households:', households.data.length);
  } catch (error) {
    console.error('API calls failed:', error);
  }
}

/**
 * Example 3: Manual token refresh
 */
async function manualTokenRefreshExample() {
  const client = createPcoClient({
    accessToken: 'expired-access-token',
    refreshToken: 'valid-refresh-token',
    appId: 'your-app-id',
    appSecret: 'your-app-secret',
  });

  try {
    // This will fail with 401, but the library will automatically refresh the token
    const people = await getPeople(client);
    console.log('API call succeeded after automatic token refresh');
  } catch (error) {
    console.error('API call failed even after token refresh attempt:', error);
  }
}

/**
 * Example 4: Error handling for refresh token failures
 */
async function refreshTokenErrorHandlingExample() {
  const client = createPcoClient({
    accessToken: 'expired-access-token',
    refreshToken: 'invalid-refresh-token', // This will cause refresh to fail
    appId: 'your-app-id',
    appSecret: 'your-app-secret',
    onTokenRefresh: async (newTokens) => {
      console.log('Tokens refreshed:', newTokens.access_token);
    },
  });

  try {
    const people = await getPeople(client);
    console.log('API call succeeded');
  } catch (error) {
    if (error instanceof Error && error.message.includes('Token refresh failed')) {
      console.log('Token refresh failed - user needs to re-authenticate');
      // Redirect user to login page or show re-authentication UI
    } else {
      console.error('Other API error:', error);
    }
  }
}

/**
 * Example 5: Using with different authentication methods
 */
async function mixedAuthenticationExample() {
  // For server applications, use app credentials (no refresh needed)
  const serverClient = createPcoClient({
    appId: 'your-app-id',
    appSecret: 'your-app-secret',
  });

  // For user applications, use OAuth with refresh tokens
  const userClient = createPcoClient({
    accessToken: 'user-access-token',
    refreshToken: 'user-refresh-token',
    appId: 'your-app-id',
    appSecret: 'your-app-secret',
    onTokenRefresh: async (newTokens) => {
      // Save to user's session or database
      console.log('User tokens refreshed');
    },
  });

  // Both clients can be used interchangeably
  const [serverPeople, userPeople] = await Promise.all([
    getPeople(serverClient),
    getPeople(userClient),
  ]);

  console.log('Server retrieved:', serverPeople.data.length, 'people');
  console.log('User retrieved:', userPeople.data.length, 'people');
}

// Run examples
if (require.main === module) {
  console.log('=== Basic Refresh Token Example ===');
  basicRefreshTokenExample().catch(console.error);

  console.log('\n=== Advanced Refresh Token Example ===');
  advancedRefreshTokenExample().catch(console.error);

  console.log('\n=== Manual Token Refresh Example ===');
  manualTokenRefreshExample().catch(console.error);

  console.log('\n=== Refresh Token Error Handling Example ===');
  refreshTokenErrorHandlingExample().catch(console.error);

  console.log('\n=== Mixed Authentication Example ===');
  mixedAuthenticationExample().catch(console.error);
}

export {
  basicRefreshTokenExample,
  advancedRefreshTokenExample,
  manualTokenRefreshExample,
  refreshTokenErrorHandlingExample,
  mixedAuthenticationExample,
  TokenManager,
};
