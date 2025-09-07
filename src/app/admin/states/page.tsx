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
import { Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">States Management</h1>
          <p className="text-gray-600">Manage US states for geographic targeting</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {states?.map((state) => (
          <Card key={state.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {state.name}
                    <Badge variant="outline">{state.abbreviation}</Badge>
                    <Badge variant={state.enabled ? "default" : "secondary"}>
                      {state.enabled ? "Enabled" : "Disabled"}
                    </Badge>
                  </CardTitle>
                  {state.population && (
                    <CardDescription>
                      Population: {state.population.toLocaleString()}
                    </CardDescription>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingState(state)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteState(state.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>

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
