// app/embed/map/page.tsx  
"use client";  
  
import { useEffect, useState } from "react";  
import dynamic from "next/dynamic";  
import { listAllPlaces } from "@/src/lib/firestore";  
import { Place } from "@/src/types/place";  
import { ensureAnonAuth } from "@/src/lib/firebase";  
  
// Import MapCanvas dynamically to avoid SSR issues with Leaflet  
const MapCanvas = dynamic(() => import("@/src/components/MapCanvas"), {  
  ssr: false,  
});  
  
// Helper function to calculate distance between two coordinates using Haversine formula  
function distanceM(lat1: number, lng1: number, lat2: number, lng2: number): number {  
  const R = 6371000; // Earth's radius in meters  
  const dLat = ((lat2 - lat1) * Math.PI) / 180;  
  const dLng = ((lng2 - lng1) * Math.PI) / 180;  
  const a =  
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +  
    Math.cos((lat1 * Math.PI) / 180) *  
      Math.cos((lat2 * Math.PI) / 180) *  
      Math.sin(dLng / 2) *  
      Math.sin(dLng / 2);  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));  
  return R * c;  
}  
  
export default function EmbedMapPage() {  
  const [places, setPlaces] = useState<(Place & { distance?: number })[]>([]);  
  const [loading, setLoading] = useState(true);  
  const [error, setError] = useState<string | null>(null);  
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({ lat: 50.0, lng: 10.0 });  
  const [mapZoom, setMapZoom] = useState<number>(5);  
  const [drawerOpen, setDrawerOpen] = useState(false);  
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);  
  const [locationError, setLocationError] = useState<string | null>(null);  
  
  useEffect(() => {  
    (async () => {  
      try {  
        console.log('🔄 Initializing anonymous authentication...');  
        await ensureAnonAuth();  
        console.log('✅ Successful authentication');  
            
        console.log('🔄 Loading places from Firestore...');  
        const data = await listAllPlaces();  
        console.log(`✅ ${data.length} loaded places`);  
                    
        const approvedPlaces = data.filter(p => p.status === 'approved');  
        setPlaces(approvedPlaces);  
          
        // Request user location after loading places  
        requestUserLocation();  
      } catch (err) {  
        console.error('❌ Error:', err);  
        setError(err instanceof Error ? err.message : 'Unknown error');  
      } finally {  
        setLoading(false);  
      }  
    })();  
  }, []);  
  
  // Update map center when user location is obtained  
  useEffect(() => {  
    if (userLocation) {  
      setMapCenter(userLocation);  
      setMapZoom(12);  
    }  
  }, [userLocation]);  
  
  // Sort places by distance when user location is available  
  useEffect(() => {  
    if (userLocation && places.length > 0) {  
      const placesWithDistance = places.map(place => ({  
        ...place,  
        distance: distanceM(  
          userLocation.lat,  
          userLocation.lng,  
          place.coords.lat,  
          place.coords.lng  
        )  
      }));  
        
      const sortedPlaces = placesWithDistance.sort((a, b) => (a.distance || 0) - (b.distance || 0));  
      setPlaces(sortedPlaces);  
    }  
  }, [userLocation]);  
  
  function requestUserLocation() {  
    if (navigator.geolocation) {  
      navigator.geolocation.getCurrentPosition(  
        (position) => {  
          const location = {  
            lat: position.coords.latitude,  
            lng: position.coords.longitude  
          };  
          setUserLocation(location);  
          setLocationError(null);  
          console.log('✅ User location obtained:', location);  
        },  
        (error) => {  
          console.error("Error getting location:", error);  
          setLocationError("Location access denied. Using default location.");  
          setUserLocation({ lat: 50.0, lng: 10.0 });  
        }  
      );  
    } else {  
      setLocationError("Geolocation not supported by browser.");  
      setUserLocation({ lat: 50.0, lng: 10.0 });  
    }  
  }  
  
  const handlePlaceClick = (place: Place & { distance?: number }) => {  
    setMapCenter({ lat: place.coords.lat, lng: place.coords.lng });  
    setMapZoom(15);  
    setDrawerOpen(false);  
  };  
  
  if (loading) {  
    return (  
      <div style={{     
        width: '100vw',     
        height: '100vh',     
        display: 'flex',     
        alignItems: 'center',     
        justifyContent: 'center',     
        background: '#0B0B0B'     
      }}>  
        <div style={{ textAlign: 'center' }}>  
          <div style={{     
            display: 'inline-block',     
            width: '48px',     
            height: '48px',     
            border: '4px solid #A4CB3E',     
            borderTopColor: 'transparent',     
            borderRadius: '50%',     
            animation: 'spin 1s linear infinite',     
            marginBottom: '16px'     
          }}></div>  
          <p style={{ color: '#B6B9BF', fontSize: '18px' }}>Loading map...</p>  
        </div>  
        <style jsx>{`  
          @keyframes spin {  
            to { transform: rotate(360deg); }  
          }  
        `}</style>  
      </div>  
    );  
  }  
  
  if (error) {  
    return (  
      <div style={{     
        width: '100vw',     
        height: '100vh',     
        display: 'flex',     
        alignItems: 'center',     
        justifyContent: 'center',     
        background: '#0B0B0B'     
      }}>  
        <div style={{ textAlign: 'center', padding: '40px', color: '#FF60A8' }}>  
          <p>Error loading map: {error}</p>  
          <button     
            onClick={() => window.location.reload()}    
            style={{    
              marginTop: '20px',    
              padding: '10px 20px',    
              background: '#A4CB3E',    
              color: '#0B0B0B',    
              border: 'none',    
              borderRadius: '9999px',    
              cursor: 'pointer',    
              fontWeight: 'bold'    
            }}    
          >    
            Retry    
          </button>  
        </div>  
      </div>  
    );  
  }  
  
  return (  
    <div style={{     
      width: '100vw',     
      height: '100vh',     
      position: 'relative',    
      background: '#0B0B0B',    
      overflow: 'hidden'    
    }}>  
      {/* Mapa a pantalla completa */}  
      <div style={{ width: '100%', height: '100%', position: 'relative' }}>  
        <MapCanvas    
          height="100vh"    
          center={mapCenter}    
          zoom={mapZoom}    
          markers={places.map(p => ({ id: p.id!, lat: p.coords.lat, lng: p.coords.lng }))}    
        />  
      </div>  
  
      {/* Botón flotante para abrir drawer */}  
      <button    
        onClick={() => setDrawerOpen(!drawerOpen)}    
        style={{    
          position: 'fixed',    
          bottom: '24px',    
          right: '24px',    
          width: '56px',    
          height: '56px',    
          borderRadius: '50%',    
          background: '#A4CB3E',    
          border: 'none',    
          cursor: 'pointer',    
          display: 'flex',    
          alignItems: 'center',    
          justifyContent: 'center',    
          fontSize: '24px',    
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',    
          zIndex: 1000,    
          transition: 'transform 0.2s'    
        }}    
        onMouseEnter={(e) => {    
          e.currentTarget.style.transform = 'scale(1.1)';    
        }}    
        onMouseLeave={(e) => {    
          e.currentTarget.style.transform = 'scale(1)';    
        }}    
      >    
        {drawerOpen ? '✕' : '🌿'}    
      </button>  
  
      {/* Overlay oscuro cuando el drawer está abierto */}  
      {drawerOpen && (    
        <div    
          onClick={() => setDrawerOpen(false)}    
          style={{    
            position: 'fixed',    
            top: 0,    
            left: 0,    
            width: '100%',    
            height: '100%',    
            background: 'rgba(0, 0, 0, 0.5)',    
            zIndex: 1001,    
            animation: 'fadeIn 0.3s ease-out'    
          }}    
        />    
      )}  
  
      {/* Drawer deslizable desde abajo */}  
      <div    
        className="drawer-scroll"    
        style={{    
          position: 'fixed',    
          bottom: 0,    
          left: 0,    
          width: '100%',    
          maxHeight: '70vh',    
          background: '#0F0F0F',    
          borderTopLeftRadius: '24px',    
          borderTopRightRadius: '24px',    
          boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.5)',    
          transform: drawerOpen ? 'translateY(0)' : 'translateY(100%)',    
          transition: 'transform 0.3s ease-out',    
          zIndex: 1002,    
          overflowY: 'auto',    
          padding: '24px'    
        }}    
      >    
        {/* Handle visual para indicar que se puede deslizar */}  
        <div style={{    
          width: '40px',    
          height: '4px',    
          background: '#2A2A2A',    
          borderRadius: '2px',    
          margin: '0 auto 20px',    
          cursor: 'pointer'    
        }} onClick={() => setDrawerOpen(false)} />  
  
        <h2 style={{     
          fontSize: '24px',     
          fontWeight: 'bold',     
          marginBottom: '20px',     
          color: '#F5F5F5',    
          margin: '0 0 20px 0'    
        }}>    
          🌿 Calm Places ({places.length})    
          {locationError && (  
            <span style={{ fontSize: '12px', color: '#FF60A8', marginLeft: '8px' }}>  
              ⚠️ {locationError}  
            </span>  
          )}  
        </h2>  
  
        {places.length === 0 ? (    
          <div style={{ textAlign: 'center', padding: '40px', color: '#B6B9BF' }}>    
            <p>No places yet</p>    
          </div>    
        ) : (    
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>    
            {places.map(place => (    
              <div    
                key={place.id}    
                onClick={() => handlePlaceClick(place)}    
                style={{    
                  padding: '16px',    
                  background: '#111111',    
                  borderRadius: '12px',    
                  border: '1px solid #242424',    
                  cursor: 'pointer',    
                  transition: 'all 0.2s'    
                }}    
                onMouseEnter={(e) => {    
                  e.currentTarget.style.background = '#1A1A1A';    
                  e.currentTarget.style.borderColor = 'rgba(164, 203, 62, 0.3)';    
                }}    
                onMouseLeave={(e) => {    
                  e.currentTarget.style.background = '#111111';    
                  e.currentTarget.style.borderColor = '#242424';    
                }}    
              >    
                {/* Header with name, place type icon, city badge, and distance */}  
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '8px' }}>    
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>    
                    <div style={{     
                      fontWeight: 'bold',     
                      fontSize: '16px',     
                      color: '#F5F5F5'    
                    }}>    
                      {place.name}    
                    </div>    
                    {place.placeType && (    
                      <span style={{ fontSize: '16px' }}>    
                        {place.placeType === 'park' ? '🌳' : '☕'}    
                      </span>    
                    )}    
                  </div>    
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>  
                    {place.city && (    
                      <span style={{    
                        fontSize: '12px',    
                        fontWeight: '600',    
                        color: '#B6B9BF',    
                        background: '#1F1F1F',    
                        padding: '4px 8px',    
                        borderRadius: '999px',    
                        whiteSpace: 'nowrap'    
                      }}>    
                        📍 {place.city}    
                      </span>    
                    )}  
                    {userLocation && place.distance !== undefined && (  
                      <span style={{  
                        fontSize: '12px',  
                        fontWeight: '600',  
                        color: '#A4CB3E',  
                        background: 'rgba(164, 203, 62, 0.1)',  
                        padding: '4px 8px',  
                        borderRadius: '999px',  
                        whiteSpace: 'nowrap'  
                      }}>  
                        📏 {(place.distance / 1000).toFixed(1)} km  
                      </span>  
                    )}  
                  </div>  
                </div>  
  
                {/* Address */}  
                {place.address && (    
                  <div style={{     
                    fontSize: '12px',     
                    color: '#B6B9BF',    
                    marginBottom: '8px'    
                  }}>    
                    📍 {place.address}    
                  </div>    
                )}  
  
                {/* Schedule */}  
                {place.schedule && (    
                  <div style={{     
                    fontSize: '12px',     
                    color: '#B6B9BF',    
                    marginBottom: '8px'    
                  }}>    
                    🕐 {place.schedule}    
                  </div>    
                )}  
  
                {/* Description */}  
                {place.description && (    
                  <div style={{     
                    fontSize: '14px',     
                    color: '#B6B9BF',    
                    lineHeight: '1.5',    
                    marginBottom: '8px'    
                  }}>    
                    {place.description}    
                  </div>    
                )}  
  
                {/* Tags */}  
                {place.tags && place.tags.length > 0 && (    
                  <div style={{     
                    fontSize: '12px',     
                    color: '#B6B9BF',    
                    marginTop: '8px'    
                  }}>    
                    #{place.tags.join(' #')}    
                  </div>    
                )}  
              </div>    
            ))}    
          </div>    
        )}    
      </div>  
  
      <style jsx>{`    
        @keyframes spin {    
          to { transform: rotate(360deg); }    
        }    
    
        @keyframes fadeIn {    
          from { opacity: 0; }    
          to { opacity: 1; }    
        }    
    
        .drawer-scroll::-webkit-scrollbar {    
          width: 8px;    
        }    
    
        .drawer-scroll::-webkit-scrollbar-track {    
          background: #0F0F0F;    
          border-radius: 4px;    
        }    
    
        .drawer-scroll::-webkit-scrollbar-thumb {    
          background: #2A2A2A;    
          border-radius: 4px;    
        }    
    
        .drawer-scroll::-webkit-scrollbar-thumb:hover {    
          background: #A4CB3E;    
        }    
      `}</style>    
    </div>    
  );  
}