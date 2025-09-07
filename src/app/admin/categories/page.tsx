'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Save, X, AlertTriangle, Tag, Building2, Globe, Search, Filter } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Category {
  id: string;
  name: string;
  description: string;
  examples: string; // Changed from array to string
  industries: string; // Changed from array to string
  enabled: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export default function CategoriesManagementPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'enabled' | 'disabled'>('all');
  const [newCategory, setNewCategory] = useState({
    name: '',
    description: '',
    examples: '', // Changed from array to string
    industries: '', // Changed from array to string
    sortOrder: 0,
  });

  const { data: categories, refetch, error: categoriesError, isLoading: categoriesLoading } = trpc.adminData.getCategories.useQuery();
  const createCategoryMutation = trpc.adminData.createCategory.useMutation();
  const updateCategoryMutation = trpc.adminData.updateCategory.useMutation();
  const deleteCategoryMutation = trpc.adminData.deleteCategory.useMutation();

  const handleCreateCategory = async () => {
    try {
      await createCategoryMutation.mutateAsync({
        name: newCategory.name,
        description: newCategory.description,
        examples: newCategory.examples, // Changed from array to string
        industries: newCategory.industries, // Changed from array to string
        sortOrder: newCategory.sortOrder,
      });
      
      toast.success('Category created successfully');
      setIsCreateDialogOpen(false);
      setNewCategory({ name: '', description: '', examples: '', industries: '', sortOrder: 0 });
      refetch();
    } catch (error) {
      toast.error('Failed to create category');
    }
  };

  const handleUpdateCategory = async (category: Category) => {
    try {
      await updateCategoryMutation.mutateAsync({
        id: category.id,
        name: category.name,
        description: category.description,
        examples: category.examples, // Already string
        industries: category.industries, // Already string
        enabled: category.enabled,
        sortOrder: category.sortOrder,
      });
      
      toast.success('Category updated successfully');
      setEditingCategory(null);
      refetch();
    } catch (error) {
      toast.error('Failed to update category');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    
    try {
      await deleteCategoryMutation.mutateAsync({ id });
      toast.success('Category deleted successfully');
      refetch();
    } catch (error) {
      toast.error('Failed to delete category');
    }
  };

  // Filter categories based on search and status
  const filteredCategories = categories?.filter(category => {
    const matchesSearch = category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         category.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         category.examples.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         category.industries.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'enabled' && category.enabled) ||
                         (statusFilter === 'disabled' && !category.enabled);
    
    return matchesSearch && matchesStatus;
  }) || [];

  // Show error state if query failed
  if (categoriesError) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Error Loading Categories
          </h2>
          <p className="text-gray-600 mb-4">
            {categoriesError.message || 'Failed to load categories. The database tables may not exist yet.'}
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
  if (categoriesLoading) {
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
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-100">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Tag className="h-6 w-6 text-blue-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">Categories Management</h1>
            </div>
            <p className="text-gray-600">Manage domain categories for geographic targeting and organization</p>
            <div className="flex items-center gap-4 mt-3">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Globe className="h-4 w-4" />
                <span>{filteredCategories.length} categories</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Building2 className="h-4 w-4" />
                <span>{filteredCategories.filter(c => c.enabled).length} enabled</span>
              </div>
            </div>
          </div>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Category
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Category</DialogTitle>
              <DialogDescription>
                Add a new domain category with examples and industries.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Category Name</Label>
                <Input
                  id="name"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Hotels & Accommodation"
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newCategory.description}
                  onChange={(e) => setNewCategory(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe what this category covers..."
                  rows={3}
                />
              </div>
              
              <div>
                <Label>Examples</Label>
                <Textarea
                  value={newCategory.examples}
                  onChange={(e) => setNewCategory(prev => ({ ...prev, examples: e.target.value }))}
                  placeholder="Enter examples separated by commas, e.g., TexasHotels.com, CaliforniaHotels.com"
                  rows={3}
                />
              </div>
              
              <div>
                <Label>Industries</Label>
                <Textarea
                  value={newCategory.industries}
                  onChange={(e) => setNewCategory(prev => ({ ...prev, industries: e.target.value }))}
                  placeholder="Enter industries separated by commas, e.g., Hospitality, Tourism, Travel"
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="sortOrder">Sort Order</Label>
                <Input
                  id="sortOrder"
                  type="number"
                  value={newCategory.sortOrder}
                  onChange={(e) => setNewCategory(prev => ({ ...prev, sortOrder: parseInt(e.target.value) || 0 }))}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateCategory} disabled={createCategoryMutation.isLoading}>
                {createCategoryMutation.isLoading ? 'Creating...' : 'Create Category'}
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
                placeholder="Search categories by name, description, examples, or industries..."
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
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="enabled">Enabled Only</option>
                <option value="disabled">Disabled Only</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        {filteredCategories.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
              <Tag className="h-6 w-6 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No categories found</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search or filter criteria.' 
                : 'Get started by creating your first category.'}
            </p>
            {!searchTerm && statusFilter === 'all' && (
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Category
              </Button>
            )}
          </div>
        ) : (
          filteredCategories.map((category) => (
          <Card key={category.id} className="hover:shadow-md transition-shadow duration-200">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <Tag className="h-4 w-4 text-blue-600" />
                    </div>
                    <CardTitle className="text-lg">{category.name}</CardTitle>
                    <Badge 
                      variant={category.enabled ? "default" : "secondary"}
                      className={category.enabled ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}
                    >
                      {category.enabled ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>
                  <CardDescription className="text-gray-600 mb-3">{category.description}</CardDescription>
                  
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Examples:</Label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {category.examples.split(',').map((example, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {example.trim()}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Industries:</Label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {category.industries.split(',').map((industry, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {industry.trim()}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingCategory(category)}
                    className="hover:bg-blue-50 hover:border-blue-200"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteCategory(category.id)}
                    className="hover:bg-red-50 hover:border-red-200 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>
          ))
        )}
      </div>

      {/* Edit Dialog */}
      {editingCategory && (
        <Dialog open={!!editingCategory} onOpenChange={() => setEditingCategory(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Category</DialogTitle>
              <DialogDescription>
                Update the category information.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Category Name</Label>
                <Input
                  id="edit-name"
                  value={editingCategory.name}
                  onChange={(e) => setEditingCategory(prev => prev ? { ...prev, name: e.target.value } : null)}
                />
              </div>
              
              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editingCategory.description}
                  onChange={(e) => setEditingCategory(prev => prev ? { ...prev, description: e.target.value } : null)}
                  rows={3}
                />
              </div>
              
              <div>
                <Label>Examples</Label>
                <Textarea
                  value={editingCategory.examples}
                  onChange={(e) => setEditingCategory(prev => prev ? { ...prev, examples: e.target.value } : null)}
                  placeholder="Enter examples separated by commas, e.g., TexasHotels.com, CaliforniaHotels.com"
                  rows={3}
                />
              </div>
              
              <div>
                <Label>Industries</Label>
                <Textarea
                  value={editingCategory.industries}
                  onChange={(e) => setEditingCategory(prev => prev ? { ...prev, industries: e.target.value } : null)}
                  placeholder="Enter industries separated by commas, e.g., Hospitality, Tourism, Travel"
                  rows={3}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-enabled"
                  checked={editingCategory.enabled}
                  onCheckedChange={(checked) => setEditingCategory(prev => prev ? { ...prev, enabled: checked } : null)}
                />
                <Label htmlFor="edit-enabled">Enabled</Label>
              </div>
              
              <div>
                <Label htmlFor="edit-sortOrder">Sort Order</Label>
                <Input
                  id="edit-sortOrder"
                  type="number"
                  value={editingCategory.sortOrder}
                  onChange={(e) => setEditingCategory(prev => prev ? { ...prev, sortOrder: parseInt(e.target.value) || 0 } : null)}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingCategory(null)}>
                Cancel
              </Button>
              <Button onClick={() => handleUpdateCategory(editingCategory)} disabled={updateCategoryMutation.isLoading}>
                {updateCategoryMutation.isLoading ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
