"use client";  
  
import { useEffect, useState } from "react";  
import { Brand, listBrands } from '@/src/lib/firestore';  
import { ensureAnonAuth } from "@/src/lib/firebase";  
  
export default function BrandsEmbedPage() {  
  const [brands, setBrands] = useState<Brand[]>([]);  
  const [loading, setLoading] = useState(true);  
  const [error, setError] = useState<string | null>(null);  
  
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
        <div style={{ textAlign: 'center' }}>  
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>  
          <p style={{ color: '#FF60A8', fontSize: '18px' }}>{error}</p>  
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
        <div style={{ textAlign: 'center' }}>  
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏷️</div>  
          <p style={{ color: '#B6B9BF', fontSize: '18px' }}>No brands available yet.</p>  
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
      <div style={{  
        display: 'flex',  
        flexDirection: 'row',  
        gap: '20px',  
        padding: '20px',  
        height: '100%',  
        alignItems: 'center'  
      }}>  
        {brands.map((brand) => (  
          <a  
            key={brand.id}  
            href={brand.link}  
            target="_blank"  
            rel="noopener noreferrer"  
            style={{  
              textDecoration: 'none',  
              color: 'inherit',  
              flexShrink: 0  
            }}  
          >  
            <div style={{  
              width: '273px',  
              height: '500px',  
              borderRadius: '24px',  
              background: '#0F0F0F',  
              border: '1px solid #242424',  
              overflow: 'hidden',  
              position: 'relative',  
              cursor: 'pointer',  
              transition: 'all 0.2s'  
            }}  
            onMouseEnter={(e) => {  
              e.currentTarget.style.transform = 'translateY(-4px)';  
              e.currentTarget.style.borderColor = '#A4CB3E';  
            }}  
            onMouseLeave={(e) => {  
              e.currentTarget.style.transform = 'translateY(0)';  
              e.currentTarget.style.borderColor = '#242424';  
            }}>  
              {/* Brand Image */}  
              <div style={{  
                width: '100%',  
                height: '338.75px',  
                background: `url(${brand.imageBase64}) center/cover no-repeat`,  
                position: 'relative'  
              }}>  
                {/* Initial State: Brand Name Overlay */}  
                <div style={{  
                  position: 'absolute',  
                  inset: 0,  
                  background: 'linear-gradient(to bottom, transparent 0%, rgba(11, 11, 11, 0.8) 100%)',  
                  display: 'flex',  
                  alignItems: 'flex-end',  
                  padding: '24px',  
                  opacity: 1,  
                  transition: 'opacity 0.3s ease'  
                }}>  
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
                <div style={{  
                  position: 'absolute',  
                  inset: 0,  
                  background: 'rgba(11, 11, 11, 0.95)',  
                  padding: '32px',  
                  display: 'flex',  
                  flexDirection: 'column',  
                  justifyContent: 'space-between',  
                  opacity: 0,  
                  transition: 'opacity 0.3s ease'  
                }}  
                onMouseEnter={(e) => {  
                  e.currentTarget.style.opacity = '1';  
                  e.currentTarget.parentElement?.querySelector('div[style*="opacity: 1"]')?.setAttribute('style', e.currentTarget.parentElement?.querySelector('div[style*="opacity: 1"]')?.getAttribute('style')?.replace('opacity: 1', 'opacity: 0') || '');  
                }}  
                onMouseLeave={(e) => {  
                  e.currentTarget.style.opacity = '0';  
                  e.currentTarget.parentElement?.querySelector('div[style*="opacity: 0"]')?.setAttribute('style', e.currentTarget.parentElement?.querySelector('div[style*="opacity: 0"]')?.getAttribute('style')?.replace('opacity: 0', 'opacity: 1') || '');  
                }}>  
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
          </a>  
        ))}  
      </div>  
  
      <style jsx>{`  
        @keyframes spin {  
          to { transform: rotate(360deg); }  
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