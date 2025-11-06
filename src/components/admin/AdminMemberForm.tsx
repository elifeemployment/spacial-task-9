import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { checkMobileDuplicate } from "@/lib/mobileValidation";
import { supabase } from "@/integrations/supabase/client";

interface AdminMember {
  id: string;
  team_id: string;
  name: string;
  mobile: string;
  panchayath: string;
  role: string;
  created_at: string;
}

interface AdminMemberFormProps {
  teamId: string;
  member?: AdminMember | null;
  onSuccess: () => void;
  onCancel: () => void;
}

const memberRoles = [
  "Team member",
  "Team lead",
  "Coordinator",
  "Supervisor",
  "Administrator"
];

export const AdminMemberForm = ({ teamId, member, onSuccess, onCancel }: AdminMemberFormProps) => {
  const [name, setName] = useState(member?.name || "");
  const [mobile, setMobile] = useState(member?.mobile || "");
  const [panchayath, setPanchayath] = useState(member?.panchayath || "");
  const [role, setRole] = useState(member?.role || "Team member");
  const [panchayaths, setPanchayaths] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const isEditing = !!member;

  // Fetch available panchayaths
  useEffect(() => {
    const fetchPanchayaths = async () => {
      try {
        const { data, error } = await supabase
          .from('panchayaths')
          .select('name')
          .order('name');

        if (error) throw error;

        const panchayathNames = data?.map(p => p.name) || [];
        setPanchayaths(panchayathNames);
      } catch (error) {
        console.error("Error fetching panchayaths:", error);
      }
    };

    fetchPanchayaths();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !mobile.trim() || !panchayath || !role) {
      toast({
        title: "Error",
        description: "All fields are required",
        variant: "destructive",
      });
      return;
    }

    // Basic mobile number validation
    const mobileRegex = /^[0-9]{10}$/;
    if (!mobileRegex.test(mobile.replace(/\s/g, ''))) {
      toast({
        title: "Error",
        description: "Please enter a valid 10-digit mobile number",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Check for duplicate mobile number
      const cleanMobile = mobile.replace(/\s/g, '');
      
      // Check admin_members table for duplicates
      const { data: adminMemberData, error: adminMemberError } = await supabase
        .from('admin_members')
        .select('id')
        .eq('mobile', cleanMobile);

      if (!adminMemberError && adminMemberData && adminMemberData.length > 0) {
        // If editing, exclude current member from duplicate check
        if (!isEditing || adminMemberData.some(m => m.id !== member?.id)) {
          toast({
            title: "Error",
            description: "This mobile number is already registered as an admin member",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
      }

      if (isEditing && member) {
        // Update existing admin member
        const { error } = await supabase
          .from('admin_members')
          .update({
            name: name.trim(),
            mobile: cleanMobile,
            panchayath,
            role
          })
          .eq('id', member.id);

        if (error) throw error;
      } else {
        // Create new admin member
        const { error } = await supabase
          .from('admin_members')
          .insert({
            team_id: teamId,
            name: name.trim(),
            mobile: cleanMobile,
            panchayath,
            role
          });

        if (error) throw error;
      }

      toast({
        title: "Success",
        description: `Admin member ${isEditing ? "updated" : "added"} successfully`,
      });

      onSuccess();
    } catch (error) {
      console.error(`Error ${isEditing ? "updating" : "adding"} admin member:`, error);
      toast({
        title: "Error",
        description: `Failed to ${isEditing ? "update" : "add"} admin member`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Admin Member" : "Add Admin Member"}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? "Update the admin member information below."
              : "Fill in the details to add a new admin member."
            }
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter full name"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="mobile">Mobile Number *</Label>
            <Input
              id="mobile"
              type="text"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              placeholder="Enter 10-digit mobile number"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="panchayath">Panchayath *</Label>
            <Select value={panchayath} onValueChange={setPanchayath} required>
              <SelectTrigger>
                <SelectValue placeholder="Select a panchayath" />
              </SelectTrigger>
              <SelectContent>
                {panchayaths.filter(name => name && name.trim()).map((panchayathName) => (
                  <SelectItem key={panchayathName} value={panchayathName}>
                    {panchayathName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="role">Role *</Label>
            <Select value={role} onValueChange={setRole} required>
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {memberRoles.map((roleOption) => (
                  <SelectItem key={roleOption} value={roleOption}>
                    {roleOption}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : (isEditing ? "Update Member" : "Add Member")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};