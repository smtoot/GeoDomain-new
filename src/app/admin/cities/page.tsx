'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { StandardPageLayout } from '@/components/layout/StandardPageLayout';
import { QueryErrorBoundary } from '@/components/error';
import { LoadingCardSkeleton } from '@/components/ui/loading/LoadingSkeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DataPagination } from '@/components/ui/data-pagination';
import { Plus, Edit, Trash2, AlertTriangle, Building2, MapPin, Search, Filter } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { usePagination } from '@/hooks/usePagination';

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
  const [selectedStateId, setSelectedStateId] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [newCity, setNewCity] = useState({
    name: '',
    stateId: '',
    population: 0,
    sortOrder: 0,
  });

  const { data: cities, refetch, error: citiesError, isLoading: citiesLoading } = trpc.adminData.getCities.useQuery({}, {
    retry: 1,
    retryDelay: 1000,
    staleTime: 30000,
  });
  const { data: states, error: statesError, isLoading: statesLoading } = trpc.adminData.getStates.useQuery(undefined, {
    retry: 1,
    retryDelay: 1000,
    staleTime: 30000,
  });

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

  const filteredCities = cities?.filter(city => {
    const matchesState = selectedStateId === 'all' || city.stateId === selectedStateId;
    const matchesSearch = !searchTerm || city.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesState && matchesSearch;
  }) || [];

  // Pagination setup
  const {
    currentPage,
    totalPages,
    itemsPerPage,
    goToPage,
    paginatedItems,
  } = usePagination({
    totalItems: filteredCities.length,
    itemsPerPage: 10,
  });

  // Get paginated cities
  const paginatedCities = paginatedItems(filteredCities);

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
            <div className="flex gap-2 justify-center">
              <Button onClick={() => refetch()} variant="outline">
                Try Again
              </Button>
              <Button onClick={() => window.location.href = '/admin/seed-data'} variant="default">
                Go to Seed Data
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show loading state with timeout
  if (citiesLoading || statesLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Loading Cities...
          </h2>
          <p className="text-gray-600 mb-4">
            {citiesLoading && statesLoading ? 'Loading cities and states data...' : 
             citiesLoading ? 'Loading cities data...' : 'Loading states data...'}
          </p>
          <p className="text-sm text-gray-500">
            If this takes too long, the database tables may not exist yet.
          </p>
          <Button 
            onClick={() => window.location.reload()} 
            variant="outline" 
            className="mt-4"
          >
            Refresh Page
          </Button>
        </div>
      </div>
    );
  }

  return (
    <QueryErrorBoundary context="Admin Cities Management Page">
      <StandardPageLayout
        title="Cities Management"
        description="Manage US cities for geographic targeting and organization"
        isLoading={citiesLoading || statesLoading}
        loadingText="Loading cities and states..."
        error={citiesError || statesError}
      >
        {/* City Stats */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Building2 className="h-4 w-4" />
            <span>{filteredCities?.length || 0} cities</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <MapPin className="h-4 w-4" />
            <span>{filteredCities?.filter(c => c.enabled).length || 0} enabled</span>
          </div>
        </div>
          
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-purple-600 hover:bg-purple-700 mt-4">
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

        {/* Search and Filter Section */}
      <div className="bg-white rounded-lg border p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search cities by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <Label htmlFor="state-filter" className="text-sm font-medium">State:</Label>
              <Select value={selectedStateId} onValueChange={setSelectedStateId}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All states" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All states</SelectItem>
                  {states?.map((state) => (
                    <SelectItem key={state.id} value={state.id}>
                      {state.name} ({state.abbreviation})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Cities Table */}
      <Card>
        <CardHeader>
          <CardTitle>Cities</CardTitle>
          <CardDescription>
            Manage your US cities
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredCities.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                <Building2 className="h-6 w-6 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No cities found</h3>
              <p className="text-gray-500 mb-4">
                {searchTerm || selectedStateId !== 'all' 
                  ? 'Try adjusting your search or filter criteria.' 
                  : 'Get started by creating your first city.'}
              </p>
              {!searchTerm && selectedStateId === 'all' && (
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First City
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>State</TableHead>
                  <TableHead>Population</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sort Order</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedCities.map((city) => (
                  <TableRow key={city.id}>
                    <TableCell className="font-medium">{city.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          {city.state.abbreviation}
                        </Badge>
                        <span className="text-sm text-gray-600">{city.state.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {city.population ? city.population.toLocaleString() : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={city.enabled ? "default" : "secondary"}
                        className={city.enabled ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}
                      >
                        {city.enabled ? "Enabled" : "Disabled"}
                      </Badge>
                    </TableCell>
                    <TableCell>{city.sortOrder}</TableCell>
                    <TableCell>
                      {new Date(city.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingCity(city)}
                          className="hover:bg-purple-50 hover:border-purple-200"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteCity(city.id)}
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
        {filteredCities.length > 0 && (
          <div className="px-6 pb-4">
            <DataPagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredCities.length}
              itemsPerPage={itemsPerPage}
              onPageChange={goToPage}
            />
          </div>
        )}
      </Card>

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
      </StandardPageLayout>
    </QueryErrorBoundary>
  );
}