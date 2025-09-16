import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, History, Save } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { User } from "@/lib/authService";
interface DailyNoteData {
  id?: string;
  date: string;
  activity: string | null;
  is_leave: boolean;
  mobile_number?: string;
}
interface DailyNoteProps {
  currentUser: User;
}
export const DailyNote = ({
  currentUser
}: DailyNoteProps) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [activity, setActivity] = useState("");
  const [notes, setNotes] = useState<DailyNoteData[]>([]);
  const [currentNote, setCurrentNote] = useState<DailyNoteData | null>(null);
  const [activeTab, setActiveTab] = useState("today");
  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');
  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
  const isToday = selectedDateStr === todayStr;
  useEffect(() => {
    if (currentUser) {
      fetchNotes();
    }
  }, [currentUser]);
  useEffect(() => {
    if (selectedDate && notes.length > 0) {
      const note = notes.find(n => n.date === selectedDateStr);
      setCurrentNote(note || null);
      setActivity(note?.activity || "");
    }
  }, [selectedDate, notes, selectedDateStr]);
  const fetchNotes = async () => {
    if (!currentUser?.mobile_number) return;
    try {
      const {
        data,
        error
      } = await supabase.from('daily_notes').select('*').eq('mobile_number', currentUser.mobile_number).order('date', {
        ascending: false
      });
      if (error) throw error;
      setNotes(data || []);
    } catch (error) {
      console.error('Error fetching notes:', error);
      toast({
        title: "Error",
        description: "Failed to fetch daily notes",
        variant: "destructive"
      });
    }
  };
  const saveNote = async () => {
    if (!isToday) {
      toast({
        title: "Cannot Edit Past Dates",
        description: "You can only edit today's activity",
        variant: "destructive"
      });
      return;
    }
    if (!currentUser?.mobile_number) {
      toast({
        title: "Error",
        description: "User information not available",
        variant: "destructive"
      });
      return;
    }
    try {
      const noteData = {
        mobile_number: currentUser.mobile_number,
        user_id: currentUser.id,
        date: selectedDateStr,
        activity: activity.trim() || null,
        is_leave: !activity.trim()
      };
      if (currentNote) {
        const {
          error
        } = await supabase.from('daily_notes').update(noteData).eq('id', currentNote.id);
        if (error) throw error;
      } else {
        const {
          error
        } = await supabase.from('daily_notes').insert([noteData]);
        if (error) throw error;
      }
      await fetchNotes();
      toast({
        title: "Success",
        description: "Daily note saved successfully"
      });
    } catch (error) {
      console.error('Error saving note:', error);
      toast({
        title: "Error",
        description: "Failed to save daily note",
        variant: "destructive"
      });
    }
  };
  const hasActivity = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const note = notes.find(n => n.date === dateStr);
    return !!(note && !note.is_leave && note.activity);
  };
  const isOnLeave = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const note = notes.find(n => n.date === dateStr);
    // Only show as leave for past dates with no activity
    const isPastDate = date < new Date(new Date().setHours(0, 0, 0, 0));
    return isPastDate && (!note || note.is_leave || !note.activity);
  };

  const isFutureDate = (date: Date) => {
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today
    return date > today;
  };
  return <Card className="relative overflow-hidden bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 backdrop-blur-sm border border-white/20 shadow-xl animate-fade-in">
      {/* Glass morphism overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
      
      <CardHeader className="relative z-10">
        <CardTitle className="flex items-center justify-between text-lg font-semibold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-500" />
            Daily Notes ()
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">{currentUser.name}</span>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="relative z-10 p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-white/10 backdrop-blur-sm">
              <TabsTrigger value="today" className="data-[state=active]:bg-white/20">
                Today
              </TabsTrigger>
              <TabsTrigger value="history" className="data-[state=active]:bg-white/20">
                <History className="h-4 w-4 mr-2" />
                History
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="today" className="mt-4 space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-foreground/90">
                    {format(selectedDate, 'EEEE, MMMM do, yyyy')}
                  </h3>
                  {currentNote && !currentNote.is_leave && currentNote.activity && <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />}
                  {currentNote && (currentNote.is_leave || !currentNote.activity) && <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />}
                </div>
                
                <Textarea value={activity} onChange={e => setActivity(e.target.value)} placeholder={isToday ? "What did you accomplish today?" : "View only - cannot edit past dates"} disabled={!isToday} className="min-h-[120px] border-white/10 backdrop-blur-sm resize-none bg-gray-50" />
                
                {isToday && <Button onClick={saveNote} className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 transition-all duration-300 hover-scale">
                    <Save className="h-4 w-4 mr-2" />
                    Save Activity
                  </Button>}
                
                {!isToday && <p className="text-sm text-muted-foreground text-center py-2">
                    You can only edit today's activity
                  </p>}
              </div>
            </TabsContent>
            
            <TabsContent value="history" className="mt-4">
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-3">
                    Select a date to view activities
                  </p>
                  <div className="flex justify-center gap-4 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-green-500" />
                      <span>Active</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-red-500" />
                      <span>Leave</span>
                    </div>
                  </div>
                </div>
                
                <Calendar 
                  mode="single" 
                  selected={selectedDate} 
                  onSelect={date => {
                    if (date && !isFutureDate(date)) {
                      setSelectedDate(date);
                      setActiveTab("today");
                    }
                  }} 
                  className="rounded-md border-0 bg-white/5 backdrop-blur-sm pointer-events-auto mx-auto" 
                  disabled={isFutureDate}
                  modifiers={{
                    hasActivity: hasActivity,
                    onLeave: isOnLeave
                  }} 
                  modifiersClassNames={{
                    hasActivity: "bg-green-500/20 text-green-800 hover:bg-green-500/30 border-green-500/50",
                    onLeave: "bg-red-500/20 text-red-800 hover:bg-red-500/30 border-red-500/50"
                  }} 
                />
              </div>
            </TabsContent>
          </Tabs>
      </CardContent>
    </Card>;
};
