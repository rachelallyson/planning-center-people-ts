/**
 * Utility to update .env.test file with new tokens
 */
import * as fs from 'fs';
import * as path from 'path';

export interface TokenUpdate {
    accessToken?: string;
    refreshToken?: string;
}

/**
 * Update the .env.test file with new tokens
 */
export async function updateEnvTestFile(tokenUpdate: TokenUpdate): Promise<void> {
    const envPath = path.join(process.cwd(), '.env.test');

    try {
        // Read the current .env.test file
        let envContent = '';
        if (fs.existsSync(envPath)) {
            envContent = fs.readFileSync(envPath, 'utf8');
        }

        // Update or add the token values
        if (tokenUpdate.accessToken) {
            envContent = updateEnvVariable(envContent, 'PCO_ACCESS_TOKEN', tokenUpdate.accessToken);
        }

        if (tokenUpdate.refreshToken) {
            envContent = updateEnvVariable(envContent, 'PCO_REFRESH_TOKEN', tokenUpdate.refreshToken);
        }

        // Write the updated content back to the file
        fs.writeFileSync(envPath, envContent, 'utf8');

        console.log('✅ Updated .env.test file with new tokens');
    } catch (error) {
        console.error('❌ Failed to update .env.test file:', error);
        // Don't throw - this is not critical for test execution
    }
}

/**
 * Update or add an environment variable in the env content
 */
function updateEnvVariable(envContent: string, variableName: string, value: string): string {
    const lines = envContent.split('\n');
    let found = false;

    // Update existing variable
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith(`${variableName}=`)) {
            lines[i] = `${variableName}=${value}`;
            found = true;
            break;
        }
    }

    // Add new variable if not found
    if (!found) {
        lines.push(`${variableName}=${value}`);
    }

    return lines.join('\n');
}

/**
 * Get the current tokens from .env.test file
 */
export function getCurrentTokens(): { accessToken?: string; refreshToken?: string } {
    const envPath = path.join(process.cwd(), '.env.test');

    if (!fs.existsSync(envPath)) {
        return {};
    }

    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');

    let accessToken: string | undefined;
    let refreshToken: string | undefined;

    for (const line of lines) {
        if (line.startsWith('PCO_ACCESS_TOKEN=')) {
            accessToken = line.split('=')[1];
        } else if (line.startsWith('PCO_REFRESH_TOKEN=')) {
            refreshToken = line.split('=')[1];
        }
    }

    return { accessToken, refreshToken };
}
