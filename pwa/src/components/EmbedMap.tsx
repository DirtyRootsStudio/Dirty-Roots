// src/components/EmbedMap.tsx      
"use client";      
      
import { useEffect, useState } from "react";      
import dynamic from "next/dynamic";      
import { listAllPlaces  } from "@/src/lib/firestore";      
import { Place } from "@/src/types/place";      
      
// Import MapCanvas dynamically to avoid SSR      
const MapCanvas = dynamic(() => import("./MapCanvas"), { ssr: false });      
      
export default function EmbedMap() {      
  const [places, setPlaces] = useState<Place[]>([]);      
  const [loading, setLoading] = useState(true);      
  const [error, setError] = useState<string | null>(null);      
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({       
    lat: 50.0,       
    lng: 10.0       
  });      
  const [mapZoom, setMapZoom] = useState<number>(5);      
      
  useEffect(() => {      
    (async () => {      
      try {      
        console.log('🔄 Loading places from Firestore...');      
        const data = await listAllPlaces();
        console.log(`✅ ${data.length} places loaded`);      
        setPlaces(data);      
      } catch (err) {      
        console.error('❌ Error loading places:', err);      
        setError('Error loading places. Please reload the page.');      
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
        minHeight: '100vh',       
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
          <p style={{ color: '#B6B9BF', fontSize: '18px' }}>      
            Loading calm places...      
          </p>      
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
        minHeight: '100vh',       
        display: 'flex',       
        alignItems: 'center',       
        justifyContent: 'center',       
        background: '#0B0B0B',      
        padding: '32px'      
      }}>      
        <div style={{       
          textAlign: 'center',      
          background: '#0F0F0F',      
          padding: '40px',      
          borderRadius: '24px',      
          border: '1px solid #242424'      
        }}>      
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>      
          <p style={{ color: '#FF60A8', fontSize: '18px', marginBottom: '16px' }}>      
            {error}      
          </p>      
          <button       
            onClick={() => window.location.reload()}      
            style={{      
              padding: '12px 24px',      
              borderRadius: '9999px',      
              background: '#A4CB3E',      
              color: '#0B0B0B',      
              fontWeight: 'bold',      
              border: 'none',      
              cursor: 'pointer',      
              fontSize: '14px'      
            }}      
          >      
            Reload      
          </button>      
        </div>      
      </div>      
    );      
  }      
      
  return (      
    <div style={{       
      minHeight: '100vh',       
      background: '#0B0B0B',       
      padding: '24px',      
      display: 'flex',      
      gap: '24px'      
    }}>      
      {/* Map - Left column */}      
      <div style={{       
        flex: '1',      
        borderRadius: '24px',       
        overflow: 'hidden',      
        border: '1px solid #222222',      
        background: '#111111',      
        minHeight: '600px',      
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'      
      }}>      
        <MapCanvas      
          height="100%"      
          center={mapCenter}      
          zoom={mapZoom}      
          markers={places.map(p => ({       
            id: p.id!,       
            lat: p.coords.lat,       
            lng: p.coords.lng       
          }))}      
        />      
      </div>      
      
      {/* Places list - Right column */}      
      <div style={{       
        width: '400px',      
        display: 'flex',      
        flexDirection: 'column',      
        gap: '16px'      
      }}>      
        <div style={{       
          position: 'sticky',       
          top: 0,       
          background: '#0B0B0B',       
          padding: '12px 0',       
          zIndex: 10       
        }}>      
          <h2 style={{       
            fontSize: '24px',       
            fontWeight: 'bold',       
            color: '#F5F5F5',      
            margin: 0      
          }}>      
            🌿 {places.length} {places.length === 1 ? 'place' : 'places'}      
          </h2>      
        </div>      
      
        <div style={{       
          display: 'flex',       
          flexDirection: 'column',       
          gap: '16px',       
          maxHeight: 'calc(100vh - 100px)',       
          overflowY: 'auto',      
          paddingRight: '8px'      
        }}>      
          {places.length === 0 ? (      
            <div style={{       
              borderRadius: '24px',       
              padding: '40px',       
              textAlign: 'center',      
              border: '1px solid #242424',      
              background: '#0F0F0F'      
            }}>      
              <div style={{ fontSize: '56px', marginBottom: '24px' }}>🌿</div>      
              <p style={{       
                marginBottom: '0',       
                fontSize: '20px',       
                color: '#B6B9BF'       
              }}>      
                No places yet      
              </p>      
            </div>      
          ) : (      
            places.map(place => (      
              <div      
                key={place.id}      
                onClick={() => handlePlaceClick(place)}      
                style={{      
                  borderRadius: '24px',      
                  padding: '20px',      
                  border: '1px solid #242424',      
                  background: '#0F0F0F',      
                  cursor: 'pointer',      
                  transition: 'all 0.2s',      
                  position: 'relative'      
                }}      
                onMouseEnter={(e) => {      
                  e.currentTarget.style.background = '#111111';      
                  e.currentTarget.style.borderColor = 'rgba(164, 203, 62, 0.3)';      
                }}      
                onMouseLeave={(e) => {      
                  e.currentTarget.style.background = '#0F0F0F';      
                  e.currentTarget.style.borderColor = '#242424';      
                }}      
              >      
                {/* Header with name, place type icon, and city badge */}    
                <div style={{       
                  display: 'flex',       
                  justifyContent: 'space-between',       
                  alignItems: 'flex-start',       
                  marginBottom: '8px'       
                }}>      
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>    
                    <h3 style={{       
                      fontSize: '18px',       
                      fontWeight: 'bold',       
                      color: '#F5F5F5',      
                      margin: 0    
                    }}>      
                      {place.name}      
                    </h3>    
                    {place.placeType && (    
                      <span style={{ fontSize: '16px' }}>    
                        {place.placeType === 'park' ? '🌳' : '☕'}    
                      </span>    
                    )}    
                  </div>    
                  {place.city && (      
                    <span style={{       
                      fontSize: '12px',       
                      fontWeight: '600',  
                      color: '#B6B9BF',       
                      background: '#111111',       
                      padding: '4px 8px',       
                      borderRadius: '999px',      
                      marginLeft: '8px',  
                      whiteSpace: 'nowrap'  
                    }}>      
                      📍 {place.city}      
                    </span>      
                  )}      
                </div>      
    
                {/* Address - separate from city */}    
                {place.address && (    
                  <p style={{       
                    fontSize: '12px',       
                    color: '#B6B9BF',       
                    lineHeight: '1.4',      
                    margin: '0 0 8px 0'      
                  }}>      
                    📍 {place.address}      
                  </p>      
                )}    
    
                {/* Schedule */}    
                {place.schedule && (    
                  <p style={{       
                    fontSize: '12px',       
                    color: '#B6B9BF',       
                    lineHeight: '1.4',      
                    margin: '0 0 12px 0'      
                  }}>      
                    🕐 {place.schedule}      
                  </p>      
                )}    
      
                {place.description && (      
                  <p style={{       
                    fontSize: '14px',       
                    color: '#B6B9BF',       
                    lineHeight: '1.6',      
                    margin: '0 0 12px 0'      
                  }}>      
                    {place.description}      
                  </p>      
                )}      
      
                {place.photo && (      
                  <div style={{       
                    width: '100%',       
                    height: '150px',       
                    borderRadius: '12px',       
                    overflow: 'hidden',      
                    marginBottom: '12px'      
                  }}>      
                    <img       
                      src={place.photo}       
                      alt={place.name}      
                      style={{       
                        width: '100%',       
                        height: '100%',       
                        objectFit: 'cover'       
                      }}      
                    />      
                  </div>      
                )}      
      
                {/* Tags only - noiseLevel removed */}    
                {place.tags && place.tags.length > 0 && (    
                  <div style={{       
                    display: 'flex',       
                    alignItems: 'center',       
                    gap: '8px',    
                    fontSize: '14px',      
                    paddingTop: '12px',      
                    borderTop: '1px solid #1F1F1F',      
                    color: '#B6B9BF'      
                  }}>      
                    <span style={{       
                      background: '#1F1F1F',      
                      padding: '6px 12px',      
                      borderRadius: '9999px',      
                      fontSize: '12px'      
                    }}>      
                      #{place.tags.join(' #')}      
                    </span>      
                  </div>      
                )}    
              </div>      
            ))      
          )}      
        </div>      
      </div>      
      
      <style jsx>{`      
        /* Custom scrollbar */      
        div::-webkit-scrollbar {      
          width: 8px;      
        }      
              
        div::-webkit-scrollbar-track {      
          background: #0F0F0F;      
          border-radius: 4px;      
        }      
              
        div::-webkit-scrollbar-thumb {      
          background: #2A2A2A;      
          border-radius: 4px;      
        }      
              
        div::-webkit-scrollbar-thumb:hover {      
          background: #A4CB3E;      
        }      
      `}</style>      
    </div>      
  );      
}