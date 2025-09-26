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
import { Plus, Minus } from "lucide-react";

export interface CustomerFormProps {
  selectedPanchayath?: any;
  editingCustomer?: any;
  onEditComplete?: () => void;
}

export const CustomerForm = ({ selectedPanchayath: preSelectedPanchayath, editingCustomer, onEditComplete }: CustomerFormProps) => {
  const [ward, setWard] = useState("");
  const [proId, setProId] = useState("");
  const [customerCount, setCustomerCount] = useState(1);
  const [pros, setPros] = useState<any[]>([]);
  const [panchayathId, setPanchayathId] = useState("");
  const [panchayaths, setPanchayaths] = useState<any[]>([]);
  const [selectedPanchayath, setSelectedPanchayath] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmedAgentDetails, setConfirmedAgentDetails] = useState<any>(null);
  const isEditing = !!editingCustomer;
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
    if (editingCustomer) {
      setWard(editingCustomer.ward.toString());
      setProId(editingCustomer.pro_id);
      setCustomerCount(editingCustomer.customer_count || 1);
      setPanchayathId(editingCustomer.panchayath_id);
    }
  }, [editingCustomer]);

  useEffect(() => {
    if (panchayathId) {
      const panchayath = panchayaths.find(p => p.id === panchayathId);
      setSelectedPanchayath(panchayath);
      setWard(""); // Reset ward when panchayath changes
      setProId("");
    } else {
      setSelectedPanchayath(null);
    }
  }, [panchayathId, panchayaths]);

  useEffect(() => {
    if (ward && panchayathId) {
      fetchProsForWard(parseInt(ward));
    } else {
      setPros([]);
      setProId("");
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

  const fetchProsForWard = async (wardNum: number) => {
    if (!panchayathId) return;
    
    try {
      const { data, error } = await supabase
        .from("pros")
        .select("*")
        .eq("panchayath_id", panchayathId)
        .eq("ward", wardNum);

      if (error) throw error;
      setPros(data || []);
    } catch (error) {
      console.error("Error fetching PROs:", error);
    }
  };

  const incrementCount = () => {
    setCustomerCount(prev => prev + 1);
  };

  const decrementCount = () => {
    setCustomerCount(prev => Math.max(1, prev - 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // For editing, get panchayath ID from either editing data or state
    const effectivePanchayathId = isEditing ? (editingCustomer?.panchayath_id || panchayathId) : panchayathId;
    
    if (!ward || !proId || (!effectivePanchayathId && !isEditing)) {
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
      if (isEditing) {
        const { data: updated, error } = await supabase
          .from("customers" as any)
          .update({
            pro_id: proId,
            ward: wardNum,
            customer_count: customerCount,
          })
          .eq("id", editingCustomer.id)
          .select("id");

        if (error) throw error;
        if (!updated || updated.length === 0) {
          throw new Error("No customer updated. Please try again.");
        }

        toast({
          title: "Success",
          description: "Customer updated successfully",
        });
        
        onEditComplete?.();
      } else {
        const { error } = await supabase
          .from("customers" as any)
          .insert({
            panchayath_id: panchayathId,
            pro_id: proId,
            ward: wardNum,
            customer_count: customerCount,
          });

        if (error) throw error;

        // Prepare agent details for confirmation
        const selectedPro = pros.find(p => p.id === proId);
        const agentDetails = {
          ward: wardNum,
          panchayath: selectedPanchayath.name,
          role: "Customer",
          pro: selectedPro?.name,
          customerCount: customerCount
        };

        setConfirmedAgentDetails(agentDetails);
        setShowConfirmation(true);
        
        // Reset form fields
        setWard("");
        setProId("");
        setCustomerCount(1);
        
        // Only reset panchayath selection if not pre-selected
        if (!preSelectedPanchayath) {
          setPanchayathId("");
        }
      }
    } catch (error: any) {
      console.error(`Error ${isEditing ? 'updating' : 'adding'} customer:`, error);
      toast({
        title: "Error",
        description: error.message || `Failed to ${isEditing ? 'update' : 'add'} customer`,
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
      description: "Customer added successfully",
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
          <CardTitle>{isEditing ? 'Edit Customer' : 'Add Customer'}</CardTitle>
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
                <Label>Select PRO</Label>
                <Select value={proId} onValueChange={setProId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select PRO for this ward" />
                  </SelectTrigger>
                  <SelectContent>
                    {pros.map((pro) => (
                      <SelectItem key={pro.id} value={pro.id}>
                        {pro.name} ({pro.mobile_number})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>Customer Count</Label>
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={decrementCount}
                  disabled={customerCount <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <div className="flex items-center justify-center min-w-[60px] h-10 border rounded-md bg-background">
                  <span className="font-medium">{customerCount}</span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={incrementCount}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <Button type="submit" disabled={loading}>
              {loading ? (isEditing ? "Updating..." : "Adding...") : (isEditing ? "Update Customer" : "Add Customer")}
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