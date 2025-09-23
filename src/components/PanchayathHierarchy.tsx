import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Users, MapPin, Building, BarChart3, Edit, Trash2, MessageSquare, ChevronDown, ChevronRight, Eye, EyeOff } from "lucide-react";
import { PanchayathChart } from "@/components/PanchayathChart";
import { PanchayathForm } from "@/components/PanchayathForm";
import { SupervisorForm } from "@/components/SupervisorForm";
import { GroupLeaderForm } from "@/components/GroupLeaderForm";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PanchayathData {
  id: string;
  name: string;
  number_of_wards: number;
  coordinator_count: number;
  supervisor_count: number;
  group_leader_count: number;
  pro_count: number;
}

interface Agent {
  id: string;
  name: string;
  mobile_number: string;
  ward?: number;
  supervisor_id?: string;
  coordinator_id?: string;
  group_leader_id?: string;
}

export const PanchayathHierarchy = () => {
  const [panchayaths, setPanchayaths] = useState<PanchayathData[]>([]);
  const [filteredPanchayaths, setFilteredPanchayaths] = useState<PanchayathData[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingPanchayath, setEditingPanchayath] = useState<any>(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});
  const [showAgentNames, setShowAgentNames] = useState<Record<string, boolean>>({
    coordinator: true,
    supervisor: true,
    group_leader: false,
    pro: false
  });
  const [showAgentDialog, setShowAgentDialog] = useState(false);
  const [selectedAgentType, setSelectedAgentType] = useState<'supervisor' | 'group_leader' | null>(null);
  const [selectedPanchayathForAgents, setSelectedPanchayathForAgents] = useState<PanchayathData | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const { toast } = useToast();

  const fetchPanchayaths = async () => {
    try {
      const { data, error } = await supabase
        .from("panchayaths")
        .select(`
          id,
          name,
          number_of_wards,
          coordinators:coordinators(count),
          supervisors:supervisors(count),
          group_leaders:group_leaders(count),
          pros:pros(count)
        `);

      if (error) throw error;

      const panchayathsWithCounts = data?.map(p => ({
        id: p.id,
        name: p.name,
        number_of_wards: p.number_of_wards,
        coordinator_count: p.coordinators?.[0]?.count || 0,
        supervisor_count: p.supervisors?.[0]?.count || 0,
        group_leader_count: p.group_leaders?.[0]?.count || 0,
        pro_count: p.pros?.[0]?.count || 0,
      })) || [];

      setPanchayaths(panchayathsWithCounts);
      setFilteredPanchayaths(panchayathsWithCounts);
    } catch (error: any) {
      console.error("Error fetching panchayaths:", error);
      toast({
        title: "Error",
        description: "Failed to fetch panchayaths",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPanchayaths();
  }, []);

  useEffect(() => {
    const filtered = panchayaths.filter(p =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    // Sort by total agents (high to low)
    const sorted = filtered.sort((a, b) => {
      const totalA = a.coordinator_count + a.supervisor_count + a.group_leader_count + a.pro_count;
      const totalB = b.coordinator_count + b.supervisor_count + b.group_leader_count + b.pro_count;
      return totalB - totalA;
    });
    
    setFilteredPanchayaths(sorted);
  }, [searchTerm, panchayaths]);

  const handleEdit = (panchayath: PanchayathData) => {
    setEditingPanchayath({
      id: panchayath.id,
      name: panchayath.name,
      number_of_wards: panchayath.number_of_wards
    });
    setShowEditForm(true);
  };

  const handleDelete = async (panchayathId: string, panchayathName: string) => {
    try {
      const { error } = await supabase
        .from("panchayaths")
        .delete()
        .eq("id", panchayathId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `${panchayathName} has been deleted successfully`,
      });

      // Refresh the list
      fetchPanchayaths();
    } catch (error: any) {
      console.error("Error deleting panchayath:", error);
      toast({
        title: "Error",
        description: "Failed to delete panchayath",
        variant: "destructive",
      });
    }
  };

  const handleEditComplete = () => {
    setEditingAgent(null);
    setShowEditDialog(false);
    setShowEditForm(false);
    setEditingPanchayath(null);
    fetchPanchayaths(); // Refresh counts
    if (selectedAgentType && selectedPanchayathForAgents) {
      fetchAgents(selectedAgentType, selectedPanchayathForAgents.id); // Refresh agent list
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "coordinator": return "bg-coordinator";
      case "supervisor": return "bg-supervisor";
      case "group-leader": return "bg-group-leader";
      case "pro": return "bg-pro";
      default: return "bg-muted";
    }
  };

  const toggleCardExpansion = (cardId: string) => {
    setExpandedCards(prev => ({
      ...prev,
      [cardId]: !prev[cardId]
    }));
  };

  const toggleAgentNameVisibility = (role: string) => {
    setShowAgentNames(prev => ({
      ...prev,
      [role]: !prev[role]
    }));
  };

  const fetchAgents = async (type: 'supervisor' | 'group_leader', panchayathId: string) => {
    try {
      const tableName = type === 'supervisor' ? 'supervisors' : 'group_leaders';
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('panchayath_id', panchayathId)
        .order('name');

      if (error) throw error;
      setAgents(data || []);
    } catch (error) {
      console.error(`Error fetching ${type}s:`, error);
      toast({
        title: "Error",
        description: `Failed to fetch ${type}s`,
        variant: "destructive",
      });
    }
  };

  const handleViewAgents = (type: 'supervisor' | 'group_leader', panchayath: PanchayathData) => {
    setSelectedAgentType(type);
    setSelectedPanchayathForAgents(panchayath);
    fetchAgents(type, panchayath.id);
    setShowAgentDialog(true);
  };

  const handleEditAgent = (agent: Agent) => {
    setEditingAgent(agent);
    setShowAgentDialog(false);
    setShowEditDialog(true);
  };

  const handleDeleteAgent = async (agentId: string, agentName: string) => {
    if (!selectedAgentType) return;
    
    try {
      const tableName = selectedAgentType === 'supervisor' ? 'supervisors' : 'group_leaders';
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', agentId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `${selectedAgentType === 'supervisor' ? 'Supervisor' : 'Group Leader'} deleted successfully`,
      });

      fetchPanchayaths(); // Refresh counts
      if (selectedPanchayathForAgents) {
        fetchAgents(selectedAgentType, selectedPanchayathForAgents.id); // Refresh agent list
      }
    } catch (error: any) {
      console.error(`Error deleting ${selectedAgentType}:`, error);
      toast({
        title: "Error",
        description: `Failed to delete ${selectedAgentType}`,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading panchayath hierarchy...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (showEditForm) {
    return (
      <div className="space-y-6">
        <PanchayathForm
          officerId="admin"
          editingPanchayath={editingPanchayath}
          onEditComplete={handleEditComplete}
          onPanchayathCreated={() => {}}
          onPanchayathDeleted={() => {}}
        />
        <Button
          variant="outline"
          onClick={() => setShowEditForm(false)}
          className="mb-4"
        >
          Back to Hierarchy
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Panchayath Hierarchy & Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="list" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="list" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                List View
              </TabsTrigger>
              <TabsTrigger value="chart" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Chart View
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="list">
                <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2 mb-4 p-2 bg-muted/50 rounded-lg">
                  <span className="text-sm font-medium text-muted-foreground">Show Names:</span>
                  {Object.entries(showAgentNames).map(([role, isVisible]) => (
                    <Button
                      key={role}
                      variant="outline"
                      size="sm"
                      onClick={() => toggleAgentNameVisibility(role)}
                      className="h-8 text-xs"
                    >
                      {isVisible ? <Eye className="h-3 w-3 mr-1" /> : <EyeOff className="h-3 w-3 mr-1" />}
                      {role.charAt(0).toUpperCase() + role.slice(1).replace('_', ' ')}
                    </Button>
                  ))}
                </div>

                <div className="space-y-4">
                  <div className="relative mb-6">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Search panchayaths..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  <div className="grid gap-4">
                    {filteredPanchayaths.map((panchayath) => (
                      <Collapsible key={panchayath.id} open={expandedCards[panchayath.id] ?? true}>
                        <Card className="border border-border hover:border-primary/40 transition-colors">
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <CollapsibleTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => toggleCardExpansion(panchayath.id)}
                                      className="h-6 w-6 p-0"
                                    >
                                      {expandedCards[panchayath.id] ?? true ? (
                                        <ChevronDown className="h-4 w-4" />
                                      ) : (
                                        <ChevronRight className="h-4 w-4" />
                                      )}
                                    </Button>
                                  </CollapsibleTrigger>
                                  <h3 className="text-lg font-semibold text-primary">{panchayath.name}</h3>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1 ml-8">
                                  <MapPin className="h-4 w-4" />
                                  <span>{panchayath.number_of_wards} wards</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="bg-primary/10">
                                  <Users className="h-3 w-3 mr-1" />
                                  Total: {panchayath.coordinator_count + panchayath.supervisor_count + panchayath.group_leader_count + panchayath.pro_count}
                                </Badge>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEdit(panchayath)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-8 w-8 p-0 hover:bg-destructive hover:text-destructive-foreground"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete Panchayath</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to delete "{panchayath.name}"? This action cannot be undone and will also delete all associated coordinators, supervisors, group leaders, and PROs.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleDelete(panchayath.id, panchayath.name)}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      >
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </div>

                            <CollapsibleContent>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <div className="flex items-center gap-2 p-2 rounded-lg bg-coordinator/10 border border-coordinator/20">
                                  <div className="h-3 w-3 rounded-full bg-coordinator"></div>
                                  <div>
                                    <p className="text-xs text-muted-foreground">
                                      Coordinators {showAgentNames.coordinator ? '(Names Shown)' : '(Names Hidden)'}
                                    </p>
                                    <p className="font-semibold">{panchayath.coordinator_count}</p>
                                  </div>
                                </div>

                                <div 
                                  className="flex items-center gap-2 p-2 rounded-lg bg-supervisor/10 border border-supervisor/20 cursor-pointer hover:bg-supervisor/20 transition-colors"
                                  onClick={() => handleViewAgents('supervisor', panchayath)}
                                >
                                  <div className="h-3 w-3 rounded-full bg-supervisor"></div>
                                  <div className="flex-1">
                                    <p className="text-xs text-muted-foreground">
                                      Supervisors {showAgentNames.supervisor ? '(Names Shown)' : '(Names Hidden)'}
                                    </p>
                                    <p className="font-semibold">{panchayath.supervisor_count}</p>
                                  </div>
                                  <Edit className="h-3 w-3 text-muted-foreground" />
                                </div>

                                <div 
                                  className="flex items-center gap-2 p-2 rounded-lg bg-group-leader/10 border border-group-leader/20 cursor-pointer hover:bg-group-leader/20 transition-colors"
                                  onClick={() => handleViewAgents('group_leader', panchayath)}
                                >
                                  <div className="h-3 w-3 rounded-full bg-group-leader"></div>
                                  <div className="flex-1">
                                    <p className="text-xs text-muted-foreground">
                                      Group Leaders {showAgentNames.group_leader ? '(Names Shown)' : '(Names Hidden)'}
                                    </p>
                                    <p className="font-semibold">{panchayath.group_leader_count}</p>
                                  </div>
                                  <Edit className="h-3 w-3 text-muted-foreground" />
                                </div>

                                <div className="flex items-center gap-2 p-2 rounded-lg bg-pro/10 border border-pro/20">
                                  <div className="h-3 w-3 rounded-full bg-pro"></div>
                                  <div>
                                    <p className="text-xs text-muted-foreground">
                                      PROs {showAgentNames.pro ? '(Names Shown)' : '(Names Hidden)'}
                                    </p>
                                    <p className="font-semibold">{panchayath.pro_count}</p>
                                  </div>
                                </div>
                              </div>
                            </CollapsibleContent>
                          </CardContent>
                        </Card>
                      </Collapsible>
                    ))}
                  </div>

                  {filteredPanchayaths.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">
                        {searchTerm ? `No panchayaths found matching "${searchTerm}"` : "No panchayaths found"}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="chart">
              <PanchayathChart />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Agents List Dialog */}
      <Dialog open={showAgentDialog} onOpenChange={setShowAgentDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedAgentType === 'supervisor' ? 'Supervisors' : 'Group Leaders'} - {selectedPanchayathForAgents?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {agents.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                No {selectedAgentType === 'supervisor' ? 'supervisors' : 'group leaders'} found
              </p>
            ) : (
              <div className="grid gap-3">
                {agents.map((agent) => (
                  <Card key={agent.id} className="border border-border">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-semibold">{agent.name}</h4>
                          <p className="text-sm text-muted-foreground">{agent.mobile_number}</p>
                          {agent.ward && (
                            <p className="text-xs text-muted-foreground">Ward {agent.ward}</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditAgent(agent)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm" className="hover:bg-destructive hover:text-destructive-foreground">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete {selectedAgentType === 'supervisor' ? 'Supervisor' : 'Group Leader'}</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{agent.name}"? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteAgent(agent.id, agent.name)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Agent Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Edit {selectedAgentType === 'supervisor' ? 'Supervisor' : 'Group Leader'}
            </DialogTitle>
          </DialogHeader>
          {editingAgent && selectedPanchayathForAgents && (
            <>
              {selectedAgentType === 'supervisor' && (
                <SupervisorForm
                  selectedPanchayath={selectedPanchayathForAgents}
                  editingSupervisor={editingAgent}
                  onEditComplete={handleEditComplete}
                />
              )}
              {selectedAgentType === 'group_leader' && (
                <GroupLeaderForm
                  selectedPanchayath={selectedPanchayathForAgents}
                  editingGroupLeader={editingAgent}
                  onEditComplete={handleEditComplete}
                />
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};