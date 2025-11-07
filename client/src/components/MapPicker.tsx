import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Polygon, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";

// Import leaflet-draw - this extends the L global object
import "leaflet-draw";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Trash2, Square, LocateFixed, Edit3, Monitor, Smartphone, Search, MapPin, Map } from "lucide-react";

// Utility to detect desktop capability for precise drawing
const isDesktopCapable = () => {
  // Much more permissive - allow drawing unless clearly on mobile
  const isMobileDevice = window.innerWidth < 600 || 'ontouchstart' in window;
  
  // Allow drawing on desktop browsers, tablets, and larger mobile devices
  return !isMobileDevice;
};

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapPickerProps {
  onPolygonSelect: (coordinates: [number, number][]) => void;
  onLocationSelect?: (lat: number, lng: number) => void;
  onBoundarySelect?: (boundary: CSBBoundary) => void;
  initialPolygon?: [number, number][];
  initialLat?: number;
  initialLng?: number;
  userZipcode?: string; // Auto-zoom to user's zipcode
  height?: string;
}

interface CSBBoundary {
  type: 'Feature';
  geometry: {
    type: 'Polygon';
    coordinates: number[][][]; // [ring][point][lng, lat]
  };
  properties: {
    id: string;
    acreage?: number;
    cropHistory?: string[];
    year?: number;
  };
}

// Component to fetch and display CSB boundaries for selection
function CSBBoundarySelector({ 
  onBoundarySelect,
  selectedBoundaryId
}: {
  onBoundarySelect: (boundary: CSBBoundary) => void;
  selectedBoundaryId: string | null;
}) {
  console.log('🗺️ [CSB] Component initializing...');
  
  const map = useMap();
  const [mapBounds, setMapBounds] = useState<string | null>(null);
  const [hoveredBoundary, setHoveredBoundary] = useState<string | null>(null);
  
  console.log('🗺️ [CSB] Hooks initialized successfully');

  // Update bounds whenever the map moves or zooms
  useEffect(() => {
    console.log('🗺️ [CSB] Setting up map event listeners');
    
    const updateBounds = () => {
      try {
        const bounds = map.getBounds();
        const bbox = `${bounds.getWest()},${bounds.getSouth()},${bounds.getEast()},${bounds.getNorth()}`;
        console.log('🗺️ [CSB] Map bounds updated:', bbox);
        setMapBounds(bbox);
      } catch (error) {
        console.error('🗺️ [CSB] Error updating bounds:', error);
      }
    };

    // Initial bounds
    updateBounds();

    // Update bounds on map movements
    map.on('moveend', updateBounds);
    map.on('zoomend', updateBounds);

    return () => {
      map.off('moveend', updateBounds);
      map.off('zoomend', updateBounds);
    };
  }, [map]);

  // Fetch claimed CSB boundary IDs
  const { data: claimedBoundaryIds = [] } = useQuery<string[]>({
    queryKey: ['/api/csb/claimed'],
    queryFn: async () => {
      const response = await fetch('/api/csb/claimed', {
        credentials: 'include'
      });
      
      if (!response.ok) {
        console.error('Failed to fetch claimed boundaries');
        return [];
      }
      
      const data = await response.json();
      console.log(`🗺️ [CSB] ✅ Fetched ${data.length} claimed boundaries`);
      return data;
    }
  });

  // Fetch CSB boundaries based on map bounds
  const { data: boundaries = [], isLoading, error } = useQuery<CSBBoundary[]>({
    queryKey: ['/api/csb/boundaries', mapBounds],
    enabled: !!mapBounds,
    queryFn: async () => {
      if (!mapBounds) return [];
      
      console.log('🗺️ [CSB] Fetching boundaries for bounds:', mapBounds);
      
      // Parse bbox string "minLng,minLat,maxLng,maxLat"
      const [minLng, minLat, maxLng, maxLat] = mapBounds.split(',');
      
      // Construct query string with proper parameters
      const params = new URLSearchParams({
        minLng,
        minLat,
        maxLng,
        maxLat,
        limit: '100'
      });
      
      const url = `/api/csb/boundaries?${params.toString()}`;
      console.log('🗺️ [CSB] Fetching from URL:', url);
      
      const response = await fetch(url, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('🗺️ [CSB] Failed to fetch boundaries:', response.status, errorText);
        throw new Error(`Failed to fetch boundaries: ${response.status} ${errorText}`);
      }
      
      const data = await response.json();
      console.log(`🗺️ [CSB] ✅ Received ${data.length} boundaries from server`);
      if (data.length > 0) {
        console.log('🗺️ [CSB] Sample boundary:', data[0]);
      }
      
      return data;
    }
  });

  // Log boundary data changes
  useEffect(() => {
    console.log(`🗺️ [CSB] Boundaries array updated: ${boundaries.length} boundaries`);
    if (boundaries.length > 0) {
      console.log('🗺️ [CSB] First boundary structure:', {
        hasGeometry: !!boundaries[0]?.geometry,
        hasCoordinates: !!boundaries[0]?.geometry?.coordinates,
        coordinatesLength: boundaries[0]?.geometry?.coordinates?.[0]?.length,
        hasId: !!boundaries[0]?.properties?.id,
        id: boundaries[0]?.properties?.id
      });
    }
    if (error) {
      console.error('🗺️ [CSB] Query error:', error);
    }
  }, [boundaries, error]);

  return (
    <>
      {/* Loading indicator */}
      {isLoading && (
        <div className="leaflet-top leaflet-left" style={{ top: '10px', left: '10px', zIndex: 1000 }}>
          <div className="bg-background/95 border border-border px-3 py-2 rounded-lg shadow-lg">
            <div className="flex items-center gap-2">
              <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full" />
              <span className="text-xs font-medium">Loading boundaries...</span>
            </div>
          </div>
        </div>
      )}

      {/* Error indicator */}
      {error && (
        <div className="leaflet-top leaflet-left" style={{ top: '10px', left: '10px', zIndex: 1000 }}>
          <div className="bg-destructive/10 border border-destructive px-3 py-2 rounded-lg shadow-lg">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-destructive">
                Failed to load boundaries
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Render CSB boundaries */}
      {boundaries.map((boundary, index) => {
        const isSelected = selectedBoundaryId === boundary.properties.id;
        const isHovered = hoveredBoundary === boundary.properties.id;
        const isClaimed = claimedBoundaryIds.includes(boundary.properties.id);
        
        // Validate boundary has required data
        if (!boundary?.geometry?.coordinates?.[0]) {
          console.warn(`🗺️ [CSB] Boundary ${index} missing coordinates:`, boundary);
          return null;
        }
        
        // Convert GeoJSON coordinates to Leaflet format
        const coordinates = boundary.geometry.coordinates[0].map(
          (coord) => [coord[1], coord[0]] as [number, number]
        );

        // Log first few polygons being rendered
        if (index < 3) {
          console.log(`🗺️ [CSB] Rendering polygon ${index}:`, {
            id: boundary.properties.id,
            coordinateCount: coordinates.length,
            firstCoord: coordinates[0],
            isSelected,
            isHovered,
            isClaimed
          });
        }

        // Determine className based on state
        const className = `csb-boundary ${isSelected ? 'selected' : isClaimed ? 'claimed' : ''}`.trim();

        return (
          <Polygon
            key={boundary.properties.id}
            positions={coordinates}
            pathOptions={{}}
            className={className}
            eventHandlers={{
              mouseover: () => {
                if (!isClaimed) {
                  setHoveredBoundary(boundary.properties.id);
                  console.log('🗺️ [CSB] Hovering over boundary:', boundary.properties.id);
                }
              },
              mouseout: () => setHoveredBoundary(null),
              click: () => {
                if (!isClaimed) {
                  console.log('🗺️ [CSB] Boundary clicked:', boundary.properties.id);
                  onBoundarySelect(boundary);
                } else {
                  console.log('🗺️ [CSB] Cannot select claimed boundary:', boundary.properties.id);
                }
              },
            }}
          />
        );
      })}

      {/* Info overlay showing boundary count - Always visible for debugging */}
      <div className="leaflet-top leaflet-left" style={{ top: isLoading || error ? '60px' : '10px', left: '10px', zIndex: 1000 }}>
        <div className="bg-background/95 border border-border px-3 py-2 rounded-lg shadow-lg">
          <div className="flex items-center gap-2">
            <Map className="w-4 h-4 text-primary" />
            <span className="text-xs font-medium">
              {isLoading ? 'Loading...' : `${boundaries.length} field${boundaries.length !== 1 ? 's' : ''} in view`}
            </span>
          </div>
          {boundaries.length > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              Click an orange boundary to select
            </p>
          )}
          {boundaries.length === 0 && !isLoading && !error && (
            <p className="text-xs text-muted-foreground mt-1">
              Zoom in or pan to load fields
            </p>
          )}
        </div>
      </div>
    </>
  );
}

function FieldBoundaryDrawer({ 
  onPolygonSelect, 
  initialPolygon, 
  initialLat, 
  initialLng 
}: {
  onPolygonSelect: (coordinates: [number, number][]) => void;
  initialPolygon?: [number, number][];
  initialLat?: number;
  initialLng?: number;
}) {
  const [polygon, setPolygon] = useState<[number, number][] | null>(() => {
    if (initialPolygon && initialPolygon.length > 0) {
      return initialPolygon;
    }
    return null;
  });
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawMode, setDrawMode] = useState<'polygon' | 'rectangle' | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const drawControlRef = useRef<L.Control.Draw | null>(null);
  const drawnItemsRef = useRef<L.FeatureGroup | null>(null);
  const currentDrawHandlerRef = useRef<any>(null);

  const map = useMapEvents({
    click(e) {
      if (!isDrawing) return;
      // Handle manual polygon creation by clicking
    },
  });

  // Desktop-only drawing functions
  const startDrawingPolygon = () => {
    // Guard: Only allow drawing on desktop-capable devices
    if (!isDesktopCapable()) {
      console.warn('🗺️ Drawing disabled: requires desktop browser with mouse/trackpad');
      return;
    }
    
    if (!mapRef.current || !drawnItemsRef.current) {
      console.error('🗺️ Map or drawing layer not initialized');
      return;
    }
    
    // Check if Leaflet Draw is available - enhanced check
    try {
      if (!L || !(L as any).Draw || !(L as any).Draw.Polygon) {
        console.error('🗺️ Leaflet Draw library not loaded');
        alert('⚠️ Drawing Tools Not Ready\n\nThe drawing tools are still loading. Please wait a moment and try again.\n\nIf the problem persists, refresh the page.');
        return;
      }
      
      // Disable any existing draw handler
      if (currentDrawHandlerRef.current) {
        currentDrawHandlerRef.current.disable();
      }
      
      // Clear existing polygons
      drawnItemsRef.current.clearLayers();
      setPolygon(null);
      
      // Enable drawing mode
      setDrawMode('polygon');
      setIsDrawing(true);
      
      console.log('🗺️ Starting polygon drawing mode');
      
      // Start polygon drawing
      const drawHandler = new L.Draw.Polygon(mapRef.current as any, {
        allowIntersection: false,
        showArea: true,
        shapeOptions: {
          color: '#22c55e',
          fillColor: '#22c55e',
          fillOpacity: 0.3,
          weight: 3
        }
      });
      currentDrawHandlerRef.current = drawHandler;
      drawHandler.enable();
    } catch (error) {
      console.error('🗺️ Error starting polygon drawing:', error);
      alert('⚠️ Drawing Error\n\nFailed to start drawing. Please refresh the page and try again.\n\nError: ' + (error as Error).message);
      setIsDrawing(false);
      setDrawMode(null);
    }
  };

  const startDrawingRectangle = () => {
    // Guard: Only allow drawing on desktop-capable devices
    if (!isDesktopCapable()) {
      console.warn('🗺️ Drawing disabled: requires desktop browser with mouse/trackpad');
      return;
    }
    
    if (!mapRef.current || !drawnItemsRef.current) {
      console.error('🗺️ Map or drawing layer not initialized');
      return;
    }
    
    // Check if Leaflet Draw is available - enhanced check
    try {
      if (!L || !(L as any).Draw || !(L as any).Draw.Rectangle) {
        console.error('🗺️ Leaflet Draw library not loaded');
        alert('⚠️ Drawing Tools Not Ready\n\nThe drawing tools are still loading. Please wait a moment and try again.\n\nIf the problem persists, refresh the page.');
        return;
      }
      
      // Disable any existing draw handler
      if (currentDrawHandlerRef.current) {
        currentDrawHandlerRef.current.disable();
      }
      
      // Clear existing polygons
      drawnItemsRef.current.clearLayers();
      setPolygon(null);
      
      // Enable drawing mode
      setDrawMode('rectangle');
      setIsDrawing(true);
      
      console.log('🗺️ Starting rectangle drawing mode');
      
      // Start rectangle drawing
      const drawHandler = new L.Draw.Rectangle(mapRef.current as any, {
        shapeOptions: {
          color: '#22c55e',
          fillColor: '#22c55e',
          fillOpacity: 0.3,
          weight: 3
        }
      });
      currentDrawHandlerRef.current = drawHandler;
      drawHandler.enable();
    } catch (error) {
      console.error('🗺️ Error starting rectangle drawing:', error);
      alert('⚠️ Drawing Error\n\nFailed to start drawing. Please refresh the page and try again.\n\nError: ' + (error as Error).message);
      setIsDrawing(false);
      setDrawMode(null);
    }
  };

  const clearDrawing = () => {
    // Guard: Only allow clearing on desktop-capable devices
    if (!isDesktopCapable()) return;
    
    if (!drawnItemsRef.current) return;
    
    // Disable any active draw handler
    if (currentDrawHandlerRef.current) {
      currentDrawHandlerRef.current.disable();
      currentDrawHandlerRef.current = null;
    }
    
    drawnItemsRef.current.clearLayers();
    setPolygon(null);
    setIsDrawing(false);
    setDrawMode(null);
    onPolygonSelect([]);
  };

  useEffect(() => {
    mapRef.current = map;
    
    // Initialize drawing controls
    const drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);
    drawnItemsRef.current = drawnItems;

    // Mobile-optimized: Remove default draw control for better mobile experience
    // Instead we'll use custom buttons

    // Handle drawing events (using React state only, not drawnItems)
    const handleDrawCreated = (e: any) => {
      // Guard: Only process drawing on desktop-capable devices
      if (!isDesktopCapable()) return;
      
      try {
        const layer = e.layer;
        const layerType = e.layerType; // 'polygon' or 'rectangle'
        
        console.log('🗺️ Draw created - type:', layerType);
        
        // Extract coordinates based on layer type
        let latLngs;
        if (layerType === 'rectangle') {
          // Rectangle returns LatLngBounds, convert to polygon coordinates
          latLngs = layer.getLatLngs()[0];
        } else {
          // Polygon returns nested array
          latLngs = layer.getLatLngs()[0];
        }
        
        const coords = latLngs.map((latlng: L.LatLng) => [
          latlng.lat, 
          latlng.lng
        ] as [number, number]);
        
        console.log('🗺️ Field boundary drawn:', coords.length, 'points');
        
        setPolygon(coords);
        setIsDrawing(false);
        setDrawMode(null);
        if (currentDrawHandlerRef.current) {
          currentDrawHandlerRef.current.disable();
          currentDrawHandlerRef.current = null;
        }
        onPolygonSelect(coords);
      } catch (error) {
        console.error('🗺️ Error processing drawn boundary:', error);
        alert('⚠️ Drawing Error\n\nFailed to process the drawn boundary. Please try again.\n\nError: ' + (error as Error).message);
        setIsDrawing(false);
        setDrawMode(null);
      }
    };
    
    map.on('draw:created', handleDrawCreated);

    const handleDrawDeleted = () => {
      setPolygon(null);
      setIsDrawing(false);
      setDrawMode(null);
      onPolygonSelect([]);
    };
    
    map.on('draw:deleted', handleDrawDeleted);

    // Set initial view
    if (initialPolygon && initialPolygon.length > 0) {
      // Center on the polygon (React state handles rendering)
      const bounds = L.latLngBounds(initialPolygon);
      map.fitBounds(bounds, { padding: [20, 20] });
    } else if (typeof initialLat === 'number' && typeof initialLng === 'number' && 
               !isNaN(initialLat) && !isNaN(initialLng)) {
      map.setView([initialLat, initialLng], 16);
    }

    return () => {
      // Cleanup event listeners
      map.off('draw:created', handleDrawCreated);
      map.off('draw:deleted', handleDrawDeleted);
      
      // Disable any active draw handler
      if (currentDrawHandlerRef.current) {
        currentDrawHandlerRef.current.disable();
        currentDrawHandlerRef.current = null;
      }
      
      if (drawControlRef.current) {
        map.removeControl(drawControlRef.current);
      }
      map.removeLayer(drawnItems);
    };
  }, [map, onPolygonSelect, initialPolygon, initialLat, initialLng]);

  return (
    <>
      {polygon && (
        <Polygon 
          positions={polygon} 
          pathOptions={{
            color: '#22c55e',
            fillColor: '#22c55e',
            fillOpacity: 0.3,
            weight: 2
          }}
        />
      )}
      
      {/* Drawing Controls - Only show on desktop-capable browsers */}
      {isDesktopCapable() && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-[1000] flex gap-2 bg-background/95 dark:bg-background/95 border border-border p-2 rounded-lg shadow-lg">
          <Button
            size="sm"
            type="button"
            variant={drawMode === 'polygon' ? "default" : "outline"}
            onClick={startDrawingPolygon}
            disabled={isDrawing && drawMode !== 'polygon'}
            data-testid="button-draw-polygon"
          >
            <Edit3 className="w-4 h-4 mr-1" />
            Draw Field
          </Button>
          
          <Button
            size="sm"
            type="button"
            variant={drawMode === 'rectangle' ? "default" : "outline"}
            onClick={startDrawingRectangle}
            disabled={isDrawing && drawMode !== 'rectangle'}
            data-testid="button-draw-rectangle"
          >
            <Square className="w-4 h-4 mr-1" />
            Rectangle
          </Button>
          
          <Button
            size="sm"
            type="button"
            variant="outline"
            onClick={clearDrawing}
            disabled={!polygon && !isDrawing}
            data-testid="button-clear-drawing"
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Clear
          </Button>
        </div>
      )}
      
      {/* Compact Drawing Info - Only show if not desktop-capable */}
      {!isDesktopCapable() && (
        <div className="absolute top-2 right-2 z-[1000]">
          <div className="bg-background/90 border border-border px-3 py-1 rounded text-xs text-muted-foreground">
            📱 Desktop needed for drawing
          </div>
        </div>
      )}
    </>
  );
}

function AddressSearcher({ onLocationFound }: { onLocationFound: (lat: number, lng: number, address: string) => void }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchAddress = async () => {
    if (!searchTerm.trim()) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Use Nominatim (OpenStreetMap) geocoding service - free and no API key required
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchTerm)}&limit=1&countrycodes=us`
      );
      
      if (!response.ok) {
        throw new Error('Search service unavailable');
      }
      
      const results = await response.json();
      
      if (results.length === 0) {
        setError("Location not found. Try 'City, State' or 'Address, City, State'");
        return;
      }
      
      const result = results[0];
      const lat = parseFloat(result.lat);
      const lng = parseFloat(result.lon);
      
      onLocationFound(lat, lng, result.display_name);
      console.log(`🗺️ Found location: ${result.display_name} at ${lat}, ${lng}`);
      
    } catch (error) {
      console.error('Address search error:', error);
      setError("Search failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      searchAddress();
    }
  };

  return (
    <div className="space-y-2 relative z-10">
      <div className="flex items-center gap-2">
        <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
        <div className="flex-1 flex gap-2">
          <Input
            type="text"
            placeholder="Enter address, city, state, or zip code (e.g., 'Des Moines, IA' or '12345')"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1 min-w-0 border border-input"
            data-testid="input-address-search"
          />
          <Button 
            type="button"
            onClick={searchAddress}
            disabled={isLoading || !searchTerm.trim()}
            size="sm"
            className="flex-shrink-0"
            data-testid="button-search-address"
          >
            {isLoading ? (
              <div className="animate-spin w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full" />
            ) : (
              <Search className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
      {error && (
        <Alert variant="destructive" className="mt-2">
          <AlertDescription className="text-sm">{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}

function UserLocationButton() {
  const map = useMap();
  const [isLoading, setIsLoading] = useState(false);

  const handleGetLocation = () => {
    setIsLoading(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          map.setView([latitude, longitude], 13);
          setIsLoading(false);
        },
        (error) => {
          console.error("Error getting location:", error);
          setIsLoading(false);
        }
      );
    } else {
      setIsLoading(false);
      alert("Geolocation is not supported by this browser.");
    }
  };

  return (
    <div className="leaflet-top leaflet-right" style={{ top: '10px', right: '10px' }}>
      <div className="leaflet-control leaflet-bar">
        <Button
          size="sm"
          onClick={handleGetLocation}
          disabled={isLoading}
          className="rounded-sm"
          data-testid="button-get-location"
        >
          {isLoading ? (
            <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full" />
          ) : (
            <LocateFixed className="w-4 h-4" />
          )}
        </Button>
      </div>
    </div>
  );
}

function MapNavigator({ onLocationFound }: { onLocationFound: (lat: number, lng: number, address: string) => void }) {
  return <AddressSearcher onLocationFound={onLocationFound} />;
}

function MapController({ onSearchLocation }: { onSearchLocation: (lat: number, lng: number) => void }) {
  const map = useMap();

  // Update map when search location changes
  useEffect(() => {
    // This will be triggered when the search location changes
  }, []);

  // Expose map instance for external control
  useEffect(() => {
    if (map) {
      (window as any).navigateToLocation = (lat: number, lng: number) => {
        map.setView([lat, lng], 16);
      };
    }
  }, [map]);

  return null;
}

export default function MapPicker({ 
  onPolygonSelect,
  onLocationSelect,
  onBoundarySelect,
  initialPolygon,
  initialLat, 
  initialLng,
  userZipcode,
  height = "400px" 
}: MapPickerProps) {
  const [searchLocation, setSearchLocation] = useState<{lat: number, lng: number} | null>(null);
  const [mode, setMode] = useState<'select' | 'draw'>('select'); // Default to boundary selection mode
  const [selectedBoundaryId, setSelectedBoundaryId] = useState<string | null>(null);
  const [autoZoomAttempted, setAutoZoomAttempted] = useState(false);
  
  // Default to center of Minnesota farming region (where our sample CSB data is)
  const defaultLat = initialLat || 44.8;
  const defaultLng = initialLng || -94.5;
  
  // If we have an existing polygon, use its center
  const centerLat = initialPolygon && initialPolygon.length > 0 
    ? initialPolygon.reduce((sum, coord) => sum + coord[0], 0) / initialPolygon.length
    : defaultLat;
  const centerLng = initialPolygon && initialPolygon.length > 0
    ? initialPolygon.reduce((sum, coord) => sum + coord[1], 0) / initialPolygon.length
    : defaultLng;

  // Auto-zoom to user's zipcode on component mount
  useEffect(() => {
    if (userZipcode && !autoZoomAttempted && !initialLat && !initialLng) {
      setAutoZoomAttempted(true);
      // Trigger location search for the user's zipcode
      const geocodeUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(userZipcode)}`;
      
      fetch(geocodeUrl)
        .then(res => res.json())
        .then(data => {
          if (data && data.length > 0) {
            const lat = parseFloat(data[0].lat);
            const lng = parseFloat(data[0].lon);
            setSearchLocation({ lat, lng });
            if ((window as any).navigateToLocation) {
              (window as any).navigateToLocation(lat, lng);
            }
            console.log(`🗺️ Auto-zoomed to zipcode: ${userZipcode}`);
          }
        })
        .catch(err => console.error('Failed to geocode zipcode:', err));
    }
  }, [userZipcode, autoZoomAttempted, initialLat, initialLng]);

  const handleLocationFound = (lat: number, lng: number, address: string) => {
    setSearchLocation({ lat, lng });
    // Use global navigation function
    if ((window as any).navigateToLocation) {
      (window as any).navigateToLocation(lat, lng);
    }
    console.log(`🗺️ Navigated to: ${address}`);
  };

  const handleBoundarySelect = (boundary: CSBBoundary) => {
    // Convert GeoJSON coordinates to our polygon format [lat, lng]
    const coordinates = boundary.geometry.coordinates[0].map(
      (coord) => [coord[1], coord[0]] as [number, number]
    );
    
    setSelectedBoundaryId(boundary.properties.id);
    onPolygonSelect(coordinates);
    
    // Notify parent component (FieldForm) about the boundary selection
    if (onBoundarySelect) {
      onBoundarySelect(boundary);
    }
    
    console.log(`🗺️ Selected CSB boundary: ${boundary.properties.id}`, {
      acreage: boundary.properties.acreage,
      coordinates: coordinates.length + ' points'
    });
  };

  return (
    <div className="space-y-4 relative">
      {/* Address Search */}
      <div className="relative z-10">
        <AddressSearcher onLocationFound={handleLocationFound} />
      </div>
      
      {/* Mode Toggle - Select Boundary vs Draw Manually */}
      <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border border-border">
        <Map className="w-4 h-4 text-primary flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium mb-2">Field Creation Method</p>
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant={mode === 'select' ? 'default' : 'outline'}
              onClick={() => setMode('select')}
              className="flex-1"
              data-testid="button-mode-select"
            >
              <Map className="w-3 h-3 mr-1" />
              Select Boundary
            </Button>
            <Button
              type="button"
              size="sm"
              variant={mode === 'draw' ? 'default' : 'outline'}
              onClick={() => {
                setMode('draw');
                setSelectedBoundaryId(null);
              }}
              className="flex-1"
              data-testid="button-mode-draw"
              disabled={!isDesktopCapable()}
            >
              <Edit3 className="w-3 h-3 mr-1" />
              Draw Manually
            </Button>
          </div>
        </div>
      </div>
      
      {/* Mode Description */}
      <div className="flex items-center gap-2">
        <Square className="w-4 h-4 text-primary flex-shrink-0" />
        <p className="text-sm text-muted-foreground">
          {mode === 'select' ? (
            "Click on a pre-mapped field boundary on the map to select it (like onX Hunt or Acres.com)"
          ) : !isDesktopCapable() ? (
            "View field location on map - Drawing requires desktop browser"
          ) : (
            "Use the drawing tools below to manually outline your field boundaries"
          )}
        </p>
      </div>
      
      <div 
        style={{ height }} 
        className="rounded-lg overflow-hidden border border-border relative"
        data-testid="field-boundary-picker"
      >
        <MapContainer
          center={[centerLat, centerLng]}
          zoom={initialPolygon ? 16 : 10}
          style={{ height: "100%", width: "100%" }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          />
          <TileLayer
            attribution='&copy; CartoDB'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}.png"
            opacity={0.9}
          />
          <MapController onSearchLocation={(lat, lng) => setSearchLocation({ lat, lng })} />
          
          {/* Conditionally render CSB selector or drawing tools based on mode */}
          {mode === 'select' ? (
            <CSBBoundarySelector 
              onBoundarySelect={handleBoundarySelect}
              selectedBoundaryId={selectedBoundaryId}
            />
          ) : (
            <FieldBoundaryDrawer 
              onPolygonSelect={onPolygonSelect}
              initialPolygon={initialPolygon}
              initialLat={initialLat}
              initialLng={initialLng}
            />
          )}
          
          <UserLocationButton />
        </MapContainer>
      </div>
    </div>
  );
}