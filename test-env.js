// Test script to verify environment variables
console.log('🔍 Testing Environment Variables...');

// Check if .env file exists
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.join(__dirname, '.env');

if (fs.existsSync(envPath)) {
  console.log('✅ .env file found');
  
  // Read and display the content (without showing the full API key for security)
  const envContent = fs.readFileSync(envPath, 'utf8');
  const lines = envContent.split('\n');
  
  lines.forEach(line => {
    if (line.trim() && !line.startsWith('#')) {
      const [key, value] = line.split('=');
      if (key === 'VITE_ASSEMBLYAI_API_KEY') {
        console.log(`✅ ${key}=${value.substring(0, 8)}...${value.substring(value.length - 4)}`);
      } else {
        console.log(`✅ ${line}`);
      }
    }
  });
} else {
  console.log('❌ .env file not found');
}

console.log('\n🎯 Next Steps:');
console.log('1. Open http://localhost:8080 in your browser');
console.log('2. Sign in or create an account');
console.log('3. Look for the "AssemblyAI Direct Test" section');
console.log('4. Click to expand it and test the recording feature');
console.log('5. Record some audio and see the AssemblyAI analysis results!'); 