import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Toggle } from "@/components/ui/toggle";
import { ShieldCheck, ShieldOff, Trash2 } from "lucide-react";

import { ContentAccessControl } from "./types";

interface AccessRuleTableProps {
  accessRules: ContentAccessControl[];
  isLoading: boolean;
  selectedContentType: string;
  onToggleAccess: (rule: ContentAccessControl) => void;
  onDeleteRule: (id: number) => void;
}

const AccessRuleTable: React.FC<AccessRuleTableProps> = ({
  accessRules,
  isLoading,
  selectedContentType,
  onToggleAccess,
  onDeleteRule,
}) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-40">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!accessRules || accessRules.length === 0) {
    return (
      <div className="text-center p-6 border rounded-md bg-muted/20">
        <h3 className="font-medium text-lg mb-2">No Access Rules Found</h3>
        <p className="text-muted-foreground mb-4">
          No access rules have been configured for this content type and user type yet.
        </p>
      </div>
    );
  }

  return (
    <div className="border rounded-md overflow-auto">
      <Table className="min-w-[800px]">
        <TableHeader>
          <TableRow>
            <TableHead className="hidden md:table-cell w-[50px]">ID</TableHead>
            <TableHead className="w-[120px]">Content ID</TableHead>
            <TableHead className="hidden md:table-cell">Content Type</TableHead>
            <TableHead className="w-[120px]">User Type</TableHead>
            <TableHead className="w-[130px]">Access Status</TableHead>
            {selectedContentType === 'vocabulary_day' && (
              <TableHead className="hidden sm:table-cell w-[120px]">Word Limit</TableHead>
            )}
            <TableHead className="text-right w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {accessRules.map((rule) => (
            <TableRow key={rule.id}>
              <TableCell className="hidden md:table-cell">{rule.id}</TableCell>
              <TableCell>
                {rule.contentType === 'vocabulary_day' ? (
                  <Badge variant="outline" className="rounded-full">
                    Day {rule.contentId}
                  </Badge>
                ) : (
                  rule.contentId
                )}
              </TableCell>
              <TableCell className="hidden md:table-cell">
                {rule.contentType.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
              </TableCell>
              <TableCell>
                <Badge variant="secondary" className="capitalize">
                  {rule.userType}
                </Badge>
              </TableCell>
              <TableCell>
                <Toggle
                  pressed={rule.isAccessible}
                  onPressedChange={() => onToggleAccess(rule)}
                  variant={rule.isAccessible ? "default" : "outline"}
                  size="sm"
                  className="gap-1"
                >
                  {rule.isAccessible ? (
                    <>
                      <ShieldCheck className="h-4 w-4" />
                      <span className="hidden sm:inline">Allowed</span>
                    </>
                  ) : (
                    <>
                      <ShieldOff className="h-4 w-4" />
                      <span className="hidden sm:inline">Blocked</span>
                    </>
                  )}
                </Toggle>
              </TableCell>
              {selectedContentType === 'vocabulary_day' && (
                <TableCell className="hidden sm:table-cell">
                  {rule.dailyWordLimit === 0 ? 'Unlimited' : rule.dailyWordLimit}
                </TableCell>
              )}
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDeleteRule(rule.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default AccessRuleTable;