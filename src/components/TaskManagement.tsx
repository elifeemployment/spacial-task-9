import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PanchayathSelector } from "@/components/PanchayathSelector";
import { CoordinatorForm } from "@/components/CoordinatorForm";
import { SupervisorForm } from "@/components/SupervisorForm";
import { GroupLeaderForm } from "@/components/GroupLeaderForm";
import { ProForm } from "@/components/ProForm";
import { CustomerForm } from "@/components/CustomerForm";
import { AgentsList } from "@/components/AgentsList";
import { User } from "@/lib/authService";
import { ChevronDown, ChevronRight, Plus } from "lucide-react";

interface TaskManagementProps {
  currentUser: User;
}

export const TaskManagement = ({ currentUser }: TaskManagementProps) => {
  const [selectedPanchayath, setSelectedPanchayath] = useState<any>({ id: 'all', name: 'All Panchayaths' });
  const [selectedRole, setSelectedRole] = useState("coordinator");
  const [refreshKey, setRefreshKey] = useState(0);
  const [showExistingAgents, setShowExistingAgents] = useState(false);
  const [isAddAgentsOpen, setIsAddAgentsOpen] = useState(false);
  const handlePanchayathSelect = (panchayath: any) => {
    setSelectedPanchayath(panchayath);
  };
  const roleCards = [{
    key: "coordinator",
    label: "Coordinator",
    color: "bg-coordinator",
    description: "Manage ward coordinators with ratings"
  }, {
    key: "supervisor",
    label: "Supervisor",
    color: "bg-supervisor",
    description: "Assign supervisors to multiple wards"
  }, {
    key: "group-leader",
    label: "Group Leader",
    color: "bg-group-leader",
    description: "One group leader per ward"
  }, {
    key: "pro",
    label: "PRO",
    color: "bg-pro",
    description: "Public Relations Officers under group leaders"
  }, {
    key: "customer",
    label: "Customer",
    color: "bg-customer",
    description: "Manage customer counts with PRO assignment"
  }];
  return <div className="space-y-6">
      <Card className="border-2 border-primary/20 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10">
          <CardTitle className="text-primary text-sm">Agent Management (Please create panchayath first from Admin Panel)</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {/* Add Agents Collapsible Card */}
          <Card 
            className="border border-primary/20 bg-primary/5 cursor-pointer transition-all duration-300 hover:shadow-lg"
            onClick={() => setIsAddAgentsOpen(!isAddAgentsOpen)}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <Plus className="h-4 w-4" />
                Add Agents (പുതുതായി ഏജന്റുമാരെ ചേർക്കുക)
                {isAddAgentsOpen ? (
                  <ChevronDown className="h-4 w-4 ml-auto" />
                ) : (
                  <ChevronRight className="h-4 w-4 ml-auto" />
                )}
              </CardTitle>
            </CardHeader>
          </Card>

          {/* Collapsible Content */}
          {isAddAgentsOpen && (
            <div className="mt-4 space-y-6">
              <Card className="border border-supervisor/20 bg-supervisor/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-supervisor"></div>
                    Select Panchayath (പഞ്ചായത്ത് തിരഞ്ഞെടുക്കുക )
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <PanchayathSelector 
                    key={refreshKey} 
                    onPanchayathSelect={handlePanchayathSelect} 
                    onPanchayathEdit={() => {}} 
                  />
                </CardContent>
              </Card>

              {selectedPanchayath && (
                <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
                  <CardHeader>
                    <CardTitle className="text-xl">
                      Manage Hierarchy - {selectedPanchayath.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4 mb-6">
                      {roleCards.map(({
                    key,
                    label,
                    color,
                    description
                  }) => (
                        <Card 
                          key={key} 
                          className={`cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105 border-2 ${selectedRole === key ? `border-primary shadow-lg ${color}/20` : "border-border hover:border-primary/40"}`} 
                          onClick={() => setSelectedRole(key)}
                        >
                          <CardHeader className="pb-2 p-3 md:p-6">
                            <CardTitle className="text-sm md:text-base flex items-center gap-2">
                              <div className={`h-3 w-3 md:h-4 md:w-4 rounded-full ${color} shadow-sm`}></div>
                              {label}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-3 md:p-6 pt-0">
                            <p className="text-xs md:text-sm text-muted-foreground">
                              {description}
                            </p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    <div className="space-y-4">
                      <div className="flex gap-2">
                        <Button
                          variant={!showExistingAgents ? "default" : "outline"}
                          onClick={() => setShowExistingAgents(false)}
                          size="sm"
                        >
                          Add New
                        </Button>
                        <Button
                          variant={showExistingAgents ? "default" : "outline"}
                          onClick={() => setShowExistingAgents(true)}
                          size="sm"
                        >
                          View/Edit Existing
                        </Button>
                      </div>

                      <Card className="border border-primary/20">
                        <CardContent className="p-6">
                          {showExistingAgents ? (
                            <AgentsList selectedPanchayath={selectedPanchayath} selectedRole={selectedRole} />
                          ) : (
                            <>
                              {selectedRole === "coordinator" && <CoordinatorForm selectedPanchayath={selectedPanchayath} />}
                              {selectedRole === "supervisor" && <SupervisorForm selectedPanchayath={selectedPanchayath} />}
                              {selectedRole === "group-leader" && <GroupLeaderForm selectedPanchayath={selectedPanchayath} />}
                              {selectedRole === "pro" && <ProForm selectedPanchayath={selectedPanchayath} />}
                              {selectedRole === "customer" && <CustomerForm selectedPanchayath={selectedPanchayath} />}
                            </>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>;
};
