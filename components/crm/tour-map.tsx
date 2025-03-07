"use client"

import React, { useEffect, useState, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { gigHelpers, type TourStop } from '@/utils/db/gigs'
import { format } from 'date-fns'
import { useTour } from '@/components/providers/tour-provider'

// Custom styles to override Leaflet's z-index
const mapStyles = `
  .leaflet-pane {
    z-index: 1 !important;
  }
  .leaflet-top,
  .leaflet-bottom {
    z-index: 2 !important;
  }
`

// Fixing the icon image paths
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: '/images/marker-icon-2x.png',
  iconUrl: '/images/marker-icon.png',
  shadowUrl: '/images/marker-shadow.png',
})

interface MapWrapperProps {
  isPdfExport?: boolean;
  showFutureOnly?: boolean;
  mode?: 'simple' | 'full';
}

function MapWrapper({ isPdfExport = false, showFutureOnly = false, mode = 'full' }: MapWrapperProps) {
  const [map, setMap] = useState<L.Map | null>(null)
  const mapRef = useRef<L.Map | null>(null)
  const [route, setRoute] = useState<[number, number][]>([])
  const [tourStops, setTourStops] = useState<TourStop[]>([])
  const containerRef = useRef<HTMLDivElement>(null)
  const { currentTour } = useTour()
  const [isMapReady, setIsMapReady] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [loadingMessage, setLoadingMessage] = useState('Loading Map')
  
  // Check if we're in PDF capture mode via data attribute
  useEffect(() => {
    const checkPdfCaptureMode = () => {
      if (containerRef.current) {
        const isPdfCaptureMode = containerRef.current.getAttribute('data-pdf-capture') === 'true';
        if (isPdfCaptureMode !== isPdfExport) {
          console.log(`PDF capture mode ${isPdfCaptureMode ? 'enabled' : 'disabled'}`);
        }
      }
    };
    
    // Check immediately on mount
    checkPdfCaptureMode();
    
    // Set up observer to detect attribute changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'data-pdf-capture') {
          checkPdfCaptureMode();
        }
      });
    });
    
    if (containerRef.current) {
      observer.observe(containerRef.current, { attributes: true });
    }
    
    return () => observer.disconnect();
  }, [isPdfExport]);

  // Cycle through loading messages
  useEffect(() => {
    if (!isLoading) return;
    
    // Define loading phases with their target progress percentages
    const loadingPhases = [
      { message: "Loading Map", targetProgress: 30 },
      { message: "Loading Venues", targetProgress: 60 },
      { message: "Loading Route", targetProgress: 100 }
    ];
    
    // Current phase based on progress
    let currentPhaseIndex = 0;
    if (loadingProgress > loadingPhases[0].targetProgress) currentPhaseIndex = 1;
    if (loadingProgress > loadingPhases[1].targetProgress) currentPhaseIndex = 2;
    
    // Set the current message
    setLoadingMessage(loadingPhases[currentPhaseIndex].message);
    
    // Gradually increase progress
    const timer = setInterval(() => {
      setLoadingProgress(prev => {
        const currentPhase = loadingPhases[currentPhaseIndex];
        const nextPhase = loadingPhases[Math.min(currentPhaseIndex + 1, loadingPhases.length - 1)];
        
        // If we've reached the target for this phase, stop incrementing
        if (prev >= nextPhase.targetProgress) {
          return prev;
        }
        
        // Otherwise, increment slowly toward the target
        return Math.min(prev + 1, nextPhase.targetProgress);
      });
    }, 150);
    
    return () => clearInterval(timer);
  }, [isLoading, loadingProgress]);

  useEffect(() => {
    // Add custom styles to document head
    const styleElement = document.createElement('style')
    styleElement.textContent = mapStyles + `
      .leaflet-tile {
        filter: ${isPdfExport ? 'contrast(1.2) brightness(1.05)' : 'none'} !important;
      }
      .leaflet-marker-icon {
        width: ${isPdfExport ? '30px' : '25px'} !important;
        height: ${isPdfExport ? '45px' : '41px'} !important;
        margin-left: ${isPdfExport ? '-15px' : '-12px'} !important;
        margin-top: ${isPdfExport ? '-45px' : '-41px'} !important;
        z-index: 1000 !important;
      }
      .leaflet-marker-shadow {
        width: ${isPdfExport ? '45px' : '41px'} !important;
        height: ${isPdfExport ? '45px' : '41px'} !important;
        margin-left: ${isPdfExport ? '-15px' : '-12px'} !important;
        margin-top: ${isPdfExport ? '-45px' : '-41px'} !important;
        z-index: 999 !important;
      }
    `
    document.head.appendChild(styleElement)

    // Load gig data
    const loadGigData = async () => {
      if (currentTour?.id) {
        const { tourStops } = await gigHelpers.getGigsWithCoordinates(currentTour.id)
        
        // Filter out past dates if showFutureOnly is true
        const filteredStops = showFutureOnly 
          ? tourStops.filter(stop => {
              if (!stop.gig_date) return false;
              const gigDate = new Date(stop.gig_date);
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              return gigDate >= today;
            })
          : tourStops;
          
        setTourStops(filteredStops)
      }
    }

    loadGigData()

    if (containerRef.current && !mapRef.current) {
      // Set map dimensions
      if (isPdfExport) {
        console.log('Setting up map for PDF export')
        containerRef.current.style.width = '100%'
        containerRef.current.style.height = isPdfExport ? '600px' : '400px'
      }

      mapRef.current = L.map(containerRef.current, {
        zoomAnimation: false,
        fadeAnimation: false,
        markerZoomAnimation: false,
        dragging: !isPdfExport,
        zoomControl: !isPdfExport,
        scrollWheelZoom: !isPdfExport,
        attributionControl: !isPdfExport
      }).setView([39.8283, -98.5795], 4)
      
      // Use OpenStreetMap style for better detail
      const mapStyle = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

      L.tileLayer(mapStyle, {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        subdomains: 'abc',
        minZoom: 0,
        maxZoom: isPdfExport ? 8 : 20,
        className: 'map-tiles'
      }).addTo(mapRef.current)

      setMap(mapRef.current)
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
      styleElement.remove()
    }
  }, [currentTour?.id, isPdfExport, showFutureOnly])

  // Update markers and route when tour stops change
  useEffect(() => {
    if (map && tourStops.length > 0) {
      // Start in loading state
      setIsLoading(true);
      setLoadingProgress(5); // Start with a small initial progress
      
      // Create a separate map instance for PDF export to prevent affecting the preview
      const isHandlingPdf = isPdfExport;
      
      // Clear existing markers and route
      map.eachLayer((layer) => {
        if (layer instanceof L.Marker || layer instanceof L.Polyline) {
          layer.remove()
        }
      })

      // Create a collection of marker positions
      const markerPositions: {[key: string]: L.LatLng} = {};
      
      // Add markers for each tour stop
      const coordinates: [number, number][] = []
      tourStops.forEach((stop, index) => {
        const { lat, lng } = stop
        coordinates.push([lat, lng])

        // Use consistent marker sizes for both preview and PDF to keep alignment
        const markerSize: L.PointTuple = [25, 41]; // Consistent size regardless of mode
        const markerAnchor: L.PointTuple = [12, 41];
        const shadowSize: L.PointTuple = [41, 41];
        const shadowAnchor: L.PointTuple = [12, 41];

        const marker = L.marker([lat, lng], {
          icon: new L.Icon({
            iconUrl: '/images/marker-icon-2x.png',
            iconSize: markerSize,
            iconAnchor: markerAnchor,
            popupAnchor: [0, -45],
            shadowUrl: '/images/marker-shadow.png',
            shadowSize: shadowSize,
            shadowAnchor: shadowAnchor
          }),
          zIndexOffset: 1000 // Always ensure markers are on top
        })
          .addTo(map)
          .bindPopup(`
            <div class="text-sm">
              <div class="font-semibold">${index + 1}. ${stop.name}</div>
              <div>${stop.city}, ${stop.state}</div>
              <div>${format(new Date(stop.gig_date), 'MMM d, yyyy')}</div>
            </div>
          `, {
            autoClose: true,
            closeOnClick: true
          });
          
        // Store the exact marker position for route alignment
        markerPositions[`${lat},${lng}`] = marker.getLatLng();
      })

      // After adding markers, update progress
      setLoadingProgress(40);

      // Draw route between stops using OSRM - only in non-PDF mode
      if (coordinates.length > 1 && !isHandlingPdf) {
        // Update progress as we start routing
        setLoadingProgress(60);
        
        fetchSequentialRoute(tourStops).then(routeCoords => {
          // SIMPLIFIED APPROACH: Only anchor the first point of the route
          if (routeCoords.length > 0 && tourStops.length > 0) {
            // Get the first marker's actual position
            const firstStop = tourStops[0];
            const firstMarkerPos = markerPositions[`${firstStop.lat},${firstStop.lng}`];
            
            if (firstMarkerPos) {
              // Anchor the route by setting its first point to the marker position
              routeCoords[0] = [firstMarkerPos.lat, firstMarkerPos.lng];
              
              // Calculate the offset from the theoretical starting point to the actual marker
              const originalFirstPoint = [firstStop.lat, firstStop.lng];
              const latOffset = firstMarkerPos.lat - originalFirstPoint[0];
              const lngOffset = firstMarkerPos.lng - originalFirstPoint[1];
              
              // Apply the same offset to ALL route points to keep the route shape intact
              // but shift it to align with the first marker
              for (let i = 1; i < routeCoords.length; i++) {
                routeCoords[i] = [
                  routeCoords[i][0] + latOffset,
                  routeCoords[i][1] + lngOffset
                ];
              }
            }
          }

          // Create the route with the shifted coordinates
          const routeLine = L.polyline(routeCoords, {
            color: '#0066FF',  // Consistent blue color
            weight: 3,         // Consistent line weight
            opacity: 1,
            smoothFactor: 1,
            lineCap: 'round',
            lineJoin: 'round'
          }).addTo(map);

          // Use consistent bounds calculation approach
          const bounds = routeLine.getBounds()
          const latMargin = (bounds.getNorth() - bounds.getSouth()) * 0.2
          const lngMargin = (bounds.getEast() - bounds.getWest()) * 0.2
          
          const expandedBounds = L.latLngBounds(
            [bounds.getSouth() - latMargin, bounds.getWest() - lngMargin],
            [bounds.getNorth() + latMargin, bounds.getEast() + lngMargin]
          )
          
          // Fixed zoom level for consistency
          map.fitBounds(expandedBounds, { 
            padding: [30, 30],
            maxZoom: 6,
            animate: false
          })
          
          // Update progress as route is drawn
          setLoadingProgress(90);
          
          // Let the map stabilize before marking it as ready
          setTimeout(() => {
            console.log('Map is ready with routes and markers')
            setLoadingProgress(100);
            setIsMapReady(true)
            setIsLoading(false)
          }, 1000)
          
        }).catch(error => {
          console.error('Error fetching route:', error)
          // Fallback to straight lines if routing fails
          const routeLine = L.polyline(coordinates, {
            color: '#0066FF',
            weight: 3,
            opacity: 1,
            lineCap: 'round',
            lineJoin: 'round',
            dashArray: '5, 10'
          }).addTo(map)
          
          // Apply same bounds calculation to fallback
          const bounds = routeLine.getBounds()
          const latMargin = (bounds.getNorth() - bounds.getSouth()) * 0.2
          const lngMargin = (bounds.getEast() - bounds.getWest()) * 0.2
          
          const expandedBounds = L.latLngBounds(
            [bounds.getSouth() - latMargin, bounds.getWest() - lngMargin],
            [bounds.getNorth() + latMargin, bounds.getEast() + lngMargin]
          )
          
          // Fixed zoom level for consistency
          map.fitBounds(expandedBounds, { 
            padding: [30, 30],
            maxZoom: 6,
            animate: false
          })
          
          // Update progress even on error
          setLoadingProgress(90);
          
          setTimeout(() => {
            console.log('Map is ready with fallback route')
            setLoadingProgress(100);
            setIsMapReady(true)
            setIsLoading(false)
          }, 1000)
        })
      } else {
        // For PDF mode, just show markers without routes
        // Fit bounds to markers
        if (coordinates.length > 1) {
          const bounds = L.latLngBounds(coordinates);
          const latMargin = (bounds.getNorth() - bounds.getSouth()) * 0.2
          const lngMargin = (bounds.getEast() - bounds.getWest()) * 0.2
          
          const expandedBounds = L.latLngBounds(
            [bounds.getSouth() - latMargin, bounds.getWest() - lngMargin],
            [bounds.getNorth() + latMargin, bounds.getEast() + lngMargin]
          )
          
          map.fitBounds(expandedBounds, { 
            padding: [30, 30],
            maxZoom: 6,
            animate: false
          });
          
          // Update progress for PDF mode or single marker
          setLoadingProgress(80);
          
          setTimeout(() => {
            console.log('PDF mode: Map is ready with markers only (no routes)')
            setLoadingProgress(100);
            setIsMapReady(true)
            setIsLoading(false)
          }, 1000)
        } else if (coordinates.length === 1) {
          map.setView(coordinates[0], 6, {
            animate: false
          })
          
          // Update progress for PDF mode or single marker
          setLoadingProgress(80);
          
          setTimeout(() => {
            console.log('Map is ready with single point')
            setLoadingProgress(100);
            setIsMapReady(true)
            setIsLoading(false)
          }, 1000)
        }
      }

      setRoute(coordinates)
    }
  }, [map, tourStops, isPdfExport])

  // Ensure map is properly sized when container dimensions change
  useEffect(() => {
    if (map) {
      // Force map to recognize container size
      map.invalidateSize({
        animate: false,
        pan: false
      });
    }
  }, [map]);

  // Make sure loading is turned off if there's an error or component unmounts
  useEffect(() => {
    return () => {
      // Clean up by ensuring loading state is reset if component unmounts
      setIsLoading(false);
    };
  }, []);

  // Ensure loading state is reset if there are no tour stops
  useEffect(() => {
    if (tourStops.length === 0) {
      setIsLoading(false);
    }
  }, [tourStops]);

  return (
    <div className={`relative ${isPdfExport ? 'h-[600px]' : 'h-[400px]'} bg-white rounded-lg overflow-hidden`} 
         data-map-ready={isMapReady ? 'true' : 'false'}>
      <div ref={containerRef} className="h-full w-full !visible" id={isPdfExport ? 'pdf-map-container' : 'tour-route-map'} />
      
      {/* Enhanced loading overlay with cycling messages and progress bar */}
      {isLoading && !isPdfExport && (
        <div className="absolute inset-0 backdrop-blur-sm bg-white/30 flex flex-col items-center justify-center z-50">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-blue-700 font-medium text-lg mb-2">{loadingMessage}</p>
          
          {/* Progress bar */}
          <div className="w-48 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 transition-all duration-300 ease-out"
              style={{ width: `${loadingProgress}%` }}
            ></div>
          </div>
          
          {/* Progress percentage */}
          <p className="text-blue-600 text-xs mt-1">{loadingProgress}%</p>
        </div>
      )}
      
      {/* PDF preparation message */}
      {isPdfExport && !isMapReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-70">
          <p className="text-gray-500">Preparing map for export...</p>
        </div>
      )}
    </div>
  )
}

async function fetchSequentialRoute(stops: TourStop[]): Promise<[number, number][]> {
  if (stops.length < 2) {
    return stops.map(stop => [stop.lat, stop.lng]);
  }
  
  // Create an array to hold all the route segments
  let routeSegments: [number, number][][] = [];
  
  // Process each segment between consecutive stops
  for (let i = 0; i < stops.length - 1; i++) {
    const start = stops[i];
    const end = stops[i + 1];
    const url = `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`;
    
    let segmentPoints: [number, number][] = [];
    
    try {
      console.log(`Fetching route from ${start.name} to ${end.name}`);
      console.log(`URL: ${url}`);
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      
      console.log(`Route data received for segment ${i}`);
      
      if (data.code !== 'Ok') {
        console.error(`Failed to fetch route between ${start.name} and ${end.name}. Status: ${data.code}`);
        // Fall back to direct line for this segment
        segmentPoints = [[start.lat, start.lng], [end.lat, end.lng]];
      } else {
        // Convert coordinates from [lng, lat] to [lat, lng]
        segmentPoints = data.routes[0].geometry.coordinates.map(
          ([lng, lat]: [number, number]) => [lat, lng] as [number, number]
        );
        
        // Ensure the first point exactly matches the start location
        segmentPoints[0] = [start.lat, start.lng];
        
        // Ensure the last point exactly matches the end location
        segmentPoints[segmentPoints.length - 1] = [end.lat, end.lng];
      }
    } catch (error) {
      console.error(`Error fetching route segment between ${start.name} and ${end.name}:`, error);
      // Fall back to direct line for this segment
      segmentPoints = [[start.lat, start.lng], [end.lat, end.lng]];
    }
    
    // Add this segment to our collection
    routeSegments.push(segmentPoints);
  }
  
  // If we failed to get any route segments, fall back to direct lines
  if (routeSegments.length === 0) {
    console.log('No route segments available, falling back to direct lines');
    return stops.map(stop => [stop.lat, stop.lng]);
  }
  
  // Combine all segments into a single route
  // We need to be careful to avoid duplicate points where segments meet
  let combinedRoute: [number, number][] = routeSegments[0];
  
  for (let i = 1; i < routeSegments.length; i++) {
    // Skip the first point of subsequent segments (as it should be the same as the last point of the previous segment)
    combinedRoute = combinedRoute.concat(routeSegments[i].slice(1));
  }
  
  return combinedRoute;
}

export default function TourMap({ isPdfExport = false, showFutureOnly = false, mode = 'full' }: MapWrapperProps) {
  return (
    <div className="h-full">
      <MapWrapper isPdfExport={isPdfExport} showFutureOnly={showFutureOnly} mode={mode} />
    </div>
  )
}