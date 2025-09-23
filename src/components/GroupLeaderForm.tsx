import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { checkMobileDuplicate, getTableDisplayName } from "@/lib/mobileValidation";
import { AgentConfirmationDialog } from "./AgentConfirmationDialog";

export interface GroupLeaderFormProps {
  selectedPanchayath?: any;
  editingGroupLeader?: any;
  onEditComplete?: () => void;
}

export const GroupLeaderForm = ({ selectedPanchayath: preSelectedPanchayath, editingGroupLeader, onEditComplete }: GroupLeaderFormProps) => {
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [ward, setWard] = useState("");
  const [supervisorId, setSupervisorId] = useState("");
  const [supervisors, setSupervisors] = useState<any[]>([]);
  const [panchayathId, setPanchayathId] = useState("");
  const [panchayaths, setPanchayaths] = useState<any[]>([]);
  const [selectedPanchayath, setSelectedPanchayath] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmedAgentDetails, setConfirmedAgentDetails] = useState<any>(null);
  const isEditing = !!editingGroupLeader;
  const { toast } = useToast();

  useEffect(() => {
    fetchPanchayaths();
  }, []);

  useEffect(() => {
    if (preSelectedPanchayath) {
      setPanchayathId(preSelectedPanchayath.id);
      setSelectedPanchayath(preSelectedPanchayath);
    }
  }, [preSelectedPanchayath]);

  useEffect(() => {
    if (editingGroupLeader) {
      setName(editingGroupLeader.name);
      setMobile(editingGroupLeader.mobile_number);
      setWard(editingGroupLeader.ward.toString());
      setSupervisorId(editingGroupLeader.supervisor_id);
      setPanchayathId(editingGroupLeader.panchayath_id);
      
      // For editing, also fetch all supervisors as a fallback
      if (editingGroupLeader.panchayath_id) {
        fetchAllSupervisors(editingGroupLeader.panchayath_id);
      }
    }
  }, [editingGroupLeader]);

  const fetchAllSupervisors = async (panchayathId: string) => {
    try {
      console.log("Fetching all supervisors for panchayath:", panchayathId);
      const { data, error } = await supabase
        .from("supervisors")
        .select("*")
        .eq("panchayath_id", panchayathId);

      if (error) throw error;
      console.log("All supervisors fetched:", data);
      setSupervisors(data || []);
    } catch (error) {
      console.error("Error fetching all supervisors:", error);
    }
  };

  useEffect(() => {
    if (panchayathId) {
      const panchayath = panchayaths.find(p => p.id === panchayathId);
      setSelectedPanchayath(panchayath);
      // Only reset ward and supervisor when not editing or when panchayath actually changes
      if (!isEditing || (isEditing && editingGroupLeader?.panchayath_id !== panchayathId)) {
        setWard(""); // Reset ward when panchayath changes
        setSupervisorId("");
      }
    } else {
      setSelectedPanchayath(null);
    }
  }, [panchayathId, panchayaths, isEditing, editingGroupLeader?.panchayath_id]);

  useEffect(() => {
    if (ward && panchayathId) {
      fetchSupervisorsForWard(parseInt(ward));
    } else {
      setSupervisors([]);
      setSupervisorId("");
    }
  }, [ward, panchayathId]);

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

  const fetchSupervisorsForWard = async (wardNum: number) => {
    if (!panchayathId) return;
    
    console.log("Fetching supervisors for ward:", wardNum, "panchayath:", panchayathId);
    try {
      // Get all supervisors for the panchayath
      const { data: allSupervisors, error: supervisorError } = await supabase
        .from("supervisors")
        .select("*")
        .eq("panchayath_id", panchayathId);

      if (supervisorError) throw supervisorError;

      // Filter supervisors who have the required ward
      const supervisorsForWard = [];
      for (const supervisor of allSupervisors || []) {
        const { data: wards, error: wardsError } = await supabase
          .from("supervisor_wards")
          .select("ward")
          .eq("supervisor_id", supervisor.id);
        
        if (wardsError) {
          console.error("Error fetching wards for supervisor:", supervisor.id, wardsError);
          continue;
        }
        
        if (wards?.some(w => w.ward === wardNum)) {
          supervisorsForWard.push(supervisor);
        }
      }

      console.log("Supervisors fetched:", supervisorsForWard);
      setSupervisors(supervisorsForWard || []);
    } catch (error) {
      console.error("Error fetching supervisors:", error);
      setSupervisors([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // For editing, get panchayath ID from either editing data or state
    const effectivePanchayathId = isEditing ? (editingGroupLeader?.panchayath_id || panchayathId) : panchayathId;
    
    if (!name.trim() || !mobile.trim() || !ward || !supervisorId || (!effectivePanchayathId && !isEditing)) {
      toast({
        title: "Error",
        description: isEditing 
          ? "Please fill in all fields"
          : "Please fill in all fields and select a panchayath",
        variant: "destructive",
      });
      return;
    }

    // Validate mobile number (exactly 10 digits)
    if (!/^\d{10}$/.test(mobile.trim())) {
      toast({
        title: "Error",
        description: "Mobile number must be exactly 10 digits",
        variant: "destructive",
      });
      return;
    }

    const wardNum = parseInt(ward);
    if (isNaN(wardNum) || wardNum < 1 || wardNum > selectedPanchayath.number_of_wards) {
      toast({
        title: "Error",
        description: `Ward must be between 1 and ${selectedPanchayath.number_of_wards}`,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Check for duplicate mobile number
      const duplicateCheck = await checkMobileDuplicate(mobile, editingGroupLeader?.id, 'group_leaders');
      if (duplicateCheck.isDuplicate) {
        toast({
          title: "Error",
          description: `This mobile number is already registered in ${getTableDisplayName(duplicateCheck.table!)}`,
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      if (isEditing) {
        const { data: updated, error } = await supabase
          .from("group_leaders")
          .update({
            supervisor_id: supervisorId,
            name: name.trim(),
            mobile_number: mobile.trim(),
            ward: wardNum,
          })
          .eq("id", editingGroupLeader.id)
          .select("id");

        if (error) throw error;
        if (!updated || updated.length === 0) {
          throw new Error("No group leader updated. Please try again.");
        }

        toast({
          title: "Success",
          description: "Group Leader updated successfully",
        });
        
        onEditComplete?.();
      } else {
        const { error } = await supabase
          .from("group_leaders")
          .insert({
            panchayath_id: panchayathId,
            supervisor_id: supervisorId,
            name: name.trim(),
            mobile_number: mobile.trim(),
            ward: wardNum,
          });

        if (error) throw error;

        // Prepare agent details for confirmation
        const selectedSupervisor = supervisors.find(s => s.id === supervisorId);
        const agentDetails = {
          name: name.trim(),
          mobile: mobile.trim(),
          ward: wardNum,
          panchayath: selectedPanchayath.name,
          role: "Group Leader",
          groupLeader: selectedSupervisor?.name
        };

        setConfirmedAgentDetails(agentDetails);
        setShowConfirmation(true);
        
        setName("");
        setMobile("");
        setWard("");
        setSupervisorId("");
        setPanchayathId("");
      }
    } catch (error: any) {
      console.error(`Error ${isEditing ? 'updating' : 'adding'} group leader:`, error);
      toast({
        title: "Error",
        description: error.message || `Failed to ${isEditing ? 'update' : 'add'} group leader`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const wardOptions = selectedPanchayath ? Array.from({ length: selectedPanchayath.number_of_wards }, (_, i) => i + 1) : [];

  const handleConfirmation = () => {
    setShowConfirmation(false);
    setConfirmedAgentDetails(null);
    toast({
      title: "Success",
      description: "Group Leader added successfully",
    });
  };

  return (
    <>
      <AgentConfirmationDialog
        isOpen={showConfirmation}
        onConfirm={handleConfirmation}
        agentDetails={confirmedAgentDetails || {}}
      />
      <Card>
      <CardHeader>
        <CardTitle>{isEditing ? 'Edit Group Leader' : 'Add Group Leader'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!preSelectedPanchayath && !isEditing && (
            <div className="space-y-2">
              <Label>Select Panchayath</Label>
              <Select value={panchayathId} onValueChange={setPanchayathId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select panchayath" />
                </SelectTrigger>
                <SelectContent>
                  {panchayaths.map((panchayath) => (
                    <SelectItem key={panchayath.id} value={panchayath.id}>
                      {panchayath.name} ({panchayath.number_of_wards} wards)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          {(preSelectedPanchayath || (isEditing && selectedPanchayath)) && (
            <div className="space-y-2">
              <Label>Selected Panchayath</Label>
              <div className="p-3 bg-muted rounded-md border">
                <span className="font-medium">
                  {preSelectedPanchayath?.name || selectedPanchayath?.name}
                </span>
                <span className="text-muted-foreground ml-2">
                  ({preSelectedPanchayath?.number_of_wards || selectedPanchayath?.number_of_wards} wards)
                </span>
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="gl-name">Name</Label>
              <Input
                id="gl-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gl-mobile">Mobile Number</Label>
              <Input
                id="gl-mobile"
                type="tel"
                value={mobile}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                  setMobile(value);
                }}
                placeholder="Enter 10-digit mobile number"
                maxLength={10}
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Select Ward</Label>
            <Select value={ward} onValueChange={setWard} disabled={!selectedPanchayath}>
              <SelectTrigger>
                <SelectValue placeholder={selectedPanchayath ? "Select ward" : "Select panchayath first"} />
              </SelectTrigger>
              <SelectContent>
                {wardOptions.map((wardNum) => (
                  <SelectItem key={wardNum} value={wardNum.toString()}>
                    Ward {wardNum}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {ward && (
            <div className="space-y-2">
              <Label>Select Supervisor</Label>
              <Select value={supervisorId} onValueChange={setSupervisorId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select supervisor for this ward" />
                </SelectTrigger>
                <SelectContent>
                  {supervisors.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground">
                      No supervisors found for ward {ward}
                      {isEditing && <div className="text-xs">Showing all supervisors for panchayath</div>}
                    </div>
                  ) : (
                    supervisors.map((supervisor) => (
                      <SelectItem key={supervisor.id} value={supervisor.id}>
                        {supervisor.name} ({supervisor.mobile_number})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          <Button type="submit" disabled={loading}>
            {loading ? (isEditing ? "Updating..." : "Adding...") : (isEditing ? "Update Group Leader" : "Add Group Leader")}
          </Button>
          {isEditing && (
            <Button type="button" variant="outline" onClick={onEditComplete}>
              Cancel
            </Button>
          )}
        </form>
      </CardContent>
    </Card>
    </>
  );
};