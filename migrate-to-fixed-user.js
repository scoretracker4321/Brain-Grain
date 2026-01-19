// Migration Script: Consolidate Firebase data to fixed user ID
// Run this in browser console if you have data under different user IDs

(async function migrateToFixedUser() {
  console.log('🔄 Starting migration to fixed user ID...');
  
  if (!window.FirebaseConfig || !window.FirebaseConfig.isEnabled()) {
    console.error('❌ Firebase not initialized');
    return;
  }
  
  const FIXED_USER_ID = 'primary_user';
  
  // Get Firebase references (assuming they're accessible via window)
  const db = firebase.database();
  
  // List all user IDs in brain_grain
  console.log('📋 Scanning for existing user data...');
  
  const rootSnapshot = await db.ref('brain_grain').once('value');
  const allUserData = rootSnapshot.val() || {};
  
  const userIds = Object.keys(allUserData);
  console.log(`Found ${userIds.length} user ID(s):`, userIds);
  
  if (userIds.length === 0) {
    console.log('ℹ️ No data found to migrate');
    return;
  }
  
  if (userIds.length === 1 && userIds[0] === FIXED_USER_ID) {
    console.log('✅ Already using fixed user ID, no migration needed');
    return;
  }
  
  // Consolidate all data
  let mergedData = {
    students: [],
    pods: [],
    podMetadata: {},
    ai_config: null
  };
  
  for (const userId of userIds) {
    console.log(`Processing user: ${userId}`);
    const userData = allUserData[userId];
    
    // Merge students
    if (userData.data && userData.data.students) {
      mergedData.students.push(...userData.data.students);
      console.log(`  + ${userData.data.students.length} students`);
    }
    
    // Merge pods
    if (userData.data && userData.data.pods) {
      mergedData.pods.push(...userData.data.pods);
      console.log(`  + ${userData.data.pods.length} pods`);
    }
    
    // Merge pod metadata
    if (userData.data && userData.data.podMetadata) {
      Object.assign(mergedData.podMetadata, userData.data.podMetadata);
    }
    
    // Use AI config from most recent user
    if (userData.ai_config && !mergedData.ai_config) {
      mergedData.ai_config = userData.ai_config;
    }
  }
  
  // Remove duplicates based on ID
  mergedData.students = Array.from(
    new Map(mergedData.students.map(s => [s.id, s])).values()
  );
  mergedData.pods = Array.from(
    new Map(mergedData.pods.map(p => [p.id, p])).values()
  );
  
  console.log('\n📊 Merged data summary:');
  console.log(`  Students: ${mergedData.students.length}`);
  console.log(`  Pods: ${mergedData.pods.length}`);
  console.log(`  Pod metadata: ${Object.keys(mergedData.podMetadata).length}`);
  
  // Confirm before proceeding
  console.log('\n⚠️  Ready to migrate to fixed user ID:', FIXED_USER_ID);
  console.log('⚠️  Old user data will be backed up and can be restored if needed');
  
  const confirm = window.confirm(
    `Migrate all data to fixed user ID: "${FIXED_USER_ID}"?\n\n` +
    `This will:\n` +
    `• Combine ${mergedData.students.length} students\n` +
    `• Combine ${mergedData.pods.length} pods\n` +
    `• Use single user ID across all devices\n\n` +
    `Continue?`
  );
  
  if (!confirm) {
    console.log('❌ Migration cancelled');
    return;
  }
  
  try {
    // Backup old data
    const backupRef = db.ref('brain_grain_backup_' + Date.now());
    await backupRef.set(allUserData);
    console.log('✅ Backup created');
    
    // Write merged data to fixed user ID
    await db.ref(`brain_grain/${FIXED_USER_ID}/data`).set({
      students: mergedData.students,
      pods: mergedData.pods,
      podMetadata: mergedData.podMetadata,
      lastSync: new Date().toISOString(),
      version: '1.2'
    });
    
    if (mergedData.ai_config) {
      await db.ref(`brain_grain/${FIXED_USER_ID}/ai_config`).set(mergedData.ai_config);
    }
    
    console.log('✅ Data migrated successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. Refresh the page');
    console.log('2. Your data should now appear');
    console.log('3. All future syncs will use fixed user ID');
    console.log('\n💡 To revert: Check Firebase console for backup under brain_grain_backup_*');
    
    // Update local storage
    localStorage.setItem('braingrain_students', JSON.stringify(mergedData.students));
    localStorage.setItem('braingrain_pods', JSON.stringify(mergedData.pods));
    localStorage.setItem('braingrain_cloud_restored', 'true');
    
    // Prompt to reload
    if (window.confirm('Migration complete! Reload page now?')) {
      location.reload();
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
})();
