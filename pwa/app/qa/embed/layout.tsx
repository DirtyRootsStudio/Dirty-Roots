// pwa/app/qa/embed/layout.tsx  
'use client';  
  
import { useState } from 'react';  
import { useRouter, usePathname } from 'next/navigation';  
  
export default function EmbedLayout({  
  children,  
}: {  
  children: React.ReactNode;  
}) {  
  const router = useRouter();  
  const pathname = usePathname();  
  
  const navItems = [  
    { path: '/qa/embed/questions', label: '❓ Preguntas', emoji: '❓' },  
    { path: '/qa/embed/herbarium', label: '🌿 Herbario', emoji: '🌿' },  
  ];  
  
  return (  
    <div style={{   
      height: '100vh',   
      display: 'flex',   
      flexDirection: 'column',  
      background: '#0B0B0B'   
    }}>  
      {/* Contenido principal */}  
      <div style={{ flex: 1, overflow: 'hidden' }}>  
        {children}  
      </div>  
  
      {/* Barra de navegación inferior */}  
      <nav style={{  
        height: '70px',  
        background: '#0F0F0F',  
        borderTop: '1px solid #242424',  
        display: 'flex',  
        justifyContent: 'space-around',  
        alignItems: 'center',  
        padding: '0 24px'  
      }}>  
        {navItems.map((item) => (  
          <button  
            key={item.path}  
            onClick={() => router.push(item.path)}  
            style={{  
              background: 'none',  
              border: 'none',  
              color: pathname === item.path ? '#A4CB3E' : '#B6B9BF',  
              fontSize: '14px',  
              fontWeight: '600',  
              cursor: 'pointer',  
              display: 'flex',  
              flexDirection: 'column',  
              alignItems: 'center',  
              gap: '4px',  
              transition: 'all 0.2s'  
            }}  
          >  
            <span style={{ fontSize: '20px' }}>{item.emoji}</span>  
            <span>{item.label}</span>  
          </button>  
        ))}  
      </nav>  
    </div>  
  );  
}