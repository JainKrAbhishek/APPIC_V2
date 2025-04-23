import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { User } from "@shared/schema";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ContentLoader } from "@/components/ui/spinner";
import { UserPlus } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

// Import components from the users subfolder
import {
  UsersTableDesktop,
  UsersCardsMobile,
  UserEditDialog,
  UserCreateDialog,
  PasswordResetDialog,
  UserViewDialog,
  UserFilters,
  EmptyUserState,
  NoMatchingUsersState,
  UserWithStats,
  UserEditFormValues,
  UserCreateFormValues,
  PasswordResetFormValues,
  userEditSchema,
  userCreateSchema,
  passwordResetSchema
} from "./";

interface UsersManagerProps {
  searchTerm?: string;
}

const UsersManager: React.FC<UsersManagerProps> = ({ searchTerm: externalSearchTerm }) => {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  const [dialogType, setDialogType] = useState<'edit' | 'create' | 'reset' | 'view'>('edit');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserWithStats | null>(null);
  const [searchTerm, setSearchTerm] = useState(externalSearchTerm || "");
  const [filterRole, setFilterRole] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "admins" | "students">("all");
  
  // Update search term when external prop changes
  useEffect(() => {
    if (externalSearchTerm !== undefined) {
      setSearchTerm(externalSearchTerm);
    }
  }, [externalSearchTerm]);

  // Forms
  const userEditForm = useForm<UserEditFormValues>({
    resolver: zodResolver(userEditSchema),
    defaultValues: {
      username: "",
      email: "",
      firstName: "",
      lastName: "",
      isAdmin: false,
      isActive: true
    },
  });

  const userCreateForm = useForm<UserCreateFormValues>({
    resolver: zodResolver(userCreateSchema),
    defaultValues: {
      username: "",
      email: "",
      firstName: "",
      lastName: "",
      password: "",
      confirmPassword: "",
      isAdmin: false,
      isActive: true
    },
  });

  const passwordResetForm = useForm<PasswordResetFormValues>({
    resolver: zodResolver(passwordResetSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: ""
    },
  });

  // Fetch users data
  const { data: usersData, isLoading: loadingUsers } = useQuery<User[]>({
    queryKey: ["/api/users"],
    select: (data) => {
      // Convert to UserWithStats with mock data
      return data.map(user => ({
        ...user,
        practiceCompletedCount: Math.floor(Math.random() * 30),
        lastLoginDate: new Date(Date.now() - Math.floor(Math.random() * 10) * 86400000).toISOString(),
        topicsCompleted: Math.floor(Math.random() * 15),
        registrationDate: new Date(Date.now() - Math.floor(Math.random() * 60) * 86400000).toISOString(),
        accountStatus: Math.random() > 0.2 ? 'active' : 'inactive'
      } as UserWithStats));
    }
  });

  // Mutations
  const updateUserMutation = useMutation({
    mutationFn: async (data: { id: number; userData: UserEditFormValues }) => {
      const response = await apiRequest(`/api/user/${data.id}`, {
        method: "PATCH", 
        data: data.userData
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Success",
        description: "User updated successfully"
      });
      setDialogOpen(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update user",
        variant: "destructive"
      });
    },
  });

  const createUserMutation = useMutation({
    mutationFn: async (data: UserCreateFormValues) => {
      const response = await apiRequest("/api/users", {
        method: "POST",
        data: {
          ...data,
          confirmPassword: undefined // Don't send this to API
        }
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Success",
        description: "New user created successfully",
      });
      setDialogOpen(false);
      userCreateForm.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create user",
        variant: "destructive",
      });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (data: { id: number; password: string }) => {
      const response = await apiRequest(`/api/user/${data.id}/reset-password`, {
        method: "POST",
        data: { newPassword: data.password }
      });
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Password has been reset successfully",
      });
      setDialogOpen(false);
      passwordResetForm.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to reset password",
        variant: "destructive",
      });
    },
  });

  const toggleUserStatusMutation = useMutation({
    mutationFn: async (data: { id: number; isActive: boolean }) => {
      const response = await apiRequest(`/api/user/${data.id}/status`, {
        method: "PATCH",
        data: { isActive: data.isActive }
      });
      return response;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Success",
        description: `User ${variables.isActive ? "activated" : "deactivated"} successfully`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update user status",
        variant: "destructive",
      });
    },
  });

  // Event handlers
  const handleEdit = (user: UserWithStats) => {
    setEditingUser(user);
    setDialogType('edit');
    userEditForm.reset({
      username: user.username,
      email: user.email,
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      isAdmin: user.isAdmin || false,
      isActive: user.accountStatus === 'active'
    });
    setDialogOpen(true);
  };

  const handleViewDetails = (user: UserWithStats) => {
    setEditingUser(user);
    setDialogType('view');
    setDialogOpen(true);
  };

  const handleCreateUser = () => {
    setDialogType('create');
    userCreateForm.reset({
      username: "",
      email: "",
      firstName: "",
      lastName: "",
      password: "",
      confirmPassword: "",
      isAdmin: false,
      isActive: true
    });
    setDialogOpen(true);
  };

  const handleResetPassword = (user: UserWithStats) => {
    setEditingUser(user);
    setDialogType('reset');
    passwordResetForm.reset({
      newPassword: "",
      confirmPassword: ""
    });
    setDialogOpen(true);
  };

  const handleToggleUserStatus = (user: UserWithStats) => {
    const newStatus = user.accountStatus !== 'active';
    toggleUserStatusMutation.mutate({
      id: user.id,
      isActive: newStatus
    });
  };

  const onSubmitEditUser = (data: UserEditFormValues) => {
    if (!editingUser) return;
    updateUserMutation.mutate({
      id: editingUser.id,
      userData: data
    });
  };

  const onSubmitCreateUser = (data: UserCreateFormValues) => {
    createUserMutation.mutate(data);
  };

  const onSubmitResetPassword = (data: PasswordResetFormValues) => {
    if (!editingUser) return;
    resetPasswordMutation.mutate({
      id: editingUser.id,
      password: data.newPassword
    });
  };

  // Filter users
  const filteredUsers = usersData?.filter((user: UserWithStats) => {
    // Apply search filter
    const matchesSearch = 
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.firstName && user.firstName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.lastName && user.lastName.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Apply role filter
    const matchesRole = !filterRole || 
      (filterRole === 'admin' && user.isAdmin) || 
      (filterRole === 'user' && !user.isAdmin);
    
    // Apply status filter
    const matchesStatus = !filterStatus || user.accountStatus === filterStatus;
    
    // Apply tab filter
    const matchesTab = 
      activeTab === 'all' || 
      (activeTab === 'admins' && user.isAdmin) || 
      (activeTab === 'students' && !user.isAdmin);
    
    return matchesSearch && matchesRole && matchesStatus && matchesTab;
  }) || [];

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <CardTitle className="text-xl md:text-2xl">User Management</CardTitle>
          <CardDescription className="text-sm text-muted-foreground mt-1">
            Manage user accounts and permissions in the GRE preparation platform
          </CardDescription>
        </div>
        <Button onClick={handleCreateUser}>
          <UserPlus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <UserFilters 
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          filterRole={filterRole}
          onRoleFilterChange={setFilterRole}
          filterStatus={filterStatus}
          onStatusFilterChange={setFilterStatus}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
        
        {/* Users list */}
        <div className="mt-6">
          {loadingUsers ? (
            <ContentLoader className="h-60" />
          ) : usersData?.length === 0 ? (
            <EmptyUserState />
          ) : filteredUsers.length === 0 ? (
            <NoMatchingUsersState />
          ) : isMobile ? (
            <UsersCardsMobile 
              users={filteredUsers}
              onEdit={handleEdit}
              onView={handleViewDetails}
              onResetPassword={handleResetPassword}
              onToggleStatus={handleToggleUserStatus}
            />
          ) : (
            <UsersTableDesktop 
              users={filteredUsers}
              onEdit={handleEdit}
              onView={handleViewDetails}
              onResetPassword={handleResetPassword}
              onToggleStatus={handleToggleUserStatus}
            />
          )}
        </div>
      </CardContent>

      {/* Dialogs */}
      {dialogType === 'edit' && (
        <UserEditDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          title="Edit User"
          description={`Edit details for user: ${editingUser?.username}`}
          form={userEditForm}
          onSubmit={onSubmitEditUser}
          isSubmitting={updateUserMutation.isPending}
        />
      )}
      
      {dialogType === 'create' && (
        <UserCreateDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          form={userCreateForm}
          onSubmit={onSubmitCreateUser}
          isSubmitting={createUserMutation.isPending}
        />
      )}
      
      {dialogType === 'reset' && (
        <PasswordResetDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          form={passwordResetForm}
          onSubmit={onSubmitResetPassword}
          isSubmitting={resetPasswordMutation.isPending}
          user={editingUser}
        />
      )}
      
      {dialogType === 'view' && (
        <UserViewDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          user={editingUser}
          onEdit={handleEdit}
        />
      )}
    </Card>
  );
};

export default UsersManager;