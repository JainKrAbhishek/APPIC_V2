import React from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { UserWithStats } from "./types";

interface UserViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserWithStats | null;
  onEdit: (user: UserWithStats) => void;
}

// Dialog for viewing detailed user information
export const UserViewDialog: React.FC<UserViewDialogProps> = ({
  open,
  onOpenChange,
  user,
  onEdit
}) => {
  if (!user) return null;

  // Helper to format dates
  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return "N/A";
    try {
      return format(new Date(dateStr), "PPP"); // Long date format
    } catch (e) {
      return "Invalid date";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]" aria-describedby="user-view-description">
        <div id="user-view-description" className="sr-only">Viewing detailed user information</div>
        <DialogHeader>
          <DialogTitle>User Details</DialogTitle>
          <DialogDescription>
            Detailed information for user: {user.username}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">User ID</h3>
              <p className="text-sm font-mono">{user.id}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Username</h3>
              <p>{user.username}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Full Name</h3>
              <p>{user.firstName} {user.lastName}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Email</h3>
              <p className="break-all">{user.email}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Role</h3>
              <Badge variant={user.isAdmin ? "default" : "secondary"}>
                {user.isAdmin ? "Admin" : "User"}
              </Badge>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Status</h3>
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
            </div>
          </div>
          
          {/* User Stats */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">User Activity</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-md">
              <div>
                <h4 className="text-xs font-medium text-gray-500">Registered</h4>
                <p className="text-sm">{formatDate(user.registrationDate)}</p>
              </div>
              <div>
                <h4 className="text-xs font-medium text-gray-500">Last Login</h4>
                <p className="text-sm">{formatDate(user.lastLoginDate)}</p>
              </div>
              <div>
                <h4 className="text-xs font-medium text-gray-500">Practice Sets Completed</h4>
                <p className="text-sm">{user.practiceCompletedCount || 0}</p>
              </div>
              <div>
                <h4 className="text-xs font-medium text-gray-500">Topics Completed</h4>
                <p className="text-sm">{user.topicsCompleted || 0}</p>
              </div>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button onClick={() => onEdit(user)}>
            Edit User
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};