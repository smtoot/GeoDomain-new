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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit, Trash2, AlertTriangle } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface City {
  id: string;
  name: string;
  stateId: string;
  population?: number;
  enabled: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
  state: {
    id: string;
    name: string;
    abbreviation: string;
  };
}

export default function CitiesManagementPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingCity, setEditingCity] = useState<City | null>(null);
  const [selectedStateId, setSelectedStateId] = useState<string>('');
  const [newCity, setNewCity] = useState({
    name: '',
    stateId: '',
    population: 0,
    sortOrder: 0,
  });

  const { data: cities, refetch, error: citiesError, isLoading: citiesLoading } = trpc.adminData.getCities.useQuery({});
  const { data: states, error: statesError, isLoading: statesLoading } = trpc.adminData.getStates.useQuery();
  const createCityMutation = trpc.adminData.createCity.useMutation();
  const updateCityMutation = trpc.adminData.updateCity.useMutation();
  const deleteCityMutation = trpc.adminData.deleteCity.useMutation();

  const handleCreateCity = async () => {
    try {
      await createCityMutation.mutateAsync({
        name: newCity.name,
        stateId: newCity.stateId,
        population: newCity.population || undefined,
        sortOrder: newCity.sortOrder,
      });
      
      toast.success('City created successfully');
      setIsCreateDialogOpen(false);
      setNewCity({ name: '', stateId: '', population: 0, sortOrder: 0 });
      refetch();
    } catch (error) {
      toast.error('Failed to create city');
    }
  };

  const handleUpdateCity = async (city: City) => {
    try {
      await updateCityMutation.mutateAsync({
        id: city.id,
        name: city.name,
        stateId: city.stateId,
        population: city.population,
        enabled: city.enabled,
        sortOrder: city.sortOrder,
      });
      
      toast.success('City updated successfully');
      setEditingCity(null);
      refetch();
    } catch (error) {
      toast.error('Failed to update city');
    }
  };

  const handleDeleteCity = async (id: string) => {
    if (!confirm('Are you sure you want to delete this city?')) return;
    
    try {
      await deleteCityMutation.mutateAsync({ id });
      toast.success('City deleted successfully');
      refetch();
    } catch (error) {
      toast.error('Failed to delete city');
    }
  };

  const filteredCities = selectedStateId 
    ? cities?.filter(city => city.stateId === selectedStateId)
    : cities;

  // Show error state if query failed
  if (citiesError || statesError) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Error Loading Cities
          </h2>
          <p className="text-gray-600 mb-4">
            {citiesError?.message || statesError?.message || 'Failed to load cities. The database tables may not exist yet.'}
          </p>
          <div className="space-y-2">
            <p className="text-sm text-gray-500">
              Make sure you have run the database migration steps in the Seed Data page.
            </p>
            <Button onClick={() => refetch()} variant="outline">
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show loading state
  if (citiesLoading || statesLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Cities Management</h1>
          <p className="text-gray-600">Manage US cities for geographic targeting</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add City
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New City</DialogTitle>
              <DialogDescription>
                Add a new US city for geographic targeting.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">City Name</Label>
                <Input
                  id="name"
                  value={newCity.name}
                  onChange={(e) => setNewCity(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Houston"
                />
              </div>
              
              <div>
                <Label htmlFor="state">State</Label>
                <Select value={newCity.stateId} onValueChange={(value) => setNewCity(prev => ({ ...prev, stateId: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a state" />
                  </SelectTrigger>
                  <SelectContent>
                    {states?.map((state) => (
                      <SelectItem key={state.id} value={state.id}>
                        {state.name} ({state.abbreviation})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="population">Population (Optional)</Label>
                <Input
                  id="population"
                  type="number"
                  value={newCity.population}
                  onChange={(e) => setNewCity(prev => ({ ...prev, population: parseInt(e.target.value) || 0 }))}
                  placeholder="e.g., 2300000"
                />
              </div>
              
              <div>
                <Label htmlFor="sortOrder">Sort Order</Label>
                <Input
                  id="sortOrder"
                  type="number"
                  value={newCity.sortOrder}
                  onChange={(e) => setNewCity(prev => ({ ...prev, sortOrder: parseInt(e.target.value) || 0 }))}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateCity} disabled={createCityMutation.isLoading}>
                {createCityMutation.isLoading ? 'Creating...' : 'Create City'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter by State */}
      <div className="flex gap-4 items-center">
        <Label htmlFor="state-filter">Filter by State:</Label>
        <Select value={selectedStateId} onValueChange={setSelectedStateId}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="All states" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All states</SelectItem>
            {states?.map((state) => (
              <SelectItem key={state.id} value={state.id}>
                {state.name} ({state.abbreviation})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredCities?.map((city) => (
          <Card key={city.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {city.name}
                    <Badge variant="outline">{city.state.abbreviation}</Badge>
                    <Badge variant={city.enabled ? "default" : "secondary"}>
                      {city.enabled ? "Enabled" : "Disabled"}
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    {city.state.name}
                    {city.population && ` • Population: ${city.population.toLocaleString()}`}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingCity(city)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteCity(city.id)}
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
      {editingCity && (
        <Dialog open={!!editingCity} onOpenChange={() => setEditingCity(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit City</DialogTitle>
              <DialogDescription>
                Update the city information.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">City Name</Label>
                <Input
                  id="edit-name"
                  value={editingCity.name}
                  onChange={(e) => setEditingCity(prev => prev ? { ...prev, name: e.target.value } : null)}
                />
              </div>
              
              <div>
                <Label htmlFor="edit-state">State</Label>
                <Select 
                  value={editingCity.stateId} 
                  onValueChange={(value) => setEditingCity(prev => prev ? { ...prev, stateId: value } : null)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a state" />
                  </SelectTrigger>
                  <SelectContent>
                    {states?.map((state) => (
                      <SelectItem key={state.id} value={state.id}>
                        {state.name} ({state.abbreviation})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="edit-population">Population (Optional)</Label>
                <Input
                  id="edit-population"
                  type="number"
                  value={editingCity.population || ''}
                  onChange={(e) => setEditingCity(prev => prev ? { ...prev, population: parseInt(e.target.value) || undefined } : null)}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-enabled"
                  checked={editingCity.enabled}
                  onCheckedChange={(checked) => setEditingCity(prev => prev ? { ...prev, enabled: checked } : null)}
                />
                <Label htmlFor="edit-enabled">Enabled</Label>
              </div>
              
              <div>
                <Label htmlFor="edit-sortOrder">Sort Order</Label>
                <Input
                  id="edit-sortOrder"
                  type="number"
                  value={editingCity.sortOrder}
                  onChange={(e) => setEditingCity(prev => prev ? { ...prev, sortOrder: parseInt(e.target.value) || 0 } : null)}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingCity(null)}>
                Cancel
              </Button>
              <Button onClick={() => handleUpdateCity(editingCity)} disabled={updateCityMutation.isLoading}>
                {updateCityMutation.isLoading ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
