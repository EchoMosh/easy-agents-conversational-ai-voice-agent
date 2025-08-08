import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/integrations/supabase/client';

interface LeadData {
  first_name?: string;
  last_name?: string;
  email?: string;
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
    
    // Check for required fields - only first name and phone are required
    const invalidLeads = leads.filter(lead => {
      const hasFirstName = lead.first_name && lead.first_name.trim();
      const hasPhone = lead.phone && lead.phone.trim();
      
      return !hasFirstName || !hasPhone;
    });
    
    if (invalidLeads.length > 0) {
      throw new Error(`${invalidLeads.length} leads are missing required fields (first name and phone number)`);
    }
    
    // Remove duplicates within the CSV file based on phone number (since phone is now required)
    const uniquePhones = new Set();
    let leadsToImport = leads.filter(lead => {
      const phone = lead.phone?.trim();
      if (!phone) return false; // Don't import leads without phone
      
      if (uniquePhones.has(phone)) {
        return false; // Skip duplicate phone numbers within the CSV
      }
      uniquePhones.add(phone);
      return true;
    });
    
    // Check for existing leads in database only if removing duplicates is enabled
    if (removeDuplicates) {
      const phones = leadsToImport.map(lead => lead.phone?.trim()).filter(phone => phone);
      
      if (phones.length > 0) {
        const { data: existingLeads, error: checkError } = await supabase
          .from('leads')
          .select('phone')
          .in('phone', phones)
          .eq('workspace_id', workspaceId);
        
        if (checkError) {
          throw new Error(`Error checking for existing leads: ${checkError.message}`);
        }
        
        if (existingLeads && existingLeads.length > 0) {
          const existingPhones = new Set(existingLeads.map(lead => lead.phone));
          leadsToImport = leadsToImport.filter(lead => !existingPhones.has(lead.phone));
        }
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
        if (lead.email) {
          name = lead.email.split('@')[0];
        } else {
          name = 'Unknown Lead';
        }
      }
      
      // Create the database record with the required fields
      const leadRecord = {
        id: uuidv4(),
        name,
        email: lead.email || null, // Email is now optional
        phone: lead.phone, // Phone is required
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
    
    return {
      success: true,
      imported: leadsWithMetadata.length,
      duplicates: leads.length - leadsWithMetadata.length,
      tags: 0, // No tags since we removed the tagging feature
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
      const lead: LeadData = {};
      
      headerRow.forEach((header, index) => {
        const fieldName = columnMapping[header];
        if (fieldName && fieldName !== 'custom' && values[index]) {
          lead[fieldName] = values[index];
        }
      });
      
      // Add lead if it has required fields (first_name and phone)
      if (lead.first_name && lead.phone) {
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
