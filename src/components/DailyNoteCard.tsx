import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DailyNote } from "@/components/DailyNote";
import { FileText, ChevronDown, ChevronUp, Calendar, Clock } from "lucide-react";
import { User } from "@/lib/authService";
import { format } from "date-fns";

interface DailyNoteCardProps {
  currentUser: User;
}

export const DailyNoteCard = ({ currentUser }: DailyNoteCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const today = format(new Date(), 'EEEE, MMMM do');

  return (
    <Card className="relative overflow-hidden bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 backdrop-blur-sm border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300">
      {/* Glass morphism overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
      
      <CardHeader 
        className="relative z-10 cursor-pointer" 
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <CardTitle className="flex items-center justify-between text-lg font-semibold">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-blue-500/20 backdrop-blur-sm">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Daily Notes (ഇന്ന് നിങ്ങൾ എന്ത് ചെയ്തു? ഒന്നും ചെയ്യാത്ത ദിവസ്സം ലീവ് ആയി കണക്കാക്കും )
              </span>
              <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>{today}</span>
                <Clock className="h-3 w-3 ml-2" />
                <span>{currentUser.name}</span>
              </div>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            className="p-1 h-auto hover:bg-white/10"
          >
            {isExpanded ? (
              <ChevronUp className="h-5 w-5 text-blue-600" />
            ) : (
              <ChevronDown className="h-5 w-5 text-blue-600" />
            )}
          </Button>
        </CardTitle>
      </CardHeader>

      {!isExpanded && (
        <CardContent className="relative z-10 pt-0 pb-4">
          <p className="text-sm text-muted-foreground">
            Click to record your daily activities and notes
          </p>
        </CardContent>
      )}

      {isExpanded && (
        <CardContent className="relative z-10 pt-0">
          <DailyNote currentUser={currentUser} />
        </CardContent>
      )}
    </Card>
  );
};
