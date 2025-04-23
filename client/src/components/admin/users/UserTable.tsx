import React from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, UserCog, Lock, UserCheck } from "lucide-react";
import { UserWithStats } from "./types";

interface UserTableProps {
  users: UserWithStats[];
  onEdit: (user: UserWithStats) => void;
  onView: (user: UserWithStats) => void;
  onResetPassword: (user: UserWithStats) => void;
  onToggleStatus: (user: UserWithStats) => void;
}

// Desktop user table component
export const UsersTableDesktop: React.FC<UserTableProps> = ({ 
  users, 
  onEdit,
  onView,
  onResetPassword,
  onToggleStatus
}) => (
  <div className="border rounded-md overflow-hidden">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[60px]">ID</TableHead>
          <TableHead>User Information</TableHead>
          <TableHead className="w-[100px]">Role</TableHead>
          <TableHead className="w-[100px] text-center">Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map(user => (
          <TableRow key={user.id} className="group">
            <TableCell className="font-mono text-xs text-gray-500">{user.id}</TableCell>
            <TableCell>
              <div className="font-medium">{user.username}</div>
              <div className="text-sm text-gray-500">
                {user.email}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                {user.firstName} {user.lastName}
              </div>
            </TableCell>
            <TableCell>
              <Badge variant={user.isAdmin ? "default" : "secondary"}>
                {user.isAdmin ? "Admin" : "User"}
              </Badge>
            </TableCell>
            <TableCell className="text-center">
              <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                user.accountStatus === 'active' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                <div className={`mr-1 h-2 w-2 rounded-full ${
                  user.accountStatus === 'active' ? 'bg-green-400' : 'bg-red-400'
                }`}></div>
                {user.accountStatus === 'active' ? 'Active' : 'Inactive'}
              </div>
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-2 opacity-70 group-hover:opacity-100">
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => onView(user)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => onEdit(user)}
                >
                  <UserCog className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => onResetPassword(user)}
                >
                  <Lock className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => onToggleStatus(user)}
                >
                  <UserCheck className={`h-4 w-4 ${user.accountStatus === 'active' ? 'text-amber-600' : 'text-green-600'}`} />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
);