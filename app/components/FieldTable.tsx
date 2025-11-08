import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import FieldForm from "./FieldForm";
import { formatDistanceToNow } from "date-fns";

interface Field {
  id: string;
  name: string;
  crop: string;
  season: string;
  acres: string;
  status: string;
  updatedAt: string;
}

interface FieldTableProps {
  showActions?: boolean;
}

export default function FieldTable({ showActions = false }: FieldTableProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editField, setEditField] = useState<any>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);

  const { data: fields, isLoading } = useQuery<Field[]>({
    queryKey: ["/api/fields"],
  });

  const deleteFieldMutation = useMutation({
    mutationFn: async (fieldId: string) => {
      await apiRequest("DELETE", `/api/fields/${fieldId}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Field deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/fields"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message || "Failed to delete field",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (field: any) => {
    setEditField(field);
    setShowEditDialog(true);
  };

  const handleDelete = (fieldId: string) => {
    if (confirm("Are you sure you want to delete this field?")) {
      deleteFieldMutation.mutate(fieldId);
    }
  };

  const getCropIcon = (crop: string) => {
    const cropLower = crop.toLowerCase();
    if (cropLower.includes('corn')) return 'fas fa-seedling';
    if (cropLower.includes('soy')) return 'fas fa-leaf';
    if (cropLower.includes('wheat')) return 'fas fa-wheat-awn';
    return 'fas fa-seedling';
  };

  const getCropColor = (crop: string) => {
    const cropLower = crop.toLowerCase();
    if (cropLower.includes('corn')) return 'bg-primary/10 text-primary';
    if (cropLower.includes('soy')) return 'bg-chart-2/10 text-chart-2';
    if (cropLower.includes('wheat')) return 'bg-chart-4/10 text-chart-4';
    return 'bg-primary/10 text-primary';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'growing': return 'bg-chart-1/10 text-chart-1';
      case 'planted': return 'bg-chart-4/10 text-chart-4';
      case 'harvested': return 'bg-chart-2/10 text-chart-2';
      case 'fallow': return 'bg-muted text-muted-foreground';
      default: return 'bg-primary/10 text-primary';
    }
  };

  return (
    <>
      <Card className="mt-8 bg-card rounded-lg border border-border" data-testid="card-field-table">
        <CardHeader className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-foreground">My Fields</CardTitle>
            {showActions && (
              <div className="flex items-center space-x-3">
                <Button 
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 font-medium text-sm" 
                  onClick={() => setShowAddDialog(true)}
                  data-testid="button-add-field-table"
                >
                  <i className="fas fa-plus mr-2" aria-hidden="true"></i>
                  Add Field
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6">
              <div className="animate-pulse space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <div className="h-12 w-12 bg-muted rounded-lg"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-1/4"></div>
                      <div className="h-3 bg-muted rounded w-1/6"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : fields && fields.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left py-3 px-6 text-sm font-medium text-muted-foreground">Field Name</th>
                    <th className="text-left py-3 px-6 text-sm font-medium text-muted-foreground">Crop</th>
                    <th className="text-left py-3 px-6 text-sm font-medium text-muted-foreground">Season</th>
                    <th className="text-left py-3 px-6 text-sm font-medium text-muted-foreground">Size (Acres)</th>
                    <th className="text-left py-3 px-6 text-sm font-medium text-muted-foreground">Status</th>
                    <th className="text-left py-3 px-6 text-sm font-medium text-muted-foreground">Last Updated</th>
                    {showActions && (
                      <th className="text-left py-3 px-6 text-sm font-medium text-muted-foreground">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {fields.map((field: any) => (
                    <tr key={field.id} className="border-b border-border hover:bg-muted/50" data-testid={`row-field-${field.id}`}>
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-3">
                          <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
                            <i className="fas fa-map text-primary-foreground text-xs" aria-hidden="true"></i>
                          </div>
                          <span className="font-medium text-foreground" data-testid={`text-field-name-${field.id}`}>
                            {field.name}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <Badge className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getCropColor(field.crop)}`} data-testid={`badge-crop-${field.id}`}>
                          <i className={`${getCropIcon(field.crop)} mr-1`} aria-hidden="true"></i>
                          {field.crop}
                        </Badge>
                      </td>
                      <td className="py-4 px-6 text-foreground" data-testid={`text-season-${field.id}`}>
                        {field.season}
                      </td>
                      <td className="py-4 px-6 text-foreground" data-testid={`text-acres-${field.id}`}>
                        {parseFloat(field.acres).toFixed(1)}
                      </td>
                      <td className="py-4 px-6">
                        <Badge className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(field.status)}`} data-testid={`badge-status-${field.id}`}>
                          <i className="fas fa-circle mr-1 text-xs" aria-hidden="true"></i>
                          {field.status}
                        </Badge>
                      </td>
                      <td className="py-4 px-6 text-muted-foreground text-sm" data-testid={`text-updated-${field.id}`}>
                        {formatDistanceToNow(new Date(field.updatedAt), { addSuffix: true })}
                      </td>
                      {showActions && (
                        <td className="py-4 px-6">
                          <div className="flex items-center space-x-2">
                            <button 
                              className="px-3 py-2 bg-green-600 text-white hover:bg-green-700 rounded-md transition-colors font-medium"
                              onClick={() => handleEdit(field)}
                              data-testid={`button-edit-${field.id}`}
                              title="Edit Field"
                            >
                              <i className="fas fa-edit text-sm mr-1" aria-hidden="true"></i>
                              Edit
                            </button>
                            <button 
                              className="px-3 py-2 bg-red-600 text-white hover:bg-red-700 rounded-md transition-colors font-medium"
                              onClick={() => handleDelete(field.id)}
                              data-testid={`button-delete-${field.id}`}
                              title="Delete Field"
                            >
                              <i className="fas fa-trash text-sm mr-1" aria-hidden="true"></i>
                              Delete
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center">
              <i className="fas fa-map text-6xl text-muted-foreground mb-4" aria-hidden="true"></i>
              <h3 className="text-lg font-medium text-foreground mb-2">No fields added yet</h3>
              <p className="text-muted-foreground mb-6">
                Get started by adding your first field or importing from John Deere Operations Center
              </p>
              <div className="flex justify-center space-x-4">
                <Button data-testid="button-add-first-field">
                  <i className="fas fa-plus mr-2" aria-hidden="true"></i>
                  Add Field
                </Button>
                <Button variant="outline" data-testid="button-import-fields">
                  <i className="fas fa-download mr-2" aria-hidden="true"></i>
                  Import Fields
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Field Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Field</DialogTitle>
          </DialogHeader>
          <FieldForm 
            onSuccess={() => setShowAddDialog(false)} 
            onCancel={() => setShowAddDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Field Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Field</DialogTitle>
          </DialogHeader>
          {editField && (
            <FieldForm 
              field={editField}
              onSuccess={() => {
                setShowEditDialog(false);
                setEditField(null);
              }}
              onCancel={() => {
                setShowEditDialog(false);
                setEditField(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
