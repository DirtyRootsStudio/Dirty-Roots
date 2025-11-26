// app/page.tsx      
'use client';      
      
import { useEffect, useState } from 'react';      
import { useRouter } from 'next/navigation';      
import { onAuthStateChanged, signOut } from 'firebase/auth';      
import { auth } from '@/src/lib/firebase';      
import Link from 'next/link';      
      
export default function HomePage() {      
  const [loading, setLoading] = useState(true);      
  const [authenticated, setAuthenticated] = useState(false);      
  const router = useRouter();      
      
  useEffect(() => {      
    const unsubscribe = onAuthStateChanged(auth, (user) => {      
      if (user) {      
        setAuthenticated(true);      
      } else {      
        router.push('/auth');      
      }      
      setLoading(false);      
    });      
      
    return () => unsubscribe();      
  }, [router]);      
      
  const handleLogout = async () => {      
    try {      
      await signOut(auth);      
      router.push('/auth');      
    } catch (error) {      
      console.error('Error al cerrar sesión:', error);      
    }      
  };      
      
  if (loading) {      
    return (      
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0B0B0B' }}>      
        <div style={{ textAlign: 'center' }}>      
          <div style={{ display: 'inline-block', width: '48px', height: '48px', border: '4px solid #A4CB3E', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '16px' }}></div>      
          <p style={{ color: '#B6B9BF', fontSize: '18px' }}>Cargando...</p>      
        </div>      
      </div>      
    );      
  }      
      
  if (!authenticated) {      
    return null;      
  }      
      
  return (      
    <div style={{ minHeight: '100vh', background: '#0B0B0B', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px' }}>      
      <div style={{ width: '100%', maxWidth: '600px', display: 'flex', flexDirection: 'column', gap: '32px' }}>      
        {/* Header */}      
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>      
          <h1 style={{ fontSize: '36px', fontWeight: 'bold', color: '#F5F5F5' }}>      
            Dirty Roots Console      
          </h1>      
          <button      
            onClick={handleLogout}      
            style={{      
              padding: '10px 20px',      
              borderRadius: '9999px',      
              border: '1px solid #FF60A8',      
              background: 'transparent',      
              color: '#F5F5F5',      
              fontWeight: '600',      
              fontSize: '14px',      
              cursor: 'pointer',      
              transition: 'all 0.2s'      
            }}      
            onMouseEnter={(e) => {      
              e.currentTarget.style.background = '#FF60A8';      
              e.currentTarget.style.color = '#0B0B0B';      
            }}      
            onMouseLeave={(e) => {      
              e.currentTarget.style.background = 'transparent';      
              e.currentTarget.style.color = '#F5F5F5';      
            }}      
          >      
            Log out      
          </button>      
        </div>      
      
        <p style={{ textAlign: 'center', color: '#B6B9BF', fontSize: '18px' }}>      
          What do you want to explore?      
        </p>      
      
        {/* Cards Grid */}      
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>      
          <Link       
            href="/places"      
            style={{ textDecoration: 'none' }}      
          >      
            <div      
              style={{      
                borderRadius: '24px',      
                padding: '32px',      
                border: '1px solid #242424',      
                background: '#0F0F0F',      
                cursor: 'pointer',      
                transition: 'all 0.2s'      
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
              <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px', color: '#F5F5F5' }}>      
                🗺️ Places      
              </h2>      
              <p style={{ fontSize: '16px', color: '#B6B9BF', lineHeight: '1.6' }}>      
                Discover and share peaceful places      
              </p>      
            </div>      
          </Link>      
      
          <Link       
            href="/qa"      
            style={{ textDecoration: 'none' }}      
          >      
            <div      
              style={{      
                borderRadius: '24px',      
                padding: '32px',      
                border: '1px solid #242424',      
                background: '#0F0F0F',      
                cursor: 'pointer',      
                transition: 'all 0.2s'      
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
              <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px', color: '#F5F5F5' }}>      
                💬 Questions      
              </h2>      
              <p style={{ fontSize: '16px', color: '#B6B9BF', lineHeight: '1.6' }}>      
                Participate in the question and answer community      
              </p>      
            </div>      
          </Link>    
    
          <Link       
            href="/live"      
            style={{ textDecoration: 'none' }}      
          >      
            <div      
              style={{      
                borderRadius: '24px',      
                padding: '32px',      
                border: '1px solid #242424',      
                background: '#0F0F0F',      
                cursor: 'pointer',      
                transition: 'all 0.2s'      
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
              <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px', color: '#F5F5F5' }}>      
                🎙️ Live Sessions      
              </h2>      
              <p style={{ fontSize: '16px', color: '#B6B9BF', lineHeight: '1.6' }}>      
                Join seasonal live Q&A sessions with Adam      
              </p>      
            </div>      
          </Link>  
  
          {/* Nueva tarjeta para Things that grow slowly shop */}  
          <Link       
            href="/growslowlyshop"      
            style={{ textDecoration: 'none' }}      
          >      
            <div      
              style={{      
                borderRadius: '24px',      
                padding: '32px',      
                border: '1px solid #242424',      
                background: '#0F0F0F',      
                cursor: 'pointer',      
                transition: 'all 0.2s'      
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
              <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px', color: '#F5F5F5' }}>      
                🛍️ Things that grow slowly shop      
              </h2>      
              <p style={{ fontSize: '16px', color: '#B6B9BF', lineHeight: '1.6' }}>      
                Manage exclusive products for mindful living      
              </p>      
            </div>      
          </Link>  

          {/* Nueva tarjeta para Seasonal Toolkit */}  
          <Link   
            href="/seasonal-toolkit"  
            style={{ textDecoration: 'none' }}  
          >  
            <div  
              style={{  
                borderRadius: '24px',  
                padding: '32px',  
                border: '1px solid #242424',  
                background: '#0F0F0F',  
                cursor: 'pointer',  
                transition: 'all 0.2s'  
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
              <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px', color: '#F5F5F5' }}>  
                🌿 Seasonal Toolkit  
              </h2>  
              <p style={{ fontSize: '16px', color: '#B6B9BF', lineHeight: '1.6' }}>  
                Manage seasonal plant care guides and resources  
              </p>  
            </div>  
          </Link>

          <Link  
            href="/brands"  
            style={{ textDecoration: 'none' }}  
          >  
            <div  
              style={{  
                borderRadius: '24px',  
                padding: '32px',  
                border: '1px solid #242424',  
                background: '#0F0F0F',  
                cursor: 'pointer',  
                transition: 'all 0.2s'  
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
              <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px', color: '#F5F5F5' }}>  
                🏷️ Brands  
              </h2>  
              <p style={{ fontSize: '16px', color: '#B6B9BF', lineHeight: '1.6' }}>  
                Manage partner brands and their promotional content  
              </p>  
            </div>  
          </Link>
        </div>      
      </div>      


      
      
      <style jsx>{`      
        @keyframes spin {      
          to { transform: rotate(360deg); }      
        }      
      `}</style>      
    </div>      
  );      
}