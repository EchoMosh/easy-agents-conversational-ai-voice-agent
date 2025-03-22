
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/integrations/supabase/client';

interface LeadData {
  first_name?: string;
  last_name?: string;
  email: string;
  phone?: string;
  company?: string;
  job_title?: string;
  name?: string;
  [key: string]: any; // Allow for custom fields
}

interface ImportOptions {
  removeDuplicates: boolean;
  tags: string[];
  workspaceId: string;
  userId: string;
}

/**
 * Import leads from CSV data
 * @param leads Array of lead data objects
 * @param options Import options
 * @returns Object with success status and counts
 */
export async function importLeads(
  leads: LeadData[],
  options: ImportOptions
) {
  const { removeDuplicates, tags, workspaceId, userId } = options;
  
  try {
    // Validate leads
    if (!leads || !Array.isArray(leads) || leads.length === 0) {
      throw new Error('No valid leads to import');
    }
    
    // Check for required fields
    const invalidLeads = leads.filter(lead => !lead.email);
    if (invalidLeads.length > 0) {
      throw new Error(`${invalidLeads.length} leads are missing required email field`);
    }
    
    // Handle duplicates if needed
    let leadsToImport = leads;
    if (removeDuplicates) {
      // Get unique leads by email
      const uniqueEmails = new Set();
      leadsToImport = leads.filter(lead => {
        const email = lead.email.toLowerCase();
        if (uniqueEmails.has(email)) {
          return false;
        }
        uniqueEmails.add(email);
        return true;
      });
    }
    
    // Check for existing leads in database if removing duplicates
    if (removeDuplicates) {
      const emails = leadsToImport.map(lead => lead.email.toLowerCase());
      
      const { data: existingLeads, error: checkError } = await supabase
        .from('leads')
        .select('email')
        .in('email', emails)
        .eq('workspace_id', workspaceId);
      
      if (checkError) {
        throw new Error(`Error checking for existing leads: ${checkError.message}`);
      }
      
      if (existingLeads && existingLeads.length > 0) {
        const existingEmails = new Set(existingLeads.map(lead => lead.email.toLowerCase()));
        leadsToImport = leadsToImport.filter(lead => !existingEmails.has(lead.email.toLowerCase()));
      }
    }
    
    // Prepare leads for insertion - convert first_name and last_name to name
    const leadsWithMetadata = leadsToImport.map(lead => {
      let name = lead.name;
      
      // If name isn't provided directly, create it from first_name and last_name
      if (!name && (lead.first_name || lead.last_name)) {
        name = `${lead.first_name || ''} ${lead.last_name || ''}`.trim();
      }
      
      // If there's still no name, use email username as fallback
      if (!name) {
        name = lead.email.split('@')[0];
      }
      
      // Create the database record with the required fields
      const leadRecord = {
        id: uuidv4(),
        name,
        email: lead.email,
        phone: lead.phone,
        workspace_id: workspaceId,
        user_id: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        status: 'new',
      };
      
      // Remove fields that aren't in the leads table to prevent insertion errors
      const { first_name, last_name, ...remainingFields } = lead;
      
      // Only include fields that are actually in the leads table schema
      // Don't include custom fields that might cause SQL errors
      return leadRecord;
    });
    
    // Insert leads
    const { data: insertedLeads, error: insertError } = await supabase
      .from('leads')
      .insert(leadsWithMetadata)
      .select('id');
    
    if (insertError) {
      throw new Error(`Error inserting leads: ${insertError.message}`);
    }
    
    // Add tags if provided
    if (tags && tags.length > 0 && insertedLeads && insertedLeads.length > 0) {
      const leadIds = insertedLeads.map(lead => lead.id);
      
      // Create an array to hold all lead_tag entries
      const allLeadTags = [];
      
      // Make sure all the tags exist
      for (const tagId of tags) {
        // Check if this tag exists
        const { data: existingTag } = await supabase
          .from('tags')
          .select('id, name, color')
          .eq('id', tagId)
          .single();
        
        if (!existingTag) {
          console.warn(`Tag ${tagId} does not exist, skipping`);
          continue;
        }
        
        // Create lead_tag entries for each lead with this tag
        const leadTagsForThisTag = leadIds.map(leadId => ({
          lead_id: leadId,
          tag_id: tagId,
          created_at: new Date().toISOString(),
        }));
        
        // Add to our collection
        allLeadTags.push(...leadTagsForThisTag);
      }
      
      // Insert in batches of 100 to avoid hitting limits
      for (let i = 0; i < allLeadTags.length; i += 100) {
        const batch = allLeadTags.slice(i, i + 100);
        
        const { error: tagError } = await supabase
          .from('lead_tags')
          .insert(batch);
        
        if (tagError) {
          console.error(`Error adding tags to leads: ${tagError.message}`);
        }
        
        // Small delay to avoid overwhelming the database
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }
    
    return {
      success: true,
      imported: leadsWithMetadata.length,
      duplicates: leads.length - leadsWithMetadata.length,
      tags: tags.length,
    };
  } catch (error) {
    console.error('Import leads error:', error);
    throw error;
  }
}

/**
 * Process CSV data and import leads
 * @param csvData Raw CSV data as string
 * @param columnMapping Mapping of CSV columns to lead fields
 * @param options Import options
 * @returns Import result
 */
export async function processAndImportLeads(
  csvData: string,
  columnMapping: Record<string, string>,
  hasHeaders: boolean,
  options: ImportOptions
) {
  try {
    // Parse CSV data
    const rows = csvData.split(/\r?\n/).filter(row => row.trim());
    
    // Skip header row if needed
    const dataRows = hasHeaders ? rows.slice(1) : rows;
    
    // Get header row for mapping
    const headerRow = hasHeaders 
      ? rows[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))
      : Object.keys(columnMapping).map((_, i) => `Column ${i + 1}`);
    
    // Process each row into a lead object
    const leads: LeadData[] = [];
    
    for (const row of dataRows) {
      if (!row.trim()) continue;
      
      // Handle quoted values with commas inside
      const matches = row.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];
      const values = matches.map(value => 
        value.startsWith('"') && value.endsWith('"') ? value.slice(1, -1) : value
      );
      
      // Create lead object using column mapping
      const lead: LeadData = { email: '' }; // Initialize with required field
      
      headerRow.forEach((header, index) => {
        const fieldName = columnMapping[header];
        if (fieldName && fieldName !== 'custom' && values[index]) {
          lead[fieldName] = values[index];
        }
      });
      
      // Only add lead if it has an email
      if (lead.email) {
        leads.push(lead);
      }
    }
    
    // Import the processed leads
    return await importLeads(leads, options);
  } catch (error) {
    console.error('Process and import leads error:', error);
    throw error;
  }
}
