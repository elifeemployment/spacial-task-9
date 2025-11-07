import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { MobileLogin } from "@/components/MobileLogin";
import { UserProfile } from "@/components/UserProfile";
import { DailyNoteCard } from "@/components/DailyNoteCard";
import { CoordinatorReports } from "@/components/CoordinatorReports";
import { MyTasks } from "@/components/admin/MyTasks";
import { PanchayathManagement } from "@/components/admin/PanchayathManagement";
import { TaskManagement } from "@/components/TaskManagement";
import { FileText } from "lucide-react";
import { User } from "@/lib/authService";
import { useToast } from "@/hooks/use-toast";
const Index = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isReportsOpen, setIsReportsOpen] = useState(false);
  
  const {
    toast
  } = useToast();

  // Load user from localStorage on component mount
  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      try {
        setCurrentUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('currentUser');
      }
    }
  }, []);
  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('currentUser', JSON.stringify(user));
  };
  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
    toast({
      title: "Logged out",
      description: "You have been logged out successfully"
    });
  };

  // Show login screen if user is not authenticated
  if (!currentUser) {
    return <MobileLogin onLogin={handleLogin} />;
  }
  return <div className="min-h-screen bg-gradient-green-blue p-3 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 sm:mb-8">
          <div className="text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent drop-shadow-lg">Agent Management System</h1>
            <p className="text-white/90 mt-2 text-sm sm:text-base drop-shadow-md">
              Welcome, {currentUser.name}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
            <UserProfile currentUser={currentUser} onUserUpdate={setCurrentUser} />
            
            {/* Show Admin Panel button for team members */}
            {currentUser.hasAdminAccess && (
              <Button variant="outline" onClick={() => window.location.href = '/admin'} className="w-full sm:w-auto border-primary/20 hover:border-primary">
                Team Admin Panel
              </Button>
            )}
            
            {/* Show Reports button only for coordinators */}
            {currentUser.role === 'coordinator' && <Button variant="outline" onClick={() => setIsReportsOpen(!isReportsOpen)} className="w-full sm:w-auto border-blue-500/20 hover:border-blue-500 bg-blue-50 hover:bg-blue-100 text-blue-700 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Reports
              </Button>}
            
            
            <Button variant="outline" onClick={handleLogout} className="w-full sm:w-auto border-destructive/20 hover:border-destructive bg-destructive/10 hover:bg-destructive/20 text-destructive">
              Logout
            </Button>
          </div>
        </div>

        {/* Daily Note Feature */}
        <div className="mb-6">
          <DailyNoteCard currentUser={currentUser} />
        </div>


        {/* Agent Management - Show for admin users and coordinators */}
        {(currentUser.hasAdminAccess || currentUser.role === 'coordinator') && (
          <div className="mb-6">
            <TaskManagement currentUser={currentUser} />
          </div>
        )}

        {/* Assigned Tasks - Show for all users */}
        <div className="mb-6">
          <MyTasks 
            userId={currentUser.id} 
            userRole={currentUser.role}
            userTable={currentUser.table}
          />
        </div>

        {/* Coordinator Reports */}
        {currentUser.role === 'coordinator' && isReportsOpen && <div className="mb-6">
            <CoordinatorReports currentUser={currentUser} />
          </div>}


      </div>
    </div>;
};
export default Index;