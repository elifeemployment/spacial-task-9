import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Plus, Edit3, Save, X, Trash2 } from "lucide-react";

interface PanchayathNotesProps {
  panchayathId: string;
  panchayathName: string;
}

interface Note {
  id: string;
  note_text: string;
  created_at: string;
  updated_at: string;
}

export const PanchayathNotes = ({ panchayathId, panchayathName }: PanchayathNotesProps) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState("");
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (panchayathId) {
      fetchNotes();
    }
  }, [panchayathId]);

  const fetchNotes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("panchayath_notes" as any)
        .select("*")
        .eq("panchayath_id", panchayathId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setNotes((data as unknown as Note[]) || []);
    } catch (error) {
      console.error("Error fetching notes:", error);
      toast({
        title: "Error",
        description: "Failed to fetch notes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;

    try {
      const { error } = await supabase
        .from("panchayath_notes" as any)
        .insert({
          panchayath_id: panchayathId,
          note_text: newNote.trim(),
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Note added successfully",
      });

      setNewNote("");
      setShowAddForm(false);
      fetchNotes();
    } catch (error) {
      console.error("Error adding note:", error);
      toast({
        title: "Error",
        description: "Failed to add note",
        variant: "destructive",
      });
    }
  };

  const handleEditNote = async (noteId: string) => {
    if (!editText.trim()) return;

    try {
      const { error } = await supabase
        .from("panchayath_notes" as any)
        .update({ note_text: editText.trim() })
        .eq("id", noteId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Note updated successfully",
      });

      setEditingNote(null);
      setEditText("");
      fetchNotes();
    } catch (error) {
      console.error("Error updating note:", error);
      toast({
        title: "Error",
        description: "Failed to update note",
        variant: "destructive",
      });
    }
  };

  const startEdit = (note: Note) => {
    setEditingNote(note.id);
    setEditText(note.note_text);
  };

  const cancelEdit = () => {
    setEditingNote(null);
    setEditText("");
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      const { error } = await supabase
        .from("panchayath_notes" as any)
        .delete()
        .eq("id", noteId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Note deleted successfully",
      });

      fetchNotes();
    } catch (error) {
      console.error("Error deleting note:", error);
      toast({
        title: "Error",
        description: "Failed to delete note",
        variant: "destructive",
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

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            Notes for {panchayathName}
            <Badge variant="secondary">{notes.length} notes</Badge>
          </CardTitle>
          <Button
            onClick={() => setShowAddForm(!showAddForm)}
            size="sm"
            variant="outline"
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Note
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {showAddForm && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-4">
              <div className="space-y-3">
                <Textarea
                  placeholder="Enter your note about this panchayath..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="min-h-[100px]"
                />
                <div className="flex gap-2">
                  <Button onClick={handleAddNote} size="sm">
                    <Save className="h-4 w-4 mr-2" />
                    Save Note
                  </Button>
                  <Button
                    onClick={() => {
                      setShowAddForm(false);
                      setNewNote("");
                    }}
                    size="sm"
                    variant="outline"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {notes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No notes found for this panchayath.</p>
            <p className="text-sm">Add your first note using the button above.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notes.map((note) => (
              <Card key={note.id} className="border-l-4 border-l-primary/20">
                <CardContent className="pt-4">
                  {editingNote === note.id ? (
                    <div className="space-y-3">
                      <Textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="min-h-[100px]"
                      />
                      <div className="flex gap-2">
                        <Button onClick={() => handleEditNote(note.id)} size="sm">
                          <Save className="h-4 w-4 mr-2" />
                          Save
                        </Button>
                        <Button onClick={cancelEdit} size="sm" variant="outline">
                          <X className="h-4 w-4 mr-2" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <p className="text-sm leading-relaxed flex-1">{note.note_text}</p>
                        <div className="flex gap-1 ml-2">
                          <Button
                            onClick={() => startEdit(note)}
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                          >
                            <Edit3 className="h-4 w-4" />
                          </Button>
                          <Button
                            onClick={() => handleDeleteNote(note.id)}
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Added: {format(new Date(note.created_at), "MMM d, yyyy 'at' h:mm a")}</span>
                        {note.updated_at !== note.created_at && (
                          <span>• Updated: {format(new Date(note.updated_at), "MMM d, yyyy 'at' h:mm a")}</span>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};