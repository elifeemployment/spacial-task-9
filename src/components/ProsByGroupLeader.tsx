import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronDown, ChevronRight, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ProWithCustomerData {
  id: string;
  name: string;
  mobile_number: string;
  ward: number;
  total_customers: number;
}

interface GroupLeaderWithProCount {
  id: string;
  name: string;
  pro_count: number;
  total_customers: number;
  pros: ProWithCustomerData[];
}

interface ProsByGroupLeaderProps {
  panchayathId: string;
}

export const ProsByGroupLeader = ({ panchayathId }: ProsByGroupLeaderProps) => {
  const [groupLeaderData, setGroupLeaderData] = useState<GroupLeaderWithProCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [expandedGroupLeaders, setExpandedGroupLeaders] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  useEffect(() => {
    fetchGroupLeaderProCounts();
  }, [panchayathId]);

  const fetchGroupLeaderProCounts = async () => {
    try {
      setLoading(true);
      
      // Get group leaders with their PROs
      const { data: groupLeaders, error: groupLeadersError } = await supabase
        .from('group_leaders')
        .select(`
          id,
          name,
          pros:pros(
            id,
            name,
            mobile_number,
            ward
          )
        `)
        .eq('panchayath_id', panchayathId)
        .order('name');

      if (groupLeadersError) throw groupLeadersError;

      // Get customer counts for all PROs in this panchayath
      const { data: customerCounts, error: customerError } = await supabase
        .from('customers' as any)
        .select('pro_id, customer_count')
        .eq('panchayath_id', panchayathId);

      // Create a map of PRO ID to total customers (ignore customer error for fallback)
      const proCustomerMap = customerCounts?.reduce((acc: Record<string, number>, customer: any) => {
        acc[customer.pro_id] = (acc[customer.pro_id] || 0) + customer.customer_count;
        return acc;
      }, {}) || {};

      const groupLeaderWithCounts = groupLeaders?.map(groupLeader => {
        const prosWithCustomers = groupLeader.pros?.map(pro => ({
          ...pro,
          total_customers: proCustomerMap[pro.id] || 0
        })) || [];

        const totalCustomers = prosWithCustomers.reduce((sum, pro) => sum + pro.total_customers, 0);

        return {
          id: groupLeader.id,
          name: groupLeader.name,
          pro_count: prosWithCustomers.length,
          total_customers: totalCustomers,
          pros: prosWithCustomers
        };
      }) || [];

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

  const toggleGroupLeaderExpansion = (groupLeaderId: string) => {
    setExpandedGroupLeaders(prev => ({
      ...prev,
      [groupLeaderId]: !prev[groupLeaderId]
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  const totalPros = groupLeaderData.reduce((sum, groupLeader) => sum + groupLeader.pro_count, 0);
  const totalCustomers = groupLeaderData.reduce((sum, groupLeader) => sum + groupLeader.total_customers, 0);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" className="h-auto p-0 w-full justify-start text-xs">
          <div className="flex items-center gap-2 w-full">
            {isOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            <span className="font-medium text-muted-foreground">
              Breakdown: {groupLeaderData.length} group leaders, {totalPros} PROs, {totalCustomers} customers
            </span>
          </div>
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2">
        <div className="space-y-2 pl-4">
          {groupLeaderData.length === 0 ? (
            <p className="text-xs text-muted-foreground">No group leaders found</p>
          ) : (
            groupLeaderData.map((groupLeader) => (
              <div key={groupLeader.id} className="space-y-1">
                <Collapsible 
                  open={expandedGroupLeaders[groupLeader.id]} 
                  onOpenChange={() => toggleGroupLeaderExpansion(groupLeader.id)}
                >
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" className="h-auto p-1 w-full justify-start text-xs">
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                          {expandedGroupLeaders[groupLeader.id] ? 
                            <ChevronDown className="h-3 w-3" /> : 
                            <ChevronRight className="h-3 w-3" />
                          }
                          <span className="text-muted-foreground truncate flex-1">
                            {groupLeader.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Badge variant="outline" className="text-xs h-5 px-2">
                            {groupLeader.pro_count} PROs
                          </Badge>
                          <Badge variant="secondary" className="text-xs h-5 px-2">
                            <Users className="h-3 w-3 mr-1" />
                            {groupLeader.total_customers}
                          </Badge>
                        </div>
                      </div>
                    </Button>
                  </CollapsibleTrigger>
                   <CollapsibleContent className="mt-1">
                     <ScrollArea className="h-48 w-full">
                       <div className="space-y-1 pl-4 pr-4">
                         {groupLeader.pros?.length === 0 ? (
                           <p className="text-xs text-muted-foreground">No PROs found</p>
                         ) : (
                           groupLeader.pros?.map((pro) => (
                             <Card key={pro.id} className="p-2 bg-muted/30 border-muted">
                               <div className="flex items-center justify-between">
                                 <div className="flex-1 min-w-0">
                                   <p className="text-xs font-medium truncate">{pro.name}</p>
                                   <p className="text-xs text-muted-foreground">
                                     Ward {pro.ward} • {pro.mobile_number}
                                   </p>
                                 </div>
                                 <Badge variant="secondary" className="text-xs h-5 px-2 ml-2">
                                   <Users className="h-3 w-3 mr-1" />
                                   {pro.total_customers}
                                 </Badge>
                               </div>
                             </Card>
                           ))
                         )}
                       </div>
                     </ScrollArea>
                   </CollapsibleContent>
                </Collapsible>
              </div>
            ))
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};