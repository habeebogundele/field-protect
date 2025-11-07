import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import MapPicker from "./MapPicker";

// Helper function to extract polygon coordinates from GeoJSON geometry
function extractPolygonCoordinates(geometry: any): [number, number][] {
  if (!geometry || !geometry.geometry || geometry.geometry.type !== 'Polygon') {
    return [];
  }
  // GeoJSON stores coordinates as [lng, lat], we need [lat, lng]
  const coords = geometry.geometry.coordinates[0];
  return coords.map((coord: [number, number]) => [coord[1], coord[0]]);
}

const fieldFormSchema = z.object({
  name: z.string().min(1, "Field name is required"),
  crop: z.string().min(1, "Crop type is required"),
  sprayTypes: z.array(z.enum(['enlist', 'liberty', 'roundup', 'dicamba', 'conventional', 'organic'])).optional(),
  variety: z.string().optional(),
  season: z.string().min(1, "Season is required"),
  acres: z.string().min(1, "Acres is required"),
  status: z.enum(['planted', 'growing', 'harvested', 'fallow']),
  notes: z.string().optional(),
  // Location data for backward compatibility
  latitude: z.string().optional(),
  longitude: z.string().optional(),
  // Field boundary polygon coordinates
  fieldBoundaries: z.array(z.tuple([z.number(), z.number()])).optional(),
});

type FieldFormData = z.infer<typeof fieldFormSchema>;

interface FieldFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  field?: any;
}

export default function FieldForm({ onSuccess, onCancel, field }: FieldFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Track selected CSB boundary ID for claiming fields
  const [selectedCsbBoundaryId, setSelectedCsbBoundaryId] = useState<string | undefined>(field?.csbBoundaryId);

  // Fetch current user data to get zipcode for auto-location
  const { data: user } = useQuery<{
    id: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    zipcode?: string;
  }>({
    queryKey: ['/api/auth/user'],
  });

  const form = useForm<FieldFormData>({
    resolver: zodResolver(fieldFormSchema),
    defaultValues: {
      name: field?.name || "",
      crop: field?.crop || "",
      sprayTypes: field?.sprayTypes || [],
      variety: field?.variety || "",
      season: field?.season || new Date().getFullYear().toString(),
      acres: field?.acres || "",
      status: field?.status || 'planted',
      notes: field?.notes || "",
      latitude: field?.latitude?.toString() || "",
      longitude: field?.longitude?.toString() || "",
      fieldBoundaries: [],
    },
  });

  const createFieldMutation = useMutation({
    mutationFn: async (data: FieldFormData) => {
      // Default location if not provided (center of Iowa farming region)
      const lat = data.latitude ? parseFloat(data.latitude) : 42.0;
      const lng = data.longitude ? parseFloat(data.longitude) : -93.5;
      
      // Create geometry from polygon boundaries if available, otherwise use point
      let geometry;
      if (data.fieldBoundaries && data.fieldBoundaries.length > 2) {
        // Use actual field boundaries
        const coordinates = data.fieldBoundaries.map(coord => [coord[1], coord[0]]); // Convert [lat, lng] to [lng, lat] for GeoJSON
        coordinates.push(coordinates[0]); // Close the polygon
        
        geometry = {
          type: "Feature",
          properties: {},
          geometry: {
            type: "Polygon",
            coordinates: [coordinates],
          },
        };
      } else {
        // Fallback to small polygon around center point
        const offset = 0.001; // Small offset for demo polygon
        geometry = {
          type: "Feature",
          properties: {},
          geometry: {
            type: "Polygon",
            coordinates: [[
              [lng - offset, lat - offset],
              [lng + offset, lat - offset],
              [lng + offset, lat + offset],
              [lng - offset, lat + offset],
              [lng - offset, lat - offset],
            ]],
          },
        };
      }

      const fieldData = {
        name: data.name,
        crop: data.crop,
        sprayTypes: data.sprayTypes,
        variety: data.variety,
        season: data.season,
        acres: data.acres,
        status: data.status,
        notes: data.notes,
        latitude: lat,
        longitude: lng,
        geometry,
        csbBoundaryId: selectedCsbBoundaryId,
      };

      if (field) {
        return await apiRequest("PUT", `/api/fields/${field.id}`, fieldData);
      } else {
        return await apiRequest("POST", "/api/fields", fieldData);
      }
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: field ? "Field updated successfully" : "Field created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/fields"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/csb/claimed"] });
      onSuccess?.();
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message || `Failed to ${field ? 'update' : 'create'} field`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FieldFormData) => {
    console.log("🚜 Form submitted with data:", data);
    createFieldMutation.mutate(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" data-testid="form-field">
        {/* MAP SECTION - Top Priority */}
        <div className="space-y-2">
          <h4 className="text-lg font-semibold text-foreground flex items-center gap-2">
            🛰️ Field Boundaries
            {user?.zipcode && (
              <span className="text-xs font-normal text-muted-foreground">
                (Auto-zoomed to {user.zipcode})
              </span>
            )}
          </h4>
          <p className="text-sm text-muted-foreground">
            Search by address or zipcode, then click on a blue field boundary or draw your own
          </p>
          <div className="rounded-lg border border-border overflow-hidden">
            <MapPicker
              onBoundarySelect={(boundary) => {
                // Store the CSB boundary ID for claiming
                setSelectedCsbBoundaryId(boundary.properties.id);
                console.log('🗺️ CSB boundary selected:', boundary.properties.id);
              }}
              onPolygonSelect={(coordinates) => {
                // Store the polygon coordinates
                form.setValue("fieldBoundaries", coordinates);
                
                // Also set lat/lng for backward compatibility (use center of polygon)
                if (coordinates.length > 0) {
                  const centerLat = coordinates.reduce((sum, coord) => sum + coord[0], 0) / coordinates.length;
                  const centerLng = coordinates.reduce((sum, coord) => sum + coord[1], 0) / coordinates.length;
                  form.setValue("latitude", centerLat.toString());
                  form.setValue("longitude", centerLng.toString());
                }
                console.log('🗺️ Field boundary selected:', coordinates.length, 'points');
              }}
              onLocationSelect={(lat, lng) => {
                // Fallback for point selection if no polygon drawn
                form.setValue("latitude", lat.toString());
                form.setValue("longitude", lng.toString());
                console.log('🗺️ Point location selected:', lat, lng);
              }}
              initialLat={(() => {
                const lat = form.getValues("latitude") || (field?.latitude);
                return lat ? parseFloat(lat) : undefined;
              })()}
              initialLng={(() => {
                const lng = form.getValues("longitude") || (field?.longitude);
                return lng ? parseFloat(lng) : undefined;
              })()}
              userZipcode={user?.zipcode}
              height="500px"
            />
          </div>
        </div>

        {/* FIELD INFORMATION FORM - Below Map */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-foreground">Field Information</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Field Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., North Field A" {...field} data-testid="input-field-name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

          <FormField
            control={form.control}
            name="crop"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Crop Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-crop-type">
                      <SelectValue placeholder="Select crop type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="corn">Corn</SelectItem>
                    <SelectItem value="sweet-corn">Sweet Corn</SelectItem>
                    <SelectItem value="soybeans">Soybeans</SelectItem>
                    <SelectItem value="sugar-beets">Sugar Beets</SelectItem>
                    <SelectItem value="wheat">Wheat</SelectItem>
                    <SelectItem value="rye">Rye</SelectItem>
                    <SelectItem value="peas">Peas</SelectItem>
                    <SelectItem value="cotton">Cotton</SelectItem>
                    <SelectItem value="rice">Rice</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="sprayTypes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Spray Types (Herbicide Tolerance) - Select All That Apply</FormLabel>
                <FormControl>
                  <div className="space-y-3" data-testid="checkboxes-spray-types">
                    {[
                      { value: 'enlist', label: 'Enlist (2,4-D + Glyphosate)' },
                      { value: 'liberty', label: 'Liberty (Glufosinate)' },
                      { value: 'roundup', label: 'Roundup Ready (Glyphosate)' },
                      { value: 'dicamba', label: 'Dicamba Tolerant' },
                      { value: 'conventional', label: 'Conventional' },
                      { value: 'organic', label: 'Organic' }
                    ].map((spray) => (
                      <div key={spray.value} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={spray.value}
                          checked={field.value?.includes(spray.value as any) || false}
                          onChange={(e) => {
                            const current = field.value || [];
                            if (e.target.checked) {
                              field.onChange([...current, spray.value as any]);
                            } else {
                              field.onChange(current.filter((v) => v !== spray.value));
                            }
                          }}
                          className="rounded border-gray-300"
                          data-testid={`checkbox-spray-${spray.value}`}
                        />
                        <label htmlFor={spray.value} className="text-sm font-medium">
                          {spray.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="variety"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Variety (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Pioneer P1234A, DeKalb DKC62-14" {...field} data-testid="input-variety" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="season"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Season/Year</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., 2025" {...field} data-testid="input-season" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="acres"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Size (Acres)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="e.g., 45.2" {...field} data-testid="input-acres" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-status">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="planted">Planted</SelectItem>
                    <SelectItem value="growing">Growing</SelectItem>
                    <SelectItem value="harvested">Harvested</SelectItem>
                    <SelectItem value="fallow">Fallow</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          </div>

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notes (Optional)</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Additional field information..."
                    {...field}
                    data-testid="textarea-notes"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            {field ? 'Edit field information' : 'Fill in the form to add a new field'}
          </div>
          <div className="flex space-x-4">
            <Button type="button" variant="outline" onClick={onCancel || onSuccess} data-testid="button-cancel">
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={createFieldMutation.isPending}
              data-testid="button-save-field"
            >
              {createFieldMutation.isPending ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full mr-2" />
                  {field ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                field ? 'Update Field' : 'Create Field'
              )}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
