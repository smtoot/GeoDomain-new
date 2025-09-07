'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DataPagination } from '@/components/ui/data-pagination';
import { Plus, Edit, Trash2, MapPin, Users, Search, Filter, Flag } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { usePagination } from '@/hooks/usePagination';

interface State {
  id: string;
  name: string;
  abbreviation: string;
  population?: number;
  enabled: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export default function StatesManagementPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingState, setEditingState] = useState<State | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'enabled' | 'disabled'>('all');
  const [newState, setNewState] = useState({
    name: '',
    abbreviation: '',
    population: 0,
    sortOrder: 0,
  });

  const { data: states, refetch } = trpc.adminData.getStates.useQuery();
  const createStateMutation = trpc.adminData.createState.useMutation();
  const updateStateMutation = trpc.adminData.updateState.useMutation();
  const deleteStateMutation = trpc.adminData.deleteState.useMutation();

  const handleCreateState = async () => {
    try {
      await createStateMutation.mutateAsync({
        name: newState.name,
        abbreviation: newState.abbreviation.toUpperCase(),
        population: newState.population || undefined,
        sortOrder: newState.sortOrder,
      });
      
      toast.success('State created successfully');
      setIsCreateDialogOpen(false);
      setNewState({ name: '', abbreviation: '', population: 0, sortOrder: 0 });
      refetch();
    } catch (error) {
      toast.error('Failed to create state');
    }
  };

  const handleUpdateState = async (state: State) => {
    try {
      await updateStateMutation.mutateAsync({
        id: state.id,
        name: state.name,
        abbreviation: state.abbreviation,
        population: state.population,
        enabled: state.enabled,
        sortOrder: state.sortOrder,
      });
      
      toast.success('State updated successfully');
      setEditingState(null);
      refetch();
    } catch (error) {
      toast.error('Failed to update state');
    }
  };

  const handleDeleteState = async (id: string) => {
    if (!confirm('Are you sure you want to delete this state?')) return;
    
    try {
      await deleteStateMutation.mutateAsync({ id });
      toast.success('State deleted successfully');
      refetch();
    } catch (error) {
      toast.error('Failed to delete state');
    }
  };

  // Filter states based on search and status
  const filteredStates = states?.filter(state => {
    const matchesSearch = state.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         state.abbreviation.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'enabled' && state.enabled) ||
                         (statusFilter === 'disabled' && !state.enabled);
    
    return matchesSearch && matchesStatus;
  }) || [];

  // Pagination setup
  const {
    currentPage,
    totalPages,
    itemsPerPage,
    goToPage,
    paginatedItems,
  } = usePagination({
    totalItems: filteredStates.length,
    itemsPerPage: 10,
  });

  // Get paginated states
  const paginatedStates = paginatedItems(filteredStates);

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6 border border-green-100">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <MapPin className="h-6 w-6 text-green-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">States Management</h1>
            </div>
            <p className="text-gray-600">Manage US states for geographic targeting and organization</p>
            <div className="flex items-center gap-4 mt-3">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Flag className="h-4 w-4" />
                <span>{filteredStates.length} states</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Users className="h-4 w-4" />
                <span>{filteredStates.filter(s => s.enabled).length} enabled</span>
              </div>
            </div>
          </div>
        </div>
          
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-green-600 hover:bg-green-700 mt-4">
              <Plus className="h-4 w-4 mr-2" />
              Add State
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New State</DialogTitle>
              <DialogDescription>
                Add a new US state for geographic targeting.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">State Name</Label>
                <Input
                  id="name"
                  value={newState.name}
                  onChange={(e) => setNewState(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Texas"
                />
              </div>
              
              <div>
                <Label htmlFor="abbreviation">Abbreviation</Label>
                <Input
                  id="abbreviation"
                  value={newState.abbreviation}
                  onChange={(e) => setNewState(prev => ({ ...prev, abbreviation: e.target.value }))}
                  placeholder="e.g., TX"
                  maxLength={2}
                />
              </div>
              
              <div>
                <Label htmlFor="population">Population (Optional)</Label>
                <Input
                  id="population"
                  type="number"
                  value={newState.population}
                  onChange={(e) => setNewState(prev => ({ ...prev, population: parseInt(e.target.value) || 0 }))}
                  placeholder="e.g., 30000000"
                />
              </div>
              
              <div>
                <Label htmlFor="sortOrder">Sort Order</Label>
                <Input
                  id="sortOrder"
                  type="number"
                  value={newState.sortOrder}
                  onChange={(e) => setNewState(prev => ({ ...prev, sortOrder: parseInt(e.target.value) || 0 }))}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateState} disabled={createStateMutation.isLoading}>
                {createStateMutation.isLoading ? 'Creating...' : 'Create State'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filter Section */}
      <div className="bg-white rounded-lg border p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search states by name or abbreviation..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | 'enabled' | 'disabled')}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="all">All Status</option>
                <option value="enabled">Enabled Only</option>
                <option value="disabled">Disabled Only</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* States Table */}
      <Card>
        <CardHeader>
          <CardTitle>States</CardTitle>
          <CardDescription>
            Manage your US states
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredStates.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                <MapPin className="h-6 w-6 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No states found</h3>
              <p className="text-gray-500 mb-4">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Try adjusting your search or filter criteria.' 
                  : 'Get started by creating your first state.'}
              </p>
              {!searchTerm && statusFilter === 'all' && (
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First State
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Abbreviation</TableHead>
                  <TableHead>Population</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sort Order</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedStates.map((state) => (
                  <TableRow key={state.id}>
                    <TableCell className="font-medium">{state.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        {state.abbreviation}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {state.population ? state.population.toLocaleString() : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={state.enabled ? "default" : "secondary"}
                        className={state.enabled ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}
                      >
                        {state.enabled ? "Enabled" : "Disabled"}
                      </Badge>
                    </TableCell>
                    <TableCell>{state.sortOrder}</TableCell>
                    <TableCell>
                      {new Date(state.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingState(state)}
                          className="hover:bg-green-50 hover:border-green-200"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteState(state.id)}
                          className="hover:bg-red-50 hover:border-red-200 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
        
        {/* Pagination */}
        {filteredStates.length > 0 && (
          <div className="px-6 pb-4">
            <DataPagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredStates.length}
              itemsPerPage={itemsPerPage}
              onPageChange={goToPage}
            />
          </div>
        )}
      </Card>

      {/* Edit Dialog */}
      {editingState && (
        <Dialog open={!!editingState} onOpenChange={() => setEditingState(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit State</DialogTitle>
              <DialogDescription>
                Update the state information.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">State Name</Label>
                <Input
                  id="edit-name"
                  value={editingState.name}
                  onChange={(e) => setEditingState(prev => prev ? { ...prev, name: e.target.value } : null)}
                />
              </div>
              
              <div>
                <Label htmlFor="edit-abbreviation">Abbreviation</Label>
                <Input
                  id="edit-abbreviation"
                  value={editingState.abbreviation}
                  onChange={(e) => setEditingState(prev => prev ? { ...prev, abbreviation: e.target.value } : null)}
                  maxLength={2}
                />
              </div>
              
              <div>
                <Label htmlFor="edit-population">Population (Optional)</Label>
                <Input
                  id="edit-population"
                  type="number"
                  value={editingState.population || ''}
                  onChange={(e) => setEditingState(prev => prev ? { ...prev, population: parseInt(e.target.value) || undefined } : null)}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-enabled"
                  checked={editingState.enabled}
                  onCheckedChange={(checked) => setEditingState(prev => prev ? { ...prev, enabled: checked } : null)}
                />
                <Label htmlFor="edit-enabled">Enabled</Label>
              </div>
              
              <div>
                <Label htmlFor="edit-sortOrder">Sort Order</Label>
                <Input
                  id="edit-sortOrder"
                  type="number"
                  value={editingState.sortOrder}
                  onChange={(e) => setEditingState(prev => prev ? { ...prev, sortOrder: parseInt(e.target.value) || 0 } : null)}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingState(null)}>
                Cancel
              </Button>
              <Button onClick={() => handleUpdateState(editingState)} disabled={updateStateMutation.isLoading}>
                {updateStateMutation.isLoading ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}