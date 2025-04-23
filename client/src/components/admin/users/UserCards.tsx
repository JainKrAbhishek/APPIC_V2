import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Eye, UserCog, Lock, UserCheck } from "lucide-react";
import { UserWithStats } from "./types";

interface UserCardsProps {
  users: UserWithStats[];
  onEdit: (user: UserWithStats) => void;
  onView: (user: UserWithStats) => void;
  onResetPassword: (user: UserWithStats) => void;
  onToggleStatus: (user: UserWithStats) => void;
}

// Mobile cards view for users
export const UsersCardsMobile: React.FC<UserCardsProps> = ({ 
  users, 
  onEdit,
  onView,
  onResetPassword,
  onToggleStatus
}) => (
  <div className="space-y-4">
    {users.map(user => (
      <div key={user.id} className="bg-white border rounded-lg p-4 shadow-sm">
        <div className="flex justify-between items-start mb-3">
          <div>
            <div className="font-medium flex items-center">
              {user.username}
              <span className="ml-2 text-xs font-mono text-gray-400">#{user.id}</span>
            </div>
            <div className="text-sm text-gray-500 mt-1">{user.firstName} {user.lastName}</div>
          </div>
          <Badge variant={user.isAdmin ? "default" : "secondary"}>
            {user.isAdmin ? "Admin" : "User"}
          </Badge>
        </div>
        
        <div className="text-sm text-gray-500 mb-3 break-all">
          {user.email}
        </div>
        
        <div className="flex justify-between items-center">
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
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <MoreHorizontal className="h-4 w-4 mr-1" />
                Actions
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onView(user)}>
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(user)}>
                <UserCog className="h-4 w-4 mr-2" />
                Edit User
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onResetPassword(user)}>
                <Lock className="h-4 w-4 mr-2" />
                Reset Password
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => onToggleStatus(user)}
                className={user.accountStatus === 'active' ? 'text-amber-600' : 'text-green-600'}
              >
                <UserCheck className="h-4 w-4 mr-2" />
                {user.accountStatus === 'active' ? 'Deactivate User' : 'Activate User'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    ))}
  </div>
);