import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { CheckCircle, XCircle, Plus, Edit, Save, X, Calendar as CalendarIcon, Clock, Trash2, Search, Users, UserCheck, Square, CheckSquare, RefreshCcw } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Task {
  id: string;
  text: string;
  status: 'finished' | 'unfinished' | 'requested';
  remarks: string | null;
  created_at: string;
  finished_at?: string | null;
  assigned_to?: string | null;
  reassigned_to_coordinator?: string | null;
  reassigned_to_supervisor?: string | null;
  assigned_to_all?: boolean;
  assigned_to_all_members?: boolean;
  finished_by_member_id?: string | null;
  assigned_member?: {
    id: string;
    name: string;
    mobile: string;
  } | null;
  reassigned_coordinator?: {
    id: string;
    name: string;
    mobile_number: string;
  } | null;
  reassigned_supervisor?: {
    id: string;
    name: string;
    mobile_number: string;
  } | null;
  finished_by_member?: {
    id: string;
    name: string;
    mobile: string;
  } | null;
}

interface AdminMember {
  id: string;
  name: string;
  mobile: string;
  team_id: string;
  role: string;
  panchayath: string;
}

interface Assignee {
  id: string;
  name: string;
  mobile: string;
  type: 'admin_member' | 'coordinator' | 'supervisor';
  role?: string;
}

export const TodoList = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [taskType, setTaskType] = useState<'single' | 'multi'>('single');
  const [singleTaskText, setSingleTaskText] = useState('');
  const [multiTaskText, setMultiTaskText] = useState('');
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [editRemarks, setEditRemarks] = useState('');
  const [editingTaskText, setEditingTaskText] = useState<string | null>(null);
  const [editTaskText, setEditTaskText] = useState('');
  const [finishingTask, setFinishingTask] = useState<string | null>(null);
  const [finishRemarks, setFinishRemarks] = useState('');
  const [activeTab, setActiveTab] = useState('unfinished');
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [deletingTask, setDeletingTask] = useState<string | null>(null);
  const [deletePasskey, setDeletePasskey] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [adminMembers, setAdminMembers] = useState<AdminMember[]>([]);
  const [assigningTask, setAssigningTask] = useState<string | null>(null);
  const [selectedMember, setSelectedMember] = useState<string>('unassigned');
  const [filterByAssignedTo, setFilterByAssignedTo] = useState<string>('all');
  const [newTaskAssignee, setNewTaskAssignee] = useState<string>('unassigned');
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState<'delete' | 'finish' | 'reassign' | null>(null);
  const [bulkRemarks, setBulkRemarks] = useState('');
  const [bulkDeletePasskey, setBulkDeletePasskey] = useState('');
  const [assignees, setAssignees] = useState<Assignee[]>([]);
  const [assigneeSearchTerm, setAssigneeSearchTerm] = useState('');
  const [bulkSelectedAssignee, setBulkSelectedAssignee] = useState<string>('unassigned');
  const [reassigningTask, setReassigningTask] = useState<string | null>(null);
  const [selectedReassignee, setSelectedReassignee] = useState<string>('unassigned');
  const [reassigneeType, setReassigneeType] = useState<'coordinator' | 'supervisor'>('coordinator');
  const [finishingMember, setFinishingMember] = useState<string>('');
  const [showMemberSelection, setShowMemberSelection] = useState(false);
  const { toast } = useToast();

  const isRequested = (task: Task) => task.status !== 'finished' && (task.remarks?.toLowerCase().includes('requested completion') ?? false);

  // Load tasks from database
  useEffect(() => {
    loadTasks();
    loadAdminMembers();
    loadAssignees();
  }, []);

  const loadTasks = async () => {
    try {
      console.log('Loading tasks...');
      const { data, error } = await supabase
        .from('todos')
        .select('*')
        .order('created_at', { ascending: false });

      console.log('Tasks loaded:', { data, error });

      if (error) throw error;
      
      // Get assigned members and reassigned coordinators/supervisors separately
      const tasksWithMembers = await Promise.all(
        (data || []).map(async (task) => {
          let assigned_member = null;
          let reassigned_coordinator = null;
          let reassigned_supervisor = null;
          const taskAny = task as any;
          
          if (taskAny.assigned_to) {
            const { data: memberData } = await supabase
              .from('admin_members')
              .select('id, name, mobile')
              .eq('id', taskAny.assigned_to)
              .single();
            assigned_member = memberData;
          }

          if (taskAny.reassigned_to_coordinator) {
            const { data: coordinatorData } = await supabase
              .from('coordinators')
              .select('id, name, mobile_number')
              .eq('id', taskAny.reassigned_to_coordinator)
              .single();
            reassigned_coordinator = coordinatorData;
          }

          if (taskAny.reassigned_to_supervisor) {
            const { data: supervisorData } = await supabase
              .from('supervisors')
              .select('id, name, mobile_number')
              .eq('id', taskAny.reassigned_to_supervisor)
              .single();
            reassigned_supervisor = supervisorData;
          }
          
            return {
              id: task.id,
              text: task.text,
              status: task.status as 'finished' | 'unfinished' | 'requested',
              remarks: task.remarks,
              created_at: task.created_at,
              finished_at: task.finished_at,
              assigned_to: taskAny.assigned_to || null,
              reassigned_to_coordinator: taskAny.reassigned_to_coordinator || null,
              reassigned_to_supervisor: taskAny.reassigned_to_supervisor || null,
              assigned_to_all_members: taskAny.assigned_to_all_members || false,
              assigned_member,
              reassigned_coordinator,
              reassigned_supervisor
            };
        })
      );
      
      console.log('Typed tasks:', tasksWithMembers);
      setTasks(tasksWithMembers);
    } catch (error) {
      console.error('Error loading tasks:', error);
      toast({
        title: "Error",
        description: "Failed to load tasks",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadAdminMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_members')
        .select('*')
        .order('name');

      if (error) throw error;
      
      setAdminMembers(data || []);
    } catch (error) {
      console.error('Error loading admin members:', error);
      toast({
        title: "Error",
        description: "Failed to load admin members",
        variant: "destructive",
      });
    }
  };

  const loadAssignees = async () => {
    try {
      const allAssignees: Assignee[] = [];

      // Load admin members
      const { data: adminData, error: adminError } = await supabase
        .from('admin_members')
        .select('id, name, mobile, role')
        .order('name');

      if (!adminError && adminData) {
        allAssignees.push(...adminData.map((member: any) => ({
          id: member.id,
          name: member.name,
          mobile: member.mobile,
          type: 'admin_member' as const,
          role: member.role
        })));
      }

      // Load coordinators
      const { data: coordinatorData, error: coordinatorError } = await supabase
        .from('coordinators')
        .select('id, name, mobile_number')
        .order('name');

      if (!coordinatorError && coordinatorData) {
        allAssignees.push(...coordinatorData.map((coordinator: any) => ({
          id: coordinator.id,
          name: coordinator.name,
          mobile: coordinator.mobile_number,
          type: 'coordinator' as const,
          role: 'Coordinator'
        })));
      }

      // Load supervisors
      const { data: supervisorData, error: supervisorError } = await supabase
        .from('supervisors')
        .select('id, name, mobile_number')
        .order('name');

      if (!supervisorError && supervisorData) {
        allAssignees.push(...supervisorData.map((supervisor: any) => ({
          id: supervisor.id,
          name: supervisor.name,
          mobile: supervisor.mobile_number,
          type: 'supervisor' as const,
          role: 'Supervisor'
        })));
      }

      setAssignees(allAssignees);
    } catch (error) {
      console.error('Error loading assignees:', error);
      toast({
        title: "Error",
        description: "Failed to load assignees",
        variant: "destructive",
      });
    }
  };

  const addSingleTask = async () => {
    if (!singleTaskText.trim()) return;

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (newTaskAssignee === 'all_members') {
        // Create individual tasks for each admin member
        const { data: members, error: membersError } = await supabase
          .from('admin_members')
          .select('id');

        if (membersError) throw membersError;

        const memberTasks = (members || []).map(member => ({
          text: singleTaskText,
          status: 'unfinished',
          remarks: null,
          created_by: user?.id || null,
          assigned_to: member.id,
          assigned_to_all_members: true
        }));

        const { error } = await supabase
          .from('todos')
          .insert(memberTasks);

        if (error) throw error;
        
        setSingleTaskText('');
        setNewTaskAssignee('unassigned');
        await loadTasks();
        toast({
          title: "Success",
          description: `Task assigned to all ${members?.length || 0} team members successfully`,
        });
      } else {
        const assignedTo = newTaskAssignee === 'unassigned' ? null : newTaskAssignee;
        
        const { error } = await supabase
          .from('todos')
          .insert([{
            text: singleTaskText,
            status: 'unfinished',
            remarks: null,
            created_by: user?.id || null,
            assigned_to: assignedTo
          }]);

        if (error) throw error;
        
        setSingleTaskText('');
        setNewTaskAssignee('unassigned');
        await loadTasks();
        toast({
          title: "Success",
          description: "Task added successfully",
        });
      }
    } catch (error) {
      console.error('Error adding task:', error);
      toast({
        title: "Error",
        description: "Failed to add task",
        variant: "destructive",
      });
    }
  };

  const addMultiTasks = async () => {
    if (!multiTaskText.trim()) return;

    const taskTexts = multiTaskText.split(',').map(text => text.trim()).filter(text => text.length > 0);
    
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (newTaskAssignee === 'all_members') {
        // Get all admin members
        const { data: members, error: membersError } = await supabase
          .from('admin_members')
          .select('id');

        if (membersError) throw membersError;

        // Create each task for each member
        const allTasks = [];
        for (const text of taskTexts) {
          for (const member of (members || [])) {
            allTasks.push({
              text,
              status: 'unfinished' as const,
              remarks: null,
              created_by: user?.id || null,
              assigned_to: member.id,
              assigned_to_all_members: true
            });
          }
        }

        const { error } = await supabase
          .from('todos')
          .insert(allTasks);

        if (error) throw error;
        
        setMultiTaskText('');
        setNewTaskAssignee('unassigned');
        await loadTasks();
        toast({
          title: "Success",
          description: `${taskTexts.length} tasks assigned to all ${members?.length || 0} team members successfully`,
        });
      } else {
        const assignedTo = newTaskAssignee === 'unassigned' ? null : newTaskAssignee;
        
        const newTasks = taskTexts.map(text => ({
          text,
          status: 'unfinished' as const,
          remarks: null,
          created_by: user?.id || null,
          assigned_to: assignedTo
        }));

        const { error } = await supabase
          .from('todos')
          .insert(newTasks);

        if (error) throw error;
        
        setMultiTaskText('');
        setNewTaskAssignee('unassigned');
        await loadTasks();
        toast({
          title: "Success",
          description: `${taskTexts.length} tasks added successfully`,
        });
      }
    } catch (error) {
      console.error('Error adding tasks:', error);
      toast({
        title: "Error",
        description: "Failed to add tasks",
        variant: "destructive",
      });
    }
  };

  const toggleTaskStatus = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    if (task.status === 'unfinished') {
      // Show popup for remarks when finishing
      setFinishingTask(taskId);
      setFinishRemarks(task.remarks || '');
      setShowMemberSelection(false);
    } else {
      // Mark as unfinished
      updateTaskStatus(taskId, 'unfinished', task.remarks || '');
    }
  };

  const updateTaskStatus = async (taskId: string, status: 'finished' | 'unfinished' | 'requested', remarks: string, finishedByMemberId?: string) => {
    try {
      const updateData: any = { 
        status, 
        remarks: remarks || null,
        finished_at: status === 'finished' ? new Date().toISOString() : null
      };

      // If finished and member is specified, add the member who finished it
      if (status === 'finished' && finishedByMemberId) {
        updateData.assigned_to = finishedByMemberId;
      }

      const { error } = await supabase
        .from('todos')
        .update(updateData)
        .eq('id', taskId);

      if (error) throw error;
      
      await loadTasks();
      toast({
        title: "Success",
        description: `Task marked as ${status}`,
      });
    } catch (error) {
      console.error('Error updating task:', error);
      toast({
        title: "Error",
        description: "Failed to update task",
        variant: "destructive",
      });
    }
  };

  const confirmFinishTask = () => {
    if (!finishingTask) return;
    
    // If showing member selection, require member to be selected
    if (showMemberSelection && !finishingMember) {
      toast({
        title: "Error",
        description: "Please select a member who is finishing this task",
        variant: "destructive",
      });
      return;
    }
    
    updateTaskStatus(finishingTask, 'finished', finishRemarks, showMemberSelection ? finishingMember : undefined);
    setFinishingTask(null);
    setFinishRemarks('');
    setShowMemberSelection(false);
    setFinishingMember('');
  };

  const updateTaskRemarks = async (taskId: string, remarks: string) => {
    try {
      const { error } = await supabase
        .from('todos')
        .update({ remarks: remarks || null })
        .eq('id', taskId);

      if (error) throw error;
      
      await loadTasks();
      setEditingTask(null);
      setEditRemarks('');
      toast({
        title: "Success",
        description: "Remarks updated successfully",
      });
    } catch (error) {
      console.error('Error updating remarks:', error);
      toast({
        title: "Error",
        description: "Failed to update remarks",
        variant: "destructive",
      });
    }
  };

  const updateTaskText = async (taskId: string, text: string) => {
    try {
      const { error } = await supabase
        .from('todos')
        .update({ text: text })
        .eq('id', taskId);

      if (error) throw error;
      
      await loadTasks();
      setEditingTaskText(null);
      setEditTaskText('');
      toast({
        title: "Success",
        description: "Task text updated successfully",
      });
    } catch (error) {
      console.error('Error updating task text:', error);
      toast({
        title: "Error",
        description: "Failed to update task text",
        variant: "destructive",
      });
    }
  };

  const startEditingRemarks = (task: Task) => {
    setEditingTask(task.id);
    setEditRemarks(task.remarks || '');
  };

  const startEditingTaskText = (task: Task) => {
    setEditingTaskText(task.id);
    setEditTaskText(task.text);
  };

  const cancelEditing = () => {
    setEditingTask(null);
    setEditRemarks('');
    setEditingTaskText(null);
    setEditTaskText('');
  };

  const cancelFinishing = () => {
    setFinishingTask(null);
    setFinishRemarks('');
    setShowMemberSelection(false);
    setFinishingMember('');
  };

  const startDeleting = (taskId: string) => {
    setDeletingTask(taskId);
    setDeletePasskey('');
  };

  const cancelDeleting = () => {
    setDeletingTask(null);
    setDeletePasskey('');
  };

  const confirmDeleteTask = async () => {
    if (deletePasskey !== 's7025715877') {
      toast({
        title: "Error",
        description: "Invalid passkey",
        variant: "destructive",
      });
      return;
    }

    if (!deletingTask) return;

    try {
      const { error } = await supabase
        .from('todos')
        .delete()
        .eq('id', deletingTask);

      if (error) throw error;
      
      await loadTasks();
      setDeletingTask(null);
      setDeletePasskey('');
      toast({
        title: "Success",
        description: "Task deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting task:', error);
      toast({
        title: "Error",
        description: "Failed to delete task",
        variant: "destructive",
      });
    }
  };

  const reassignTaskToCoordinatorOrSupervisor = async (taskId: string, assigneeId: string | null, type: 'coordinator' | 'supervisor') => {
    try {
      const updateData: any = {};
      
      if (type === 'coordinator') {
        updateData.reassigned_to_coordinator = assigneeId;
        // Clear supervisor assignment when assigning to coordinator
        updateData.reassigned_to_supervisor = null;
      } else {
        updateData.reassigned_to_supervisor = assigneeId;
        // Clear coordinator assignment when assigning to supervisor
        updateData.reassigned_to_coordinator = null;
      }
      
      const { error } = await supabase
        .from('todos')
        .update(updateData)
        .eq('id', taskId);

      if (error) {
        console.error('Reassignment error details:', error);
        
        if (error.message.includes('reassigned_to') || error.message.includes('column') || error.code === '42703') {
          toast({
            title: "Database Update Required",
            description: `Please run the SQL script 'add_reassigned_to_column.sql' to add reassignment columns. Error: ${error.message}`,
            variant: "destructive",
          });
          return;
        }
        throw error;
      }
      
      await loadTasks();
      setReassigningTask(null);
      setSelectedReassignee('unassigned');
      toast({
        title: "Success",
        description: assigneeId ? `Task reassigned to ${type} successfully` : "Task reassignment removed",
      });
    } catch (error) {
      console.error('Error reassigning task:', error);
      toast({
        title: "Error",
        description: "Failed to reassign task. Make sure database is properly configured.",
        variant: "destructive",
      });
    }
  };

  const assignTaskToMember = async (taskId: string, memberId: string | null) => {
    try {
      // Try to update the assignment - this will work once the database column is added
      const updateData: any = { assigned_to: memberId };
      
      const { error } = await supabase
        .from('todos')
        .update(updateData)
        .eq('id', taskId);

      if (error) {
        console.error('Assignment error details:');
        console.error('Error message:', error.message);
        console.error('Error code:', error.code);
        console.error('Full error:', JSON.stringify(error, null, 2));
        
        // If error is about missing column, show helpful message
        if (error.message.includes('assigned_to') || error.message.includes('column') || error.code === '42703' || error.code === '23503') {
          toast({
            title: "Database Update Required",
            description: `Please run the SQL script 'fix_foreign_key_constraint.sql' to fix task assignments. Error: ${error.message}`,
            variant: "destructive",
          });
          return;
        }
        throw error;
      }
      
      await loadTasks();
      setAssigningTask(null);
      setSelectedMember('unassigned');
      toast({
        title: "Success",
        description: memberId ? "Task assigned successfully" : "Task assignment removed",
      });
    } catch (error) {
      console.error('Error assigning task:', error);
      toast({
        title: "Error",
        description: "Failed to assign task. Make sure database is properly configured.",
        variant: "destructive",
      });
    }
  };

  const startAssigning = (taskId: string, currentAssignment?: string) => {
    setAssigningTask(taskId);
    setSelectedMember(currentAssignment || 'unassigned');
  };

  const cancelAssigning = () => {
    setAssigningTask(null);
    setSelectedMember('unassigned');
  };

  const confirmAssignTask = () => {
    if (!assigningTask) return;
    const memberToAssign = selectedMember === "unassigned" ? null : selectedMember || null;
    assignTaskToMember(assigningTask, memberToAssign);
  };

  const startReassigning = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    setReassigningTask(taskId);
    
    // Set the current assignment as the selected value
    if (task?.reassigned_to_coordinator) {
      setSelectedReassignee(task.reassigned_to_coordinator);
      setReassigneeType('coordinator');
    } else if (task?.reassigned_to_supervisor) {
      setSelectedReassignee(task.reassigned_to_supervisor);
      setReassigneeType('supervisor');
    } else {
      setSelectedReassignee('unassigned');
      setReassigneeType('coordinator');
    }
  };

  const cancelReassigning = () => {
    setReassigningTask(null);
    setSelectedReassignee('unassigned');
  };

  const confirmReassignTask = () => {
    if (!reassigningTask) return;
    const assigneeToReassign = selectedReassignee === "unassigned" ? null : selectedReassignee || null;
    reassignTaskToCoordinatorOrSupervisor(reassigningTask, assigneeToReassign, reassigneeType);
  };

  // Bulk action functions
  const toggleTaskSelection = (taskId: string) => {
    setSelectedTasks(prev => 
      prev.includes(taskId) 
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };

  const toggleSelectAll = (taskList: Task[]) => {
    const allTaskIds = taskList.map(task => task.id);
    const allSelected = allTaskIds.every(id => selectedTasks.includes(id));
    
    if (allSelected) {
      setSelectedTasks(prev => prev.filter(id => !allTaskIds.includes(id)));
    } else {
      setSelectedTasks(prev => [...prev, ...allTaskIds.filter(id => !prev.includes(id))]);
    }
  };

  const clearSelection = () => {
    setSelectedTasks([]);
  };

  const startBulkAction = (action: 'delete' | 'finish' | 'reassign') => {
    if (selectedTasks.length === 0) {
      toast({
        title: "No Selection",
        description: "Please select tasks to perform bulk action",
        variant: "destructive",
      });
      return;
    }
    setBulkAction(action);
    setBulkRemarks('');
    setBulkDeletePasskey('');
    setBulkSelectedAssignee('unassigned');
  };

  const cancelBulkAction = () => {
    setBulkAction(null);
    setBulkRemarks('');
    setBulkDeletePasskey('');
    setBulkSelectedAssignee('unassigned');
    setAssigneeSearchTerm('');
  };

  const confirmBulkDelete = async () => {
    if (bulkDeletePasskey !== 's7025715877') {
      toast({
        title: "Error",
        description: "Invalid passkey",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('todos')
        .delete()
        .in('id', selectedTasks);

      if (error) throw error;
      
      await loadTasks();
      clearSelection();
      setBulkAction(null);
      setBulkDeletePasskey('');
      toast({
        title: "Success",
        description: `${selectedTasks.length} tasks deleted successfully`,
      });
    } catch (error) {
      console.error('Error deleting tasks:', error);
      toast({
        title: "Error",
        description: "Failed to delete tasks",
        variant: "destructive",
      });
    }
  };

  const confirmBulkFinish = async () => {
    try {
      const { error } = await supabase
        .from('todos')
        .update({ 
          status: 'finished', 
          remarks: bulkRemarks || null,
          finished_at: new Date().toISOString()
        })
        .in('id', selectedTasks);

      if (error) throw error;
      
      await loadTasks();
      clearSelection();
      setBulkAction(null);
      setBulkRemarks('');
      toast({
        title: "Success",
        description: `${selectedTasks.length} tasks marked as finished`,
      });
    } catch (error) {
      console.error('Error finishing tasks:', error);
      toast({
        title: "Error",
        description: "Failed to finish tasks",
        variant: "destructive",
      });
    }
  };

  const confirmBulkReassign = async () => {
    try {
      // For bulk reassign, we'll reassign to coordinators by default
      // Users can use individual reassign for supervisors
      const assignedTo = bulkSelectedAssignee === 'unassigned' ? null : bulkSelectedAssignee;
      
      let updateData: any = {};
      
      // Check if the selected assignee is a coordinator, supervisor, or team member
      const selectedAssignee = assignees.find(a => a.id === assignedTo);
      
      if (!selectedAssignee || bulkSelectedAssignee === 'unassigned') {
        // Clear all assignments and reassignments
        updateData = { 
          assigned_to: null,
          reassigned_to_coordinator: null,
          reassigned_to_supervisor: null
        };
      } else if (selectedAssignee.type === 'admin_member') {
        // Assign to team member (assigned_to)
        updateData = { 
          assigned_to: assignedTo,
          reassigned_to_coordinator: null,
          reassigned_to_supervisor: null
        };
      } else if (selectedAssignee.type === 'coordinator') {
        // Reassign to coordinator
        updateData = { 
          reassigned_to_coordinator: assignedTo,
          reassigned_to_supervisor: null
        };
      } else if (selectedAssignee.type === 'supervisor') {
        // Reassign to supervisor  
        updateData = { 
          reassigned_to_supervisor: assignedTo,
          reassigned_to_coordinator: null
        };
      }
      
      const { error } = await supabase
        .from('todos')
        .update(updateData)
        .in('id', selectedTasks);

      if (error) {
        console.error('Bulk assignment error details:', error);
        
        // If error is about missing column, show helpful message
        if (error.message.includes('reassigned_to') || error.message.includes('assigned_to') || error.message.includes('column') || error.code === '42703') {
          toast({
            title: "Database Update Required",
            description: `Please run the SQL scripts 'fix_foreign_key_constraint.sql' and 'add_reassigned_to_column.sql' to add assignment columns. Error: ${error.message}`,
            variant: "destructive",
          });
          return;
        }
        throw error;
      }
      
      await loadTasks();
      clearSelection();
      setBulkAction(null);
      setBulkSelectedAssignee('unassigned');
      setAssigneeSearchTerm('');
      toast({
        title: "Success",
        description: `${selectedTasks.length} tasks reassigned successfully`,
      });
    } catch (error) {
      console.error('Error reassigning tasks:', error);
      toast({
        title: "Error",
        description: "Failed to reassign tasks. Make sure database is properly configured.",
        variant: "destructive",
      });
    }
  };

  // Filter assignees based on search term
  const filteredAssignees = assignees.filter(assignee => 
    assignee.name.toLowerCase().includes(assigneeSearchTerm.toLowerCase()) ||
    assignee.mobile.includes(assigneeSearchTerm)
  );

  const getTasksForDate = (date: Date) => {
    return tasks.filter(task => {
      const taskDate = new Date(task.created_at);
      return taskDate.toDateString() === date.toDateString();
    });
  };

  // Filter tasks based on search term and assigned to
  const filterTasks = (taskList: Task[]) => {
    let filteredTasks = taskList;

    // Filter by search term
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filteredTasks = filteredTasks.filter(task => 
        task.text.toLowerCase().includes(searchLower)
      );
    }

    // Filter by assigned to
    if (filterByAssignedTo !== 'all') {
      if (filterByAssignedTo === 'unassigned') {
        filteredTasks = filteredTasks.filter(task => !task.assigned_to);
      } else {
        filteredTasks = filteredTasks.filter(task => task.assigned_to === filterByAssignedTo);
      }
    }

    return filteredTasks;
  };

  const unfinishedTasks = filterTasks(tasks.filter(task => task.status === 'unfinished'));
  const finishedTasks = filterTasks(tasks.filter(task => task.status === 'finished'));

  // Clear selection when changing tabs
  useEffect(() => {
    clearSelection();
  }, [activeTab]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Todo List Management
          </CardTitle>
          <CardDescription>
            Add and manage tasks with completion status and remarks
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Task Type Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Task Type</label>
            <Select value={taskType} onValueChange={(value: 'single' | 'multi') => setTaskType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="single">Single Task</SelectItem>
                <SelectItem value="multi">Multi Tasks</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Single Task Input */}
          {taskType === 'single' && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Task Text</label>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter single task..."
                  value={singleTaskText}
                  onChange={(e) => setSingleTaskText(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addSingleTask()}
                />
                <Button onClick={addSingleTask} disabled={!singleTaskText.trim()}>
                  Add Task
                </Button>
              </div>
              
              {/* Assign To Dropdown - Optional */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Assign To (Optional)</label>
                  <Select value={newTaskAssignee} onValueChange={setNewTaskAssignee}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select team member (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      <SelectItem value="all_members">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Assign to All Team Members
                        </div>
                      </SelectItem>
                      {adminMembers.map(member => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.name} - {member.mobile}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
              </div>
            </div>
          )}

          {/* Multi Task Input */}
          {taskType === 'multi' && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Task Texts (separate with commas)</label>
              <div className="space-y-2">
                <Textarea
                  placeholder="Enter multiple tasks separated by commas (e.g., Task 1, Task 2, Task 3)..."
                  value={multiTaskText}
                  onChange={(e) => setMultiTaskText(e.target.value)}
                  rows={3}
                />
                
                {/* Assign To Dropdown - Optional */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Assign All To (Optional)</label>
                  <Select value={newTaskAssignee} onValueChange={setNewTaskAssignee}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select team member (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      <SelectItem value="all_members">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Assign to All Team Members
                        </div>
                      </SelectItem>
                      {adminMembers.map(member => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.name} - {member.mobile}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <Button onClick={addMultiTasks} disabled={!multiTaskText.trim()}>
                  Add Tasks
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tasks Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Tasks Management</span>
            <div className="flex gap-2">
              <Button
                variant={showCalendar ? "default" : "outline"}
                size="sm"
                onClick={() => setShowCalendar(!showCalendar)}
              >
                <CalendarIcon className="h-4 w-4 mr-1" />
                {showCalendar ? "Hide Calendar" : "Calendar View"}
              </Button>
            </div>
          </CardTitle>
          <CardDescription>
            Manage your tasks and their completion status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="mb-4 space-y-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search tasks by text..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Filter by Assigned To */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium whitespace-nowrap">Filter by Assigned To:</label>
              <Select value={filterByAssignedTo} onValueChange={setFilterByAssignedTo}>
                <SelectTrigger className="w-full max-w-xs">
                  <SelectValue placeholder="All tasks" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All tasks</SelectItem>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {adminMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name} - {member.mobile}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {showCalendar ? (
            <div className="space-y-4">
              <div className="flex justify-center">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="rounded-md border"
                />
              </div>
              {selectedDate && (
                <div className="space-y-3">
                  <h3 className="font-medium">
                    Tasks for {format(selectedDate, "PPP")}
                  </h3>
                  {getTasksForDate(selectedDate).length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground">
                      No tasks for this date.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {getTasksForDate(selectedDate).map((task) => (
                        <Card key={task.id} className={`p-3 ${task.assigned_to_all_members ? 'bg-blue-50 border-blue-200' : ''}`}>
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className={task.status === 'finished' ? 'line-through text-muted-foreground' : 'underline'}>
                                  {task.text}
                                </span>
                                {task.assigned_to_all_members && (
                                  <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800 border-blue-300">
                                    All Members
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant={
                                  task.status === 'finished' ? 'default' : 
                                  isRequested(task) ? 'destructive' : 'secondary'
                                } className={isRequested(task) ? 'bg-orange-500 hover:bg-orange-600' : ''}>
                                  {isRequested(task) ? 'Requested' : task.status}
                                </Badge>
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  Created: {format(new Date(task.created_at), "HH:mm")}
                                  {task.finished_at && (
                                    <> | Finished: {format(new Date(task.finished_at), "HH:mm")}</>
                                  )}
                                </span>
                              </div>
                              {task.remarks && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  Remarks: {task.remarks}
                                </p>
                              )}
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="unfinished">
                  Unfinished ({unfinishedTasks.length})
                </TabsTrigger>
                <TabsTrigger value="finished">
                  Finished ({finishedTasks.length})
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="unfinished" className="space-y-3 mt-4">
                {unfinishedTasks.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No unfinished tasks. Great job!
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Bulk Action Controls */}
                    {selectedTasks.length > 0 && (
                      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <span className="text-sm font-medium">
                          {selectedTasks.length} task{selectedTasks.length > 1 ? 's' : ''} selected
                        </span>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => startBulkAction('finish')}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Finish Selected
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => startBulkAction('reassign')}
                          >
                            <RefreshCcw className="h-4 w-4 mr-1" />
                            Reassign Selected
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => startBulkAction('delete')}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete Selected
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={clearSelection}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Clear
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    <div className="border rounded-lg">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-12">
                              <Checkbox
                                checked={unfinishedTasks.length > 0 && unfinishedTasks.every(task => selectedTasks.includes(task.id))}
                                onCheckedChange={() => toggleSelectAll(unfinishedTasks)}
                              />
                            </TableHead>
                            <TableHead>Task</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Assigned To (Team)</TableHead>
                            <TableHead>Reassigned To (Coord/Sup)</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead>Remarks</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {unfinishedTasks.map((task) => (
                            <TableRow key={task.id} className={task.assigned_to_all_members ? 'bg-blue-50' : ''}>
                              <TableCell>
                                <Checkbox
                                  checked={selectedTasks.includes(task.id)}
                                  onCheckedChange={() => toggleTaskSelection(task.id)}
                                />
                              </TableCell>
                               <TableCell>
                                 {editingTaskText === task.id ? (
                                   <div className="flex gap-1">
                                     <Input
                                       value={editTaskText}
                                       onChange={(e) => setEditTaskText(e.target.value)}
                                       className="h-8 text-sm"
                                     />
                                     <Button 
                                       size="sm" 
                                       onClick={() => updateTaskText(task.id, editTaskText)}
                                       className="h-8 px-2"
                                     >
                                       <Save className="h-3 w-3" />
                                     </Button>
                                     <Button 
                                       size="sm" 
                                       variant="outline" 
                                       onClick={cancelEditing}
                                       className="h-8 px-2"
                                     >
                                       <X className="h-3 w-3" />
                                     </Button>
                                   </div>
                                 ) : (
                                    <div className="flex items-center gap-2">
                                      <div className="font-medium underline">{task.text}</div>
                                      {task.assigned_to_all_members && (
                                        <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800 border-blue-300">
                                          All Members
                                        </Badge>
                                      )}
                                     <Button 
                                       size="sm" 
                                       variant="ghost" 
                                       onClick={() => startEditingTaskText(task)}
                                       className="h-6 px-1"
                                     >
                                       <Edit className="h-3 w-3" />
                                     </Button>
                                   </div>
                                 )}
                               </TableCell>
                            <TableCell>
                               <Badge variant={
                                 task.status === 'finished' ? 'secondary' : 
                                 isRequested(task) ? 'destructive' : 'outline'
                               } className={isRequested(task) ? 'bg-orange-500 hover:bg-orange-600' : ''}>
                                 {isRequested(task) ? 'Requested' : task.status}
                               </Badge>
                            </TableCell>
                             <TableCell>
                                <div className="space-y-1">
                                  {task.assigned_to === 'all_members' ? (
                                    <div className="flex items-center gap-2">
                                      <Badge variant="secondary" className="text-xs">
                                        <Users className="h-3 w-3 mr-1" />
                                        All Members
                                      </Badge>
                                    </div>
                                  ) : task.assigned_member ? (
                                    <div className="flex items-center gap-2">
                                      <Badge variant="outline" className="text-xs">
                                        <UserCheck className="h-3 w-3 mr-1" />
                                        {task.assigned_member.name}
                                      </Badge>
                                      <span className="text-xs text-muted-foreground">
                                        {task.assigned_member.mobile}
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-sm text-muted-foreground">Not assigned</span>
                                  )}
                                 <Button
                                   size="sm"
                                   variant="ghost"
                                   onClick={() => startAssigning(task.id, task.assigned_to || '')}
                                   className="h-6 text-xs"
                                 >
                                   <Edit className="h-3 w-3" />
                                 </Button>
                               </div>
                             </TableCell>
                              <TableCell>
                                <div className="space-y-1">
                                  {task.reassigned_coordinator ? (
                                    <div className="flex items-center gap-2">
                                      <Badge variant="secondary" className="text-xs">
                                        <Users className="h-3 w-3 mr-1" />
                                        Coord: {task.reassigned_coordinator.name}
                                      </Badge>
                                      <span className="text-xs text-muted-foreground">
                                        {task.reassigned_coordinator.mobile_number}
                                      </span>
                                    </div>
                                  ) : task.reassigned_supervisor ? (
                                    <div className="flex items-center gap-2">
                                      <Badge variant="secondary" className="text-xs">
                                        <Users className="h-3 w-3 mr-1" />
                                        Sup: {task.reassigned_supervisor.name}
                                      </Badge>
                                      <span className="text-xs text-muted-foreground">
                                        {task.reassigned_supervisor.mobile_number}
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-sm text-muted-foreground">Not reassigned</span>
                                  )}
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => startReassigning(task.id)}
                                    className="h-6 text-xs"
                                    title={task.reassigned_coordinator || task.reassigned_supervisor ? "Remove or Change Reassignment" : "Reassign Task"}
                                  >
                                    <RefreshCcw className="h-3 w-3" />
                                    <span className="ml-1">
                                      {task.reassigned_coordinator || task.reassigned_supervisor ? "Change" : "Reassign"}
                                    </span>
                                  </Button>
                                </div>
                              </TableCell>
                            <TableCell>
                              <div className="text-sm text-muted-foreground">
                                {format(new Date(task.created_at), "PPP HH:mm")}
                              </div>
                            </TableCell>
                            <TableCell>
                              {editingTask === task.id ? (
                                <div className="flex gap-1">
                                  <Input
                                    placeholder="Add remarks..."
                                    value={editRemarks}
                                    onChange={(e) => setEditRemarks(e.target.value)}
                                    className="h-8 text-sm"
                                  />
                                  <Button 
                                    size="sm" 
                                    onClick={() => updateTaskRemarks(task.id, editRemarks)}
                                    className="h-8 px-2"
                                  >
                                    <Save className="h-3 w-3" />
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    onClick={cancelEditing}
                                    className="h-8 px-2"
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-muted-foreground">
                                    {task.remarks || 'No remarks'}
                                  </span>
                                  <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    onClick={() => startEditingRemarks(task)}
                                    className="h-6 px-1"
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => toggleTaskStatus(task.id)}
                                  className="h-8 px-2"
                                >
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Finish
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => startDeleting(task.id)}
                                  className="h-8 px-2"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="finished" className="space-y-3 mt-4">
                {finishedTasks.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No finished tasks yet.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Bulk Action Controls for Finished Tasks */}
                    {selectedTasks.length > 0 && (
                      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <span className="text-sm font-medium">
                          {selectedTasks.length} task{selectedTasks.length > 1 ? 's' : ''} selected
                        </span>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => startBulkAction('reassign')}
                          >
                            <RefreshCcw className="h-4 w-4 mr-1" />
                            Reassign Selected
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => startBulkAction('delete')}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete Selected
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={clearSelection}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Clear
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    <div className="border rounded-lg">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-12">
                              <Checkbox
                                checked={finishedTasks.length > 0 && finishedTasks.every(task => selectedTasks.includes(task.id))}
                                onCheckedChange={() => toggleSelectAll(finishedTasks)}
                              />
                            </TableHead>
                            <TableHead>Task</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Assigned To (Team)</TableHead>
                            <TableHead>Reassigned To (Coord/Sup)</TableHead>
                            <TableHead>Created/Finished</TableHead>
                            <TableHead>Remarks</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {finishedTasks.map((task) => (
                            <TableRow key={task.id} className={task.assigned_to_all_members ? 'bg-blue-50' : ''}>
                              <TableCell>
                                <Checkbox
                                  checked={selectedTasks.includes(task.id)}
                                  onCheckedChange={() => toggleTaskSelection(task.id)}
                                />
                              </TableCell>
                               <TableCell>
                                 {editingTaskText === task.id ? (
                                   <div className="flex gap-1">
                                     <Input
                                       value={editTaskText}
                                       onChange={(e) => setEditTaskText(e.target.value)}
                                       className="h-8 text-sm"
                                     />
                                     <Button 
                                       size="sm" 
                                       onClick={() => updateTaskText(task.id, editTaskText)}
                                       className="h-8 px-2"
                                     >
                                       <Save className="h-3 w-3" />
                                     </Button>
                                     <Button 
                                       size="sm" 
                                       variant="outline" 
                                       onClick={cancelEditing}
                                       className="h-8 px-2"
                                     >
                                       <X className="h-3 w-3" />
                                     </Button>
                                   </div>
                                 ) : (
                                    <div className="flex items-center gap-2">
                                      <div className="font-medium line-through text-muted-foreground">{task.text}</div>
                                      {task.assigned_to_all_members && (
                                        <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800 border-blue-300">
                                          All Members
                                        </Badge>
                                      )}
                                     <Button 
                                       size="sm" 
                                       variant="ghost" 
                                       onClick={() => startEditingTaskText(task)}
                                       className="h-6 px-1"
                                     >
                                       <Edit className="h-3 w-3" />
                                     </Button>
                                   </div>
                                 )}
                               </TableCell>
                            <TableCell>
                               <Badge variant={
                                 task.status === 'finished' ? 'default' : 
                                 isRequested(task) ? 'destructive' : 'secondary'
                               } className={isRequested(task) ? 'bg-orange-500 hover:bg-orange-600' : ''}>
                                 {isRequested(task) ? 'Requested' : task.status}
                               </Badge>
                            </TableCell>
                             <TableCell>
                                <div className="space-y-1">
                                  {task.assigned_to === 'all_members' ? (
                                    <div className="flex items-center gap-2">
                                      <Badge variant="secondary" className="text-xs">
                                        <Users className="h-3 w-3 mr-1" />
                                        All Members
                                      </Badge>
                                    </div>
                                  ) : task.assigned_member ? (
                                    <div className="flex items-center gap-2">
                                      <Badge variant="outline" className="text-xs">
                                        <UserCheck className="h-3 w-3 mr-1" />
                                        {task.assigned_member.name}
                                      </Badge>
                                      <span className="text-xs text-muted-foreground">
                                        {task.assigned_member.mobile}
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-sm text-muted-foreground">Not assigned</span>
                                  )}
                                </div>
                             </TableCell>
                             <TableCell>
                               <div className="space-y-1">
                                 {task.reassigned_coordinator ? (
                                   <div className="flex items-center gap-2">
                                     <Badge variant="secondary" className="text-xs">
                                       <Users className="h-3 w-3 mr-1" />
                                       Coord: {task.reassigned_coordinator.name}
                                     </Badge>
                                     <span className="text-xs text-muted-foreground">
                                       {task.reassigned_coordinator.mobile_number}
                                     </span>
                                   </div>
                                 ) : task.reassigned_supervisor ? (
                                   <div className="flex items-center gap-2">
                                     <Badge variant="secondary" className="text-xs">
                                       <Users className="h-3 w-3 mr-1" />
                                       Sup: {task.reassigned_supervisor.name}
                                     </Badge>
                                     <span className="text-xs text-muted-foreground">
                                       {task.reassigned_supervisor.mobile_number}
                                     </span>
                                   </div>
                                 ) : (
                                   <span className="text-sm text-muted-foreground">Not reassigned</span>
                                 )}
                               </div>
                             </TableCell>
                            <TableCell>
                              <div className="text-sm text-muted-foreground space-y-1">
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  Created: {format(new Date(task.created_at), "MMM dd, HH:mm")}
                                </div>
                                {task.finished_at && (
                                  <div className="flex items-center gap-1">
                                    <CheckCircle className="h-3 w-3" />
                                    Finished: {format(new Date(task.finished_at), "MMM dd, HH:mm")}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                             <TableCell>
                               {editingTask === task.id ? (
                                 <div className="flex gap-1">
                                   <Input
                                     placeholder="Add remarks..."
                                     value={editRemarks}
                                     onChange={(e) => setEditRemarks(e.target.value)}
                                     className="h-8 text-sm"
                                   />
                                   <Button 
                                     size="sm" 
                                     onClick={() => updateTaskRemarks(task.id, editRemarks)}
                                     className="h-8 px-2"
                                   >
                                     <Save className="h-3 w-3" />
                                   </Button>
                                   <Button 
                                     size="sm" 
                                     variant="outline" 
                                     onClick={cancelEditing}
                                     className="h-8 px-2"
                                   >
                                     <X className="h-3 w-3" />
                                   </Button>
                                 </div>
                               ) : (
                                 <div className="flex items-center gap-2">
                                   <div className="text-sm text-muted-foreground">
                                     {task.remarks || 'No remarks'}
                                   </div>
                                   <Button 
                                     size="sm" 
                                     variant="ghost" 
                                     onClick={() => startEditingRemarks(task)}
                                     className="h-6 px-1"
                                   >
                                     <Edit className="h-3 w-3" />
                                   </Button>
                                 </div>
                               )}
                             </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={() => toggleTaskStatus(task.id)}
                                  className="h-8 px-2"
                                >
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Unfinish
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => startDeleting(task.id)}
                                  className="h-8 px-2"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>

      {/* Bulk Action Dialogs */}
      <Dialog open={bulkAction === 'delete'} onOpenChange={() => bulkAction === 'delete' && cancelBulkAction()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Delete Tasks</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedTasks.length} selected task{selectedTasks.length > 1 ? 's' : ''}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Enter passkey to confirm deletion:</label>
              <Input
                type="password"
                placeholder="Enter passkey..."
                value={bulkDeletePasskey}
                onChange={(e) => setBulkDeletePasskey(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={cancelBulkAction}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmBulkDelete}>
              Delete Tasks
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={bulkAction === 'finish'} onOpenChange={() => bulkAction === 'finish' && cancelBulkAction()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Finish Tasks</DialogTitle>
            <DialogDescription>
              Mark {selectedTasks.length} selected task{selectedTasks.length > 1 ? 's' : ''} as finished.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Remarks (optional):</label>
              <Textarea
                placeholder="Add remarks for all selected tasks..."
                value={bulkRemarks}
                onChange={(e) => setBulkRemarks(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={cancelBulkAction}>
              Cancel
            </Button>
            <Button onClick={confirmBulkFinish}>
              Finish Tasks
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Reassign Dialog */}
      <Dialog open={bulkAction === 'reassign'} onOpenChange={() => bulkAction === 'reassign' && cancelBulkAction()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Reassign Tasks</DialogTitle>
            <DialogDescription>
              Reassign {selectedTasks.length} selected task{selectedTasks.length > 1 ? 's' : ''} to a new assignee.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Search by name or mobile number:</label>
              <Input
                placeholder="Search assignees..."
                value={assigneeSearchTerm}
                onChange={(e) => setAssigneeSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Select assignee:</label>
              <Select value={bulkSelectedAssignee} onValueChange={setBulkSelectedAssignee}>
                <SelectTrigger>
                  <SelectValue placeholder="Select assignee" />
                </SelectTrigger>
                <SelectContent className="bg-background border z-50">
                  <SelectItem value="unassigned">Unassign all tasks</SelectItem>
                  {filteredAssignees.map((assignee) => (
                    <SelectItem key={assignee.id} value={assignee.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{assignee.name}</span>
                        <div className="flex items-center gap-2 ml-2 text-xs text-muted-foreground">
                          <span>{assignee.mobile}</span>
                          <Badge variant="outline" className="text-xs">
                            {assignee.role}
                          </Badge>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={cancelBulkAction}>
              Cancel
            </Button>
            <Button onClick={confirmBulkReassign}>
              {bulkSelectedAssignee === "unassigned" ? 'Unassign Tasks' : 'Reassign Tasks'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      {/* Finish Task Dialog */}
      <Dialog open={!!finishingTask} onOpenChange={(open) => !open && cancelFinishing()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Finish Task</DialogTitle>
            <DialogDescription>
              {showMemberSelection 
                ? "Select which team member is finishing this task."
                : "Add remarks for completing this task (optional)."
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {showMemberSelection && (
              <div>
                <label className="text-sm font-medium">Select Team Member:</label>
                <Select value={finishingMember} onValueChange={setFinishingMember}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select team member who is finishing this task" />
                  </SelectTrigger>
                  <SelectContent>
                    {adminMembers.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        <div className="flex items-center justify-between w-full">
                          <span>{member.name}</span>
                          <div className="flex items-center gap-2 ml-2 text-xs text-muted-foreground">
                            <span>{member.mobile}</span>
                            <Badge variant="outline" className="text-xs">
                              {member.role}
                            </Badge>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <label className="text-sm font-medium">Remarks (optional):</label>
              <Textarea
                placeholder="Add any remarks or notes about completing this task..."
                value={finishRemarks}
                onChange={(e) => setFinishRemarks(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={cancelFinishing}>
              Cancel
            </Button>
            <Button onClick={confirmFinishTask}>
              Mark as Finished
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Task Dialog */}
      <Dialog open={!!deletingTask} onOpenChange={(open) => !open && cancelDeleting()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Task</DialogTitle>
            <DialogDescription>
              This action cannot be undone. Please enter the passkey to confirm deletion.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              type="password"
              placeholder="Enter passkey..."
              value={deletePasskey}
              onChange={(e) => setDeletePasskey(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={cancelDeleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteTask}>
              Delete Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reassignment Dialog */}
      <Dialog open={!!reassigningTask} onOpenChange={() => setReassigningTask(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reassign Task to Coordinator/Supervisor</DialogTitle>
            <DialogDescription>
              Reassign this task to a coordinator or supervisor while keeping the original team member assignment.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Reassign Type:</label>
              <Select value={reassigneeType} onValueChange={(value: 'coordinator' | 'supervisor') => setReassigneeType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="coordinator">Coordinator</SelectItem>
                  <SelectItem value="supervisor">Supervisor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {reassigneeType === 'coordinator' ? 'Select Coordinator:' : 'Select Supervisor:'}
              </label>
              <div className="space-y-2">
                <Input
                  placeholder={`Search ${reassigneeType}s by name or mobile...`}
                  value={assigneeSearchTerm}
                  onChange={(e) => setAssigneeSearchTerm(e.target.value)}
                />
                <Select value={selectedReassignee} onValueChange={setSelectedReassignee}>
                  <SelectTrigger>
                    <SelectValue placeholder={`Select ${reassigneeType}`} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Remove Reassignment</SelectItem>
                    {filteredAssignees
                      .filter(assignee => assignee.type === reassigneeType)
                      .map(assignee => (
                        <SelectItem key={assignee.id} value={assignee.id}>
                          <div className="flex items-center justify-between w-full">
                            <span>{assignee.name}</span>
                            <Badge variant="outline" className="ml-2">
                              {assignee.mobile}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={cancelReassigning}>
              Cancel
            </Button>
            <Button onClick={confirmReassignTask}>
              {selectedReassignee === 'unassigned' ? 'Remove Reassignment' : 'Reassign Task'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Task Dialog */}
      <Dialog open={!!assigningTask} onOpenChange={(open) => !open && cancelAssigning()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Task to Team Member</DialogTitle>
            <DialogDescription>
              Select an admin team member to assign this task to, or leave unassigned.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Search admin team members:</label>
              <Input
                placeholder="Search team members..."
                value={assigneeSearchTerm}
                onChange={(e) => setAssigneeSearchTerm(e.target.value)}
              />
            </div>
            <Select value={selectedMember} onValueChange={setSelectedMember}>
              <SelectTrigger>
                <SelectValue placeholder="Select team member" />
              </SelectTrigger>
               <SelectContent className="bg-background border z-50">
                <SelectItem value="unassigned">No assignment</SelectItem>
                {adminMembers
                  .filter(member => 
                    member.name.toLowerCase().includes(assigneeSearchTerm.toLowerCase()) ||
                    member.mobile.includes(assigneeSearchTerm)
                  )
                  .map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    <div className="flex items-center justify-between w-full">
                      <span>{member.name}</span>
                      <div className="flex items-center gap-2 ml-2 text-xs text-muted-foreground">
                        <span>{member.mobile}</span>
                        <Badge variant="outline" className="text-xs">
                          {member.role}
                        </Badge>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={cancelAssigning}>
              Cancel
            </Button>
            <Button onClick={confirmAssignTask}>
              {selectedMember && selectedMember !== "unassigned" ? 'Assign Task' : 'Remove Assignment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};