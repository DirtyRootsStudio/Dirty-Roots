"use client";  
  
import { useEffect, useState, useRef } from "react";  
import { ensureAnonAuth } from "@/src/lib/firebase";  
import { listProducts } from "@/src/lib/firestore";  
  
export default function EmbedGrowSlowlyShopPage() {  
  const [mounted, setMounted] = useState(false);  
  const [products, setProducts] = useState<any[]>([]);  
  const [loading, setLoading] = useState(true);  
  const scrollContainerRef = useRef<HTMLDivElement>(null);  
  const [isDragging, setIsDragging] = useState(false);  
  const [startX, setStartX] = useState(0);  
  const [scrollLeft, setScrollLeft] = useState(0);  
  
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
  
  // Drag-to-scroll handlers  
  const handleMouseDown = (e: React.MouseEvent) => {  
    if (!scrollContainerRef.current) return;  
    setIsDragging(true);  
    setStartX(e.pageX - scrollContainerRef.current.offsetLeft);  
    setScrollLeft(scrollContainerRef.current.scrollLeft);  
    scrollContainerRef.current.style.cursor = 'grabbing';  
  };  
  
  const handleMouseMove = (e: React.MouseEvent) => {  
    if (!isDragging || !scrollContainerRef.current) return;  
    e.preventDefault();  
    const x = e.pageX - scrollContainerRef.current.offsetLeft;  
    const walk = (x - startX) * 2;  
    scrollContainerRef.current.scrollLeft = scrollLeft - walk;  
  };  
  
  const handleMouseUp = () => {  
    setIsDragging(false);  
    if (scrollContainerRef.current) {  
      scrollContainerRef.current.style.cursor = 'grab';  
    }  
  };  
  
  const handleMouseLeave = () => {  
    if (isDragging) {  
      setIsDragging(false);  
      if (scrollContainerRef.current) {  
        scrollContainerRef.current.style.cursor = 'grab';  
      }  
    }  
  };  
  
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
    <div   
      ref={scrollContainerRef}  
      onMouseDown={handleMouseDown}  
      onMouseMove={handleMouseMove}  
      onMouseUp={handleMouseUp}  
      onMouseLeave={handleMouseLeave}  
      className="scroll-container"  
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
            display: 'flex',  
            flexDirection: 'row',  
            gap: '20px',  
            padding: '20px',  
            height: '100%'  
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
                transition: 'transform 0.2s',  
                flexShrink: 0,  
                pointerEvents: isDragging ? 'none' : 'auto'  
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
                <div style={{  
                  alignSelf: 'stretch',  
                  height: '338.75px',  
                  background: '#0B0B0B',  
                  backgroundImage: `url(${product.imageBase64})`,  
                  backgroundSize: 'cover',  
                  backgroundPosition: 'center'  
                }}></div>  
  
                <div style={{  
                  alignSelf: 'stretch',  
                  padding: '14px',  
                  flexDirection: 'column',  
                  justifyContent: 'flex-start',  
                  alignItems: 'flex-start',  
                  gap: '7.20px',  
                  display: 'flex'  
                }}>  
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
  
        /* Ocultar scrollbar del contenedor con scroll */  
        .scroll-container::-webkit-scrollbar {  
          display: none !important;  
          width: 0 !important;  
          height: 0 !important;  
        }  
  
        .scroll-container {  
          scrollbar-width: none !important;  
          -ms-overflow-style: none !important;  
        }  
  
        .product-card:hover {  
          transform: translateY(-4px);  
        }  
  
        /* Media query para móvil */  
        @media (max-width: 768px) {  
          .scroll-container {  
            width: 100% !important;  
          }  
  
          .product-carousel-scroll {  
            padding: 10px !important;  
            gap: 16px !important;  
          }  
  
          .product-card div[style*="width: 273px"] {  
            width: 260px !important;  
          }  
        }  
      `}</style>  
    </div>  
  );  
}