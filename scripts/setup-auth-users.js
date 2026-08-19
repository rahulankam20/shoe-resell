import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function setupUsers() {
  const users = [
    { email: 'admin@solevault.in', password: 'Admin@Sole2025', fullName: 'SoleVault Admin', role: 'admin' },
    { email: 'demo@solevault.in', password: 'Demo@Sole2025', fullName: 'Demo User', role: 'customer' }
  ];

  for (const u of users) {
    console.log('\n--- Provisioning:', u.email, '---');
    
    // First, list existing users to see if it exists
    const { data: listData, error: listErr } = await supabase.auth.admin.listUsers();
    if (listErr) {
      console.error('List users failed:', listErr.message);
      continue;
    }
    
    const existing = listData?.users?.find(x => x.email === u.email);
    let userId;
    
    if (existing) {
      console.log('User already exists in auth.users (ID: ' + existing.id + '). Updating password...');
      const { data: updateData, error: updateErr } = await supabase.auth.admin.updateUserById(
        existing.id,
        {
          password: u.password,
          email_confirm: true,
          user_metadata: { full_name: u.fullName }
        }
      );
      if (updateErr) {
        console.error('Failed to update user:', updateErr.message);
      } else {
        console.log('User password updated successfully.');
        userId = updateData.user.id;
      }
    } else {
      console.log('Creating user in Supabase Auth...');
      const { data: createData, error: createErr } = await supabase.auth.admin.createUser({
        email: u.email,
        password: u.password,
        email_confirm: true,
        user_metadata: { full_name: u.fullName }
      });
      
      if (createErr) {
        console.error('Failed to create user:', createErr.message);
      } else {
        console.log('User created successfully with ID:', createData.user.id);
        userId = createData.user.id;
      }
    }

    if (userId) {
      console.log('Updating profile record in public.profiles with role:', u.role);
      const { error: profileErr } = await supabase.from('profiles').upsert({
        id: userId,
        email: u.email,
        full_name: u.fullName,
        role: u.role
      });
      if (profileErr) {
        console.error('Profile upsert failed:', profileErr.message);
      } else {
        console.log('Profile saved successfully.');
      }
    }
  }

  // Verification: Test login with public anon client
  console.log('\n--- Verifying Logins ---');
  const anonClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  for (const u of users) {
    const { data: authData, error: authErr } = await anonClient.auth.signInWithPassword({
      email: u.email,
      password: u.password
    });
    if (authErr) {
      console.error('❌ Login failed for ' + u.email + ':', authErr.message);
    } else {
      console.log('✅ Login verified for ' + u.email + ' (User ID: ' + authData.user.id + ')');
    }
  }
}

setupUsers().catch(console.error);
