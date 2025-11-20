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
          <p style={{ color: '#B6B9BF', fontSize: '18px' }}>Loading shop...</p>  
        </div>  
        <style jsx>{`  
          @keyframes spin {  
            to { transform: rotate(360deg); }  
          }  
        `}</style>  
      </div>  
    );  
  }  
  
  return (  
    <div style={{  
      width: '100%',  
      height: '600px',  
      position: 'relative',  
      background: '#0B0B0B',  
      overflow: 'hidden'  
    }}>  
      {/* Header */}  
      <div style={{  
        padding: '20px',  
        textAlign: 'center',  
        borderBottom: '1px solid #242424'  
      }}>  
        <h1 style={{  
          fontSize: '28px',  
          fontWeight: 'bold',  
          color: '#F5F5F5',  
          margin: '0 0 8px 0'  
        }}>  
          🛍️ Things that grow slowly shop  
        </h1>  
        <p style={{  
          fontSize: '14px',  
          color: '#B6B9BF',  
          margin: 0  
        }}>  
          Exclusive items for mindful living  
        </p>  
      </div>  
  
      {/* Products carousel */}  
      {products.length === 0 ? (  
        <div style={{  
          display: 'flex',  
          alignItems: 'center',  
          justifyContent: 'center',  
          height: 'calc(100% - 100px)',  
          padding: '40px'  
        }}>  
          <div style={{ textAlign: 'center' }}>  
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>🛍️</div>  
            <p style={{ fontSize: '18px', color: '#B6B9BF', marginBottom: '8px' }}>  
              No products yet  
            </p>  
            <p style={{ fontSize: '14px', color: '#757575' }}>  
              Check back soon for exclusive items  
            </p>  
          </div>  
        </div>  
      ) : (  
        <div   
          className="product-carousel-wrapper"  
          style={{  
            width: '100%',  
            height: 'calc(100% - 100px)',  
            display: 'flex',  
            flexDirection: 'row',  
            overflowX: 'auto',  
            overflowY: 'hidden',  
            scrollSnapType: 'x mandatory',  
            WebkitOverflowScrolling: 'touch',  
            gap: '20px',  
            padding: '20px',  
            boxSizing: 'border-box',  
            alignItems: 'center',  
            justifyContent: 'flex-start'  
          }}  
        >  
          {products.map(product => (  
            <a  
              key={product.id}  
              href={product.link}  
              target="_blank"  
              rel="noopener noreferrer"  
              className="product-card"  
              style={{  
                textDecoration: 'none',  
                flex: '0 0 280px',  
                minWidth: '280px',  
                maxWidth: '280px',  
                scrollSnapAlign: 'start',  
                transition: 'transform 0.2s',  
                padding: '1px',  
                background: 'linear-gradient(180deg, #141414 0%, #0F0F0F 100%)',  
                overflow: 'hidden',  
                borderRadius: '18px',  
                outline: '1px rgba(255, 255, 255, 0.08) solid',  
                outlineOffset: '-1px',  
                display: 'flex',  
                flexDirection: 'column'  
              }}  
              onMouseEnter={(e) => {  
                e.currentTarget.style.transform = 'translateY(-4px)';  
              }}  
              onMouseLeave={(e) => {  
                e.currentTarget.style.transform = 'translateY(0)';  
              }}  
            >  
              {/* Background image */}  
              <div   
                className="Background"  
                style={{  
                  width: '100%',  
                  height: '338.75px',  
                  background: product.imageBase64   
                    ? `url(${product.imageBase64})`   
                    : '#0B0B0B',  
                  backgroundSize: 'cover',  
                  backgroundPosition: 'center'  
                }}  
              />  
  
              {/* Product info */}  
              <div style={{  
                padding: '14px',  
                display: 'flex',  
                flexDirection: 'column',  
                gap: '7.20px'  
              }}>  
                {/* Label and Price */}  
                <div style={{  
                  display: 'flex',  
                  justifyContent: 'space-between',  
                  alignItems: 'center'  
                }}>  
                  <div style={{  
                    color: '#B6B9BF',  
                    fontSize: '14.40px',  
                    fontFamily: 'Segoe UI, system-ui, sans-serif',  
                    fontWeight: 400,  
                    lineHeight: '20.88px'  
                  }}>  
                    {product.label}  
                  </div>  
                  <div style={{  
                    color: '#B6B9BF',  
                    fontSize: '14.40px',  
                    fontFamily: 'Segoe UI, system-ui, sans-serif',  
                    fontWeight: 400,  
                    lineHeight: '20.88px'  
                  }}>  
                    €{product.price.toFixed(2)}  
                  </div>  
                </div>  
  
                {/* Product Name */}  
                <div style={{  
                  color: '#F5F5F5',  
                  fontSize: '16.80px',  
                  fontFamily: 'Segoe UI, system-ui, sans-serif',  
                  fontWeight: 700,  
                  lineHeight: '24.36px'  
                }}>  
                  {product.name}  
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
  
        /* Ocultar scrollbar en todos los navegadores */  
        .product-carousel-wrapper::-webkit-scrollbar {  
          display: none;  
        }  
          
        .product-carousel-wrapper {  
          -ms-overflow-style: none;  
          scrollbar-width: none;  
        }  
  
        /* Ajustes para móvil */  
        @media (max-width: 768px) {  
          .product-carousel-wrapper {  
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