import React from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface UserFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filterRole: string | null;
  onRoleFilterChange: (value: string | null) => void;
  filterStatus: string | null;
  onStatusFilterChange: (value: string | null) => void;
  activeTab: "all" | "admins" | "students";
  onTabChange: (value: "all" | "admins" | "students") => void;
}

// Component for filtering users
export const UserFilters: React.FC<UserFiltersProps> = ({
  searchTerm,
  onSearchChange,
  filterRole,
  onRoleFilterChange,
  filterStatus,
  onStatusFilterChange,
  activeTab,
  onTabChange
}) => (
  <div className="space-y-4">
    <Tabs 
      value={activeTab} 
      onValueChange={(value) => onTabChange(value as "all" | "admins" | "students")}
      className="w-full"
    >
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="all">All Users</TabsTrigger>
        <TabsTrigger value="admins">Admins</TabsTrigger>
        <TabsTrigger value="students">Students</TabsTrigger>
      </TabsList>
    </Tabs>

    <div className="flex flex-col md:flex-row gap-4">
      <Input
        placeholder="Search users..."
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        className="md:w-1/2"
      />
      
      <div className="flex gap-4">
        <Select 
          value={filterRole || ""}
          onValueChange={(value) => onRoleFilterChange(value || null)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Role: All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="user">User</SelectItem>
          </SelectContent>
        </Select>
        
        <Select 
          value={filterStatus || ""}
          onValueChange={(value) => onStatusFilterChange(value || null)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status: All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  </div>
);