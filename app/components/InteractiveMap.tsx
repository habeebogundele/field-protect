import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MapContainer, TileLayer, Polygon, Popup, useMap } from "react-leaflet";
import { LatLngBounds } from "leaflet";
import "leaflet/dist/leaflet.css";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AccessRequestDialog from "@/components/AccessRequestDialog";
import { FieldWithAccess } from "@shared/schema";

// Define GeoJSON geometry types with proper discriminated union
type PolygonGeometry = {
  type: 'Polygon';
  coordinates: number[][][]; // [ring][point][lng, lat]
};

type MultiPolygonGeometry = {
  type: 'MultiPolygon';
  coordinates: number[][][][]; // [polygon][ring][point][lng, lat]
};

type OtherGeometry = {
  type: 'Point' | 'LineString' | 'MultiPoint' | 'MultiLineString' | 'GeometryCollection';
  coordinates: any; // We don't render these types
};

type GeoJSONGeometry = PolygonGeometry | MultiPolygonGeometry | OtherGeometry;

interface GeoJSONFeature {
  type: 'Feature';
  geometry: GeoJSONGeometry;
  properties?: Record<string, any>;
}

// Extended Field type with proper geometry typing
type Field = FieldWithAccess & {
  geometry: GeoJSONFeature;
  updatedAt: string | null;
};

interface MapProps {
  height?: string;
  showFieldDetails?: boolean;
}

// Component to fit map bounds to fields
function MapBounds({ fields }: { fields: Field[] }) {
  const map = useMap();
  
  React.useEffect(() => {
    if (fields && fields.length > 0) {
      const bounds = new LatLngBounds([]);
      
      fields.forEach(field => {
        const geometry = field.geometry?.geometry;
        if (!geometry?.coordinates) return;
        
        if (geometry.type === 'Polygon') {
          // For Polygon: coordinates[0] is the outer ring
          const outerRing = geometry.coordinates[0];
          outerRing.forEach((coord: any) => {
            if (Array.isArray(coord) && coord.length >= 2) {
              bounds.extend([coord[1], coord[0]]); // Leaflet uses [lat, lng]
            }
          });
        } else if (geometry.type === 'MultiPolygon') {
          // For MultiPolygon: iterate through each polygon
          geometry.coordinates.forEach((polygon: any) => {
            const outerRing = polygon[0]; // First ring is outer ring
            outerRing.forEach((coord: any) => {
              if (Array.isArray(coord) && coord.length >= 2) {
                bounds.extend([coord[1], coord[0]]); // Leaflet uses [lat, lng]
              }
            });
          });
        }
        // Skip other geometry types (Point, LineString, etc.) for bounds calculation
      });
      
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [20, 20] });
      }
    }
  }, [fields, map]);
  
  return null;
}

// Generate colors and opacity based on access level and spray type
function getFieldStyle(field: Field) {
  // Expanded unique color palette for better field distinction
  const colors = [
    '#4CAF50', '#2196F3', '#FF9800', '#9C27B0', '#F44336',
    '#00BCD4', '#8BC34A', '#FF5722', '#3F51B5', '#E91E63',
    '#795548', '#607D8B', '#009688', '#FFC107', '#673AB7',
    '#FF4081', '#CDDC39', '#FF6F00', '#1976D2', '#388E3C'
  ];
  
  // Generate unique color based on field ID to ensure each field has distinct color
  let hash = 0;
  for (let i = 0; i < field.id.length; i++) {
    const char = field.id.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  let color = colors[Math.abs(hash) % colors.length];
  
  // Override with spray type colors if specified
  if (field.sprayType) {
    switch (field.sprayType) {
      case 'enlist': color = '#4CAF50'; break; // Green
      case 'liberty': color = '#2196F3'; break; // Blue  
      case 'roundup': color = '#FF9800'; break; // Orange
      case 'dicamba': color = '#9C27B0'; break; // Purple
      case 'conventional': color = '#607D8B'; break; // Blue Grey
      case 'organic': color = '#795548'; break; // Brown
    }
  }
  
  // Bold black outlines with bright fill colors for all access levels
  switch (field.accessLevel) {
    case 'owner':
      return {
        color: '#000000', // Bold black outline
        weight: 4, // Thicker border
        opacity: 1.0, // Full opacity for border
        fillColor: color,
        fillOpacity: 0.6, // Brighter fill
        dashArray: undefined,
      };
    case 'approved':
      return {
        color: '#000000', // Bold black outline
        weight: 3, // Thick border
        opacity: 1.0, // Full opacity for border
        fillColor: color,
        fillOpacity: 0.5, // Brighter fill
        dashArray: undefined,
      };
    case 'restricted':
    default:
      return {
        color: '#000000', // Bold black outline (not gray)
        weight: 3, // Thick border
        opacity: 1.0, // Full opacity for border
        fillColor: color,
        fillOpacity: 0.3, // More visible fill
        dashArray: '8, 8', // Larger dash pattern for better visibility
      };
  }
}

function getCropIcon(crop: string) {
  const cropLower = crop.toLowerCase();
  if (cropLower.includes('corn')) return '🌽';
  if (cropLower.includes('soy')) return '🌱';
  if (cropLower.includes('wheat')) return '🌾';
  return '🌾';
}

export default function InteractiveMap({ height = "500px", showFieldDetails = true }: MapProps) {
  const [accessRequestDialog, setAccessRequestDialog] = useState<{ open: boolean; fieldId?: string; fieldName?: string }>({ open: false });
  const [legendExpanded, setLegendExpanded] = useState(true);
  
  // Fetch all nearby fields (owned, approved, and restricted)
  const { data: fields = [], isLoading } = useQuery<Field[]>({
    queryKey: ["/api/fields/all-nearby"],
  });

  // Essential debugging for geometry validation
  React.useEffect(() => {
    if (fields && Array.isArray(fields)) {
      console.log(`🗺️ FRONTEND RECEIVED: ${fields.length} total fields`);
      
      // Log each field with details
      fields.forEach((field, index) => {
        const hasGeometry = !!field.geometry?.geometry?.coordinates;
        const geomType = field.geometry?.geometry?.type || 'none';
        console.log(`🗺️ Field ${index + 1}: "${field.name}" (${field.accessLevel}) - Geometry: ${geomType} - Valid: ${hasGeometry}`);
      });
      
      // Count geometry types for debugging
      const geometryTypeCount = fields.reduce((acc, field) => {
        const geoType = field.geometry?.geometry?.type || 'unknown';
        acc[geoType] = (acc[geoType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      console.log('🗺️ Map geometry types:', geometryTypeCount);
      
      // Check for fields with invalid geometry and report errors
      const fieldsWithInvalidGeometry = fields.filter(f => {
        const geometry = f.geometry?.geometry;
        if (geometry?.type === 'Polygon') {
          return !geometry.coordinates?.[0]?.length;
        } else if (geometry?.type === 'MultiPolygon') {
          return !geometry.coordinates?.[0]?.[0]?.length;
        }
        return geometry?.type && !['Polygon', 'MultiPolygon'].includes(geometry.type);
      });
      
      if (fieldsWithInvalidGeometry.length > 0) {
        console.error('Fields with invalid geometry:', fieldsWithInvalidGeometry.map(f => ({ name: f.name, id: f.id, geometryType: f.geometry?.geometry?.type })));
      }
    }
  }, [fields, isLoading]);


  if (isLoading) {
    return (
      <Card style={{ height }}>
        <CardContent className="p-6 flex items-center justify-center">
          <div className="animate-pulse">
            <div className="text-muted-foreground">Loading map...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!fields || fields.length === 0) {
    return (
      <Card style={{ height }}>
        <CardContent className="p-6 flex items-center justify-center">
          <div className="text-center">
            <i className="fas fa-map text-4xl text-muted-foreground mb-4" aria-hidden="true"></i>
            <h3 className="text-lg font-medium text-foreground mb-2">No fields to display</h3>
            <p className="text-muted-foreground">Add fields to see them on the map</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Default center (will be overridden by MapBounds)
  const defaultCenter: [number, number] = [40.7128, -74.0060]; // New York area
  
  return (
    <Card style={{ height }} className="overflow-hidden">
      {showFieldDetails && (
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Field Map</CardTitle>
          <p className="text-sm text-muted-foreground">
            Interactive map showing {fields.length} field{fields.length !== 1 ? 's' : ''} with satellite imagery
          </p>
          {/* Debug info */}
          <p className="text-xs text-muted-foreground">
            Fields with geometry: {fields.filter(f => {
              const geometry = f.geometry?.geometry;
              if (geometry?.type === 'Polygon') {
                return geometry.coordinates?.[0]?.length > 0;
              } else if (geometry?.type === 'MultiPolygon') {
                return geometry.coordinates?.[0]?.[0]?.length > 0;
              }
              return false;
            }).length}
          </p>
        </CardHeader>
      )}
      <CardContent className="p-0 h-full">
        <MapContainer
          center={defaultCenter}
          zoom={13}
          style={{ height: showFieldDetails ? "calc(100% - 80px)" : "100%", width: "100%" }}
          className="z-0"
        >
          {/* Satellite/Aerial imagery tile layer */}
          <TileLayer
            attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          />
          
          {/* Hybrid labels overlay */}
          <TileLayer
            attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
            opacity={0.6}
          />
          
          {/* Fit map to show all fields */}
          <MapBounds fields={fields} />
          
          {/* Collapsible Legend */}
          <div className="leaflet-top leaflet-right" style={{ 
            position: 'absolute', 
            top: '10px', 
            right: '10px', 
            zIndex: 1000,
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '6px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            fontSize: '11px',
            maxWidth: legendExpanded ? '140px' : '36px',
            transition: 'all 0.3s ease'
          }}>
            {/* Toggle Button */}
            <button
              onClick={() => setLegendExpanded(!legendExpanded)}
              className="w-full flex items-center justify-center p-2 hover:bg-gray-50 rounded-t-md transition-colors"
              style={{ minHeight: '32px' }}
              title={legendExpanded ? "Hide Legend" : "Show Legend"}
            >
              <span className="text-gray-600 text-sm">
                {legendExpanded ? '✕' : '🗺️'}
              </span>
            </button>
            
            {/* Legend Content */}
            {legendExpanded && (
              <div className="px-3 pb-3 border-t border-gray-200">
                <div className="text-xs font-medium mb-2 text-gray-700">Fields</div>
                <div className="space-y-1 mb-3">
                  <div className="flex items-center space-x-1.5">
                    <div className="w-2.5 h-2.5 rounded border" style={{ backgroundColor: 'rgba(76, 175, 80, 0.6)', borderColor: '#4CAF50' }}></div>
                    <span className="text-xs text-gray-600">Your Fields</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <div className="w-2.5 h-2.5 rounded border" style={{ backgroundColor: 'rgba(33, 150, 243, 0.5)', borderColor: '#2196F3' }}></div>
                    <span className="text-xs text-gray-600">Approved</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <div className="w-2.5 h-2.5 rounded border border-dashed" style={{ backgroundColor: 'rgba(158, 158, 158, 0.3)', borderColor: '#666666' }}></div>
                    <span className="text-xs text-gray-600">Request</span>
                  </div>
                </div>
                <div className="text-xs font-medium mb-1 text-gray-700 border-t pt-2">Spray Types</div>
                <div className="grid grid-cols-2 gap-1 text-xs">
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 rounded" style={{ backgroundColor: '#4CAF50' }}></div>
                    <span className="text-gray-600">Enlist</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 rounded" style={{ backgroundColor: '#2196F3' }}></div>
                    <span className="text-gray-600">Liberty</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 rounded" style={{ backgroundColor: '#FF9800' }}></div>
                    <span className="text-gray-600">Roundup</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 rounded" style={{ backgroundColor: '#9C27B0' }}></div>
                    <span className="text-gray-600">Dicamba</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 rounded" style={{ backgroundColor: '#607D8B' }}></div>
                    <span className="text-gray-600">Convnl</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 rounded" style={{ backgroundColor: '#795548' }}></div>
                    <span className="text-gray-600">Organic</span>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Field boundaries */}
          {fields.map((field, index) => {
            const geometry = field.geometry?.geometry;
            
            // Debug: Count and log field rendering
            console.log(`🗺️ FRONTEND: Field ${index + 1}/${fields.length}: "${field.name}" (${field.accessLevel}) - Coords: ${geometry?.coordinates?.[0]?.length || 0} points`);
            
            if (!geometry?.coordinates) {
              console.error(`❌ Field "${field.name}" has no valid geometry - SKIPPING`);
              return null;
            }
            
            // Debug: Check coordinate validity
            if (geometry.type === 'Polygon' && (!geometry.coordinates[0] || geometry.coordinates[0].length < 3)) {
              console.error(`❌ Field "${field.name}" has invalid polygon coordinates - SKIPPING`);
              return null;
            }
            
            const fieldStyle = getFieldStyle(field);
            
            // Handle both Polygon and MultiPolygon geometries
            if (geometry.type === 'Polygon') {
              console.log(`✅ RENDERING: "${field.name}" as Polygon with ${geometry.coordinates[0].length} points`);
              // For Polygon: coordinates[0] is the outer ring
              const coordinates = geometry.coordinates[0].map(
                (coord: any) => [coord[1], coord[0]] as [number, number]
              );
              
              
              return (
                <Polygon
                  key={field.id}
                  positions={coordinates}
                  pathOptions={fieldStyle}
                  eventHandlers={{
                    mouseover: (e) => {
                      const hoverStyle = {
                        weight: fieldStyle.weight + 1,
                        fillOpacity: Math.min(fieldStyle.fillOpacity + 0.2, 0.6),
                      };
                      e.target.setStyle(hoverStyle);
                    },
                    mouseout: (e) => {
                      e.target.setStyle({
                        weight: fieldStyle.weight,
                        fillOpacity: fieldStyle.fillOpacity,
                      });
                    },
                    click: (e) => {
                      if (field.accessLevel === 'restricted') {
                        e.originalEvent.stopPropagation();
                        setAccessRequestDialog({ 
                          open: true, 
                          fieldId: field.id,
                          fieldName: 'Private Field' 
                        });
                      }
                    },
                  }}
                >
                  {/* Popup for owner and approved fields */}
                  {field.accessLevel !== 'restricted' && (
                    <Popup>
                      <div className="min-w-64 p-2">
                        <div className="flex items-center space-x-2 mb-3">
                          <span className="text-2xl">{getCropIcon(field.crop)}</span>
                          <div>
                            <h3 className="font-semibold text-lg">{field.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {parseFloat(field.acres).toFixed(1)} acres
                            </p>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Crop:</span>
                            <Badge variant="secondary">{field.crop}</Badge>
                          </div>
                          
                          {field.variety && (
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">Variety:</span>
                              <span className="text-sm">{field.variety}</span>
                            </div>
                          )}
                          
                          {field.sprayType && (
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">Spray Type:</span>
                              <Badge 
                                style={{ backgroundColor: fieldStyle.fillColor, color: 'white' }}
                                className="text-xs"
                              >
                                {field.sprayType.toUpperCase()}
                              </Badge>
                            </div>
                          )}
                          
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Status:</span>
                            <Badge variant="outline">{field.status}</Badge>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Season:</span>
                            <span className="text-sm">{field.season}</span>
                          </div>
                          
                          <div className="flex items-center justify-between pt-2 border-t">
                            <span className="text-sm font-medium">Access:</span>
                            <Badge 
                              variant={field.accessLevel === 'owner' ? 'default' : field.accessLevel === 'approved' ? 'secondary' : 'outline'}
                              className="text-xs"
                            >
                              {field.accessLevel === 'owner' ? '👤 Your Field' : 
                               field.accessLevel === 'approved' ? '✅ Approved' : '🔒 Restricted'}
                            </Badge>
                          </div>
                          
                          <div className="pt-2 border-t">
                            <p className="text-xs text-muted-foreground">
                              Updated {field.updatedAt ? formatDistanceToNow(new Date(field.updatedAt), { addSuffix: true }) : 'Unknown'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </Popup>
                  )}
                  
                  {/* Popup for restricted fields */}
                  {field.accessLevel === 'restricted' && (
                    <Popup>
                      <div className="min-w-48 p-3 text-center">
                        <div className="text-2xl mb-2">🔒</div>
                        <h3 className="font-semibold text-lg mb-2">Private Field</h3>
                        <p className="text-sm text-muted-foreground mb-3">
                          This field is owned by another farmer
                        </p>
                        <p className="text-xs text-muted-foreground mb-3">
                          Click the field boundary to request access for detailed information
                        </p>
                        <button 
                          className="px-3 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
                          data-testid="button-request-field-access"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setAccessRequestDialog({ 
                              open: true, 
                              fieldId: field.id,
                              fieldName: 'Private Field' 
                            });
                          }}
                        >
                          Request Access
                        </button>
                      </div>
                    </Popup>
                  )}
                </Polygon>
              );
            } else if (geometry.type === 'MultiPolygon') {
              // For MultiPolygon: render multiple Polygon components
              
              return (
                <React.Fragment key={field.id}>
                  {geometry.coordinates.map((polygon, polygonIndex) => {
                    // Each polygon's first ring is the outer ring
                    const coordinates = polygon[0].map(
                      (coord: any) => [coord[1], coord[0]] as [number, number]
                    );
                    
                    return (
                      <Polygon
                        key={`${field.id}-${polygonIndex}`}
                        positions={coordinates}
                        pathOptions={fieldStyle}
                        eventHandlers={{
                          mouseover: (e) => {
                            const hoverStyle = {
                              weight: fieldStyle.weight + 1,
                              fillOpacity: Math.min(fieldStyle.fillOpacity + 0.2, 0.6),
                            };
                            e.target.setStyle(hoverStyle);
                          },
                          mouseout: (e) => {
                            e.target.setStyle({
                              weight: fieldStyle.weight,
                              fillOpacity: fieldStyle.fillOpacity,
                            });
                          },
                          click: (e) => {
                            if (field.accessLevel === 'restricted') {
                              e.originalEvent.stopPropagation();
                              setAccessRequestDialog({ 
                                open: true, 
                                fieldId: field.id,
                                fieldName: 'Private Field' 
                              });
                            }
                          },
                        }}
                      >
                        {/* Only show popup on the first polygon of a MultiPolygon */}
                        {polygonIndex === 0 && field.accessLevel !== 'restricted' && (
                          <Popup>
                    <div className="min-w-64 p-2">
                    <div className="flex items-center space-x-2 mb-3">
                      <span className="text-2xl">{getCropIcon(field.crop)}</span>
                      <div>
                        <h3 className="font-semibold text-lg">{field.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {parseFloat(field.acres).toFixed(1)} acres
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Crop:</span>
                        <Badge variant="secondary">{field.crop}</Badge>
                      </div>
                      
                      {field.variety && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Variety:</span>
                          <span className="text-sm">{field.variety}</span>
                        </div>
                      )}
                      
                      {field.sprayType && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Spray Type:</span>
                          <Badge 
                            style={{ backgroundColor: fieldStyle.fillColor, color: 'white' }}
                            className="text-xs"
                          >
                            {field.sprayType.toUpperCase()}
                          </Badge>
                        </div>
                      )}
                      
                      {(
                        <>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Status:</span>
                            <Badge variant="outline">{field.status}</Badge>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Season:</span>
                            <span className="text-sm">{field.season}</span>
                          </div>
                        </>
                      )}
                      
                      
                      <div className="flex items-center justify-between pt-2 border-t">
                        <span className="text-sm font-medium">Access:</span>
                        <Badge 
                          variant={field.accessLevel === 'owner' ? 'default' : field.accessLevel === 'approved' ? 'secondary' : 'outline'}
                          className="text-xs"
                        >
                          {field.accessLevel === 'owner' ? '👤 Your Field' : 
                           field.accessLevel === 'approved' ? '✅ Approved' : '🔒 Restricted'}
                        </Badge>
                      </div>
                      
                      <div className="pt-2 border-t">
                        <p className="text-xs text-muted-foreground">
                          Updated {field.updatedAt ? formatDistanceToNow(new Date(field.updatedAt), { addSuffix: true }) : 'Unknown'}
                        </p>
                      </div>
                      </div>
                    </div>
                  </Popup>
                        )}
                        
                        {polygonIndex === 0 && field.accessLevel === 'restricted' && (
                          <Popup>
                            <div className="min-w-48 p-3 text-center">
                              <div className="text-2xl mb-2">🔒</div>
                              <h3 className="font-semibold text-lg mb-2">Private Field</h3>
                              <p className="text-sm text-muted-foreground mb-3">
                                This field is owned by another farmer
                              </p>
                              <p className="text-xs text-muted-foreground mb-3">
                                Click the field boundary to request access for detailed information
                              </p>
                              <button 
                                className="px-3 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
                                data-testid="button-request-field-access"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setAccessRequestDialog({ 
                                    open: true, 
                                    fieldId: field.id,
                                    fieldName: 'Private Field' 
                                  });
                                }}
                              >
                                Request Access
                              </button>
                            </div>
                          </Popup>
                        )}
                      </Polygon>
                    );
                  })}
                </React.Fragment>
              );
            } else {
              console.error(`Unsupported geometry type "${geometry.type}" for field "${field.name}"`);
              return null;
            }
          })}
        </MapContainer>
      </CardContent>
      
      <AccessRequestDialog
        open={accessRequestDialog.open}
        onOpenChange={(open) => setAccessRequestDialog({ ...accessRequestDialog, open })}
        fieldId={accessRequestDialog.fieldId || ''}
        fieldName={accessRequestDialog.fieldName}
      />
    </Card>
  );
}