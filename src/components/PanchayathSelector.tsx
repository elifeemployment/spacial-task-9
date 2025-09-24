import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PanchayathSelectorProps {
  onPanchayathSelect: (panchayath: any) => void;
  onPanchayathEdit: (panchayath: any) => void;
}

export const PanchayathSelector = ({ onPanchayathSelect, onPanchayathEdit }: PanchayathSelectorProps) => {
  const [panchayaths, setPanchayaths] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchPanchayaths();
  }, []);

  const fetchPanchayaths = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("panchayaths")
        .select(`
          *,
          coordinators(count),
          supervisors(count),
          group_leaders(count),
          pros(count)
        `)
        .order("name");

      if (error) throw error;
      setPanchayaths(data || []);
    } catch (error) {
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

  const handleSelect = () => {
    const selected = panchayaths.find(p => p.id === selectedId);
    if (selected) {
      onPanchayathSelect(selected);
      toast({
        title: "Success",
        description: `Selected ${selected.name} for management`,
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const selectedPanchayath = panchayaths.find(p => p.id === selectedId);

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Select value={selectedId} onValueChange={setSelectedId}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a panchayath to manage" />
          </SelectTrigger>
          <SelectContent className="bg-popover border border-border shadow-lg">
            {panchayaths.filter(p => p.id && p.id.trim()).map((panchayath) => (
              <SelectItem key={panchayath.id} value={panchayath.id}>
                <div className="flex items-center justify-between w-full">
                  <span className="font-medium">{panchayath.name}</span>
                  <Badge variant="secondary" className="ml-2">
                    {panchayath.number_of_wards} wards
                  </Badge>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedId && (
          <div className="space-y-4">
            <Button onClick={handleSelect} className="w-full">
              Select for Management
            </Button>
            <Button
              onClick={() => onPanchayathEdit(selectedPanchayath)}
              className="w-full"
              variant="outline"
            >
              Edit Panchayath Details
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};