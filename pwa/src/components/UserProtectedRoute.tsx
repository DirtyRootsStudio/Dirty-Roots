// pwa/src/components/UserProtectedRoute.tsx  
'use client';  
  
import { useEffect, useState } from 'react';  
import { useRouter } from 'next/navigation';  
import { onAuthStateChanged } from 'firebase/auth';  
import { auth } from '@/src/lib/firebase';  
  
export default function UserProtectedRoute({  
  children,  
}: {  
  children: React.ReactNode;  
}) {  
  const [loading, setLoading] = useState(true);  
  const router = useRouter();  
  
  useEffect(() => {  
    const unsubscribe = onAuthStateChanged(auth, (user) => {  
      if (!user || user.isAnonymous) {  
        router.push('/user-auth');  
      } else {  
        setLoading(false);  
      }  
    });  
  
    return () => unsubscribe();  
  }, [router]);  
  
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
          <p style={{ color: '#B6B9BF', fontSize: '18px' }}>Cargando...</p>  
        </div>  
      </div>  
    );  
  }  
  
  return <>{children}</>;  
}