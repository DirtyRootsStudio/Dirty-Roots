// pwa/app/seasonal-toolkit/embed/page.tsx  
"use client";  
  
import { useEffect, useState } from "react";  
import dynamic from "next/dynamic";  
import { ensureAnonAuth } from "@/src/lib/firebase";  
import { listSeasonalToolkits, SeasonalToolkit  } from "@/src/lib/firestore";  
  
// Import MapCanvas dynamically to avoid SSR issues with Leaflet  
const MapCanvas = dynamic(() => import("@/src/components/MapCanvas"), {  
  ssr: false,  
});  
  
export default function EmbedSeasonalToolkitPage() {  
  const [mounted, setMounted] = useState(false);  
  const [toolkits, setToolkits] = useState<SeasonalToolkit[]>([]);
  const [loading, setLoading] = useState(true);  
  const [selectedToolkit, setSelectedToolkit] = useState<SeasonalToolkit | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);  
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);  
  const [locationError, setLocationError] = useState<string | null>(null);  
  const [sunPosition, setSunPosition] = useState<{lat: number, lng: number} | null>(null);  
  const [mapCenter, setMapCenter] = useState<{lat: number, lng: number}>({ lat: 50.0, lng: 10.0 });  
  const [mapZoom, setMapZoom] = useState<number>(15);  
  const [mapKey, setMapKey] = useState(0);  
  
  // Primer useEffect: marcar como montado  
  useEffect(() => {  
    setMounted(true);  
  }, []);  
  
  // Segundo useEffect: cargar datos después de montar  
  useEffect(() => {  
    if (!mounted) return;  
  
    (async () => {  
      try {  
        await ensureAnonAuth();  
        await loadToolkits();  
        requestUserLocation();  
      } catch (error) {  
        console.error("Error initializing:", error);  
      }  
    })();  
  }, [mounted]);  
  
  // Actualizar mapCenter cuando se obtiene la ubicación del usuario  
  useEffect(() => {  
    if (userLocation) {  
      setMapCenter(userLocation);  
    }  
  }, [userLocation]);  
  
  // Calcular posición del sol cuando tenemos ubicación  
  useEffect(() => {  
    if (!userLocation) return;  
  
    const now = new Date();  
    const hour = now.getHours();  
    const minute = now.getMinutes();  
    const timeDecimal = hour + minute / 60;  
  
    // Aproximación simple: el sol se mueve de este a oeste  
    let azimuthDegrees = 90 + ((timeDecimal - 6) / 12) * 180;  
    azimuthDegrees = ((azimuthDegrees % 360) + 360) % 360;  
  
    const distance = 0.005;  
    const azimuthRad = (azimuthDegrees * Math.PI) / 180;  
      
    const sunLat = userLocation.lat + distance * Math.cos(azimuthRad);  
    const sunLng = userLocation.lng + distance * Math.sin(azimuthRad);  
  
    setSunPosition({ lat: sunLat, lng: sunLng });  
  }, [userLocation]);  
  
  async function loadToolkits() {  
    try {  
      const allToolkits = await listSeasonalToolkits(50);  
        
      const now = new Date();  
      const activeToolkits = allToolkits.filter(t => {  
        const from = t.activeFrom.toDate();  
        const to = t.activeTo.toDate();  
        return now >= from && now <= to;  
      });  
        
      setToolkits(activeToolkits);  
    } catch (error) {  
      console.error("Error loading toolkits:", error);  
    } finally {  
      setLoading(false);  
    }  
  }  
  
  function requestUserLocation() {  
    if (navigator.geolocation) {  
      navigator.geolocation.getCurrentPosition(  
        (position) => {  
          setUserLocation({  
            lat: position.coords.latitude,  
            lng: position.coords.longitude  
          });  
          setLocationError(null);  
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
  
  // Función para recentrar el mapa  
  const handleRecenter = () => {  
    if (userLocation) {  
      setMapCenter(userLocation);  
      setMapZoom(15);  
      setMapKey(prev => prev + 1); // Forzar re-render del mapa  
    }  
  };  
  
  const handleOpenKit = (toolkit: SeasonalToolkit) => {  
    setSelectedToolkit(toolkit);  
    setDrawerOpen(true);  
  };  
  
  const seasonEmojis = {  
    winter: '❄️',  
    spring: '🌱',  
    summer: '☀️',  
    autumn: '🍂'  
  };  
  
  if (!mounted || loading) {  
    return (  
      <div style={{  
        width: '100%',  
        minHeight: '600px',  
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
          <p style={{ color: '#B6B9BF', fontSize: '18px' }}>Loading seasonal toolkit...</p>  
        </div>  
      </div>  
    );  
  }  
  
  return (  
    <div style={{  
      width: '100%',  
      minHeight: '600px',  
      background: '#0B0B0B',  
      padding: '24px',  
      boxSizing: 'border-box'  
    }}>  
      {/* Header */}  
      <div style={{  
        marginBottom: '32px',  
        textAlign: 'center'  
      }}>  
        <h1 style={{  
          fontSize: '32px',  
          fontWeight: 'bold',  
          color: '#F5F5F5',  
          marginBottom: '8px'  
        }}>  
          🌿 LITFA Seasonal Toolkit  
        </h1>  
        <p style={{  
          fontSize: '16px',  
          color: '#B6B9BF',  
          lineHeight: '1.5'  
        }}>  
          Simple, practical guides for each season — done the LITFA way.  
        </p>  
      </div>  
  
      {/* Toolkits Grid */}  
      {toolkits.length === 0 ? (  
        <div style={{  
          textAlign: 'center',  
          padding: '60px 20px',  
          color: '#B6B9BF'  
        }}>  
          <p style={{ fontSize: '18px' }}>No active seasonal toolkit at the moment.</p>  
          <p style={{ fontSize: '14px', marginTop: '8px' }}>Check back soon!</p>  
        </div>  
      ) : (  
        <div style={{  
          display: 'grid',  
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',  
          gap: '24px',  
          maxWidth: '1200px',  
          margin: '0 auto'  
        }}>  
          {toolkits.map((toolkit) => (  
            <div  
              key={toolkit.id}  
              style={{  
                background: '#0F0F0F',  
                borderRadius: '24px',  
                border: '1px solid #242424',  
                padding: '24px',  
                cursor: 'pointer',  
                transition: 'all 0.2s',  
                position: 'relative'  
              }}  
              onMouseEnter={(e) => {  
                e.currentTarget.style.borderColor = 'rgba(164, 203, 62, 0.3)';  
                e.currentTarget.style.transform = 'translateY(-4px)';  
              }}  
              onMouseLeave={(e) => {  
                e.currentTarget.style.borderColor = '#242424';  
                e.currentTarget.style.transform = 'translateY(0)';  
              }}  
              onClick={() => handleOpenKit(toolkit)}  
            >  
              <div style={{  
                position: 'absolute',  
                top: '16px',  
                right: '16px',  
                padding: '6px 12px',  
                background: '#1F1F1F',  
                borderRadius: '9999px',  
                fontSize: '14px',  
                color: '#F5F5F5',  
                fontWeight: '600'  
              }}>  
                {seasonEmojis[toolkit.season as keyof typeof seasonEmojis]}  
              </div>  
  
              <h2 style={{  
                fontSize: '24px',  
                fontWeight: 'bold',  
                color: '#F5F5F5',  
                marginBottom: '12px',  
                paddingRight: '60px'  
              }}>  
                {toolkit.title}  
              </h2>  
  
              <p style={{  
                fontSize: '14px',  
                color: '#B6B9BF',  
                lineHeight: '1.6',  
                marginBottom: '16px'  
              }}>  
                {toolkit.description}  
              </p>  
  
              <div style={{  
                padding: '12px 16px',  
                background: '#0B0B0B',  
                borderRadius: '12px',  
                border: '1px solid #2A2A2A',  
                marginBottom: '16px'  
              }}>  
                <p style={{  
                  fontSize: '14px',  
                  color: '#A4CB3E',  
                  fontStyle: 'italic',  
                  margin: 0  
                }}>  
                  &quot;{toolkit.calmReminder}&quot;
                </p>  
              </div>  
  
              <button  
                style={{  
                  width: '100%',  
                  padding: '12px',  
                  background: 'transparent',  
                  border: '1px solid #A4CB3E',  
                  borderRadius: '12px',  
                  color: '#A4CB3E',  
                  fontSize: '14px',  
                  fontWeight: '600',  
                  cursor: 'pointer',  
                  transition: 'all 0.2s'  
                }}  
                onMouseEnter={(e) => {  
                  e.currentTarget.style.background = '#A4CB3E';  
                  e.currentTarget.style.color = '#0B0B0B';  
                }}  
                onMouseLeave={(e) => {  
                  e.currentTarget.style.background = 'transparent';  
                  e.currentTarget.style.color = '#A4CB3E';  
                }}  
              >  
                Open Kit →  
              </button>  
            </div>  
          ))}  
        </div>  
      )}  
  
      {/* Overlay */}  
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
  
      {/* Drawer con contenido del toolkit */}  
      <div  
        className="drawer-scroll"  
        style={{  
          position: 'fixed',  
          bottom: 0,  
          left: 0,  
          width: '100%',  
          maxHeight: '85vh',  
          background: '#0F0F0F',  
          borderTopLeftRadius: '20px',  
          borderTopRightRadius: '20px',  
          boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.5)',  
          transform: drawerOpen ? 'translateY(0)' : 'translateY(100%)',  
          transition: 'transform 0.3s ease-out',  
          zIndex: 1002,  
          overflowY: 'auto',  
          padding: '20px 24px',  
          boxSizing: 'border-box',  
          scrollbarWidth: 'none',  
          msOverflowStyle: 'none'  
        }}  
      >  
        <div style={{  
          width: '40px',  
          height: '4px',  
          background: '#2A2A2A',  
          borderRadius: '2px',  
          margin: '0 auto 20px',  
          cursor: 'pointer'  
        }} onClick={() => setDrawerOpen(false)} />  
  
        {selectedToolkit && (  
          <div>  
            {/* Header */}  
            <div style={{ marginBottom: '24px' }}>  
              <div style={{  
                display: 'flex',  
                alignItems: 'center',  
                gap: '12px',  
                marginBottom: '12px'  
              }}>  
                <span style={{ fontSize: '32px' }}>  
                  {seasonEmojis[selectedToolkit.season as keyof typeof seasonEmojis]}  
                </span>  
                <h2 style={{  
                  fontSize: '28px',  
                  fontWeight: 'bold',  
                  color: '#F5F5F5',  
                  margin: 0  
                }}>  
                  {selectedToolkit.title}  
                </h2>  
              </div>  
              <p style={{  
                fontSize: '16px',  
                color: '#B6B9BF',  
                lineHeight: '1.6',  
                margin: 0  
              }}>  
                {selectedToolkit.description}  
              </p>  
            </div>  
  
            {/* Calm Reminder */}  
            <div style={{  
              padding: '20px',  
              background: '#0B0B0B',  
              borderRadius: '16px',  
              border: '1px solid #2A2A2A',  
              marginBottom: '32px'  
            }}>  
              <p style={{  
                fontSize: '16px',  
                color: '#A4CB3E',  
                fontStyle: 'italic',  
                lineHeight: '1.6',  
                margin: 0  
              }}>  
                &quot;{selectedToolkit.calmReminder}&quot;
              </p>  
            </div>  
  
            {/* Checklist */}  
            <div style={{ marginBottom: '32px' }}>  
              <h3 style={{  
                fontSize: '20px',  
                fontWeight: 'bold',  
                color: '#F5F5F5',  
                marginBottom: '16px '
                              }}>  
                ✓ Calm Checklist  
              </h3>  
              <ul style={{  
                listStyle: 'none',  
                padding: 0,  
                margin: 0  
              }}>  
                {selectedToolkit.checklist.map((item: string, index: number) => (  
                  <li key={index} style={{  
                    padding: '12px 16px',  
                    background: '#0B0B0B',  
                    borderRadius: '12px',  
                    border: '1px solid #2A2A2A',  
                    marginBottom: '8px',  
                    fontSize: '14px',  
                    color: '#B6B9BF',  
                    lineHeight: '1.5'  
                  }}>  
                    • {item}  
                  </li>  
                ))}  
              </ul>  
            </div>  
  
            {/* Interactive Light Map with Recenter Button */}  
            <div style={{ marginBottom: '32px' }}>  
              <h3 style={{  
                fontSize: '20px',  
                fontWeight: 'bold',  
                color: '#F5F5F5',  
                marginBottom: '16px'  
              }}>  
                💡 Seasonal Light Map  
              </h3>  
  
              {/* Location Status */}  
              {locationError && (  
                <div style={{  
                  padding: '12px 16px',  
                  background: 'rgba(255, 96, 168, 0.1)',  
                  border: '1px solid #FF60A8',  
                  borderRadius: '12px',  
                  marginBottom: '16px',  
                  fontSize: '12px',  
                  color: '#FF60A8'  
                }}>  
                  ⚠️ {locationError}  
                </div>  
              )}  
  
              {userLocation && (  
                <div style={{  
                  padding: '12px 16px',  
                  background: 'rgba(164, 203, 62, 0.1)',  
                  border: '1px solid #A4CB3E',  
                  borderRadius: '12px',  
                  marginBottom: '16px',  
                  fontSize: '12px',  
                  color: '#A4CB3E'  
                }}>  
                  ✓ Location detected: {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}  
                </div>  
              )}  
  
              {/* Map Container with Recenter Button */}  
              {userLocation ? (  
                <div style={{  
                  height: '400px',  
                  borderRadius: '12px',  
                  overflow: 'hidden',  
                  border: '1px solid #2A2A2A',  
                  position: 'relative',  
                  marginBottom: '16px'  
                }}>  
                  <MapCanvas  
                    height="400px"  
                    center={mapCenter}  
                    zoom={15}  
                    selectable={false}  
                    key={mapKey}  
                  />  
  
                  {/* User Location Marker (Fixed Overlay) */}  
                  <div style={{  
                    position: 'absolute',  
                    top: '50%',  
                    left: '50%',  
                    transform: 'translate(-50%, -50%)',  
                    fontSize: '32px',  
                    zIndex: 1000,  
                    pointerEvents: 'none',  
                    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'  
                  }}>  
                    📍  
                  </div>  
  
                  {/* Sun Position Marker (Fixed Overlay) */}  
                  {sunPosition && (  
                    <div style={{  
                      position: 'absolute',  
                      top: '20%',  
                      right: '20%',  
                      fontSize: '40px',  
                      zIndex: 1000,  
                      pointerEvents: 'none',  
                      animation: 'pulse 2s ease-in-out infinite',  
                      filter: 'drop-shadow(0 0 8px rgba(253, 184, 19, 0.6))'  
                    }}>  
                      ☀️  
                    </div>  
                  )}  
  
                  {/* Recenter Button */}  
                  <button  
                    onClick={handleRecenter}  
                    style={{  
                      position: 'absolute',  
                      bottom: '16px',  
                      right: '16px',  
                      width: '48px',  
                      height: '48px',  
                      borderRadius: '50%',  
                      background: '#A4CB3E',  
                      border: 'none',  
                      cursor: 'pointer',  
                      display: 'flex',  
                      alignItems: 'center',  
                      justifyContent: 'center',  
                      fontSize: '20px',  
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',  
                      zIndex: 1001,  
                      transition: 'all 0.2s'  
                    }}  
                    onMouseEnter={(e) => {  
                      e.currentTarget.style.transform = 'scale(1.1)';  
                      e.currentTarget.style.background = '#8FB82E';  
                    }}  
                    onMouseLeave={(e) => {  
                      e.currentTarget.style.transform = 'scale(1)';  
                      e.currentTarget.style.background = '#A4CB3E';  
                    }}  
                    title="Recenter on your location"  
                  >  
                    🎯  
                  </button>  
  
                  {/* Sun Info Overlay */}  
                  <div style={{  
                    position: 'absolute',  
                    top: '16px',  
                    left: '16px',  
                    background: 'rgba(11, 11, 11, 0.9)',  
                    padding: '12px 16px',  
                    borderRadius: '12px',  
                    border: '1px solid #2A2A2A',  
                    zIndex: 1000  
                  }}>  
                    <div style={{  
                      fontSize: '12px',  
                      color: '#B6B9BF',  
                      marginBottom: '4px'  
                    }}>  
                      ☀️ Sun Position  
                    </div>  
                    <div style={{  
                      fontSize: '14px',  
                      color: '#F5F5F5',  
                      fontWeight: '600'  
                    }}>  
                      {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}  
                    </div>  
                    <div style={{  
                      fontSize: '12px',  
                      color: '#A4CB3E',  
                      marginTop: '4px'  
                    }}>  
                      {selectedToolkit.season} light pattern  
                    </div>  
                  </div>  
                </div>  
              ) : (  
                <div style={{  
                  height: '400px',  
                  borderRadius: '12px',  
                  border: '1px solid #2A2A2A',  
                  background: '#0B0B0B',  
                  display: 'flex',  
                  alignItems: 'center',  
                  justifyContent: 'center',  
                  marginBottom: '16px'  
                }}>  
                  <p style={{  
                    color: '#B6B9BF',  
                    fontSize: '14px',  
                    textAlign: 'center',  
                    padding: '20px'  
                  }}>  
                    📍 Enable location access to see your personalized light map  
                  </p>  
                </div>  
              )}  
  
              {/* Light Map Description */}  
              <p style={{  
                fontSize: '14px',  
                color: '#B6B9BF',  
                lineHeight: '1.6',  
                padding: '16px',  
                background: '#0B0B0B',  
                borderRadius: '12px',  
                border: '1px solid #2A2A2A',  
                margin: 0  
              }}>  
                {selectedToolkit.lightMap.description}  
              </p>  
            </div>  
  
            {/* Micro Guide */}  
            <div style={{ marginBottom: '32px' }}>  
              <h3 style={{  
                fontSize: '20px',  
                fontWeight: 'bold',  
                color: '#F5F5F5',  
                marginBottom: '16px'  
              }}>  
                📖 Care Guide  
              </h3>  
              <p style={{  
                fontSize: '14px',  
                color: '#B6B9BF',  
                lineHeight: '1.8',  
                padding: '16px',  
                background: '#0B0B0B',  
                borderRadius: '12px',  
                border: '1px solid #2A2A2A',  
                margin: 0,  
                whiteSpace: 'pre-wrap'  
              }}>  
                {selectedToolkit.microGuide}  
              </p>  
            </div>  
  
            {/* Downloadables */}  
            {(selectedToolkit.downloadables.checklistPdf ||   
              selectedToolkit.downloadables.posterPdf ||   
              selectedToolkit.downloadables.guidePdf) && (  
              <div style={{ marginBottom: '32px' }}>  
                <h3 style={{  
                  fontSize: '20px',  
                  fontWeight: 'bold',  
                  color: '#F5F5F5',  
                  marginBottom: '16px'  
                }}>  
                  📥 Downloads  
                </h3>  
                <div style={{  
                  display: 'grid',  
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',  
                  gap: '12px'  
                }}>  
                  {selectedToolkit.downloadables.checklistPdf && (  
                    <a  
                      href={selectedToolkit.downloadables.checklistPdf}  
                      target="_blank"  
                      rel="noopener noreferrer"  
                      style={{  
                        padding: '12px 16px',  
                        background: '#0B0B0B',  
                        border: '1px solid #2A2A2A',  
                        borderRadius: '12px',  
                        color: '#A4CB3E',  
                        fontSize: '14px',  
                        textDecoration: 'none',  
                        display: 'flex',  
                        alignItems: 'center',  
                        gap: '8px',  
                        transition: 'all 0.2s'  
                      }}  
                      onMouseEnter={(e) => {  
                        e.currentTarget.style.borderColor = '#A4CB3E';  
                        e.currentTarget.style.background = 'rgba(164, 203, 62, 0.05)';  
                      }}  
                      onMouseLeave={(e) => {  
                        e.currentTarget.style.borderColor = '#2A2A2A';  
                        e.currentTarget.style.background = '#0B0B0B';  
                      }}  
                    >  
                      ✓ Checklist PDF  
                    </a>  
                  )}  
                  {selectedToolkit.downloadables.posterPdf && (  
                    <a  
                      href={selectedToolkit.downloadables.posterPdf}  
                      target="_blank"  
                      rel="noopener noreferrer"  
                      style={{  
                        padding: '12px 16px',  
                        background: '#0B0B0B',  
                        border: '1px solid #2A2A2A',  
                        borderRadius: '12px',  
                        color: '#A4CB3E',  
                        fontSize: '14px',  
                        textDecoration: 'none',  
                        display: 'flex',  
                        alignItems: 'center',  
                        gap: '8px',  
                        transition: 'all 0.2s'  
                      }}  
                      onMouseEnter={(e) => {  
                        e.currentTarget.style.borderColor = '#A4CB3E';  
                        e.currentTarget.style.background = 'rgba(164, 203, 62, 0.05)';  
                      }}  
                      onMouseLeave={(e) => {  
                        e.currentTarget.style.borderColor = '#2A2A2A';  
                        e.currentTarget.style.background = '#0B0B0B';  
                      }}  
                    >  
                      🖼️ Poster PDF  
                    </a>  
                  )}  
                  {selectedToolkit.downloadables.guidePdf && (  
                    <a  
                      href={selectedToolkit.downloadables.guidePdf}  
                      target="_blank"  
                      rel="noopener noreferrer"  
                      style={{  
                        padding: '12px 16px',  
                        background: '#0B0B0B',  
                        border: '1px solid #2A2A2A',  
                        borderRadius: '12px',  
                        color: '#A4CB3E',  
                        fontSize: '14px',  
                        textDecoration: 'none',  
                        display: 'flex',  
                        alignItems: 'center',  
                        gap: '8px',  
                        transition: 'all 0.2s'  
                      }}  
                      onMouseEnter={(e) => {  
                        e.currentTarget.style.borderColor = '#A4CB3E';  
                        e.currentTarget.style.background = 'rgba(164, 203, 62, 0.05)';  
                      }}  
                      onMouseLeave={(e) => {  
                        e.currentTarget.style.borderColor = '#2A2A2A';  
                        e.currentTarget.style.background = '#0B0B0B';  
                      }}  
                    >  
                      📖 Guide PDF  
                    </a>  
                  )}  
                </div>  
              </div>  
            )}  
          </div>  
        )}  
      </div>  
  
      {/* Animations & Scrollbar hiding */}  
      <style jsx>{`  
        @keyframes spin {  
          to { transform: rotate(360deg); }  
        }  
  
        @keyframes fadeIn {  
          from { opacity: 0; }  
          to { opacity: 1; }  
        }  
  
        @keyframes pulse {  
          0%, 100% {   
            opacity: 1;  
            transform: scale(1);  
          }  
          50% {   
            opacity: 0.7;  
            transform: scale(1.1);  
          }  
        }  
  
        .drawer-scroll {  
          scrollbar-width: none !important;  
          -ms-overflow-style: none !important;  
        }  
  
        .drawer-scroll::-webkit-scrollbar {  
          display: none !important;  
          width: 0 !important;  
          height: 0 !important;  
        }  
      `}</style>  
    </div>  
  );  
}