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

export interface ProFormProps {
  selectedPanchayath?: any;
  editingPro?: any;
  onEditComplete?: () => void;
}

export const ProForm = ({ selectedPanchayath: preSelectedPanchayath, editingPro, onEditComplete }: ProFormProps) => {
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [ward, setWard] = useState("");
  const [groupLeaderId, setGroupLeaderId] = useState("");
  const [groupLeaders, setGroupLeaders] = useState<any[]>([]);
  const [panchayathId, setPanchayathId] = useState("");
  const [panchayaths, setPanchayaths] = useState<any[]>([]);
  const [selectedPanchayath, setSelectedPanchayath] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmedAgentDetails, setConfirmedAgentDetails] = useState<any>(null);
  const isEditing = !!editingPro;
  const { toast } = useToast();

  useEffect(() => {
    fetchPanchayaths();
  }, []);

  useEffect(() => {
    if (preSelectedPanchayath) {
      setPanchayathId(preSelectedPanchayath.id);
    }
  }, [preSelectedPanchayath]);

  useEffect(() => {
    if (editingPro) {
      setName(editingPro.name);
      setMobile(editingPro.mobile_number);
      setWard(editingPro.ward.toString());
      setGroupLeaderId(editingPro.group_leader_id);
      setPanchayathId(editingPro.panchayath_id);
    }
  }, [editingPro]);

  useEffect(() => {
    if (panchayathId) {
      const panchayath = panchayaths.find(p => p.id === panchayathId);
      setSelectedPanchayath(panchayath);
      setWard(""); // Reset ward when panchayath changes
      setGroupLeaderId("");
    } else {
      setSelectedPanchayath(null);
    }
  }, [panchayathId, panchayaths]);

  useEffect(() => {
    if (ward && panchayathId) {
      fetchGroupLeadersForWard(parseInt(ward));
    } else {
      setGroupLeaders([]);
      setGroupLeaderId("");
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

  const fetchGroupLeadersForWard = async (wardNum: number) => {
    if (!panchayathId) return;
    
    try {
      const { data, error } = await supabase
        .from("group_leaders")
        .select("*")
        .eq("panchayath_id", panchayathId)
        .eq("ward", wardNum);

      if (error) throw error;
      setGroupLeaders(data || []);
    } catch (error) {
      console.error("Error fetching group leaders:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // For editing, get panchayath ID from either editing data or state
    const effectivePanchayathId = isEditing ? (editingPro?.panchayath_id || panchayathId) : panchayathId;
    
    if (!name.trim() || !mobile.trim() || !ward || !groupLeaderId || (!effectivePanchayathId && !isEditing)) {
      toast({
        title: "Error",
        description: isEditing 
          ? "Please fill in all fields"
          : "Please fill in all fields and select a panchayath",
        variant: "destructive",
      });
      return;
    }

    const wardNum = parseInt(ward);
    // Validate mobile number (exactly 10 digits)
    if (!/^\d{10}$/.test(mobile.trim())) {
      toast({
        title: "Error",
        description: "Mobile number must be exactly 10 digits",
        variant: "destructive",
      });
      return;
    }

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
      const duplicateCheck = await checkMobileDuplicate(mobile, editingPro?.id, 'pros');
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
          .from("pros")
          .update({
            group_leader_id: groupLeaderId,
            name: name.trim(),
            mobile_number: mobile.trim(),
            ward: wardNum,
          })
          .eq("id", editingPro.id)
          .select("id");

        if (error) throw error;
        if (!updated || updated.length === 0) {
          throw new Error("No PRO updated. Please try again.");
        }

        toast({
          title: "Success",
          description: "PRO updated successfully",
        });
        
        onEditComplete?.();
      } else {
        const { error } = await supabase
          .from("pros")
          .insert({
            panchayath_id: panchayathId,
            group_leader_id: groupLeaderId,
            name: name.trim(),
            mobile_number: mobile.trim(),
            ward: wardNum,
          });

        if (error) throw error;

        // Prepare agent details for confirmation
        const selectedGroupLeader = groupLeaders.find(gl => gl.id === groupLeaderId);
        const agentDetails = {
          name: name.trim(),
          mobile: mobile.trim(),
          ward: wardNum,
          panchayath: selectedPanchayath.name,
          role: "PRO",
          groupLeader: selectedGroupLeader?.name
        };

        setConfirmedAgentDetails(agentDetails);
        setShowConfirmation(true);
        
        // Reset form fields
        const tempName = name;
        const tempMobile = mobile;
        const tempWard = ward;
        const tempGroupLeaderId = groupLeaderId;
        
        setName("");
        setMobile("");
        setWard("");
        setGroupLeaderId("");
        
        // Only reset panchayath selection if not pre-selected
        if (!preSelectedPanchayath) {
          setPanchayathId("");
        }
      }
    } catch (error: any) {
      console.error(`Error ${isEditing ? 'updating' : 'adding'} PRO:`, error);
      toast({
        title: "Error",
        description: error.message || `Failed to ${isEditing ? 'update' : 'add'} PRO`,
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
      description: "PRO added successfully",
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
        <CardTitle>{isEditing ? 'Edit PRO' : 'Add PRO'}</CardTitle>
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
              <Label htmlFor="pro-name">Name</Label>
              <Input
                id="pro-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pro-mobile">Mobile Number</Label>
              <Input
                id="pro-mobile"
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
              <Label>Select Group Leader</Label>
              <Select value={groupLeaderId} onValueChange={setGroupLeaderId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select group leader for this ward" />
                </SelectTrigger>
                <SelectContent>
                  {groupLeaders.map((leader) => (
                    <SelectItem key={leader.id} value={leader.id}>
                      {leader.name} ({leader.mobile_number})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <Button type="submit" disabled={loading}>
            {loading ? (isEditing ? "Updating..." : "Adding...") : (isEditing ? "Update PRO" : "Add PRO")}
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