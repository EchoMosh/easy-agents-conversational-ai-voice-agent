const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables: VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  console.error('Make sure you have a .env file with these variables set.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixExistingUsersOnboarding() {
  console.log('Running onboarding fix for existing users...');

  try {
    // Get all users who have workspace memberships
    const { data: workspaceMembers, error: memberError } = await supabase
      .from('workspace_members')
      .select('user_id')
      .not('user_id', 'is', null);

    if (memberError) {
      console.error('Error fetching workspace members:', memberError);
    } else if (workspaceMembers && workspaceMembers.length > 0) {
      const userIds = [...new Set(workspaceMembers.map(m => m.user_id))];
      
      // Update profiles for these users
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ onboarding_completed: true })
        .in('id', userIds)
        .or('onboarding_completed.is.null,onboarding_completed.eq.false');

      if (updateError) {
        console.error('Error updating profiles for workspace members:', updateError);
      } else {
        console.log(`✓ Updated ${userIds.length} profiles for users with workspace memberships`);
      }
    }

    // Get all workspace owners
    const { data: workspaces, error: workspaceError } = await supabase
      .from('workspaces')
      .select('owner_id')
      .not('owner_id', 'is', null);

    if (workspaceError) {
      console.error('Error fetching workspaces:', workspaceError);
    } else if (workspaces && workspaces.length > 0) {
      const ownerIds = [...new Set(workspaces.map(w => w.owner_id))];
      
      // Update profiles for workspace owners
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ onboarding_completed: true })
        .in('id', ownerIds)
        .or('onboarding_completed.is.null,onboarding_completed.eq.false');

      if (updateError) {
        console.error('Error updating profiles for workspace owners:', updateError);
      } else {
        console.log(`✓ Updated ${ownerIds.length} profiles for workspace owners`);
      }
    }

    // Get all users who have created agents
    const { data: agents, error: agentError } = await supabase
      .from('agents')
      .select('created_by')
      .not('created_by', 'is', null);

    if (agentError) {
      console.error('Error fetching agents:', agentError);
    } else if (agents && agents.length > 0) {
      const creatorIds = [...new Set(agents.map(a => a.created_by))];
      
      // Update profiles for agent creators
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ onboarding_completed: true })
        .in('id', creatorIds)
        .or('onboarding_completed.is.null,onboarding_completed.eq.false');

      if (updateError) {
        console.error('Error updating profiles for agent creators:', updateError);
      } else {
        console.log(`✓ Updated ${creatorIds.length} profiles for users who have created agents`);
      }
    }

    console.log('\n✅ Onboarding fix completed successfully!');
    console.log('Existing users should no longer see the onboarding flow.');
    console.log('\nNote: The migration file has also been created at:');
    console.log('supabase/migrations/20250608_fix_existing_users_onboarding.sql');
    console.log('\nThis will be applied automatically when you run: supabase db push');

  } catch (error) {
    console.error('Error running onboarding fix:', error);
  }
}

// Run the fix
fixExistingUsersOnboarding();
