import React, { useEffect, useRef } from "react";
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

  useEffect(() => {
    // Dynamically import Leaflet since it requires window object
    const importLeaflet = async () => {
      try {
        // Import both the Leaflet library and its CSS
        const L = await import("leaflet");

        // Manually import the CSS
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        link.integrity = "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=";
        link.crossOrigin = "";
        document.head.appendChild(link);

        // Import Leaflet Routing Machine CSS and library
        const routingCssLink = document.createElement("link");
        routingCssLink.rel = "stylesheet";
        routingCssLink.href =
          "https://unpkg.com/leaflet-routing-machine@3.2.12/dist/leaflet-routing-machine.css";
        document.head.appendChild(routingCssLink);

        // Need to load the Leaflet Routing Machine as a script
        // since dynamic import isn't working properly
        await new Promise<void>((resolve) => {
          const routingScript = document.createElement("script");
          routingScript.src =
            "https://unpkg.com/leaflet-routing-machine@3.2.12/dist/leaflet-routing-machine.js";
          routingScript.onload = () => resolve();
          document.head.appendChild(routingScript);
        });

        // If map doesn't exist and we have user location, initialize it
        if (!leafletMapRef.current && userLocation && mapRef.current) {
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

        // Update map view if user location changes
        if (leafletMapRef.current && userLocation) {
          leafletMapRef.current.setView(
            [userLocation.latitude, userLocation.longitude],
            16
          );

          // Clear existing markers
          leafletMapRef.current.eachLayer((layer: any) => {
            if (layer instanceof L.Marker || layer instanceof L.Circle) {
              leafletMapRef.current.removeLayer(layer);
            }
          });

          // Add user location marker with improved visibility
          // Remove previous user location markers if they exist
          if (userMarkerRef.current) {
            leafletMapRef.current.removeLayer(userMarkerRef.current);
          }
          if (userCircleRef.current) {
            leafletMapRef.current.removeLayer(userCircleRef.current);
          }

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
          ).addTo(leafletMapRef.current);

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
            .addTo(leafletMapRef.current)
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

            L.marker([poi.latitude, poi.longitude], {
              icon: poiIcon,
              title: poi.name,
            })
              .addTo(leafletMapRef.current)
              .bindPopup(
                `<b>${poi.name}</b><br>${poi.type}<br>${poi.distance}m away`
              );
          });

          // Add directions if showDirections is true and there's a selected POI
          if (showDirections && selectedPOI) {
            // Remove existing routing control if it exists
            if (routingControlRef.current) {
              leafletMapRef.current.removeControl(routingControlRef.current);
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
                }).addTo(leafletMapRef.current);
              } else {
                console.error(
                  "Leaflet Routing Machine OSRM router not loaded correctly"
                );
              }
            }
          } else if (!showDirections && routingControlRef.current) {
            // Remove routing control if directions are no longer needed
            leafletMapRef.current.removeControl(routingControlRef.current);
            routingControlRef.current = null;
          }
        }
      } catch (error) {
        console.error("Error loading Leaflet:", error);
      }
    };

    importLeaflet();

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
      // Remove the dynamically added CSS when the component unmounts
      const leafletCSS = document.querySelector('link[href*="leaflet.css"]');
      if (leafletCSS) {
        document.head.removeChild(leafletCSS);
      }
      const routingCSS = document.querySelector(
        'link[href*="leaflet-routing-machine.css"]'
      );
      if (routingCSS) {
        document.head.removeChild(routingCSS);
      }
      // Also remove the script
      const routingScript = document.querySelector(
        'script[src*="leaflet-routing-machine.js"]'
      );
      if (routingScript) {
        document.head.removeChild(routingScript);
      }
    };
  }, [
    userLocation,
    pointsOfInterest,
    selectedPOI,
    showDirections,
    transportMode,
  ]);

  return (
    <div
      ref={mapRef}
      className="h-60 w-full rounded-md overflow-hidden shadow-md z-10"
    />
  );
};

export default Map;
