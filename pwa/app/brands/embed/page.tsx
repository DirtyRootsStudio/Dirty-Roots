"use client";  
  
import { useEffect, useState } from "react";  
import { Brand, listBrands } from '@/src/lib/firestore';  
import { ensureAnonAuth } from "@/src/lib/firebase";  
  
export default function BrandsEmbedPage() {  
  const [brands, setBrands] = useState<Brand[]>([]);  
  const [loading, setLoading] = useState(true);  
  const [error, setError] = useState<string | null>(null);  
  const [currentIndex, setCurrentIndex] = useState(0);  
  
  useEffect(() => {  
    (async () => {  
      try {  
        console.log('🔄 Initializing anonymous authentication...');  
        await ensureAnonAuth();  
        console.log('✅ Successful authentication');  
          
        console.log('🔄 Loading brands from Firestore...');  
        const data = await listBrands(50);  
        console.log(`✅ ${data.length} loaded brands`);  
          
        setBrands(data);  
      } catch (err) {  
        console.error('❌ Error:', err);  
        setError(err instanceof Error ? err.message : 'Unknown error');  
      } finally {  
        setLoading(false);  
      }  
    })();  
  }, []);  
  
  const nextSlide = () => {  
    setCurrentIndex((prev) => (prev + 1) % brands.length);  
  };  
  
  const prevSlide = () => {  
    setCurrentIndex((prev) => (prev - 1 + brands.length) % brands.length);  
  };  
  
  const goToSlide = (index: number) => {  
    setCurrentIndex(index);  
  };  
  
  if (loading) {  
    return (  
      <div style={{  
        width: '1192px',  
        maxWidth: '100%',  
        height: '600px',  
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
          <p style={{ color: '#B6B9BF', fontSize: '18px' }}>Loading brands...</p>  
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
        width: '1192px',  
        maxWidth: '100%',  
        height: '600px',  
        display: 'flex',  
        alignItems: 'center',  
        justifyContent: 'center',  
        background: '#0B0B0B'  
      }}>  
        <div style={{ textAlign: 'center', padding: '40px', color: '#FF60A8' }}>  
          <p>Error loading brands: {error}</p>  
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
  
  if (brands.length === 0) {  
    return (  
      <div style={{  
        width: '1192px',  
        maxWidth: '100%',  
        height: '600px',  
        display: 'flex',  
        alignItems: 'center',  
        justifyContent: 'center',  
        background: '#0B0B0B'  
      }}>  
        <div style={{ textAlign: 'center', color: '#B6B9BF' }}>  
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏷️</div>  
          <p>No brands available yet</p>  
        </div>  
      </div>  
    );  
  }  
  
  return (  
    <div   
      className="brands-carousel"  
      style={{  
        width: '1192px',  
        maxWidth: '100%',  
        height: '600px',  
        position: 'relative',  
        background: '#0B0B0B',  
        overflowX: 'auto',  
        overflowY: 'hidden',  
        cursor: 'grab',  
        userSelect: 'none'  
      }}  
    >  
      {/* Navigation Buttons */}  
      <button  
        onClick={prevSlide}  
        style={{  
          position: 'absolute',  
          left: '20px',  
          top: '50%',  
          transform: 'translateY(-50%)',  
          width: '48px',  
          height: '48px',  
          borderRadius: '50%',  
          background: 'rgba(164, 203, 62, 0.2)',  
          border: '1px solid #A4CB3E',  
          color: '#A4CB3E',  
          fontSize: '20px',  
          cursor: 'pointer',  
          transition: 'all 0.2s',  
          zIndex: 10  
        }}  
        onMouseEnter={(e) => {  
          e.currentTarget.style.background = '#A4CB3E';  
          e.currentTarget.style.color = '#0B0B0B';  
        }}  
        onMouseLeave={(e) => {  
          e.currentTarget.style.background = 'rgba(164, 203, 62, 0.2)';  
          e.currentTarget.style.color = '#A4CB3E';  
        }}  
      >  
        ←  
      </button>  
  
      <button  
        onClick={nextSlide}  
        style={{  
          position: 'absolute',  
          right: '20px',  
          top: '50%',  
          transform: 'translateY(-50%)',  
          width: '48px',  
          height: '48px',  
          borderRadius: '50%',  
          background: 'rgba(164, 203, 62, 0.2)',  
          border: '1px solid #A4CB3E',  
          color: '#A4CB3E',  
          fontSize: '20px',  
          cursor: 'pointer',  
          transition: 'all 0.2s',  
          zIndex: 10  
        }}  
        onMouseEnter={(e) => {  
          e.currentTarget.style.background = '#A4CB3E';  
          e.currentTarget.style.color = '#0B0B0B';  
        }}  
        onMouseLeave={(e) => {  
          e.currentTarget.style.background = 'rgba(164, 203, 62, 0.2)';  
          e.currentTarget.style.color = '#A4CB3E';  
        }}  
      >  
        →  
      </button>  
  
      {/* Brand Cards - Direct flex layout like shop embed */}  
      <div style={{  
        display: 'flex',  
        flexDirection: 'row',  
        gap: '32px',  
        padding: '20px',  
        height: '100%',  
        alignItems: 'center'  
      }}>  
        {brands.map((brand, index) => {  
          const isActive = index === currentIndex;  
          const isAdjacent = Math.abs(index - currentIndex) === 1 ||   
                            (currentIndex === 0 && index === brands.length - 1) ||   
                            (currentIndex === brands.length - 1 && index === 0);  
            
          return (  
            <div  
              key={brand.id}  
              style={{  
                flexShrink: 0,  
                width: isActive ? '400px' : isAdjacent ? '300px' : '200px',  
                height: isActive ? '500px' : isAdjacent ? '400px' : '300px',  
                borderRadius: '24px',  
                background: '#0F0F0F',  
                border: isActive ? '2px solid #A4CB3E' : '1px solid #242424',  
                overflow: 'hidden',  
                position: 'relative',  
                cursor: 'pointer',  
                transition: 'all 0.3s ease',  
                opacity: isActive ? 1 : isAdjacent ? 0.7 : 0.3,  
                transform: `scale(${isActive ? 1 : isAdjacent ? 0.9 : 0.8})`  
              }}  
              onClick={() => goToSlide(index)}  
              onMouseEnter={(e) => {  
                if (!isActive) {  
                  e.currentTarget.style.transform = 'scale(0.95)';  
                  e.currentTarget.style.borderColor = 'rgba(164, 203, 62, 0.5)';  
                }  
              }}  
              onMouseLeave={(e) => {  
                if (!isActive) {  
                  e.currentTarget.style.transform = `scale(${isAdjacent ? 0.9 : 0.8})`;  
                  e.currentTarget.style.borderColor = '#242424';  
                }  
              }}  
            >  
              {/* Brand Image with Overlay */}  
              <div style={{  
                width: '100%',  
                height: '100%',  
                position: 'relative',  
                background: `url(${brand.imageBase64}) center/cover no-repeat`  
              }}>  
                {/* Initial State: Image + Brand Name */}  
                <div  
                  style={{  
                    position: 'absolute',  
                    inset: 0,  
                    background: 'linear-gradient(to bottom, transparent 0%, rgba(11, 11, 11, 0.8) 100%)',  
                    display: 'flex',  
                    alignItems: 'flex-end',  
                    padding: '24px',  
                    opacity: isActive ? 0 : 1,  
                    transition: 'opacity 0.3s ease'  
                  }}  
                >  
                  <h3 style={{  
                    fontSize: '24px',  
                    fontWeight: 'bold',  
                    color: '#F5F5F5',  
                    margin: 0,  
                    textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)'  
                  }}>  
                    {brand.name}  
                  </h3>  
                </div>  
  
                {/* Hover State: Full Info */}  
                <div  
                  style={{  
                    position: 'absolute',  
                    inset: 0,  
                    background: 'rgba(11, 11, 11, 0.95)',  
                    padding: '32px',  
                    display: 'flex',  
                    flexDirection: 'column',  
                    justifyContent: 'space-between',  
                    opacity: isActive ? 1 : 0,  
                    transition: 'opacity 0.3s ease'  
                  }}  
                >  
                  <div>  
                    <h3 style={{  
                      fontSize: '28px',  
                      fontWeight: 'bold',  
                      color: '#F5F5F5',  
                      margin: '0 0 16px 0'  
                    }}>  
                      {brand.name}  
                    </h3>  
                        
                    <p style={{  
                      fontSize: '16px',  
                      color: '#B6B9BF',  
                      lineHeight: '1.6',  
                      margin: '0 0 20px 0'  
                    }}>  
                      {brand.description}  
                    </p>  
  
                    {brand.discount && (  
                      <div style={{  
                        background: 'rgba(164, 203, 62, 0.1)',  
                        border: '1px solid #A4CB3E',  
                        borderRadius: '8px',  
                        padding: '8px 12px',  
                        marginBottom: '20px',  
                        display: 'inline-block'  
                      }}>  
                        <span style={{  
                          fontSize: '14px',  
                          color: '#A4CB3E',  
                          fontWeight: '600'  
                        }}>  
                          🎁 {brand.discount}  
                        </span>  
                      </div>  
                    )}  
                  </div>  
  
                  <div>  
                    <a  
                      href={brand.link}  
                      target="_blank"  
                      rel="noopener noreferrer"  
                      style={{  
                        display: 'inline-block',  
                        padding: '12px 24px',  
                        background: '#A4CB3E',  
                        color: '#0B0B0B',  
                        borderRadius: '9999px',  
                        textDecoration: 'none',  
                        fontSize: '16px',  
                        fontWeight: '600',  
                        transition: 'all 0.2s',  
                        textAlign: 'center'  
                      }}  
                      onMouseEnter={(e) => {  
                        e.currentTarget.style.background = '#8FB82E';  
                      }}  
                      onMouseLeave={(e) => {  
                        e.currentTarget.style.background = '#A4CB3E';  
                      }}  
                    >  
                      More Info →  
                    </a>  
                  </div>  
                </div>  
              </div>  
            </div>  
          );  
        })}  
      </div>  
  
      {/* Navigation Dots */}  
      <div style={{  
        position: 'absolute',  
        bottom: '40px',  
        left: '50%',  
        transform: 'translateX(-50%)',  
        display: 'flex',  
        gap: '12px',  
        zIndex: 10  
      }}>  
        {brands.map((_, index) => (  
          <button  
            key={index}  
            onClick={() => goToSlide(index)}  
            style={{  
              width: currentIndex === index ? '32px' : '12px',  
              height: '12px',  
              borderRadius: '9999px',  
              background: currentIndex === index ? '#A4CB3E' : 'rgba(164, 203, 62, 0.3)',  
              border: 'none',  
              cursor: 'pointer',  
              transition: 'all 0.3s ease'  
            }}  
          />  
        ))}  
      </div>  
  
      <style jsx>{`  
        @keyframes spin {  
          to { transform: rotate(360deg); }  
        }  
  
        @keyframes fadeIn {  
          from { opacity: 0; }  
          to { opacity: 1; }  
        }  
  
        /* Hide scrollbar for carousel */  
        .brands-carousel::-webkit-scrollbar {  
          display: none !important;  
          width: 0 !important;  
          height: 0 !important;  
        }  
  
        .brands-carousel {  
          scrollbar-width: none !important;  
          -ms-overflow-style: none !important;  
        }  
  
        /* Mobile responsive */  
        @media (max-width: 768px) {  
          .brands-carousel {  
            padding: 10px !important;  
            gap: 16px !important;  
          }  
        }  
      `}</style>  
    </div>  
  );  
}