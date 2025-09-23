import { supabase } from "@/integrations/supabase/client";

export interface User {
  id: string;
  name: string;
  mobile_number: string;
  role: 'coordinator' | 'supervisor' | 'group_leader' | 'pro' | 'admin_member';
  table: string;
  hasAdminAccess: boolean;
  ward?: number;
  panchayath_id?: string;
}

export interface AuthResult {
  success: boolean;
  user?: User;
  error?: string;
}

/**
 * Search for a user by mobile number across all agent tables
 */
export const findUserByMobile = async (mobile: string): Promise<AuthResult> => {
  const cleanMobile = mobile.trim();
  
  // Check coordinators table
  try {
    const { data: coordinatorsData, error: coordinatorsError } = await supabase
      .from('coordinators')
      .select('id, name, mobile_number, panchayath_id')
      .eq('mobile_number', cleanMobile)
      .limit(1);
    
    if (!coordinatorsError && coordinatorsData && coordinatorsData.length > 0) {
      const user = coordinatorsData[0];
      return {
        success: true,
        user: {
          id: user.id,
          name: user.name,
          mobile_number: user.mobile_number,
          role: 'coordinator',
          table: 'coordinators',
          hasAdminAccess: false,
          panchayath_id: user.panchayath_id
        }
      };
    }
  } catch (error) {
    console.error('Error checking coordinators table:', error);
  }

  // Check supervisors table
  try {
    const { data: supervisorsData, error: supervisorsError } = await supabase
      .from('supervisors')
      .select('id, name, mobile_number, panchayath_id')
      .eq('mobile_number', cleanMobile)
      .limit(1);
    
    if (!supervisorsError && supervisorsData && supervisorsData.length > 0) {
      const user = supervisorsData[0];
      return {
        success: true,
        user: {
          id: user.id,
          name: user.name,
          mobile_number: user.mobile_number,
          role: 'supervisor',
          table: 'supervisors',
          hasAdminAccess: false,
          panchayath_id: user.panchayath_id
        }
      };
    }
  } catch (error) {
    console.error('Error checking supervisors table:', error);
  }

  // Check group_leaders table
  try {
    const { data: groupLeadersData, error: groupLeadersError } = await supabase
      .from('group_leaders')
      .select('id, name, mobile_number, ward, panchayath_id')
      .eq('mobile_number', cleanMobile)
      .limit(1);
    
    if (!groupLeadersError && groupLeadersData && groupLeadersData.length > 0) {
      const user = groupLeadersData[0];
      return {
        success: true,
        user: {
          id: user.id,
          name: user.name,
          mobile_number: user.mobile_number,
          role: 'group_leader',
          table: 'group_leaders',
          hasAdminAccess: false,
          ward: user.ward,
          panchayath_id: user.panchayath_id
        }
      };
    }
  } catch (error) {
    console.error('Error checking group_leaders table:', error);
  }

  // Check pros table
  try {
    const { data: prosData, error: prosError } = await supabase
      .from('pros')
      .select('id, name, mobile_number, panchayath_id')
      .eq('mobile_number', cleanMobile)
      .limit(1);
    
    if (!prosError && prosData && prosData.length > 0) {
      const user = prosData[0];
      return {
        success: true,
        user: {
          id: user.id,
          name: user.name,
          mobile_number: user.mobile_number,
          role: 'pro',
          table: 'pros',
          hasAdminAccess: false,
          panchayath_id: user.panchayath_id
        }
      };
    }
  } catch (error) {
    console.error('Error checking pros table:', error);
  }

  // Check admin_members table (team members with admin access)
  try {
    const { data: adminMembersData, error: adminMembersError } = await supabase
      .from('admin_members')
      .select('id, name, mobile')
      .eq('mobile', cleanMobile)
      .limit(1);
    
    if (!adminMembersError && adminMembersData && adminMembersData.length > 0) {
      const user = adminMembersData[0];
      return {
        success: true,
        user: {
          id: user.id,
          name: user.name,
          mobile_number: user.mobile,
          role: 'admin_member',
          table: 'admin_members',
          hasAdminAccess: true
        }
      };
    }
  } catch (error) {
    console.error('Error checking admin_members table:', error);
  }

  return {
    success: false,
    error: 'You are not registered. Please contact administrator.'
  };
};

/**
 * Get role display name
 */
export const getRoleDisplayName = (role: string): string => {
  const displayNames: Record<string, string> = {
    'coordinator': 'Coordinator',
    'supervisor': 'Supervisor',
    'group_leader': 'Group Leader',
    'pro': 'PRO',
    'admin_member': 'Team Member'
  };
  return displayNames[role] || role;
};