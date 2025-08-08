#!/usr/bin/env node

import { execSync } from 'child_process';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const PROJECT_REF = 'ahpmmgnkksrbpthniptg';

console.log('=== Trieve API Configuration for Supabase Edge Functions ===\n');
console.log('This script will help you set up the required Trieve API credentials.');
console.log('You need to have a Trieve account and API key ready.\n');
console.log('Get your API key from: https://dashboard.trieve.ai/settings/api-keys');
console.log('Get your Organization ID from: https://dashboard.trieve.ai/settings\n');

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function main() {
  try {
    // Ask for Trieve API Key
    const trieveApiKey = await askQuestion('Enter your Trieve API Key: ');
    if (!trieveApiKey) {
      console.error('Error: Trieve API Key is required');
      process.exit(1);
    }

    // Ask for Trieve Organization ID
    const trieveOrgId = await askQuestion('Enter your Trieve Organization ID: ');
    if (!trieveOrgId) {
      console.error('Error: Trieve Organization ID is required');
      process.exit(1);
    }

    console.log('\nSetting up Supabase secrets...');

    // Set TRIEVE_API_KEY
    try {
      execSync(`npx supabase secrets set TRIEVE_API_KEY="${trieveApiKey}" --project-ref ${PROJECT_REF}`, {
        stdio: 'inherit'
      });
      console.log('✓ TRIEVE_API_KEY set successfully');
    } catch (error) {
      console.error('✗ Failed to set TRIEVE_API_KEY:', error.message);
    }

    // Set TRIEVE_ORG_ID
    try {
      execSync(`npx supabase secrets set TRIEVE_ORG_ID="${trieveOrgId}" --project-ref ${PROJECT_REF}`, {
        stdio: 'inherit'
      });
      console.log('✓ TRIEVE_ORG_ID set successfully');
    } catch (error) {
      console.error('✗ Failed to set TRIEVE_ORG_ID:', error.message);
    }

    console.log('\n=== Configuration Complete ===');
    console.log('\nThe following secrets have been set:');
    console.log('- TRIEVE_API_KEY');
    console.log('- TRIEVE_ORG_ID');
    console.log('\nYour edge functions should now be able to connect to Trieve!');
    console.log('\nNext steps:');
    console.log('1. Try uploading knowledge to an agent');
    console.log('2. Check the edge function logs if you encounter any issues');
    console.log('3. Verify your Trieve dashboard shows the created datasets');

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    rl.close();
  }
}

main();
