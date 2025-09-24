import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SupervisorWithGroupLeaderCount {
  id: string;
  name: string;
  group_leader_count: number;
}

interface GroupLeadersBySuperviserProps {
  panchayathId: string;
}

export const GroupLeadersBySupervisor = ({ panchayathId }: GroupLeadersBySuperviserProps) => {
  const [supervisorData, setSupervisorData] = useState<SupervisorWithGroupLeaderCount[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchSupervisorGroupLeaderCounts();
  }, [panchayathId]);

  const fetchSupervisorGroupLeaderCounts = async () => {
    try {
      setLoading(true);
      
      // Get supervisors with their group leader counts
      const { data: supervisors, error: supervisorsError } = await supabase
        .from('supervisors')
        .select(`
          id,
          name,
          group_leaders:group_leaders(count)
        `)
        .eq('panchayath_id', panchayathId)
        .order('name');

      if (supervisorsError) throw supervisorsError;

      const supervisorWithCounts = supervisors?.map(supervisor => ({
        id: supervisor.id,
        name: supervisor.name,
        group_leader_count: supervisor.group_leaders?.[0]?.count || 0
      })) || [];

      setSupervisorData(supervisorWithCounts);
    } catch (error: any) {
      console.error("Error fetching supervisor group leader counts:", error);
      toast({
        title: "Error",
        description: "Failed to fetch supervisor data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground mb-2">Group Leaders by Supervisor:</p>
      {supervisorData.length === 0 ? (
        <p className="text-xs text-muted-foreground">No supervisors found</p>
      ) : (
        <div className="space-y-1">
          {supervisorData.map((supervisor) => (
            <div key={supervisor.id} className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground truncate flex-1 mr-2">{supervisor.name}</span>
              <Badge variant="outline" className="text-xs h-5 px-2">
                {supervisor.group_leader_count}
              </Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};