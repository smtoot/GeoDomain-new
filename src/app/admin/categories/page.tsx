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
import { Plus, Edit, Trash2, Save, X, AlertTriangle } from 'lucide-react';
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

  const addExample = () => {
    setNewCategory(prev => ({ ...prev, examples: [...prev.examples, ''] }));
  };

  const removeExample = (index: number) => {
    setNewCategory(prev => ({ 
      ...prev, 
      examples: prev.examples.filter((_, i) => i !== index) 
    }));
  };

  const updateExample = (index: number, value: string) => {
    setNewCategory(prev => ({
      ...prev,
      examples: prev.examples.map((ex, i) => i === index ? value : ex)
    }));
  };

  const addIndustry = () => {
    setNewCategory(prev => ({ ...prev, industries: [...prev.industries, ''] }));
  };

  const removeIndustry = (index: number) => {
    setNewCategory(prev => ({ 
      ...prev, 
      industries: prev.industries.filter((_, i) => i !== index) 
    }));
  };

  const updateIndustry = (index: number, value: string) => {
    setNewCategory(prev => ({
      ...prev,
      industries: prev.industries.map((ind, i) => i === index ? value : ind)
    }));
  };

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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Categories Management</h1>
          <p className="text-gray-600">Manage domain categories and their properties</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
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
                <div className="space-y-2">
                  {newCategory.examples.map((example, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={example}
                        onChange={(e) => updateExample(index, e.target.value)}
                        placeholder="e.g., TexasHotels.com"
                      />
                      {newCategory.examples.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeExample(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={addExample}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Example
                  </Button>
                </div>
              </div>
              
              <div>
                <Label>Industries</Label>
                <div className="space-y-2">
                  {newCategory.industries.map((industry, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={industry}
                        onChange={(e) => updateIndustry(index, e.target.value)}
                        placeholder="e.g., Hospitality"
                      />
                      {newCategory.industries.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeIndustry(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={addIndustry}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Industry
                  </Button>
                </div>
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

      <div className="grid gap-4">
        {categories?.map((category) => (
          <Card key={category.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {category.name}
                    <Badge variant={category.enabled ? "default" : "secondary"}>
                      {category.enabled ? "Enabled" : "Disabled"}
                    </Badge>
                  </CardTitle>
                  <CardDescription>{category.description}</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingCategory(category)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteCategory(category.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Examples:</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {category.examples.map((example, index) => (
                      <Badge key={index} variant="outline">{example}</Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Industries:</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {category.industries.map((industry, index) => (
                      <Badge key={index} variant="secondary">{industry}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
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
                <div className="space-y-2">
                  {editingCategory.examples.map((example, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={example}
                        onChange={(e) => setEditingCategory(prev => prev ? {
                          ...prev,
                          examples: prev.examples.map((ex, i) => i === index ? e.target.value : ex)
                        } : null)}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingCategory(prev => prev ? {
                          ...prev,
                          examples: prev.examples.filter((_, i) => i !== index)
                        } : null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setEditingCategory(prev => prev ? {
                      ...prev,
                      examples: [...prev.examples, '']
                    } : null)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Example
                  </Button>
                </div>
              </div>
              
              <div>
                <Label>Industries</Label>
                <div className="space-y-2">
                  {editingCategory.industries.map((industry, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={industry}
                        onChange={(e) => setEditingCategory(prev => prev ? {
                          ...prev,
                          industries: prev.industries.map((ind, i) => i === index ? e.target.value : ind)
                        } : null)}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingCategory(prev => prev ? {
                          ...prev,
                          industries: prev.industries.filter((_, i) => i !== index)
                        } : null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setEditingCategory(prev => prev ? {
                      ...prev,
                      industries: [...prev.industries, '']
                    } : null)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Industry
                  </Button>
                </div>
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
