import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { CoordinatorHierarchyView } from "@/components/CoordinatorHierarchyView";
import { CoordinatorHierarchyChart } from "@/components/CoordinatorHierarchyChart";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@/lib/authService";
import { BarChart3, Network, TrendingDown, ChevronDown } from "lucide-react";

interface CoordinatorReportsProps {
  currentUser: User;
}

interface AgentPerformance {
  agent_id: string;
  agent_name: string;
  agent_type: string;
  mobile_number: string;
  consecutive_leave_days: number;
  is_inactive: boolean;
  last_activity_date: string | null;
  total_notes: number;
}

interface PerformanceStats {
  total_agents: number;
  inactive_agents: number;
  inactive_percentage: number;
}

export const CoordinatorReports = ({ currentUser }: CoordinatorReportsProps) => {
  const [agentPerformance, setAgentPerformance] = useState<AgentPerformance[]>([]);
  const [performanceStats, setPerformanceStats] = useState<PerformanceStats>({
    total_agents: 0,
    inactive_agents: 0,
    inactive_percentage: 0
  });
  const [loading, setLoading] = useState(false);
  const [panchayathName, setPanchayathName] = useState<string>("");

  useEffect(() => {
    if (currentUser.panchayath_id) {
      fetchPanchayathName();
      fetchPerformanceData();
    }
  }, [currentUser.panchayath_id]);

  const fetchPanchayathName = async () => {
    if (!currentUser.panchayath_id) return;

    const { data, error } = await supabase
      .from('panchayaths')
      .select('name')
      .eq('id', currentUser.panchayath_id)
      .single();

    if (!error && data) {
      setPanchayathName(data.name);
    }
  };

  const fetchPerformanceData = async () => {
    if (!currentUser.panchayath_id) return;

    setLoading(true);
    const performances: AgentPerformance[] = [];

    try {
      // Fetch coordinators for this panchayath
      const { data: coordinators } = await supabase
        .from('coordinators')
        .select('id, name, mobile_number')
        .eq('panchayath_id', currentUser.panchayath_id);

      if (coordinators) {
        for (const coordinator of coordinators) {
          const performance = await analyzeAgentPerformance(
            coordinator.mobile_number, 
            coordinator.name, 
            'coordinator'
          );
          if (performance) {
            performances.push({
              ...performance,
              agent_id: coordinator.id
            });
          }
        }
      }

      // Fetch supervisors for this panchayath
      const { data: supervisors } = await supabase
        .from('supervisors')
        .select('id, name, mobile_number')
        .eq('panchayath_id', currentUser.panchayath_id);

      if (supervisors) {
        for (const supervisor of supervisors) {
          const performance = await analyzeAgentPerformance(
            supervisor.mobile_number, 
            supervisor.name, 
            'supervisor'
          );
          if (performance) {
            performances.push({
              ...performance,
              agent_id: supervisor.id
            });
          }
        }
      }

      // Fetch group leaders for this panchayath
      const { data: groupLeaders } = await supabase
        .from('group_leaders')
        .select('id, name, mobile_number')
        .eq('panchayath_id', currentUser.panchayath_id);

      if (groupLeaders) {
        for (const groupLeader of groupLeaders) {
          const performance = await analyzeAgentPerformance(
            groupLeader.mobile_number, 
            groupLeader.name, 
            'group_leader'
          );
          if (performance) {
            performances.push({
              ...performance,
              agent_id: groupLeader.id
            });
          }
        }
      }

      // Fetch pros for this panchayath
      const { data: pros } = await supabase
        .from('pros')
        .select('id, name, mobile_number')
        .eq('panchayath_id', currentUser.panchayath_id);

      if (pros) {
        for (const pro of pros) {
          const performance = await analyzeAgentPerformance(
            pro.mobile_number, 
            pro.name, 
            'pro'
          );
          if (performance) {
            performances.push({
              ...performance,
              agent_id: pro.id
            });
          }
        }
      }

      setAgentPerformance(performances);

      // Calculate stats
      const totalAgents = performances.length;
      const inactiveAgents = performances.filter(p => p.is_inactive).length;
      const inactivePercentage = totalAgents > 0 ? (inactiveAgents / totalAgents) * 100 : 0;

      setPerformanceStats({
        total_agents: totalAgents,
        inactive_agents: inactiveAgents,
        inactive_percentage: Math.round(inactivePercentage * 100) / 100
      });

    } catch (error) {
      console.error('Error fetching performance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const analyzeAgentPerformance = async (
    mobileNumber: string, 
    agentName: string, 
    agentType: string
  ): Promise<Omit<AgentPerformance, 'agent_id'> | null> => {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: notes, error } = await supabase
        .from('daily_notes')
        .select('date, is_leave, activity')
        .eq('mobile_number', mobileNumber)
        .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
        .order('date', { ascending: false });

      if (error) {
        console.error('Error fetching notes for agent:', agentName, error);
        return null;
      }

      let consecutiveLeaveDays = 0;
      let lastActivityDate: string | null = null;
      const totalNotes = notes?.length || 0;

      if (notes && notes.length > 0) {
        // Sort notes by date (most recent first)
        const sortedNotes = notes.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        // Count consecutive leave days from the most recent date
        for (const note of sortedNotes) {
          if (note.is_leave) {
            consecutiveLeaveDays++;
          } else {
            break; // Stop counting when we find a non-leave day
          }
        }

        // Find the most recent activity (non-leave day)
        const lastActiveNote = sortedNotes.find(note => !note.is_leave);
        if (lastActiveNote) {
          lastActivityDate = lastActiveNote.date;
        }
      }

      const isInactive = consecutiveLeaveDays >= 3;

      return {
        agent_name: agentName,
        agent_type: agentType,
        mobile_number: mobileNumber,
        consecutive_leave_days: consecutiveLeaveDays,
        is_inactive: isInactive,
        last_activity_date: lastActivityDate,
        total_notes: totalNotes
      };

    } catch (error) {
      console.error('Error analyzing agent performance:', error);
      return null;
    }
  };

  const getStatusBadge = (agent: AgentPerformance) => {
    if (agent.is_inactive) {
      return <Badge variant="destructive">Inactive</Badge>;
    }
    return <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-200">Active</Badge>;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5" />
            Reports - {panchayathName}
          </CardTitle>
          <CardDescription>
            Performance reports and hierarchy for your panchayath
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="performance" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="performance" className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4" />
                Performance
              </TabsTrigger>
              <TabsTrigger value="hierarchy" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Hierarchy
              </TabsTrigger>
              <TabsTrigger value="hierarchy-count" className="flex items-center gap-2">
                <Network className="h-4 w-4" />
                Hierarchy Count
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="performance" className="space-y-6">
              {/* Performance Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Total Agents</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-primary">
                      {performanceStats.total_agents}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Inactive Agents</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-destructive">
                      {performanceStats.inactive_agents}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Inactive Percentage</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-orange-600">
                      {performanceStats.inactive_percentage}%
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Performance by Role */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold">Agent Performance Details</h3>
                  <Badge variant="outline">{agentPerformance.length} total agents</Badge>
                </div>
                
                {loading ? (
                  <div className="text-center py-8">Loading performance data...</div>
                ) : agentPerformance.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No agent data found for this panchayath
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Group agents by role */}
                    {['coordinator', 'supervisor', 'group_leader', 'pro'].map((roleType) => {
                      const roleAgents = agentPerformance.filter(agent => agent.agent_type === roleType);
                      if (roleAgents.length === 0) return null;
                      
                      const roleDisplayName = roleType === 'group_leader' ? 'Group Leader' : 
                                             roleType === 'pro' ? 'PRO' : 
                                             roleType.charAt(0).toUpperCase() + roleType.slice(1);
                      
                      return (
                        <Collapsible key={roleType}>
                          <Card>
                            <CollapsibleTrigger asChild>
                              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <CardTitle className="text-lg">{roleDisplayName}s</CardTitle>
                                    <Badge variant="secondary">{roleAgents.length} agents</Badge>
                                    <Badge variant={roleAgents.some(a => a.is_inactive) ? "destructive" : "default"}>
                                      {roleAgents.filter(a => a.is_inactive).length} inactive
                                    </Badge>
                                  </div>
                                  <ChevronDown className="h-4 w-4 transition-transform duration-200 data-[state=open]:rotate-180" />
                                </div>
                              </CardHeader>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <CardContent className="pt-0">
                                <div className="rounded-md border">
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Mobile</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Leave Days</TableHead>
                                        <TableHead>Last Activity</TableHead>
                                        <TableHead>Total Notes</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {roleAgents.map((agent, index) => (
                                        <TableRow key={index}>
                                          <TableCell className="font-medium">{agent.agent_name}</TableCell>
                                          <TableCell>{agent.mobile_number}</TableCell>
                                          <TableCell>{getStatusBadge(agent)}</TableCell>
                                          <TableCell>
                                            <span className={agent.consecutive_leave_days >= 3 ? "text-destructive font-medium" : ""}>
                                              {agent.consecutive_leave_days}
                                            </span>
                                          </TableCell>
                                          <TableCell>
                                            {agent.last_activity_date ? (
                                              new Date(agent.last_activity_date).toLocaleDateString()
                                            ) : (
                                              <span className="text-muted-foreground">No activity</span>
                                            )}
                                          </TableCell>
                                          <TableCell>{agent.total_notes}</TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </div>
                              </CardContent>
                            </CollapsibleContent>
                          </Card>
                        </Collapsible>
                      );
                    })}
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="hierarchy">
              <CoordinatorHierarchyView panchayathId={currentUser.panchayath_id} />
            </TabsContent>
            
            <TabsContent value="hierarchy-count">
              <CoordinatorHierarchyChart panchayathId={currentUser.panchayath_id} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};