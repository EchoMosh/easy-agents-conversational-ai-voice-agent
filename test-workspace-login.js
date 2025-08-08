import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testWorkspaceFlow() {
  try {
    console.log('🔍 Testing workspace flow after icon column addition...\n');
    
    // Step 1: Check current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('❌ No authenticated user found. Please login first.');
      return;
    }
    
    console.log(`✅ Authenticated as: ${user.email}`);
    
    // Step 2: Check user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (profileError) {
      console.error('❌ Error fetching profile:', profileError);
      return;
    }
    
    console.log(`✅ Profile found:`, {
      email: profile.email,
      onboarding_completed: profile.onboarding_completed,
      first_name: profile.first_name,
      last_name: profile.last_name
    });
    
    // Step 3: Check workspace membership
    const { data: memberships, error: memberError } = await supabase
      .from('workspace_members')
      .select('workspace_id')
      .eq('user_id', user.id);
    
    if (memberError) {
      console.error('❌ Error checking workspace membership:', memberError);
      return;
    }
    
    console.log(`\n📊 Found ${memberships?.length || 0} workspace memberships`);
    
    // Step 4: Try to fetch workspaces with icon column
    if (memberships && memberships.length > 0) {
      const workspaceIds = memberships.map(m => m.workspace_id);
      
      const { data: workspaces, error: workspaceError } = await supabase
        .from('workspaces')
        .select('id, name, icon, created_at')
        .in('id', workspaceIds);
      
      if (workspaceError) {
        console.error('❌ Error fetching workspaces:', workspaceError);
        console.error('   This might be the white screen cause!');
        return;
      }
      
      console.log('\n✅ Successfully fetched workspaces with icon column:');
      workspaces.forEach(ws => {
        console.log(`   - ${ws.name} (icon: ${ws.icon || 'none'})`);
      });
    } else {
      console.log('\n⚠️  User has no workspaces!');
      console.log('   This would cause redirect to onboarding.');
      
      // Try to create a test workspace
      console.log('\n🔧 Attempting to create a test workspace...');
      
      const { data: newWorkspace, error: createError } = await supabase
        .from('workspaces')
        .insert({
          name: `${profile.first_name || user.email.split('@')[0]}'s Workspace`,
          icon: 'building'
        })
        .select()
        .single();
      
      if (createError) {
        console.error('❌ Error creating workspace:', createError);
        console.error('   This is likely the white screen cause!');
      } else {
        console.log('✅ Successfully created workspace:', newWorkspace);
        
        // Check if user was added as member
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const { data: newMembership } = await supabase
          .from('workspace_members')
          .select('*')
          .eq('user_id', user.id)
          .eq('workspace_id', newWorkspace.id)
          .single();
        
        if (newMembership) {
          console.log('✅ User automatically added to workspace via trigger');
        } else {
          console.log('⚠️  User not automatically added to workspace');
        }
      }
    }
    
    console.log('\n🎉 Test completed!');
    console.log('\nNext steps:');
    console.log('1. Clear browser local storage and cookies');
    console.log('2. Try logging in again');
    console.log('3. You should now be able to access the dashboard without white screen');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the test
testWorkspaceFlow();
