import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, FileText, User, Phone } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AgentDailyNotesProps {
  agentName: string;
  agentType: string;
  agentMobile: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface DailyNote {
  id: string;
  date: string;
  activity: string | null;
  is_leave: boolean;
  created_at: string;
  updated_at: string;
}

export const AgentDailyNotes = ({ 
  agentName, 
  agentType, 
  agentMobile, 
  open, 
  onOpenChange 
}: AgentDailyNotesProps) => {
  const [notes, setNotes] = useState<DailyNote[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedNote, setSelectedNote] = useState<DailyNote | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (open && agentMobile) {
      fetchAgentNotes();
    }
  }, [open, agentMobile]);

  const fetchAgentNotes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('daily_notes')
        .select('*')
        .eq('mobile_number', agentMobile)
        .order('date', { ascending: false })
        .limit(90); // Show last 90 days for better calendar view

      if (error) throw error;
      setNotes(data || []);
    } catch (error) {
      console.error('Error fetching agent notes:', error);
      toast({
        title: "Error",
        description: "Failed to fetch daily notes",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Helper functions for calendar
  const hasActivity = (date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    return notes.some(note => note.date === dateString && note.activity && !note.is_leave);
  };

  const isOnLeave = (date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    return notes.some(note => note.date === dateString && note.is_leave);
  };

  const hasNoActivity = (date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    const note = notes.find(note => note.date === dateString);
    return note && !note.is_leave && (!note.activity || note.activity.trim() === '');
  };

  const getNoteForDate = (date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    return notes.find(note => note.date === dateString);
  };

  // Update selected note when date changes
  useEffect(() => {
    if (selectedDate) {
      const note = getNoteForDate(selectedDate);
      setSelectedNote(note || null);
    }
  }, [selectedDate, notes]);

  const getActivityStats = () => {
    const totalDays = notes.length;
    const activeDays = notes.filter(note => !note.is_leave && note.activity && note.activity.trim() !== '').length;
    const leaveDays = notes.filter(note => note.is_leave).length;
    const noActivityDays = notes.filter(note => !note.is_leave && (!note.activity || note.activity.trim() === '')).length;
    
    // Calculate inactive days (3+ consecutive leave/no activity days)
    const inactiveDays = calculateInactiveDays();
    
    return { totalDays, activeDays, leaveDays: leaveDays + noActivityDays, inactiveDays };
  };

  const calculateInactiveDays = () => {
    if (notes.length === 0) return 0;
    
    // Sort notes by date to check for consecutive days
    const sortedNotes = [...notes].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // Generate all dates to check for gaps
    const allDates: string[] = [];
    if (sortedNotes.length > 0) {
      const startDate = new Date(sortedNotes[0].date);
      const endDate = new Date(sortedNotes[sortedNotes.length - 1].date);
      const currentDate = new Date(startDate);
      
      while (currentDate <= endDate) {
        allDates.push(format(currentDate, 'yyyy-MM-dd'));
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }
    
    let inactiveDays = 0;
    let consecutiveInactiveDays = 0;
    
    for (const dateStr of allDates) {
      const note = sortedNotes.find(n => n.date === dateStr);
      const isInactiveDay = !note || note.is_leave || !note.activity || note.activity.trim() === '';
      
      if (isInactiveDay) {
        consecutiveInactiveDays++;
        // Only count as inactive if we have 3+ consecutive days
        if (consecutiveInactiveDays >= 3) {
          inactiveDays++;
        }
      } else {
        // Reset counter on active day, but don't add previous days if less than 3
        if (consecutiveInactiveDays >= 3) {
          // We were in an inactive period, it ended
        }
        consecutiveInactiveDays = 0;
      }
    }
    
    return inactiveDays;
  };

  const stats = getActivityStats();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Daily Notes History
          </DialogTitle>
          <DialogDescription>
            View and manage daily notes for this agent
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Agent Info */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <h3 className="font-semibold">{agentName}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Badge variant="outline" className="text-xs">
                        {agentType}
                      </Badge>
                      <Phone className="h-3 w-3" />
                      <span>{agentMobile}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Activity Stats */}
          <div className="grid grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{stats.totalDays}</div>
                  <div className="text-sm text-muted-foreground">Total Days</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{stats.activeDays}</div>
                  <div className="text-sm text-muted-foreground">Active Days</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{stats.leaveDays}</div>
                  <div className="text-sm text-muted-foreground">Leave Days</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{stats.inactiveDays}</div>
                  <div className="text-sm text-muted-foreground">Inactive Days</div>
                  <div className="text-xs text-muted-foreground mt-1">(3+ consecutive leave)</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Calendar View and Selected Date Details */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Calendar */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  Daily Notes Calendar (Last 90 days)
                </CardTitle>
                 <div className="flex items-center gap-4 text-xs text-muted-foreground">
                   <div className="flex items-center gap-1">
                     <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                     <span>Active</span>
                   </div>
                   <div className="flex items-center gap-1">
                     <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                     <span>On Leave</span>
                   </div>
                   <div className="flex items-center gap-1">
                     <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                     <span>No Activity</span>
                   </div>
                   <div className="flex items-center gap-1">
                     <div className="w-3 h-3 bg-muted rounded-full"></div>
                     <span>No Data</span>
                   </div>
                 </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Loading daily notes...
                  </div>
                ) : (
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    className="rounded-md border"
                    modifiers={{
                      hasActivity: (date) => hasActivity(date),
                      onLeave: (date) => isOnLeave(date),
                      noActivity: (date) => hasNoActivity(date),
                    }}
                    modifiersClassNames={{
                      hasActivity: "bg-green-500 text-white hover:bg-green-600",
                      onLeave: "bg-red-500 text-white hover:bg-red-600",
                      noActivity: "bg-orange-500 text-white hover:bg-orange-600",
                    }}
                  />
                )}
              </CardContent>
            </Card>

            {/* Selected Date Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  {selectedDate ? format(selectedDate, 'EEEE, MMMM do, yyyy') : 'Select a Date'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!selectedDate ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Click on a date in the calendar to view details
                  </div>
                ) : selectedNote ? (
                  <div className="space-y-4">
                     <div className="flex items-center gap-2">
                       <Badge 
                         variant={
                           selectedNote.is_leave ? "destructive" : 
                           !selectedNote.activity || selectedNote.activity.trim() === '' ? "secondary" : 
                           "default"
                         }
                       >
                         {selectedNote.is_leave ? "On Leave" : 
                          !selectedNote.activity || selectedNote.activity.trim() === '' ? "No Activity" : 
                          "Active"}
                       </Badge>
                       <span className="text-sm text-muted-foreground">
                         Updated: {format(new Date(selectedNote.updated_at), 'HH:mm')}
                       </span>
                     </div>
                    
                    {selectedNote.activity ? (
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">Daily Activity:</h4>
                        <p className="text-sm bg-muted p-3 rounded-md">
                          {selectedNote.activity}
                        </p>
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground italic">
                        No activity recorded for this date
                        {selectedNote.is_leave && " (marked as leave)"}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No data available for {format(selectedDate, 'MMMM do, yyyy')}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};