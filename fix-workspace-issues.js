import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function fixWorkspaceIssues() {
  try {
    console.log('Starting workspace fixes...');
    
    // Step 1: Add icon column to workspaces table if it doesn't exist
    console.log('\n1. Adding icon column to workspaces table...');
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: `
        DO $$ 
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'workspaces' 
            AND column_name = 'icon'
          ) THEN
            ALTER TABLE workspaces ADD COLUMN icon TEXT DEFAULT 'building';
            RAISE NOTICE 'Added icon column to workspaces table';
          ELSE
            RAISE NOTICE 'Icon column already exists';
          END IF;
        END $$;
      `
    });
    
    if (alterError) {
      // If the RPC doesn't exist, try a direct approach
      console.log('RPC not available, trying direct SQL...');
      const { error: directError } = await supabase
        .from('workspaces')
        .select('icon')
        .limit(1);
      
      if (directError && directError.message.includes("column")) {
        console.error('Cannot add icon column automatically. Please run this SQL manually in Supabase dashboard:');
        console.error('ALTER TABLE workspaces ADD COLUMN icon TEXT DEFAULT \'building\';');
      } else {
        console.log('Icon column already exists or was added successfully');
      }
    } else {
      console.log('Icon column check completed');
    }
    
    // Step 2: Find users with onboarding_completed but no workspace
    console.log('\n2. Finding users with completed onboarding but no workspace...');
    const { data: orphanedUsers, error: orphanedError } = await supabase
      .from('profiles')
      .select('id, email, first_name, last_name')
      .eq('onboarding_completed', true);
    
    if (orphanedError) {
      console.error('Error finding orphaned users:', orphanedError);
      return;
    }
    
    console.log(`Found ${orphanedUsers.length} users with completed onboarding`);
    
    // Step 3: Check which users don't have workspaces
    for (const user of orphanedUsers) {
      const { data: memberships, error: memberError } = await supabase
        .from('workspace_members')
        .select('workspace_id')
        .eq('user_id', user.id);
      
      if (memberError) {
        console.error(`Error checking memberships for user ${user.email}:`, memberError);
        continue;
      }
      
      if (!memberships || memberships.length === 0) {
        console.log(`\nUser ${user.email} has no workspace. Creating one...`);
        
        // Create a workspace for this user
        const workspaceName = user.first_name && user.last_name 
          ? `${user.first_name} ${user.last_name}'s Workspace`
          : user.email.split('@')[0] + "'s Workspace";
          
        const { data: workspace, error: createError } = await supabase
          .from('workspaces')
          .insert({
            name: workspaceName,
            icon: 'building'
          })
          .select()
          .single();
        
        if (createError) {
          console.error(`Error creating workspace for ${user.email}:`, createError);
          // If icon column is missing, try without it
          if (createError.message.includes('icon')) {
            const { data: workspaceNoIcon, error: createError2 } = await supabase
              .from('workspaces')
              .insert({
                name: workspaceName
              })
              .select()
              .single();
            
            if (createError2) {
              console.error(`Error creating workspace without icon:`, createError2);
              continue;
            }
            
            console.log(`Created workspace for ${user.email} (without icon)`);
          }
          continue;
        }
        
        console.log(`Created workspace "${workspace.name}" for ${user.email}`);
        
        // The database trigger should automatically add the user as a member
        // but let's verify
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for trigger
        
        const { data: newMembership } = await supabase
          .from('workspace_members')
          .select('*')
          .eq('user_id', user.id)
          .eq('workspace_id', workspace.id)
          .single();
        
        if (newMembership) {
          console.log(`User ${user.email} successfully added to workspace`);
        } else {
          console.log(`Warning: User ${user.email} may not have been added to workspace automatically`);
        }
      } else {
        console.log(`User ${user.email} already has ${memberships.length} workspace(s)`);
      }
    }
    
    console.log('\n✅ Workspace fixes completed!');
    console.log('\nNext steps:');
    console.log('1. If the icon column couldn\'t be added automatically, please add it manually in Supabase dashboard');
    console.log('2. Clear your browser\'s local storage and cookies for this app');
    console.log('3. Try logging in again');
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the fixes
fixWorkspaceIssues();
