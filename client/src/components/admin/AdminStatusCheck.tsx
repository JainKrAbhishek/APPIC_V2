import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { apiRequest } from '@/lib/queryClient';
import { toast } from '@/hooks/use-toast';
import { Loader2, AlertCircle, CheckCircle, Settings } from 'lucide-react';

interface AdminStatusCheckProps {
  onStatusChange?: (isAdmin: boolean, userData?: any) => void;
}

const AdminStatusCheck: React.FC<AdminStatusCheckProps> = ({ onStatusChange }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    const checkAdminStatus = async () => {
      setIsLoading(true);
      try {
        // First check user data
        const userResponse = await fetch('/api/auth/user', {
          credentials: 'include'
        });
        
        if (!userResponse.ok) {
          setError(`User fetch failed: ${userResponse.status} ${userResponse.statusText}`);
          setIsAdmin(false);
          onStatusChange?.(false);
          return;
        }
        
        const userData = await userResponse.json();
        setUserData(userData);
        
        if (!userData.success || !userData.user) {
          setError('No user data received');
          setIsAdmin(false);
          onStatusChange?.(false);
          return;
        }
        
        // Log user data to debug
        console.log('Current user data:', {
          id: userData.user.id,
          username: userData.user.username,
          isAdmin: userData.user.isAdmin,
          userType: userData.user.userType
        });
        
        // Now try to access an admin-only endpoint
        try {
          const response = await apiRequest('/api/admin/stats');
          // If request succeeds, user has admin access
          setIsAdmin(true);
          setError(null);
          onStatusChange?.(true, userData.user);
        } catch (adminError: any) {
          console.error('Admin access check failed:', adminError);
          setError(`Admin check failed: ${adminError?.message || 'Unknown error'}`);
          setIsAdmin(false);
          onStatusChange?.(false, userData.user);
        }
      } catch (error: any) {
        console.error('Admin status check error:', error);
        setError(`Error: ${error?.message || 'Unknown error'}`);
        setIsAdmin(false);
        onStatusChange?.(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminStatus();
  }, [onStatusChange]);

  const updateAdminStatus = async () => {
    if (!userData?.user?.id) {
      toast({
        title: 'Error',
        description: 'User ID not found',
        variant: 'destructive'
      });
      return;
    }
    
    try {
      // Create a direct console message with instructions
      console.log('To update admin status, run the following SQL command:');
      console.log(`UPDATE users SET is_admin = true, user_type = 'admin' WHERE id = ${userData.user.id};`);
      
      toast({
        title: 'Admin Update Instructions',
        description: 'Check the console for instructions on how to update admin status',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: `Failed to set up admin update: ${error?.message || 'Unknown error'}`,
        variant: 'destructive'
      });
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Checking Admin Status
          </CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center py-6">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Settings className="mr-2 h-5 w-5" />
          Admin Access Status
        </CardTitle>
        <CardDescription>
          {isAdmin 
            ? 'You have administrator access in this application' 
            : 'You do not have administrator access'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error ? (
          <div className="bg-destructive/10 p-4 rounded-md flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-destructive">Error Details</p>
              <p className="text-sm mt-1 text-muted-foreground">{error}</p>
            </div>
          </div>
        ) : isAdmin ? (
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-md flex items-start space-x-3">
            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-green-800 dark:text-green-500">Admin Access Verified</p>
              <p className="text-sm mt-1 text-muted-foreground">
                You have full administrative privileges in this application.
              </p>
              {userData?.user && (
                <div className="mt-3 text-xs text-muted-foreground">
                  <p><strong>User ID:</strong> {userData.user.id}</p>
                  <p><strong>Username:</strong> {userData.user.username}</p>
                  <p><strong>Admin Flag:</strong> {userData.user.isAdmin ? 'True' : 'False'}</p>
                  <p><strong>User Type:</strong> {userData.user.userType || 'Not set'}</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-md flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-amber-800 dark:text-amber-500">Admin Access Not Available</p>
              <p className="text-sm mt-1 text-muted-foreground">
                You need administrator privileges to access admin features.
              </p>
              {userData?.user && (
                <div className="mt-3 text-xs text-muted-foreground">
                  <p><strong>User ID:</strong> {userData.user.id}</p>
                  <p><strong>Username:</strong> {userData.user.username}</p>
                  <p><strong>Admin Flag:</strong> {userData.user.isAdmin ? 'True' : 'False'}</p>
                  <p><strong>User Type:</strong> {userData.user.userType || 'Not set'}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-end space-x-2">
        <Button 
          variant="outline" 
          onClick={() => window.location.reload()}
        >
          Refresh Status
        </Button>
        {!isAdmin && (
          <Button onClick={updateAdminStatus}>
            Get Admin Update Instructions
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default AdminStatusCheck;