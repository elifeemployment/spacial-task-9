import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  UserCog, 
  Search, 
  CheckCircle, 
  XCircle, 
  Edit, 
  Trash2, 
  Loader2,
  Shield,
  Phone,
  MapPin
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TeamAdmin {
  id: string;
  name: string;
  mobile: string;
  panchayath: string;
  role: string;
  team_id: string;
  team_name?: string;
  is_approved: boolean;
  is_active: boolean;
  created_at: string;
}

interface Team {
  id: string;
  name: string;
}

export const TeamAdminManagement = () => {
  const [teamAdmins, setTeamAdmins] = useState<TeamAdmin[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "approved" | "inactive">("all");
  const [editingAdmin, setEditingAdmin] = useState<TeamAdmin | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchTeamAdmins();
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_teams')
        .select('id, name');
      
      if (error) throw error;
      setTeams(data || []);
    } catch (error) {
      console.error("Error fetching teams:", error);
    }
  };

  const fetchTeamAdmins = async () => {
    try {
      setLoading(true);
      const { data: membersData, error: membersError } = await supabase
        .from('admin_members')
        .select('*')
        .eq('admin_type', 'team_admin')
        .order('created_at', { ascending: false });

      if (membersError) throw membersError;

      const { data: teamsData, error: teamsError } = await supabase
        .from('admin_teams')
        .select('id, name');

      if (teamsError) throw teamsError;

      const teamsMap = new Map(teamsData?.map(t => [t.id, t.name]) || []);

      const adminsWithTeams = (membersData || []).map(admin => ({
        ...admin,
        team_name: teamsMap.get(admin.team_id) || 'Unknown Team',
        is_approved: admin.is_approved ?? false,
        is_active: admin.is_active ?? true,
      }));

      setTeamAdmins(adminsWithTeams);
    } catch (error) {
      console.error("Error fetching team admins:", error);
      toast({
        title: "Error",
        description: "Failed to fetch team admins",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (adminId: string, approved: boolean) => {
    setActionLoading(adminId);
    try {
      const { error } = await supabase
        .from('admin_members')
        .update({ is_approved: approved })
        .eq('id', adminId);

      if (error) throw error;

      setTeamAdmins(prev => prev.map(admin => 
        admin.id === adminId ? { ...admin, is_approved: approved } : admin
      ));

      toast({
        title: approved ? "Approved" : "Approval Revoked",
        description: `Team admin has been ${approved ? 'approved' : 'unapproved'}`,
      });
    } catch (error) {
      console.error("Error updating approval:", error);
      toast({
        title: "Error",
        description: "Failed to update approval status",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleActive = async (adminId: string, isActive: boolean) => {
    setActionLoading(adminId);
    try {
      const { error } = await supabase
        .from('admin_members')
        .update({ is_active: isActive })
        .eq('id', adminId);

      if (error) throw error;

      setTeamAdmins(prev => prev.map(admin => 
        admin.id === adminId ? { ...admin, is_active: isActive } : admin
      ));

      toast({
        title: isActive ? "Activated" : "Deactivated",
        description: `Team admin has been ${isActive ? 'activated' : 'deactivated'}`,
      });
    } catch (error) {
      console.error("Error toggling active status:", error);
      toast({
        title: "Error",
        description: "Failed to update active status",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (adminId: string) => {
    if (!confirm("Are you sure you want to delete this team admin? This action cannot be undone.")) return;
    
    setActionLoading(adminId);
    try {
      const { error } = await supabase
        .from('admin_members')
        .delete()
        .eq('id', adminId);

      if (error) throw error;

      setTeamAdmins(prev => prev.filter(admin => admin.id !== adminId));

      toast({
        title: "Deleted",
        description: "Team admin has been deleted",
      });
    } catch (error) {
      console.error("Error deleting team admin:", error);
      toast({
        title: "Error",
        description: "Failed to delete team admin",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleEditSave = async () => {
    if (!editingAdmin) return;
    
    setActionLoading(editingAdmin.id);
    try {
      const { error } = await supabase
        .from('admin_members')
        .update({
          name: editingAdmin.name,
          mobile: editingAdmin.mobile,
          panchayath: editingAdmin.panchayath,
          role: editingAdmin.role,
          team_id: editingAdmin.team_id,
        })
        .eq('id', editingAdmin.id);

      if (error) throw error;

      const teamName = teams.find(t => t.id === editingAdmin.team_id)?.name || 'Unknown Team';
      
      setTeamAdmins(prev => prev.map(admin => 
        admin.id === editingAdmin.id ? { ...editingAdmin, team_name: teamName } : admin
      ));

      setShowEditDialog(false);
      setEditingAdmin(null);

      toast({
        title: "Updated",
        description: "Team admin details updated successfully",
      });
    } catch (error) {
      console.error("Error updating team admin:", error);
      toast({
        title: "Error",
        description: "Failed to update team admin",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const filteredAdmins = teamAdmins.filter(admin => {
    const matchesSearch = 
      admin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      admin.mobile.includes(searchQuery) ||
      admin.panchayath.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (filterStatus === "all") return matchesSearch;
    if (filterStatus === "pending") return matchesSearch && !admin.is_approved;
    if (filterStatus === "approved") return matchesSearch && admin.is_approved && admin.is_active;
    if (filterStatus === "inactive") return matchesSearch && !admin.is_active;
    
    return matchesSearch;
  });

  const pendingCount = teamAdmins.filter(a => !a.is_approved).length;
  const activeCount = teamAdmins.filter(a => a.is_approved && a.is_active).length;
  const inactiveCount = teamAdmins.filter(a => !a.is_active).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <UserCog className="h-6 w-6" />
          Team Admin Control
        </h2>
        <p className="text-muted-foreground">Approve, edit, delete, and manage team admin access</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setFilterStatus("all")}>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{teamAdmins.length}</div>
            <p className="text-sm text-muted-foreground">Total Admins</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-yellow-500/50 transition-colors border-yellow-200 bg-yellow-50" onClick={() => setFilterStatus("pending")}>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
            <p className="text-sm text-yellow-600/70">Pending Approval</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-green-500/50 transition-colors border-green-200 bg-green-50" onClick={() => setFilterStatus("approved")}>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{activeCount}</div>
            <p className="text-sm text-green-600/70">Active</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-red-500/50 transition-colors border-red-200 bg-red-50" onClick={() => setFilterStatus("inactive")}>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">{inactiveCount}</div>
            <p className="text-sm text-red-600/70">Inactive</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, mobile, or panchayath..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterStatus} onValueChange={(v: any) => setFilterStatus(v)}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Admins</SelectItem>
            <SelectItem value="pending">Pending Approval</SelectItem>
            <SelectItem value="approved">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Team Admins List */}
      <Card>
        <CardHeader>
          <CardTitle>Team Administrators</CardTitle>
          <CardDescription>
            {filteredAdmins.length} {filteredAdmins.length === 1 ? 'admin' : 'admins'} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredAdmins.map((admin) => (
              <div
                key={admin.id}
                className={`p-4 rounded-lg border transition-all ${
                  !admin.is_active 
                    ? 'bg-muted/50 border-muted' 
                    : !admin.is_approved 
                      ? 'border-yellow-300 bg-yellow-50' 
                      : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-semibold">{admin.name}</h4>
                      {!admin.is_approved && (
                        <Badge variant="outline" className="bg-yellow-100 text-yellow-700 border-yellow-300">
                          Pending Approval
                        </Badge>
                      )}
                      {admin.is_approved && admin.is_active && (
                        <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                          Active
                        </Badge>
                      )}
                      {!admin.is_active && (
                        <Badge variant="outline" className="bg-red-100 text-red-700 border-red-300">
                          Inactive
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {admin.mobile}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {admin.panchayath}
                      </span>
                      <span className="flex items-center gap-1">
                        <Shield className="h-3 w-3" />
                        {admin.team_name}
                      </span>
                    </div>
                    <Badge variant="secondary" className="text-xs">{admin.role}</Badge>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    {/* Approval Toggle */}
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`approve-${admin.id}`} className="text-sm">
                        Approved
                      </Label>
                      <Switch
                        id={`approve-${admin.id}`}
                        checked={admin.is_approved}
                        onCheckedChange={(checked) => handleApprove(admin.id, checked)}
                        disabled={actionLoading === admin.id}
                      />
                    </div>

                    {/* Active Toggle */}
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`active-${admin.id}`} className="text-sm">
                        Active
                      </Label>
                      <Switch
                        id={`active-${admin.id}`}
                        checked={admin.is_active}
                        onCheckedChange={(checked) => handleToggleActive(admin.id, checked)}
                        disabled={actionLoading === admin.id}
                      />
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingAdmin(admin);
                          setShowEditDialog(true);
                        }}
                        disabled={actionLoading === admin.id}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(admin.id)}
                        disabled={actionLoading === admin.id}
                        className="text-destructive hover:text-destructive"
                      >
                        {actionLoading === admin.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {filteredAdmins.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <UserCog className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No team admins found</p>
                {searchQuery && <p className="text-sm">Try adjusting your search query</p>}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Team Admin</DialogTitle>
            <DialogDescription>
              Update the team admin details below
            </DialogDescription>
          </DialogHeader>
          {editingAdmin && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Name</Label>
                <Input
                  id="edit-name"
                  value={editingAdmin.name}
                  onChange={(e) => setEditingAdmin({ ...editingAdmin, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-mobile">Mobile</Label>
                <Input
                  id="edit-mobile"
                  value={editingAdmin.mobile}
                  onChange={(e) => setEditingAdmin({ ...editingAdmin, mobile: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-panchayath">Panchayath</Label>
                <Input
                  id="edit-panchayath"
                  value={editingAdmin.panchayath}
                  onChange={(e) => setEditingAdmin({ ...editingAdmin, panchayath: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-role">Role</Label>
                <Input
                  id="edit-role"
                  value={editingAdmin.role}
                  onChange={(e) => setEditingAdmin({ ...editingAdmin, role: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-team">Team</Label>
                <Select 
                  value={editingAdmin.team_id} 
                  onValueChange={(value) => setEditingAdmin({ ...editingAdmin, team_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select team" />
                  </SelectTrigger>
                  <SelectContent>
                    {teams.map((team) => (
                      <SelectItem key={team.id} value={team.id}>
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditSave} disabled={actionLoading === editingAdmin?.id}>
              {actionLoading === editingAdmin?.id ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
