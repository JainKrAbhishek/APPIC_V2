import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShieldCheck } from "lucide-react";

import AccessRulesTab from "./AccessRulesTab";
import BulkActionsTab from "./BulkActionsTab";

interface ContentAccessManagerProps {
  searchTerm?: string;
}

const ContentAccessManager: React.FC<ContentAccessManagerProps> = ({ searchTerm = "" }) => {
  const [activeTab, setActiveTab] = useState("rules");
  const [selectedContentType, setSelectedContentType] = useState("quant_topic");
  const [selectedUserType, setSelectedUserType] = useState("free");

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Content Access Control
          </CardTitle>
          <CardDescription>
            Manage access control rules for different types of content based on user subscription levels
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="rules">Access Rules</TabsTrigger>
              <TabsTrigger value="bulk">Bulk Actions</TabsTrigger>
            </TabsList>

            <TabsContent value="rules">
              <AccessRulesTab 
                selectedContentType={selectedContentType}
                setSelectedContentType={setSelectedContentType}
                selectedUserType={selectedUserType}
                setSelectedUserType={setSelectedUserType}
                searchTerm={searchTerm}
              />
            </TabsContent>

            <TabsContent value="bulk">
              <BulkActionsTab 
                selectedContentType={selectedContentType}
                setSelectedContentType={setSelectedContentType}
                selectedUserType={selectedUserType}
                setSelectedUserType={setSelectedUserType}
                searchTerm={searchTerm}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default ContentAccessManager;