import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Trash2, Edit, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CoordinatorForm } from "@/components/CoordinatorForm";
import { SupervisorForm } from "@/components/SupervisorForm";
import { GroupLeaderForm } from "@/components/GroupLeaderForm";
import { ProForm } from "@/components/ProForm";
import { AgentDailyNotes } from "@/components/AgentDailyNotes";

export const PanchayathView = () => {
  const [panchayaths, setPanchayaths] = useState<any[]>([]);
  const [selectedPanchayath, setSelectedPanchayath] = useState("");
  const [hierarchyData, setHierarchyData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteCode, setDeleteCode] = useState("");
  const [itemToDelete, setItemToDelete] = useState<{type: string, id?: string, name: string} | null>(null);
  const { toast } = useToast();
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editType, setEditType] = useState<"coordinator" | "supervisor" | "group_leader" | "pro" | null>(null);
  const [editRecord, setEditRecord] = useState<any | null>(null);
  const [showNotesDialog, setShowNotesDialog] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<{name: string, type: string, mobile: string} | null>(null);

  useEffect(() => {
    fetchPanchayaths();
  }, []);

  useEffect(() => {
    if (selectedPanchayath) {
      fetchHierarchyData();
    }
  }, [selectedPanchayath]);

  const fetchPanchayaths = async () => {
    try {
      const { data, error } = await supabase
        .from("panchayaths")
        .select("*")
        .order("name");

      if (error) throw error;
      setPanchayaths(data || []);
    } catch (error) {
      console.error("Error fetching panchayaths:", error);
    }
  };

  const fetchHierarchyData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("hierarchy_view")
        .select("*")
        .eq("panchayath_name", panchayaths.find(p => p.id === selectedPanchayath)?.name)
        .order("coordinator_ward", { nullsFirst: false })
        .order("group_leader_ward", { nullsFirst: false });

      if (error) throw error;
      setHierarchyData(data || []);
    } catch (error) {
      console.error("Error fetching hierarchy data:", error);
      toast({
        title: "Error",
        description: "Failed to fetch hierarchy data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (type: string, row: any) => {
    try {
      if (!selectedPanchayath) throw new Error("Select a panchayath first");
      
      console.log(`Attempting to edit ${type}:`, row);
      let record: any = null;

      switch (type) {
        case "coordinator": {
          const { data, error } = await supabase
            .from("coordinators")
            .select("id, name, mobile, ward, rating, panchayath_id")
            .eq("panchayath_id", selectedPanchayath)
            .eq("name", row.coordinator_name)
            .eq("ward", row.coordinator_ward)
            .limit(1);
          console.log(`Coordinator query result:`, { data, error, searching_for: { name: row.coordinator_name, ward: row.coordinator_ward } });
          if (error) throw error;
          record = data?.[0] || null;
          break;
        }
        case "supervisor": {
          const { data, error } = await supabase
            .from("supervisors")
            .select("id, name, mobile_number, coordinator_id, panchayath_id")
            .eq("panchayath_id", selectedPanchayath)
            .eq("name", row.supervisor_name)
            .limit(1);
          console.log(`Supervisor query result:`, { data, error, searching_for: { name: row.supervisor_name } });
          if (error) throw error;
          record = data?.[0] || null;
          break;
        }
        case "group_leader": {
          const { data, error } = await supabase
            .from("group_leaders")
            .select("id, name, mobile_number, ward, supervisor_id, panchayath_id")
            .eq("panchayath_id", selectedPanchayath)
            .eq("name", row.group_leader_name)
            .eq("ward", row.group_leader_ward)
            .limit(1);
          console.log(`Group leader query result:`, { data, error, searching_for: { name: row.group_leader_name, ward: row.group_leader_ward } });
          if (error) throw error;
          record = data?.[0] || null;
          break;
        }
        case "pro": {
          const { data, error } = await supabase
            .from("pros")
            .select("id, name, mobile_number, ward, group_leader_id, panchayath_id")
            .eq("panchayath_id", selectedPanchayath)
            .eq("name", row.pro_name)
            .eq("ward", row.pro_ward)
            .limit(1);
          console.log(`Pro query result:`, { data, error, searching_for: { name: row.pro_name, ward: row.pro_ward } });
          if (error) throw error;
          record = data?.[0] || null;
          break;
        }
        default:
          throw new Error("Invalid type");
      }

      if (!record) throw new Error(`${type} record not found`);

      setEditType(type as any);
      setEditRecord(record);
      setShowEditDialog(true);
    } catch (error: any) {
      console.error(`Error preparing edit for ${type}:`, error);
      toast({
        title: "Error",
        description: error.message || `Could not load ${type} for edit`,
        variant: "destructive",
      });
    }
  };

  const handleDelete = (type: string, id: string, name: string) => {
    setItemToDelete({ type, id, name });
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (deleteCode !== "9497589094") {
      toast({
        title: "Error",
        description: "Invalid delete code",
        variant: "destructive",
      });
      return;
    }

    if (!itemToDelete) return;

    try {
      let tableName: string;
      switch (itemToDelete.type) {
        case "coordinator":
          tableName = "coordinators";
          break;
        case "supervisor":
          tableName = "supervisors";
          break;
        case "group_leader":
          tableName = "group_leaders";
          break;
        case "pro":
          tableName = "pros";
          break;
        default:
          throw new Error("Invalid type");
      }

      // Resolve target id (hierarchy_view doesn't expose IDs)
      let targetId = itemToDelete.id;
      if (!targetId) {
        if (itemToDelete.type === "coordinator") {
          const match = hierarchyData.find((h) => h.coordinator_name === itemToDelete.name);
          if (!match) throw new Error("Coordinator reference not found in hierarchy data");
          const { data, error: findError } = await supabase
            .from("coordinators")
            .select("id")
            .eq("panchayath_id", selectedPanchayath)
            .eq("name", match.coordinator_name)
            .eq("mobile", match.coordinator_mobile)
            .eq("ward", match.coordinator_ward)
            .limit(1);
          if (findError) throw findError;
          targetId = data?.[0]?.id;
        } else if (itemToDelete.type === "supervisor") {
          const match = hierarchyData.find((h) => h.supervisor_name === itemToDelete.name);
          if (!match) throw new Error("Supervisor reference not found in hierarchy data");
          const { data, error: findError } = await supabase
            .from("supervisors")
            .select("id")
            .eq("panchayath_id", selectedPanchayath)
            .eq("name", match.supervisor_name)
            .eq("mobile_number", match.supervisor_mobile)
            .limit(1);
          if (findError) throw findError;
          targetId = data?.[0]?.id;
        } else if (itemToDelete.type === "group_leader") {
          const match = hierarchyData.find((h) => h.group_leader_name === itemToDelete.name);
          if (!match) throw new Error("Group Leader reference not found in hierarchy data");
          const { data, error: findError } = await supabase
            .from("group_leaders")
            .select("id")
            .eq("panchayath_id", selectedPanchayath)
            .eq("name", match.group_leader_name)
            .eq("mobile_number", match.group_leader_mobile)
            .eq("ward", match.group_leader_ward)
            .limit(1);
          if (findError) throw findError;
          targetId = data?.[0]?.id;
        } else if (itemToDelete.type === "pro") {
          const match = hierarchyData.find((h) => h.pro_name === itemToDelete.name);
          if (!match) throw new Error("PRO reference not found in hierarchy data");
          const { data, error: findError } = await supabase
            .from("pros")
            .select("id")
            .eq("panchayath_id", selectedPanchayath)
            .eq("name", match.pro_name)
            .eq("ward", match.pro_ward)
            .eq("mobile_number", match.pro_mobile)
            .limit(1);
          if (findError) throw findError;
          targetId = data?.[0]?.id;
        }

        if (!targetId) throw new Error("Record not found");
      }

      const { data: deleted, error } = await supabase
        .from(tableName as any)
        .delete()
        .eq("id", targetId as string)
        .select("id");

      if (error) throw error;
      if (!deleted || deleted.length === 0) {
        throw new Error("Nothing was deleted. Please try again.");
      }

      toast({
        title: "Success",
        description: `${itemToDelete.type} deleted successfully`,
      });
      
      setShowDeleteDialog(false);
      setDeleteCode("");
      setItemToDelete(null);
      fetchHierarchyData();
    } catch (error: any) {
      console.error(`Error deleting ${itemToDelete.type}:`, error);
      toast({
        title: "Error",
        description: error.message || `Failed to delete ${itemToDelete.type}`,
        variant: "destructive",
      });
    }
  };

  const handleViewNotes = (name: string, type: string, mobile: string) => {
    setSelectedAgent({ name, type, mobile });
    setShowNotesDialog(true);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg md:text-xl">View Panchayath Hierarchy</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 md:space-y-6 p-3 md:p-6">
          <div className="space-y-2">
          <label className="text-sm font-medium">Select Panchayath</label>
          <Select value={selectedPanchayath} onValueChange={setSelectedPanchayath}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a panchayath to view" />
            </SelectTrigger>
            <SelectContent className="z-50 bg-background">
              {panchayaths.map((panchayath) => (
                <SelectItem key={panchayath.id} value={panchayath.id}>
                  {panchayath.name} ({panchayath.number_of_wards} wards)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedPanchayath && (
          <div className="space-y-4">
            {loading ? (
              <p>Loading hierarchy data...</p>
            ) : hierarchyData.length === 0 ? (
              <p className="text-muted-foreground">No hierarchy data found for this panchayath.</p>
            ) : (
              <div className="space-y-6">
                {/* Group by coordinator */}
                {Array.from(new Set(hierarchyData.map(item => item.coordinator_name)
                  .filter(Boolean))).map(coordinatorName => {
                  const coordinatorData = hierarchyData.find(item => item.coordinator_name === coordinatorName);
                  const supervisors = hierarchyData.filter(item => 
                    item.coordinator_name === coordinatorName && item.supervisor_name
                  );
                  
                  return (
                    <Card key={coordinatorName} className="border-l-4 border-l-coordinator">
                      <CardHeader className="pb-3 p-3 md:p-6">
                        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-3">
                          <div className="flex-1">
                            <CardTitle className="text-base md:text-lg flex items-center gap-2 flex-wrap">
                              <Badge className="bg-coordinator text-coordinator-foreground text-xs">Coordinator</Badge>
                              <span className="break-words">{coordinatorData?.coordinator_name}</span>
                            </CardTitle>
                            <div className="text-xs md:text-sm text-muted-foreground space-y-1 md:space-y-0">
                              <div>Ward {coordinatorData?.coordinator_ward}</div>
                              <div>Mobile: {coordinatorData?.coordinator_mobile}</div>
                              <div>Rating: {coordinatorData?.coordinator_rating}/10</div>
                            </div>
                          </div>
                          <div className="flex gap-2 shrink-0">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleEdit("coordinator", coordinatorData)}
                              className="h-8 w-8 p-0 md:h-9 md:w-auto md:px-3"
                            >
                              <Edit className="h-3 w-3 md:h-4 md:w-4" />
                              <span className="hidden md:inline ml-2">Edit</span>
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleViewNotes(coordinatorData?.coordinator_name, "Coordinator", coordinatorData?.coordinator_mobile)}
                              className="h-8 w-8 p-0 md:h-9 md:w-auto md:px-3"
                            >
                              <FileText className="h-3 w-3 md:h-4 md:w-4" />
                              <span className="hidden md:inline ml-2">Notes</span>
                            </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleDelete("coordinator", coordinatorData?.coordinator_id, coordinatorData?.coordinator_name)}
                                className="h-8 w-8 p-0 md:h-9 md:w-auto md:px-3"
                              >
                                <Trash2 className="h-3 w-3 md:h-4 md:w-4" />
                                <span className="hidden md:inline ml-2">Delete</span>
                              </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {/* Supervisors under this coordinator */}
                        {Array.from(new Set(supervisors.map(s => s.supervisor_name).filter(Boolean))).map(supervisorName => {
                          const supervisorData = supervisors.find(s => s.supervisor_name === supervisorName);
                          const groupLeaders = hierarchyData.filter(item => 
                            item.supervisor_name === supervisorName && item.group_leader_name
                          );
                          
                          return (
                            <div key={supervisorName} className="ml-0 md:ml-4 mb-4 p-3 md:p-4 border-l-4 border-l-supervisor border border-border rounded-lg bg-muted/30">
                              <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-3 mb-3">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                                    <Badge className="bg-supervisor text-supervisor-foreground text-xs">Supervisor</Badge>
                                    <span className="font-medium text-sm md:text-base break-words">{supervisorData?.supervisor_name}</span>
                                  </div>
                                  <div className="text-xs md:text-sm text-muted-foreground space-y-1 md:space-y-0">
                                    <div>Mobile: {supervisorData?.supervisor_mobile}</div>
                                    <div>Wards: {supervisorData?.supervisor_wards?.join(", ")}</div>
                                  </div>
                                </div>
                                <div className="flex gap-2 shrink-0">
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => handleEdit("supervisor", supervisorData)}
                                    className="h-7 w-7 p-0 md:h-8 md:w-auto md:px-2"
                                  >
                                    <Edit className="h-3 w-3" />
                                    <span className="hidden md:inline ml-1">Edit</span>
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => handleViewNotes(supervisorData?.supervisor_name, "Supervisor", supervisorData?.supervisor_mobile)}
                                    className="h-7 w-7 p-0 md:h-8 md:w-auto md:px-2"
                                  >
                                    <FileText className="h-3 w-3" />
                                    <span className="hidden md:inline ml-1">Notes</span>
                                  </Button>
                                   <Button 
                                     size="sm" 
                                     variant="outline"
                                     onClick={() => handleDelete("supervisor", supervisorData?.supervisor_id, supervisorData?.supervisor_name)}
                                     className="h-7 w-7 p-0 md:h-8 md:w-auto md:px-2"
                                   >
                                    <Trash2 className="h-3 w-3" />
                                    <span className="hidden md:inline ml-1">Delete</span>
                                  </Button>
                                </div>
                              </div>
                              
                              {/* Group Leaders under this supervisor */}
                              {Array.from(new Set(groupLeaders.map(gl => gl.group_leader_name).filter(Boolean))).map(groupLeaderName => {
                                const groupLeaderData = groupLeaders.find(gl => gl.group_leader_name === groupLeaderName);
                                const pros = hierarchyData.filter(item => 
                                  item.group_leader_name === groupLeaderName && item.pro_name
                                );
                                
                                return (
                                  <div key={groupLeaderName} className="ml-0 md:ml-4 mb-3 p-2 md:p-3 border-l-4 border-l-group-leader border border-border rounded bg-background">
                                    <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-2 mb-2">
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                                          <Badge className="bg-group-leader text-group-leader-foreground text-xs">Group Leader</Badge>
                                          <span className="font-medium text-sm break-words">{groupLeaderData?.group_leader_name}</span>
                                        </div>
                                        <div className="text-xs md:text-sm text-muted-foreground space-y-1 md:space-y-0">
                                          <div>Ward {groupLeaderData?.group_leader_ward}</div>
                                          <div>Mobile: {groupLeaderData?.group_leader_mobile}</div>
                                        </div>
                                      </div>
                                      <div className="flex gap-2 shrink-0">
                                        <Button 
                                          size="sm" 
                                          variant="outline"
                                          onClick={() => handleEdit("group_leader", groupLeaderData)}
                                          className="h-6 w-6 p-0 md:h-7 md:w-auto md:px-2"
                                        >
                                          <Edit className="h-3 w-3" />
                                          <span className="hidden md:inline ml-1">Edit</span>
                                        </Button>
                                        <Button 
                                          size="sm" 
                                          variant="outline"
                                          onClick={() => handleViewNotes(groupLeaderData?.group_leader_name, "Group Leader", groupLeaderData?.group_leader_mobile)}
                                          className="h-6 w-6 p-0 md:h-7 md:w-auto md:px-2"
                                        >
                                          <FileText className="h-3 w-3" />
                                          <span className="hidden md:inline ml-1">Notes</span>
                                        </Button>
                                         <Button 
                                           size="sm" 
                                           variant="outline"
                                           onClick={() => handleDelete("group_leader", groupLeaderData?.group_leader_id, groupLeaderData?.group_leader_name)}
                                           className="h-6 w-6 p-0 md:h-7 md:w-auto md:px-2"
                                         >
                                          <Trash2 className="h-3 w-3" />
                                          <span className="hidden md:inline ml-1">Delete</span>
                                        </Button>
                                      </div>
                                    </div>
                                    
                                     {/* PROs under this group leader */}
                                     {pros.filter(p => p.pro_name).map((pro, index) => (
                                       <div key={index} className="ml-0 md:ml-4 p-2 border-l-4 border-l-pro">
                                         <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2">
                                           <div className="flex-1">
                                             <div className="flex items-center gap-2 flex-wrap">
                                               <Badge className="bg-pro text-pro-foreground text-xs">PRO</Badge>
                                               <span className="text-xs md:text-sm font-medium break-words">{pro.pro_name}</span>
                                             </div>
                                             <div className="text-xs text-muted-foreground space-y-1 md:space-y-0">
                                               <div>Ward {pro.pro_ward}</div>
                                               <div>Mobile: {pro.pro_mobile}</div>
                                             </div>
                                           </div>
                                            <div className="flex gap-1 shrink-0">
                                              <Button 
                                                size="sm" 
                                                variant="outline" 
                                                className="h-6 w-6 p-0"
                                                onClick={() => handleEdit("pro", pro)}
                                              >
                                                <Edit className="h-3 w-3" />
                                              </Button>
                                              <Button 
                                                size="sm" 
                                                variant="outline" 
                                                className="h-6 w-6 p-0"
                                                onClick={() => handleViewNotes(pro.pro_name, "PRO", pro.pro_mobile)}
                                              >
                                                <FileText className="h-3 w-3" />
                                              </Button>
                                                <Button 
                                                  size="sm" 
                                                  variant="outline" 
                                                  className="h-6 w-6 p-0"
                                                  onClick={() => handleDelete("pro", pro.id || pro.pro_id, pro.pro_name)}
                                                >
                                                <Trash2 className="h-3 w-3" />
                                              </Button>
                                            </div>
                                         </div>
                                       </div>
                                     ))}
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>

    <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete {itemToDelete?.name}? This action cannot be undone.
            Please enter the delete code to confirm.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="py-4">
          <Input
            type="text"
            placeholder="Enter delete code"
            value={deleteCode}
            onChange={(e) => setDeleteCode(e.target.value)}
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setDeleteCode("")}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <Dialog open={showEditDialog} onOpenChange={(open) => {
      setShowEditDialog(open);
      if (!open) {
        setEditRecord(null);
        setEditType(null);
      }
    }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit {editType?.replace("_", " ")}</DialogTitle>
        </DialogHeader>
        {editType === "coordinator" && editRecord && (
          <CoordinatorForm
            selectedPanchayath={{ id: selectedPanchayath }}
            editingCoordinator={editRecord}
            onEditComplete={() => {
              setShowEditDialog(false);
              setEditRecord(null);
              setEditType(null);
              fetchHierarchyData();
            }}
          />
        )}
        {editType === "supervisor" && editRecord && (
          <SupervisorForm
            selectedPanchayath={{ id: selectedPanchayath }}
            editingSupervisor={editRecord}
            onEditComplete={() => {
              setShowEditDialog(false);
              setEditRecord(null);
              setEditType(null);
              fetchHierarchyData();
            }}
          />
        )}
        {editType === "group_leader" && editRecord && (
          <GroupLeaderForm
            selectedPanchayath={{ id: selectedPanchayath }}
            editingGroupLeader={editRecord}
            onEditComplete={() => {
              setShowEditDialog(false);
              setEditRecord(null);
              setEditType(null);
              fetchHierarchyData();
            }}
          />
        )}
        {editType === "pro" && editRecord && (
          <ProForm
            selectedPanchayath={{ id: selectedPanchayath }}
            editingPro={editRecord}
            onEditComplete={() => {
              setShowEditDialog(false);
              setEditRecord(null);
              setEditType(null);
              fetchHierarchyData();
            }}
          />
        )}
      </DialogContent>
    </Dialog>

    {selectedAgent && (
      <AgentDailyNotes
        agentName={selectedAgent.name}
        agentType={selectedAgent.type}
        agentMobile={selectedAgent.mobile}
        open={showNotesDialog}
        onOpenChange={setShowNotesDialog}
      />
    )}
    </>
  );
};