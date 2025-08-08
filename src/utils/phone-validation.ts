import { supabase } from "@/integrations/supabase/client";

/**
 * Checks if a phone number already exists for another lead in the same workspace
 * @param phone - The phone number to check
 * @param workspaceId - The workspace ID to check within
 * @param excludeLeadId - Optional lead ID to exclude from the check (for updates)
 * @returns Promise<boolean> - true if phone number is already taken, false if available
 */
export async function isPhoneNumberTaken(
  phone: string,
  workspaceId: string,
  excludeLeadId?: string
): Promise<boolean> {
  if (!phone || !phone.trim()) {
    return false; // Empty phone numbers are allowed
  }

  try {
    let query = supabase
      .from("leads")
      .select("id")
      .eq("workspace_id", workspaceId)
      .eq("phone", phone.trim());

    // If we're updating a lead, exclude it from the check
    if (excludeLeadId) {
      query = query.neq("id", excludeLeadId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error checking phone number uniqueness:", error);
      return false; // On error, allow the operation to proceed
    }

    return data && data.length > 0;
  } catch (error) {
    console.error("Error in phone number validation:", error);
    return false; // On error, allow the operation to proceed
  }
}

/**
 * Validates phone number uniqueness and shows appropriate error message
 * @param phone - The phone number to validate
 * @param workspaceId - The workspace ID to check within
 * @param excludeLeadId - Optional lead ID to exclude from the check (for updates)
 * @returns Promise<boolean> - true if phone number is valid/available, false if taken
 */
export async function validatePhoneUniqueness(
  phone: string,
  workspaceId: string,
  excludeLeadId?: string
): Promise<boolean> {
  if (!phone || !phone.trim()) {
    return true; // Empty phone numbers are allowed
  }

  const isTaken = await isPhoneNumberTaken(phone, workspaceId, excludeLeadId);
  
  if (isTaken) {
    return false;
  }

  return true;
}
