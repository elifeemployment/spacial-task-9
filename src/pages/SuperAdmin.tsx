import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Shield, Settings, Database, Users, BarChart3, MessageSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AdminTeamManagement } from "@/components/admin/AdminTeamManagement";
import { TestimonialManagementSimple } from "@/components/admin/TestimonialManagementSimple";

const SuperAdmin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("user-management");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Simple authentication check for demo purposes
      // In production, this should use proper password hashing
      if (username === "eva" && password === "321") {
        setIsAuthenticated(true);
        toast({
          title: "Login Successful",
          description: "Welcome to Super Admin Panel",
        });
      } else {
        toast({
          title: "Login Failed",
          description: "Invalid credentials",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Login Error",
        description: "An error occurred during login",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUsername("");
    setPassword("");
    toast({
      title: "Logged Out",
      description: "You have been logged out of Super Admin Panel",
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-background/95 flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Shield className="h-12 w-12 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold">Super Admin Login</CardTitle>
            <CardDescription>Enter your credentials to access the super admin panel</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Logging in..." : "Login"}
              </Button>
            </form>
            <div className="mt-4 text-center">
              <Button variant="link" onClick={() => navigate("/")} className="text-sm">
                Back to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background/95 p-3 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 sm:mb-8">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={() => navigate("/")} className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div className="text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Super Admin Panel
              </h1>
              <p className="text-muted-foreground mt-2 text-sm sm:text-base">
                System-wide administration and control
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            Logout
          </Button>
        </div>

        {/* Admin Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div 
            className={`cursor-pointer transition-all duration-300 hover:scale-[1.02] ${activeTab === "user-management" ? "scale-[1.02]" : ""}`} 
            onClick={() => setActiveTab("user-management")}
          >
            <Card className={`relative overflow-hidden border-2 transition-all duration-300 ${activeTab === "user-management" ? "border-primary shadow-xl bg-primary/10" : "border-border hover:border-primary/50 hover:shadow-lg"}`}>
              <CardHeader className="pb-3 bg-blue-50">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">User Management</CardTitle>
                </div>
                <CardDescription>
                  Manage all system users and roles
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          <div 
            className={`cursor-pointer transition-all duration-300 hover:scale-[1.02] ${activeTab === "testimonials" ? "scale-[1.02]" : ""}`} 
            onClick={() => setActiveTab("testimonials")}
          >
            <Card className={`relative overflow-hidden border-2 transition-all duration-300 ${activeTab === "testimonials" ? "border-primary shadow-xl bg-primary/10" : "border-border hover:border-primary/50 hover:shadow-lg"}`}>
              <CardHeader className="pb-3 bg-yellow-50">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">Testimonials</CardTitle>
                </div>
                <CardDescription>
                  Manage agent testimonial questions
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>

        {/* Content Area */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsContent value="overview">
            <Card>
              <CardHeader>
                <CardTitle>System Overview</CardTitle>
                <CardDescription>
                  Monitor overall system health and performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">1,234</div>
                      <p className="text-xs text-muted-foreground">Across all roles</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Active Teams</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">56</div>
                      <p className="text-xs text-muted-foreground">Team admin groups</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">System Health</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">99.9%</div>
                      <p className="text-xs text-muted-foreground">Uptime</p>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="user-management">
            <AdminTeamManagement />
          </TabsContent>

          <TabsContent value="testimonials">
            <TestimonialManagementSimple />
          </TabsContent>
          
        </Tabs>
      </div>
    </div>
  );
};

export default SuperAdmin;