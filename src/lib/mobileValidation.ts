import { supabase } from "@/integrations/supabase/client";

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  table?: string;
  recordId?: string;
}

/**
 * Check if a mobile number already exists in any table
 * @param mobile - The mobile number to check
 * @param currentRecordId - ID of current record being edited (to exclude from duplicate check)
 * @param currentTable - Table name of current record being edited
 * @returns Promise with duplicate check result
 */
export const checkMobileDuplicate = async (
  mobile: string,
  currentRecordId?: string,
  currentTable?: string
): Promise<DuplicateCheckResult> => {
  const cleanMobile = mobile.trim();
  
  // Check officers table
  try {
    let officersQuery = supabase
      .from('officers')
      .select('id')
      .eq('mobile_number', cleanMobile);
    
    if (currentRecordId && currentTable === 'officers') {
      officersQuery = officersQuery.neq('id', currentRecordId);
    }
    
    const { data: officersData, error: officersError } = await officersQuery;
    
    if (!officersError && officersData && officersData.length > 0) {
      return {
        isDuplicate: true,
        table: 'officers',
        recordId: officersData[0].id
      };
    }
  } catch (error) {
    console.error('Error checking officers table:', error);
  }

  // Check coordinators table
  try {
    let coordinatorsQuery = supabase
      .from('coordinators')
      .select('id')
      .eq('mobile_number', cleanMobile);
    
    if (currentRecordId && currentTable === 'coordinators') {
      coordinatorsQuery = coordinatorsQuery.neq('id', currentRecordId);
    }
    
    const { data: coordinatorsData, error: coordinatorsError } = await coordinatorsQuery;
    
    if (!coordinatorsError && coordinatorsData && coordinatorsData.length > 0) {
      return {
        isDuplicate: true,
        table: 'coordinators',
        recordId: coordinatorsData[0].id
      };
    }
  } catch (error) {
    console.error('Error checking coordinators table:', error);
  }

  // Check supervisors table
  try {
    let supervisorsQuery = supabase
      .from('supervisors')
      .select('id')
      .eq('mobile_number', cleanMobile);
    
    if (currentRecordId && currentTable === 'supervisors') {
      supervisorsQuery = supervisorsQuery.neq('id', currentRecordId);
    }
    
    const { data: supervisorsData, error: supervisorsError } = await supervisorsQuery;
    
    if (!supervisorsError && supervisorsData && supervisorsData.length > 0) {
      return {
        isDuplicate: true,
        table: 'supervisors',
        recordId: supervisorsData[0].id
      };
    }
  } catch (error) {
    console.error('Error checking supervisors table:', error);
  }

  // Check group_leaders table
  try {
    let groupLeadersQuery = supabase
      .from('group_leaders')
      .select('id')
      .eq('mobile_number', cleanMobile);
    
    if (currentRecordId && currentTable === 'group_leaders') {
      groupLeadersQuery = groupLeadersQuery.neq('id', currentRecordId);
    }
    
    const { data: groupLeadersData, error: groupLeadersError } = await groupLeadersQuery;
    
    if (!groupLeadersError && groupLeadersData && groupLeadersData.length > 0) {
      return {
        isDuplicate: true,
        table: 'group_leaders',
        recordId: groupLeadersData[0].id
      };
    }
  } catch (error) {
    console.error('Error checking group_leaders table:', error);
  }

  // Check pros table
  try {
    let prosQuery = supabase
      .from('pros')
      .select('id')
      .eq('mobile_number', cleanMobile);
    
    if (currentRecordId && currentTable === 'pros') {
      prosQuery = prosQuery.neq('id', currentRecordId);
    }
    
    const { data: prosData, error: prosError } = await prosQuery;
    
    if (!prosError && prosData && prosData.length > 0) {
      return {
        isDuplicate: true,
        table: 'pros',
        recordId: prosData[0].id
      };
    }
  } catch (error) {
    console.error('Error checking pros table:', error);
  }

  return { isDuplicate: false };
};

/**
 * Get user-friendly table name for error messages
 */
export const getTableDisplayName = (tableName: string): string => {
  const displayNames: Record<string, string> = {
    'officers': 'Officers',
    'coordinators': 'Coordinators',
    'supervisors': 'Supervisors',
    'group_leaders': 'Group Leaders',
    'pros': 'PROs'
  };
  return displayNames[tableName] || tableName;
};