// app/embed/map/page.tsx  
"use client";  
  
import { useEffect, useState } from "react";  
import dynamic from "next/dynamic";  
import { listLatestPlaces } from "@/src/lib/firestore";  
import { Place } from "@/src/types/place";  
import { ensureAnonAuth } from "@/src/lib/firebase";  
  
// Importar MapCanvas dinámicamente para evitar SSR issues con Leaflet  
const MapCanvas = dynamic(() => import("@/src/components/MapCanvas"), {  
  ssr: false,  
});  
  
export default function EmbedMapPage() {  
  const [places, setPlaces] = useState<Place[]>([]);  
  const [loading, setLoading] = useState(true);  
  const [error, setError] = useState<string | null>(null);  
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({ lat: 50.0, lng: 10.0 });  
  const [mapZoom, setMapZoom] = useState<number>(5);  
  
  useEffect(() => {  
    (async () => {  
      try {  
        console.log('🔄 Initializing anonymous authentication...');  
        await ensureAnonAuth();  
        console.log('✅ Successful authentication');  
  
        console.log('🔄 Loading places from Firestore...');  
        const data = await listLatestPlaces(100);  
        console.log(`✅ ${data.length} loaded places`);  
          
        setPlaces(data.filter(p => p.status === 'approved'));  
      } catch (err) {  
        console.error('❌ Error:', err);  
        setError(err instanceof Error ? err.message : 'Unknown error');  
      } finally {  
        setLoading(false);  
      }  
    })();  
  }, []);  
  
  const handlePlaceClick = (place: Place) => {  
    setMapCenter({ lat: place.coords.lat, lng: place.coords.lng });  
    setMapZoom(15);  
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
          <p>Error al cargar el mapa: {error}</p>  
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
            Reintentar  
          </button>  
        </div>  
      </div>  
    );  
  }  
  
  return (  
    <div style={{   
      width: '100vw',   
      height: '100vh',   
      display: 'flex',   
      background: '#0B0B0B',  
      overflow: 'hidden'  
    }}>  
      {/* Mapa */}  
      <div style={{ flex: 1, position: 'relative' }}>  
        <MapCanvas  
          height="100vh"  
          center={mapCenter}  
          zoom={mapZoom}  
          markers={places.map(p => ({ id: p.id!, lat: p.coords.lat, lng: p.coords.lng }))}  
        />  
      </div>  
  
      {/* Lista lateral */}  
      <div style={{   
        width: '400px',   
        height: '100vh',   
        overflowY: 'auto',   
        background: '#0F0F0F',  
        borderLeft: '1px solid #242424',  
        padding: '20px'  
      }}>  
        <h2 style={{   
          fontSize: '24px',   
          fontWeight: 'bold',   
          marginBottom: '20px',   
          color: '#F5F5F5'   
        }}>  
          🌿 Lugares calmados  
        </h2>  
  
        {places.length === 0 ? (  
          <div style={{ textAlign: 'center', padding: '40px', color: '#B6B9BF' }}>  
            <p>No hay lugares todavía</p>  
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
                <div style={{   
                  fontWeight: 'bold',   
                  fontSize: '16px',   
                  color: '#F5F5F5',  
                  marginBottom: '8px'  
                }}>  
                  {place.name}  
                </div>  
                {place.city && (  
                  <div style={{   
                    fontSize: '12px',   
                    color: '#B6B9BF',  
                    marginBottom: '8px'  
                  }}>  
                    📍 {place.city}  
                  </div>  
                )}  
                {place.description && (  
                  <div style={{   
                    fontSize: '14px',   
                    color: '#B6B9BF',  
                    lineHeight: '1.5'  
                  }}>  
                    {place.description}  
                  </div>  
                )}  
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
    </div>  
  );  
}