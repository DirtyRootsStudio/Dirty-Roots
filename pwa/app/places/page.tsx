// src/app/places/page.tsx    
"use client";    
    
import { useEffect, useState } from "react";    
import Link from "next/link";    
import Image from "next/image";    
import dynamic from "next/dynamic";   
import { listLatestPlaces, deletePlace } from "@/src/lib/firestore";    
import { Place } from "@/src/types/place";    
    
// Importar MapCanvas dinámicamente para evitar SSR    
const MapCanvas = dynamic(() => import("@/src/components/MapCanvas"), {    
  ssr: false,    
});   
  
export default function PlacesPage() {    
  const [places, setPlaces] = useState<Place[]>([]);    
  const [loading, setLoading] = useState(true);    
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({ lat: 50.0, lng: 10.0 });    
  const [mapZoom, setMapZoom] = useState<number>(5);    
      
  useEffect(() => {    
    (async () => {    
      try {    
        const data = await listLatestPlaces(100);    
        setPlaces(data);    
      } catch (error) {    
        console.error("Error loading places:", error);    
      } finally {    
        setLoading(false);    
      }    
    })();    
  }, []);    
    
  const handlePlaceClick = (place: Place) => {    
    setMapCenter({ lat: place.coords.lat, lng: place.coords.lng });    
    setMapZoom(15);    
  };    
    
  const handleDeletePlace = async (placeId: string) => {    
    if (!confirm("Are you sure you want to delete this place?")) {    
      return;    
    }    
        
    try {    
      await deletePlace(placeId);    
      setPlaces(places.filter(p => p.id !== placeId));    
      alert("Place deleted ✅");    
    } catch (error) {    
      console.error("Error eliminando lugar:", error);    
      alert("Error al eliminar el lugar");    
    }    
  };    
      
  if (loading) {    
    return (    
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0B0B0B' }}>    
        <div style={{ textAlign: 'center' }}>    
          <div style={{ display: 'inline-block', width: '48px', height: '48px', border: '4px solid #A4CB3E', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '16px' }}></div>    
          <p style={{ color: '#B6B9BF', fontSize: '18px' }}>Loading calm places...</p>    
        </div>    
      </div>    
    );    
  }    
      
  return (    
    <div style={{ minHeight: '100vh', background: '#0B0B0B', padding: '32px' }}>    
      {/* Header */}    
      <div style={{ maxWidth: '1400px', margin: '0 auto 32px auto' }}>    
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>    
          <div>    
            <h1 style={{ fontSize: '36px', fontWeight: 'bold', marginBottom: '8px', color: '#F5F5F5' }}>    
              🗺️ Calm places    
            </h1>    
            <p style={{ fontSize: '16px', color: '#B6B9BF' }}>    
              Discover peaceful spaces shared by the community    
            </p>    
          </div>    
          <div style={{ display: 'flex', gap: '12px' }}>    
            <Link     
              href="/"     
              style={{     
                padding: '10px 20px',     
                borderRadius: '9999px',     
                border: '1px solid #FF60A8',    
                color: '#F5F5F5',    
                fontWeight: '600',    
                textDecoration: 'none',    
                fontSize: '14px',    
                transition: 'all 0.2s'    
              }}    
            >    
              ← Go back    
            </Link>    
            <Link     
              href="/places/new"     
              style={{     
                padding: '10px 20px',     
                borderRadius: '9999px',     
                background: '#A4CB3E',    
                color: '#0B0B0B',    
                fontWeight: 'bold',    
                textDecoration: 'none',    
                fontSize: '14px',    
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',    
                transition: 'all 0.2s'    
              }}    
            >    
              + Add place    
            </Link>    
          </div>    
        </div>    
      </div>    
    
      {/* Main Content - Grid con mapa pequeño a la izquierda */}    
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>    
        <div style={{ display: 'grid', gridTemplateColumns: '650px 1fr', gap: '24px' }}>    
          {/* Mapa - Columna izquierda pequeña */}    
          <div     
            style={{     
              borderRadius: '24px',     
              overflow: 'hidden',    
              border: '1px solid #222222',    
              background: '#111111',    
              height: '500px',    
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'    
            }}    
          >    
            <MapCanvas    
              height="500px"    
              center={mapCenter}    
              zoom={mapZoom}    
              markers={places.map(p => ({ id: p.id!, lat: p.coords.lat, lng: p.coords.lng }))}    
            />    
          </div>    
    
          {/* Contenido - Columna derecha grande */}    
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>    
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', position: 'sticky', top: 0, background: '#0B0B0B', padding: '12px 0', zIndex: 10 }}>    
              <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#F5F5F5' }}>    
                {places.length} {places.length === 1 ? 'place' : 'places'}    
              </h2>    
            </div>    
                
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '500px', overflowY: 'auto', paddingRight: '8px' }} className="custom-scrollbar">    
              {places.length === 0 ? (    
                <div     
                  style={{     
                    borderRadius: '24px',     
                    padding: '40px',     
                    textAlign: 'center',    
                    border: '1px solid #242424',    
                    background: '#0F0F0F'    
                  }}    
                >    
                  <div style={{ fontSize: '56px', marginBottom: '24px' }}>🌿</div>    
                  <p style={{ marginBottom: '24px', fontSize: '20px', color: '#B6B9BF' }}>    
                    There are no places available yet.   
                  </p>    
                  <Link     
                    href="/places/new"     
                    style={{     
                      display: 'inline-block',    
                      padding: '12px 32px',     
                      borderRadius: '9999px',     
                      background: '#A4CB3E',    
                      color: '#0B0B0B',    
                      fontWeight: 'bold',    
                      textDecoration: 'none',    
                      transition: 'all 0.2s'    
                    }}    
                  >    
                    Be the first to add one    
                  </Link>    
                </div>    
              ) : (    
                places.map(p => (    
                  <div     
                    key={p.id}    
                    style={{     
                      borderRadius: '24px',     
                      padding: '24px',    
                      border: '1px solid #242424',    
                      background: '#0F0F0F',    
                      transition: 'all 0.2s',    
                      cursor: 'pointer',    
                      position: 'relative'    
                    }}    
                    onClick={() => handlePlaceClick(p)}    
                    onMouseEnter={(e) => {    
                      e.currentTarget.style.background = '#111111';    
                      e.currentTarget.style.borderColor = 'rgba(164, 203, 62, 0.3)';    
                    }}    
                    onMouseLeave={(e) => {    
                      e.currentTarget.style.background = '#0F0F0F';    
                      e.currentTarget.style.borderColor = '#242424';    
                    }}    
                  >    
                    {/* Botón de eliminar */}    
                    <button    
                      onClick={(e) => {    
                        e.stopPropagation();    
                        handleDeletePlace(p.id!);    
                      }}    
                      style={{    
                        position: 'absolute',    
                        top: '16px',    
                        right: '16px',    
                        padding: '6px 12px',    
                        borderRadius: '9999px',    
                        background: '#FF60A8',    
                        color: '#0B0B0B',    
                        border: 'none',    
                        cursor: 'pointer',    
                        fontSize: '12px',    
                        fontWeight: '600',    
                        transition: 'all 0.2s',    
                        zIndex: 10    
                      }}    
                      onMouseEnter={(e) => {    
                        e.currentTarget.style.background = '#FF4090';    
                        e.currentTarget.style.transform = 'scale(1.05)';    
                      }}    
                      onMouseLeave={(e) => {    
                        e.currentTarget.style.background = '#FF60A8';    
                        e.currentTarget.style.transform = 'scale(1)';    
                      }}    
                    >    
                      🗑️ Delete    
                    </button>    
    
                    {/* Header con nombre y tipo de lugar */}    
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px', paddingRight: '100px' }}>        
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>      
                        <div style={{ fontWeight: 'bold', fontSize: '20px', color: '#F5F5F5' }}>        
                          {p.name}        
                        </div>      
                        {p.placeType && (      
                          <span style={{ fontSize: '16px' }}>      
                            {p.placeType === 'park' ? '🌳' : '☕'}      
                          </span>      
                        )}      
                      </div>      
                      {p.city && (        
                        <span         
                          style={{         
                            fontSize: '12px',        
                            fontWeight: '600',        
                            color: '#B6B9BF',        
                            background: '#1F1F1F',        
                            padding: '6px 12px',        
                            borderRadius: '9999px',        
                            border: '1px solid #2A2A2A'        
                          }}        
                        >        
                          📍 {p.city}        
                        </span>        
                      )}        
                    </div>    
                        
                    {/* Dirección completa */}    
                    {p.address && (      
                      <p style={{ fontSize: '14px', color: '#B6B9BF', marginBottom: '8px', lineHeight: '1.4' }}>      
                        📍 {p.address}      
                      </p>      
                    )}    
                        
                    {/* Horario */}      
                    {p.schedule && (      
                      <p style={{ fontSize: '14px', color: '#B6B9BF', marginBottom: '12px', lineHeight: '1.4' }}>      
                        🕐 {p.schedule}      
                      </p>      
                    )}  
                          
                    {p.description && (      
                      <p style={{ fontSize: '16px', color: '#B6B9BF', marginBottom: '16px', lineHeight: '1.6' }}>      
                        {p.description}      
                      </p>      
                    )}      
                          
                    {p.photo && (      
                      <div style={{ position: 'relative', width: '100%', height: '192px', marginBottom: '16px' }}>      
                        <Image       
                          src={p.photo}       
                          alt={p.name}      
                          fill      
                          style={{ objectFit: 'cover', borderRadius: '16px', border: '1px solid #222222' }}      
                          unoptimized      
                          onError={(e) => {      
                            (e.target as HTMLImageElement).style.display = 'none';      
                          }}      
                        />      
                      </div>      
                    )}      
                          
                    {/* Tags */}    
                    {p.tags && p.tags.length > 0 && (    
                      <div       
                        style={{       
                          display: 'flex',      
                          alignItems: 'center',      
                          gap: '8px',    
                          fontSize: '14px',      
                          paddingTop: '16px',      
                          borderTop: '1px solid #1F1F1F',      
                          color: '#B6B9BF'      
                        }}      
                      >      
                        <span       
                          style={{       
                            background: '#1F1F1F',      
                            padding: '6px 12px',      
                            borderRadius: '9999px',      
                            fontSize: '12px'      
                          }}      
                        >      
                          #{p.tags.join(" #")}      
                        </span>      
                      </div>      
                    )}    
                    </div>      
                    ))      
                    )}      
                    </div>      
                    </div>      
                    </div>      
                    </div> 
       <style jsx>{`    
        @keyframes spin {    
          to { transform: rotate(360deg); }    
        }    
          
        /* Scrollbar personalizado */  
        .custom-scrollbar::-webkit-scrollbar {  
          width: 8px;  
        }  
          
        .custom-scrollbar::-webkit-scrollbar-track {  
          background: #0F0F0F;  
          border-radius: 4px;  
        }  
          
        .custom-scrollbar::-webkit-scrollbar-thumb {  
          background: #2A2A2A;  
          border-radius: 4px;  
        }  
          
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {  
          background: #A4CB3E;  
        }  
      `}</style>    
    </div>    
  );    
}