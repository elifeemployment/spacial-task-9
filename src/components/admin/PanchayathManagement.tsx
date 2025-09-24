import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PanchayathForm } from "@/components/PanchayathForm";
import { PanchayathSelector } from "@/components/PanchayathSelector";
import { PanchayathNotes } from "@/components/PanchayathNotes";
import { MapPin } from "lucide-react";

export const PanchayathManagement = () => {
  const [editingPanchayath, setEditingPanchayath] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("create");
  const [refreshKey, setRefreshKey] = useState(0);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showPanchayathList, setShowPanchayathList] = useState(false);
  const [selectedPanchayath, setSelectedPanchayath] = useState<any>(null);
  const [showNotes, setShowNotes] = useState(false);

  const handlePanchayathCreatedOrUpdated = () => {
    setEditingPanchayath(null);
    setShowCreateForm(false);
    setRefreshKey(prev => prev + 1);
  };

  const handlePanchayathDeleted = () => {
    setEditingPanchayath(null);
    setRefreshKey(prev => prev + 1);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Panchayath Management</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="create" className="text-sm font-medium">
              Create New Panchayath
            </TabsTrigger>
            <TabsTrigger value="manage" className="text-sm font-medium">
              Manage Existing
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="create" className="space-y-6">
            <Card className="border border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-primary"></div>
                  Create New Panchayath
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!showCreateForm ? (
                  <div className="text-center py-6">
                    <button
                      onClick={() => setShowCreateForm(true)}
                      className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/80 transition-colors font-medium"
                    >
                      + Create New Panchayath
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold">Panchayath Form</h3>
                      <button
                        onClick={() => setShowCreateForm(false)}
                        className="text-muted-foreground hover:text-foreground text-xl"
                      >
                        ×
                      </button>
                    </div>
                    <PanchayathForm 
                      officerId="admin" 
                      onPanchayathCreated={handlePanchayathCreatedOrUpdated} 
                      editingPanchayath={editingPanchayath} 
                      onEditComplete={() => setEditingPanchayath(null)} 
                      onPanchayathDeleted={handlePanchayathDeleted} 
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="manage" className="space-y-6">
            <Card className="border border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-primary"></div>
                  Manage Existing Panchayaths
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!showPanchayathList ? (
                  <div className="text-center py-8">
                    <div className="mb-4">
                      <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                      <h3 className="text-lg font-semibold mb-2">View Panchayath List</h3>
                      <p className="text-muted-foreground mb-6">
                        Click the button below to load and manage existing panchayaths
                      </p>
                    </div>
                    <button
                      onClick={() => setShowPanchayathList(true)}
                      className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/80 transition-colors font-medium"
                    >
                      Show Panchayath List
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold">Panchayath List</h3>
                      <button
                        onClick={() => setShowPanchayathList(false)}
                        className="text-muted-foreground hover:text-foreground text-xl"
                      >
                        ×
                      </button>
                    </div>
                    <PanchayathSelector 
                      key={refreshKey} 
                      onPanchayathSelect={(panchayath) => {
                        setSelectedPanchayath(panchayath);
                        setShowNotes(true);
                      }} 
                      onPanchayathEdit={panchayath => {
                        setEditingPanchayath(panchayath);
                        setShowCreateForm(true);
                        setActiveTab("create");
                      }} 
                    />
                    
                    {showNotes && selectedPanchayath && (
                      <div className="mt-6">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-lg font-semibold">Panchayath Notes</h3>
                          <button
                            onClick={() => {
                              setShowNotes(false);
                              setSelectedPanchayath(null);
                            }}
                            className="text-muted-foreground hover:text-foreground text-xl"
                          >
                            ×
                          </button>
                        </div>
                        <PanchayathNotes 
                          panchayathId={selectedPanchayath.id}
                          panchayathName={selectedPanchayath.name}
                        />
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};