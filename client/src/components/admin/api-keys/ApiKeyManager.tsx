import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, Key, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { queryClient } from '@/lib/queryClient';

interface ApiKey {
  id: number;
  name: string;
  keyType: string;
  keyValue: string;
  isActive: boolean;
  createdAt: string;
  lastUsedAt?: string;
}

interface ApiKeyManagerProps {
  searchTerm: string;
}

const API_TYPES = [
  { label: 'Resend Email', value: 'resend' },
  { label: 'Stripe Payments', value: 'stripe' },
  { label: 'Custom API', value: 'custom' },
];

const ApiKeyManager: React.FC<ApiKeyManagerProps> = ({ searchTerm }) => {
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [newApiKey, setNewApiKey] = useState({
    name: '',
    keyType: '',
    keyValue: '',
  });
  const [editApiKey, setEditApiKey] = useState<ApiKey | null>(null);
  const [deleteApiKeyId, setDeleteApiKeyId] = useState<number | null>(null);

  // Fetch API keys
  const { data: apiKeys = [], isLoading } = useQuery({
    queryKey: ['/api/admin/api-keys'],
    queryFn: async () => {
      const response = await fetch('/api/admin/api-keys');
      if (!response.ok) {
        throw new Error('Failed to fetch API keys');
      }
      return response.json();
    },
  });

  // Filter API keys based on search term
  const filteredApiKeys = searchTerm
    ? apiKeys.filter(
        (key: ApiKey) =>
          key.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          key.keyType.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : apiKeys;

  // Create API key mutation
  const createMutation = useMutation({
    mutationFn: async (apiKeyData: typeof newApiKey) => {
      const response = await fetch('/api/admin/api-keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiKeyData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create API key');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/api-keys'] });
      toast({
        title: 'Success',
        description: 'API key created successfully',
      });
      resetCreateForm();
      setIsCreateDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Update API key mutation
  const updateMutation = useMutation({
    mutationFn: async (apiKey: ApiKey) => {
      const response = await fetch(`/api/admin/api-keys/${apiKey.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: apiKey.name,
          isActive: apiKey.isActive,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update API key');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/api-keys'] });
      toast({
        title: 'Success',
        description: 'API key updated successfully',
      });
      setIsEditDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Delete API key mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/admin/api-keys/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete API key');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/api-keys'] });
      toast({
        title: 'Success',
        description: 'API key deleted successfully',
      });
      setIsDeleteDialogOpen(false);
      setDeleteApiKeyId(null);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Form handlers
  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newApiKey.name || !newApiKey.keyType || !newApiKey.keyValue) {
      toast({
        title: 'Error',
        description: 'All fields are required',
        variant: 'destructive',
      });
      return;
    }
    createMutation.mutate(newApiKey);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editApiKey && !editApiKey.name) {
      toast({
        title: 'Error',
        description: 'Name is required',
        variant: 'destructive',
      });
      return;
    }
    editApiKey && updateMutation.mutate(editApiKey);
  };

  const resetCreateForm = () => {
    setNewApiKey({
      name: '',
      keyType: '',
      keyValue: '',
    });
  };

  const openEditDialog = (apiKey: ApiKey) => {
    setEditApiKey(apiKey);
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (id: number) => {
    setDeleteApiKeyId(id);
    setIsDeleteDialogOpen(true);
  };

  // Get API type label from value
  const getApiTypeLabel = (value: string): string => {
    const apiType = API_TYPES.find((type) => type.value === value);
    return apiType ? apiType.label : value;
  };

  return (
    <div className="space-y-6">
      {/* Header with action buttons */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">API Keys Management</h2>
          <p className="text-sm text-muted-foreground">
            Manage API keys for external services
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)} className="flex items-center gap-2">
          <Plus size={18} />
          Add API Key
        </Button>
      </div>

      {/* API Keys Table */}
      <Card>
        <CardHeader>
          <CardTitle>API Keys</CardTitle>
          <CardDescription>
            Secure keys for integrating with external services
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-8 text-center">Loading API keys...</div>
          ) : filteredApiKeys.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              {searchTerm ? 'No API keys match your search' : 'No API keys have been created yet'}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Last Used</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredApiKeys.map((apiKey: ApiKey) => (
                  <TableRow key={apiKey.id}>
                    <TableCell className="font-medium">{apiKey.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {getApiTypeLabel(apiKey.keyType)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {apiKey.isActive ? (
                        <Badge className="bg-green-100 text-green-800 border-green-200">
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-gray-100 text-gray-800 border-gray-200">
                          <XCircle className="mr-1 h-3 w-3" />
                          Inactive
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(apiKey.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {apiKey.lastUsedAt
                        ? new Date(apiKey.lastUsedAt).toLocaleDateString()
                        : 'Never used'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(apiKey)}
                        >
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDeleteDialog(apiKey.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create API Key Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New API Key</DialogTitle>
            <DialogDescription>
              Create a new API key for external service integration
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="Stripe Production API Key"
                  value={newApiKey.name}
                  onChange={(e) =>
                    setNewApiKey({ ...newApiKey, name: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="keyType">API Type</Label>
                <Select
                  value={newApiKey.keyType}
                  onValueChange={(value) =>
                    setNewApiKey({ ...newApiKey, keyType: value })
                  }
                >
                  <SelectTrigger id="keyType">
                    <SelectValue placeholder="Select API type" />
                  </SelectTrigger>
                  <SelectContent>
                    {API_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="keyValue">API Key Value</Label>
                <div className="flex">
                  <Input
                    id="keyValue"
                    placeholder="sk_live_..."
                    type="password"
                    value={newApiKey.keyValue}
                    onChange={(e) =>
                      setNewApiKey({ ...newApiKey, keyValue: e.target.value })
                    }
                    className="flex-1"
                  />
                  <Key className="ml-2 h-5 w-5 text-gray-400 self-center" />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  This value will be encrypted and securely stored
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  resetCreateForm();
                  setIsCreateDialogOpen(false);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creating...' : 'Create API Key'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit API Key Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit API Key</DialogTitle>
            <DialogDescription>Update API key details</DialogDescription>
          </DialogHeader>
          {editApiKey && (
            <form onSubmit={handleEditSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-name">Name</Label>
                  <Input
                    id="edit-name"
                    placeholder="API Key Name"
                    value={editApiKey.name}
                    onChange={(e) =>
                      setEditApiKey({ ...editApiKey, name: e.target.value })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-type">API Type</Label>
                  <Input
                    id="edit-type"
                    value={getApiTypeLabel(editApiKey.keyType)}
                    disabled
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    API type cannot be changed after creation
                  </p>
                </div>
                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="status">Active Status</Label>
                    <Switch
                      id="status"
                      checked={editApiKey.isActive}
                      onCheckedChange={(checked) =>
                        setEditApiKey({ ...editApiKey, isActive: checked })
                      }
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {editApiKey.isActive
                      ? 'API key is active and will be loaded into environment variables'
                      : 'API key is inactive and will not be used'}
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? 'Updating...' : 'Update API Key'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete API Key Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete API Key</DialogTitle>
            <DialogDescription className="text-red-500">
              This action cannot be undone. The API key will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p>
              Are you sure you want to delete this API key? Any services using this key will
              no longer work.
            </p>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteApiKeyId && deleteMutation.mutate(deleteApiKeyId)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete API Key'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ApiKeyManager;