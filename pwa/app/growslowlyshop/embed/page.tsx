// pwa/app/growslowlyshop/embed/page.tsx  
"use client";  
  
import { useEffect, useState } from "react";  
import { ensureAnonAuth } from "@/src/lib/firebase";  
import { listProducts } from "@/src/lib/firestore";  
  
export default function EmbedGrowSlowlyShopPage() {  
  const [mounted, setMounted] = useState(false);  
  const [products, setProducts] = useState<any[]>([]);  
  const [loading, setLoading] = useState(true);  
  
  useEffect(() => {  
    setMounted(true);  
  }, []);  
  
  useEffect(() => {  
    if (!mounted) return;  
  
    (async () => {  
      try {  
        await ensureAnonAuth();  
        await loadProducts();  
      } catch (error) {  
        console.error("Error initializing:", error);  
      }  
    })();  
  }, [mounted]);  
  
  async function loadProducts() {  
    try {  
      const allProducts = await listProducts(50);  
      setProducts(allProducts);  
    } catch (error) {  
      console.error("Error loading products:", error);  
    } finally {  
      setLoading(false);  
    }  
  }  
  
  if (!mounted || loading) {  
    return (  
      <div style={{  
        width: '100%',  
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
          <p style={{ color: '#B6B9BF', fontSize: '18px' }}>Loading products...</p>  
        </div>  
      </div>  
    );  
  }  
  
  return (  
    <div style={{  
      minWidth: '1200px',  
      width: '100%',  
      height: '600px',  
      position: 'relative',  
      background: '#0B0B0B',  
      overflow: 'hidden'  
    }}>  
      {products.length === 0 ? (  
        <div style={{  
          width: '100%',  
          height: '100%',  
          display: 'flex',  
          alignItems: 'center',  
          justifyContent: 'center',  
          flexDirection: 'column',  
          gap: '16px'  
        }}>  
          <div style={{ fontSize: '48px' }}>🛍️</div>  
          <p style={{ color: '#B6B9BF', fontSize: '18px' }}>No products available yet.</p>  
        </div>  
      ) : (  
        <div   
          className="product-carousel-scroll"  
          style={{  
            width: '100%',  
            height: '600px',  
            display: 'flex',  
            flexDirection: 'row',  
            overflowX: 'auto',  
            overflowY: 'hidden',  
            scrollSnapType: 'x mandatory',  
            WebkitOverflowScrolling: 'touch',  
            gap: '20px',  
            padding: '20px',  
            boxSizing: 'border-box',  
            scrollbarWidth: 'none',  
            msOverflowStyle: 'none'  
          }}  
        >  
          {products.map((product) => (  
            <a  
              key={product.id}  
              href={product.link}  
              target="_blank"  
              rel="noopener noreferrer"  
              className="product-card"  
              style={{  
                textDecoration: 'none',  
                color: 'inherit',  
                transition: 'transform 0.2s'  
              }}  
            >  
              <div style={{  
                width: '273px',  
                padding: '1px',  
                background: 'linear-gradient(180deg, #141414 0%, #0F0F0F 100%)',  
                overflow: 'hidden',  
                borderRadius: '18px',  
                outline: '1px rgba(255, 255, 255, 0.08) solid',  
                outlineOffset: '-1px',  
                flexDirection: 'column',  
                justifyContent: 'flex-start',  
                alignItems: 'flex-start',  
                display: 'inline-flex'  
              }}>  
                {/* Background con imagen */}  
                <div style={{  
                  alignSelf: 'stretch',  
                  height: '338.75px',  
                  background: '#0B0B0B',  
                  backgroundImage: `url(${product.imageBase64})`,  
                  backgroundSize: 'cover',  
                  backgroundPosition: 'center'  
                }}></div>  
  
                {/* Container de información */}  
                <div style={{  
                  alignSelf: 'stretch',  
                  padding: '14px',  
                  flexDirection: 'column',  
                  justifyContent: 'flex-start',  
                  alignItems: 'flex-start',  
                  gap: '7.20px',  
                  display: 'flex'  
                }}>  
                  {/* Label y Precio */}  
                  <div style={{  
                    alignSelf: 'stretch',  
                    justifyContent: 'space-between',  
                    alignItems: 'center',  
                    display: 'inline-flex'  
                  }}>  
                    <div style={{  
                      flexDirection: 'column',  
                      justifyContent: 'flex-start',  
                      alignItems: 'flex-start',  
                      display: 'inline-flex'  
                    }}>  
                      <div style={{  
                        justifyContent: 'center',  
                        display: 'flex',  
                        flexDirection: 'column',  
                        color: '#B6B9BF',  
                        fontSize: '14.40px',  
                        fontFamily: 'Segoe UI, system-ui, sans-serif',  
                        fontWeight: 400,  
                        lineHeight: '20.88px',  
                        wordWrap: 'break-word'  
                      }}>  
                        {product.label}  
                      </div>  
                    </div>  
                    <div style={{  
                      flexDirection: 'column',  
                      justifyContent: 'flex-start',  
                      alignItems: 'flex-start',  
                      display: 'inline-flex'  
                    }}>  
                      <div style={{  
                        justifyContent: 'center',  
                        display: 'flex',  
                        flexDirection: 'column',  
                        color: '#B6B9BF',  
                        fontSize: '14.40px',  
                        fontFamily: 'Segoe UI, system-ui, sans-serif',  
                        fontWeight: 400,  
                        lineHeight: '20.88px',  
                        wordWrap: 'break-word'  
                      }}>  
                        €{product.price.toFixed(2)}  
                      </div>  
                    </div>  
                  </div>  
  
                  {/* Nombre del producto */}  
                  <div style={{  
                    alignSelf: 'stretch',  
                    color: '#F5F5F5',  
                    fontSize: '16.92px',  
                    fontFamily: 'Segoe UI, system-ui, sans-serif',  
                    fontWeight: 700,  
                    lineHeight: '24.36px',  
                    wordWrap: 'break-word'  
                  }}>  
                    {product.name}  
                  </div>  
                </div>  
              </div>  
            </a>  
          ))}  
        </div>  
      )}  
  
      <style jsx>{`  
        @keyframes spin {  
          to { transform: rotate(360deg); }  
        }  
  
        /* Ocultar scrollbar en todos los navegadores - PATRÓN DE QUESTIONS */  
        .product-carousel-scroll::-webkit-scrollbar {  
          display: none !important;  
          width: 0 !important;  
          height: 0 !important;  
        }  
  
        .product-carousel-scroll {  
          scrollbar-width: none !important;  
          -ms-overflow-style: none !important;  
        }  
  
        /* Estilos para tarjetas */  
        .product-card {  
          flex: 0 0 280px;  
          min-width: 280px;  
          max-width: 280px;  
          scroll-snap-align: start;  
          transition: transform 0.2s;  
        }  
  
        .product-card:hover {  
          transform: translateY(-4px);  
        }  
  
        /* Media query para móvil */  
        @media (max-width: 768px) {  
          div[style*="minWidth: 1200px"] {  
            min-width: 100% !important;  
            width: 100% !important;  
          }  
  
          .product-carousel-scroll {  
            min-width: auto !important;  
            padding: 10px !important;  
            gap: 16px !important;  
          }  
  
          .product-card {  
            flex: 0 0 calc(100% - 32px) !important;  
            min-width: 260px !important;  
            max-width: 300px !important;  
          }  
  
          .product-card .Background {  
            height: 240px !important;  
          }  
        }  
      `}</style>  
    </div>  
  );  
}