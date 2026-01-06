import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ViewAnalyze } from "@/components/admin/ViewAnalyze";
import { PanchayathManagement } from "@/components/admin/PanchayathManagement";
import { AgentTestimonialAnalytics } from "@/components/admin/AgentTestimonialAnalytics";
import { PerformanceReport } from "@/components/admin/PerformanceReport";
import { TodoList } from "@/components/admin/TodoList";
import { ArrowLeft, Shield, BarChart3, MapPin, MessageSquare, TrendingDown, ListTodo, Mail, Loader2 } from "lucide-react";
import { DailyNoteCard } from "@/components/DailyNoteCard";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { User as AuthUser, Session } from "@supabase/supabase-js";
import { User } from "@/lib/authService";

const TeamAdmin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("panchayath");
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // Auth state
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [otpSent, setOtpSent] = useState(false);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setCheckingAuth(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setCheckingAuth(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Get current user from localStorage on component mount
  useEffect(() => {
    const userData = localStorage.getItem('currentUser');
    if (userData) {
      setCurrentUser(JSON.parse(userData));
    }
  }, []);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast({
        title: "Email Required",
        description: "Please enter your email address",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
      });

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        setOtpSent(true);
        toast({
          title: "OTP Sent",
          description: "Check your email for the verification code",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send OTP",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim()) {
      toast({
        title: "OTP Required",
        description: "Please enter the verification code",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: otp.trim(),
        type: 'email',
      });

      if (error) {
        toast({
          title: "Verification Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Login Successful",
          description: "Welcome to Team Admin Panel",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to verify OTP",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setEmail("");
    setOtp("");
    setOtpSent(false);
    toast({
      title: "Logged Out",
      description: "You have been logged out of Team Admin Panel",
    });
    navigate("/");
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-background/95 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-background/95 flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Shield className="h-12 w-12 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold">Team Admin Login</CardTitle>
            <CardDescription>
              {otpSent 
                ? "Enter the verification code sent to your email" 
                : "Enter your email to receive a verification code"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!otpSent ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Send Verification Code"
                  )}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="otp">Verification Code</Label>
                  <Input
                    id="otp"
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="Enter 6-digit code"
                    className="text-center text-lg tracking-widest"
                    maxLength={6}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    "Verify & Login"
                  )}
                </Button>
                <Button 
                  type="button" 
                  variant="ghost" 
                  className="w-full" 
                  onClick={() => {
                    setOtpSent(false);
                    setOtp("");
                  }}
                >
                  Change Email
                </Button>
              </form>
            )}
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
                Team Admin Panel
              </h1>
              <p className="text-muted-foreground mt-2 text-sm sm:text-base">
                Manage teams and administrative settings
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            Logout
          </Button>
        </div>

        {/* Daily Notes for Team Members */}
        {currentUser && (
          <div className="mb-6">
            <DailyNoteCard currentUser={currentUser} />
          </div>
        )}

        {/* Admin Navigation Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className={`cursor-pointer transition-all duration-300 hover:scale-[1.02] ${activeTab === "panchayath" ? "scale-[1.02]" : ""}`} onClick={() => setActiveTab("panchayath")}>
            <Card className={`h-full relative overflow-hidden border-2 transition-all duration-300 ${activeTab === "panchayath" ? "border-primary shadow-xl bg-primary/10" : "border-border hover:border-primary/50 hover:shadow-lg"}`}>
              <CardHeader className="pb-4">
                <div className="flex flex-col items-center text-center gap-3">
                  <div className="p-3 rounded-full bg-coordinator/10 border border-coordinator/20">
                    <MapPin className="h-6 w-6 text-coordinator" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-semibold mb-1">Panchayath</CardTitle>
                    <p className="text-xs text-muted-foreground mb-2">പഞ്ചായത്ത് ചേർക്കാൻ</p>
                    <CardDescription className="text-xs">
                      Create and manage panchayaths
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </div>

          <div className={`cursor-pointer transition-all duration-300 hover:scale-[1.02] ${activeTab === "analytics" ? "scale-[1.02]" : ""}`} onClick={() => setActiveTab("analytics")}>
            <Card className={`h-full relative overflow-hidden border-2 transition-all duration-300 ${activeTab === "analytics" ? "border-primary shadow-xl bg-primary/10" : "border-border hover:border-primary/50 hover:shadow-lg"}`}>
              <CardHeader className="pb-4">
                <div className="flex flex-col items-center text-center gap-3">
                  <div className="p-3 rounded-full bg-supervisor/10 border border-supervisor/20">
                    <BarChart3 className="h-6 w-6 text-supervisor" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-semibold mb-1">Hierarchy View</CardTitle>
                    <p className="text-xs text-muted-foreground mb-2">ശ്രേണി കാണാൻ</p>
                    <CardDescription className="text-xs">
                      View panchayath analytics and hierarchy
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </div>

          <div className={`cursor-pointer transition-all duration-300 hover:scale-[1.02] ${activeTab === "testimonials" ? "scale-[1.02]" : ""}`} onClick={() => setActiveTab("testimonials")}>
            <Card className={`h-full relative overflow-hidden border-2 transition-all duration-300 ${activeTab === "testimonials" ? "border-primary shadow-xl bg-primary/10" : "border-border hover:border-primary/50 hover:shadow-lg"}`}>
              <CardHeader className="pb-4">
                <div className="flex flex-col items-center text-center gap-3">
                  <div className="p-3 rounded-full bg-accent/10 border border-accent/20">
                    <MessageSquare className="h-6 w-6 text-accent" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-semibold mb-1">Testimonials</CardTitle>
                    <p className="text-xs text-muted-foreground mb-2">അനുമാന ചോദ്യങ്ങളും ഉത്തരങ്ങളും</p>
                    <CardDescription className="text-xs">
                      View agent testimonials and feedback
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </div>

          <div className={`cursor-pointer transition-all duration-300 hover:scale-[1.02] ${activeTab === "performance" ? "scale-[1.02]" : ""}`} onClick={() => setActiveTab("performance")}>
            <Card className={`h-full relative overflow-hidden border-2 transition-all duration-300 ${activeTab === "performance" ? "border-primary shadow-xl bg-primary/10" : "border-border hover:border-primary/50 hover:shadow-lg"}`}>
              <CardHeader className="pb-4">
                <div className="flex flex-col items-center text-center gap-3">
                  <div className="p-3 rounded-full bg-pro/10 border border-pro/20">
                    <TrendingDown className="h-6 w-6 text-pro" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-semibold mb-1">Performance</CardTitle>
                    <p className="text-xs text-muted-foreground mb-2">ഏജൻ്റുമാരുടെ പ്രകടന റിപ്പോർട്ടുകൾ</p>
                    <CardDescription className="text-xs">
                      View panchayath performance reports
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </div>

          <div className={`cursor-pointer transition-all duration-300 hover:scale-[1.02] ${activeTab === "todo" ? "scale-[1.02]" : ""}`} onClick={() => setActiveTab("todo")}>
            <Card className={`h-full relative overflow-hidden border-2 transition-all duration-300 ${activeTab === "todo" ? "border-primary shadow-xl bg-primary/10" : "border-border hover:border-primary/50 hover:shadow-lg"}`}>
              <CardHeader className="pb-4">
                <div className="flex flex-col items-center text-center gap-3">
                  <div className="p-3 rounded-full bg-group-leader/10 border border-group-leader/20">
                    <ListTodo className="h-6 w-6 text-group-leader" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-semibold mb-1">Todo List</CardTitle>
                    <p className="text-xs text-muted-foreground mb-2">ചെയ്യേണ്ട കാര്യങ്ങൾ</p>
                    <CardDescription className="text-xs">
                      Manage tasks and to-do items
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </div>
        </div>

        {/* Content Area */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsContent value="panchayath">
            <PanchayathManagement />
          </TabsContent>
          
          <TabsContent value="analytics">
            <ViewAnalyze />
          </TabsContent>

          <TabsContent value="testimonials">
            <AgentTestimonialAnalytics />
          </TabsContent>

          <TabsContent value="performance">
            <PerformanceReport />
          </TabsContent>

          <TabsContent value="todo">
            <TodoList />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default TeamAdmin;