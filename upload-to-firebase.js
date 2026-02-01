// Upload demo data to Firebase using Admin SDK
const admin = require('firebase-admin');
const fs = require('fs');

// Initialize Firebase Admin
const serviceAccount = {
  "type": "service_account",
  "project_id": "brain-grain",
  "private_key_id": process.env.FIREBASE_PRIVATE_KEY_ID,
  "private_key": process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  "client_email": process.env.FIREBASE_CLIENT_EMAIL,
  "client_id": process.env.FIREBASE_CLIENT_ID,
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": process.env.FIREBASE_CERT_URL
};

const USER_ID = 'primary_user';

function readJsonFile(filename) {
  const path = `./${filename}`;
  if (fs.existsSync(path)) {
    return JSON.parse(fs.readFileSync(path, 'utf8'));
  }
  return null;
}

async function main() {
  console.log('🔄 Uploading demo data to Firebase...\n');

  try {
    // Check if we have service account credentials
    if (!process.env.FIREBASE_PRIVATE_KEY || !process.env.FIREBASE_CLIENT_EMAIL) {
      console.log('⚠️  No Firebase Admin credentials found.');
      console.log('   Using alternative approach: Update database rules to allow write access.\n');
      console.log('📋 Alternative: Import data through the web app');
      console.log('   1. Save the JSON files');
      console.log('   2. Visit https://brain-grain.vercel.app');
      console.log('   3. Login: admin@braingrain.com / admin123');
      console.log('   4. Use the Import function to load the data');
      console.log('\n📦 JSON files ready:');
      console.log('   - students.json');
      console.log('   - pods.json');
      console.log('   - pod_plans_DEMO_POD_1.json');
      console.log('   - session_feedback_DEMO_POD_1.json');
      return;
    }

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: 'https://brain-grain-default-rtdb.asia-southeast1.firebasedatabase.app'
    });

    const db = admin.database();

    // Load data from JSON files
    const students = readJsonFile('students.json');
    const pods = readJsonFile('pods.json');
    const podPlans = readJsonFile('pod_plans_DEMO_POD_1.json');
    const feedback = readJsonFile('session_feedback_DEMO_POD_1.json');

    if (!students || !pods) {
      throw new Error('Missing required data files');
    }

    // Prepare pod metadata
    const podMetadata = {};
    if (podPlans || feedback) {
      podMetadata['DEMO_POD_1'] = {};
      if (podPlans) podMetadata['DEMO_POD_1'].planHistory = podPlans;
      if (feedback) podMetadata['DEMO_POD_1'].feedback = feedback;
    }

    // Upload complete dataset
    const dataPackage = {
      students: students,
      pods: pods,
      podMetadata: podMetadata,
      lastSync: new Date().toISOString(),
      version: '1.2'
    };

    console.log('📊 Uploading:');
    console.log(`   - ${students.length} students`);
    console.log(`   - ${pods.length} pods`);
    console.log(`   - ${podPlans?.length || 0} session plans`);
    console.log(`   - ${feedback?.length || 0} feedback entries`);
    console.log();

    await db.ref(`brain_grain/${USER_ID}/data`).set(dataPackage);

    console.log('✅ Upload successful!');
    console.log(`\n🌐 View your data at: https://brain-grain.vercel.app`);
    console.log('   Login: admin@braingrain.com / admin123');
    console.log('\n📍 Firebase path: /brain_grain/primary_user/data');

    process.exit(0);
  } catch (error) {
    console.error('❌ Upload failed:', error.message);
    process.exit(1);
  }
}

main();
