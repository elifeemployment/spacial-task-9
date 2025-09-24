import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface GroupLeaderWithProCount {
  id: string;
  name: string;
  pro_count: number;
}

interface ProsByGroupLeaderProps {
  panchayathId: string;
}

export const ProsByGroupLeader = ({ panchayathId }: ProsByGroupLeaderProps) => {
  const [groupLeaderData, setGroupLeaderData] = useState<GroupLeaderWithProCount[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchGroupLeaderProCounts();
  }, [panchayathId]);

  const fetchGroupLeaderProCounts = async () => {
    try {
      setLoading(true);
      
      // Get group leaders with their PRO counts
      const { data: groupLeaders, error: groupLeadersError } = await supabase
        .from('group_leaders')
        .select(`
          id,
          name,
          pros:pros(count)
        `)
        .eq('panchayath_id', panchayathId)
        .order('name');

      if (groupLeadersError) throw groupLeadersError;

      const groupLeaderWithCounts = groupLeaders?.map(groupLeader => ({
        id: groupLeader.id,
        name: groupLeader.name,
        pro_count: groupLeader.pros?.[0]?.count || 0
      })) || [];

      setGroupLeaderData(groupLeaderWithCounts);
    } catch (error: any) {
      console.error("Error fetching group leader PRO counts:", error);
      toast({
        title: "Error",
        description: "Failed to fetch group leader data",
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
      <p className="text-xs font-medium text-muted-foreground mb-2">PROs by Group Leader:</p>
      {groupLeaderData.length === 0 ? (
        <p className="text-xs text-muted-foreground">No group leaders found</p>
      ) : (
        <div className="space-y-1">
          {groupLeaderData.map((groupLeader) => (
            <div key={groupLeader.id} className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground truncate flex-1 mr-2">{groupLeader.name}</span>
              <Badge variant="outline" className="text-xs h-5 px-2">
                {groupLeader.pro_count}
              </Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};