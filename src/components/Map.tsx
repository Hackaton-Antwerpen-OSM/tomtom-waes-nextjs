import React, { useEffect, useRef, useState } from "react";
import { Location, PointOfInterest } from "../types";
// We'll dynamically import the CSS in the useEffect hook instead
// of importing it directly at the top level

// Add global type declaration for Leaflet Routing Machine
/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    L: typeof import("leaflet") & {
      Routing: {
        control: (options: any) => any;
        // Add the osrmv1 router to the declaration
        osrmv1: (options?: any) => any;
      };
    };
  }
}

// Remove all type definitions that are no longer used

interface MapProps {
  userLocation: Location | null;
  pointsOfInterest: PointOfInterest[];
  selectedPOI: PointOfInterest | null;
  showDirections?: boolean;
  transportMode?: "car" | "foot"; // Add transportMode prop
}

const Map: React.FC<MapProps> = ({
  userLocation,
  pointsOfInterest,
  selectedPOI,
  showDirections = false,
  transportMode = "car", // Default to car
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);
  const routingControlRef = useRef<any>(null);
  const userMarkerRef = useRef<any>(null);
  const userCircleRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [leafletLoaded, setLeafletLoaded] = useState(false);

  // Load Leaflet and its dependencies only once
  useEffect(() => {
    // Only load if not already loaded
    if (!window.L) {
      const importLeaflet = async () => {
        try {
          // Import Leaflet library
          await import("leaflet");

          // Manually import the CSS
          if (!document.querySelector('link[href*="leaflet.css"]')) {
            const link = document.createElement("link");
            link.rel = "stylesheet";
            link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
            link.integrity = "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=";
            link.crossOrigin = "";
            document.head.appendChild(link);
          }

          // Import Leaflet Routing Machine CSS
          if (!document.querySelector('link[href*="leaflet-routing-machine.css"]')) {
            const routingCssLink = document.createElement("link");
            routingCssLink.rel = "stylesheet";
            routingCssLink.href =
              "https://unpkg.com/leaflet-routing-machine@3.2.12/dist/leaflet-routing-machine.css";
            document.head.appendChild(routingCssLink);
          }

          // Load the Leaflet Routing Machine script if not already loaded
          if (!document.querySelector('script[src*="leaflet-routing-machine.js"]')) {
            await new Promise<void>((resolve) => {
              const routingScript = document.createElement("script");
              routingScript.src =
                "https://unpkg.com/leaflet-routing-machine@3.2.12/dist/leaflet-routing-machine.js";
              routingScript.onload = () => resolve();
              document.head.appendChild(routingScript);
            });
          }

          setLeafletLoaded(true);
        } catch (error) {
          console.error("Error loading Leaflet:", error);
        }
      };

      importLeaflet();
    } else {
      setLeafletLoaded(true);
    }

    // Don't clean up the scripts and CSS anymore - we want them to persist
    // This prevents flickering from repeated loading
  }, []);

  // Initialize map once Leaflet is loaded and we have user location
  useEffect(() => {
    if (!leafletLoaded || !userLocation || !mapRef.current) return;

    const L = window.L;
    
    // Initialize map only if it doesn't exist yet
    if (!leafletMapRef.current) {
      const map = L.map(mapRef.current).setView(
        [userLocation.latitude, userLocation.longitude],
        16
      );

      // Add OpenStreetMap tiles
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      // Store the map reference
      leafletMapRef.current = map;
    }

    return () => {
      // Do not destroy the map on every re-render
    };
  }, [leafletLoaded, userLocation]);

  // Update map with user location, POIs, and routing
  useEffect(() => {
    if (!leafletLoaded || !leafletMapRef.current || !userLocation) return;

    const L = window.L;
    const map = leafletMapRef.current;

    // Update map view if user location changes
    map.setView([userLocation.latitude, userLocation.longitude], 16);

    // Clear existing user markers
    if (userMarkerRef.current) {
      map.removeLayer(userMarkerRef.current);
    }
    if (userCircleRef.current) {
      map.removeLayer(userCircleRef.current);
    }

    // Clear existing POI markers
    markersRef.current.forEach(marker => {
      map.removeLayer(marker);
    });
    markersRef.current = [];

    // Add accuracy circle
    userCircleRef.current = L.circle(
      [userLocation.latitude, userLocation.longitude],
      {
        radius: 15,
        color: "#3b82f6",
        fillColor: "#60a5fa",
        fillOpacity: 0.3,
        weight: 2,
      }
    ).addTo(map);

    // Create a custom divIcon for the user location
    const userIcon = L.divIcon({
      html: `
        <div style="
          background-color: #3b82f6;
          border: 2px solid white;
          border-radius: 50%;
          width: 16px;
          height: 16px;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5), 0 0 10px rgba(59, 130, 246, 0.7);
        "></div>
      `,
      className: "user-location-marker",
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });

    // Add user marker
    userMarkerRef.current = L.marker(
      [userLocation.latitude, userLocation.longitude],
      {
        icon: userIcon,
        title: "Your location",
        zIndexOffset: 1000, // Ensure user marker is on top
      }
    )
      .addTo(map)
      .bindPopup("You are here");

    // Add POI markers
    pointsOfInterest.forEach((poi) => {
      const isSelected = selectedPOI && selectedPOI.id === poi.id;

      const poiIcon = L.icon({
        iconUrl: isSelected
          ? "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-gold.png"
          : "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png",
        shadowUrl:
          "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      });

      const marker = L.marker([poi.latitude, poi.longitude], {
        icon: poiIcon,
        title: poi.name,
      })
        .addTo(map)
        .bindPopup(
          `<b>${poi.name}</b><br>${poi.type}<br>${poi.distance}m away`
        );
      
      markersRef.current.push(marker);
    });

  }, [leafletLoaded, userLocation, pointsOfInterest, selectedPOI]);

  // Handle routing separately to minimize updates
  useEffect(() => {
    if (!leafletLoaded || !leafletMapRef.current || !userLocation || !selectedPOI) return;

    const L = window.L;
    const map = leafletMapRef.current;

    // Handle directions
    if (showDirections) {
      // Remove existing routing control if it exists
      if (routingControlRef.current) {
        map.removeControl(routingControlRef.current);
        routingControlRef.current = null;
      }

      // Create new routing control for directions
      if (window.L && window.L.Routing) {
        // Ensure the router is available before using it
        if (window.L.Routing.osrmv1) {
          // Create router configuration with options
          const routerConfig: any = {
            profile: transportMode === "foot" ? "foot" : "car",
          };

          // For walking mode, ignore one-way street restrictions
          if (transportMode === "foot") {
            // Add options to ignore one-way restrictions for pedestrians
            routerConfig.steps = true;
            routerConfig.geometryOnly = false;
            // The key setting that ignores one-way streets for pedestrians
            routerConfig.allowUTurns = true;
            // This option specifically tells the router to ignore one-way restrictions for pedestrians
            routerConfig.pedestrianMode = true;
          }

          routingControlRef.current = window.L.Routing.control({
            waypoints: [
              L.latLng(userLocation.latitude, userLocation.longitude),
              L.latLng(selectedPOI.latitude, selectedPOI.longitude),
            ],
            routeWhileDragging: false,
            showAlternatives: true,
            fitSelectedRoutes: true,
            lineOptions: {
              styles: [
                { color: "#6366f1", opacity: 0.8, weight: 6 },
                { color: "#818cf8", opacity: 0.5, weight: 4 },
              ],
            },
            altLineOptions: {
              styles: [{ color: "#64748b", opacity: 0.4, weight: 4 }],
            },
            router: window.L.Routing.osrmv1(routerConfig),
            createMarker: function () {
              return null;
            }, // We already have our own markers
          }).addTo(map);
        }
      }
    } else if (!showDirections && routingControlRef.current) {
      // Remove routing control if directions are no longer needed
      map.removeControl(routingControlRef.current);
      routingControlRef.current = null;
    }
  }, [leafletLoaded, userLocation, selectedPOI, showDirections, transportMode]);

  // Clean up only when component unmounts
  useEffect(() => {
    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, []);

  return (
    <div
      ref={mapRef}
      className="h-60 w-full rounded-md overflow-hidden shadow-md z-10"
    />
  );
};

export default Map;
