// Automated setup script for Brain Grain backend
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('\n🚀 Brain Grain Backend Setup\n');

// Check if .env exists
const envPath = path.join(__dirname, '.env');
const envExamplePath = path.join(__dirname, '.env.example');

if (!fs.existsSync(envPath)) {
  console.log('📝 Creating .env file from template...');
  try {
    fs.copyFileSync(envExamplePath, envPath);
    console.log('✅ .env file created');
    console.log('\n⚠️  IMPORTANT: Edit .env and add your API key!');
    console.log('   Get a free Gemini key: https://aistudio.google.com/app/apikey\n');
  } catch (err) {
    console.error('❌ Failed to create .env file:', err.message);
    process.exit(1);
  }
} else {
  console.log('✅ .env file already exists');
}

// Check if AI_API_KEY is configured
try {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const hasKey = envContent.includes('AI_API_KEY=') && 
                 !envContent.includes('AI_API_KEY=your_gemini_api_key_here') &&
                 !envContent.includes('AI_API_KEY=your_openai_api_key_here') &&
                 !envContent.match(/AI_API_KEY=\s*$/m);
  
  if (!hasKey) {
    console.log('\n⚠️  WARNING: AI_API_KEY not configured in .env');
    console.log('   The app will work but AI features will use fallback templates.');
    console.log('   Get a free Gemini key: https://aistudio.google.com/app/apikey\n');
  } else {
    console.log('✅ AI_API_KEY is configured\n');
  }
} catch (err) {
  console.log('⚠️  Could not verify API key configuration\n');
}

// Check if node_modules exists
const nodeModulesPath = path.join(__dirname, 'node_modules');
if (!fs.existsSync(nodeModulesPath)) {
  console.log('📦 Installing dependencies...');
  console.log('   This may take a minute...\n');
  try {
    execSync('npm install', { stdio: 'inherit' });
    console.log('\n✅ Dependencies installed');
  } catch (err) {
    console.error('\n❌ Failed to install dependencies');
    console.error('   Try running: npm install');
    process.exit(1);
  }
} else {
  console.log('✅ Dependencies already installed');
}

console.log('\n✨ Setup complete!\n');
console.log('Next steps:');
console.log('1. Edit .env and add your API key (if not done)');
console.log('2. Run: npm start');
console.log('3. Open: http://localhost:3000\n');
