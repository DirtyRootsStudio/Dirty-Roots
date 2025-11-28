'use client';  
  
import { useState } from 'react';  
import { useRouter, usePathname } from 'next/navigation';  
import Image from 'next/image';  
  
export default function EmbedLayout({  
  children,  
}: {  
  children: React.ReactNode;  
}) {  
  const router = useRouter();  
  const pathname = usePathname();  
  
  const navItems = [  
    { path: '/qa/embed/questions', icon: '/icons/questions.png', label: 'Questions' },  
    { path: '/qa/embed/herbarium', icon: '/icons/herbarium.png', label: 'Herbarium' },  
    { path: '/qa/embed/profile', icon: '/icons/profile.png', label: 'Profile' },  
  ];  
  
  return (  
    <div style={{  
      height: '100vh',  
      display: 'flex',  
      flexDirection: 'column',  
      background: '#0B0B0B'  
    }}>  
      <div style={{  
        flex: 1,  
        overflow: 'hidden',  
        scrollbarWidth: 'none',  
        msOverflowStyle: 'none'  
      }} className="layout-content">  
        {children}  
      </div>  
  
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
              cursor: 'pointer',  
              display: 'flex',  
              flexDirection: 'column',  
              alignItems: 'center',  
              gap: '4px',  
              transition: 'all 0.2s',  
              opacity: pathname === item.path ? 1 : 0.6,  
            }}  
          >  
            <div style={{ position: 'relative', width: '48px', height: '48px' }}>  
              <Image  
                src={item.icon}  
                alt={item.label}  
                fill  
                style={{ objectFit: 'contain' }}  
              />  
            </div>  
          </button>  
        ))}  
      </nav>  
  
      <style jsx>{`  
        .layout-content {  
          scrollbar-width: none !important;  
          -ms-overflow-style: none !important;  
        }  
  
        .layout-content::-webkit-scrollbar {  
          display: none !important;  
          width: 0 !important;  
          height: 0 !important;  
        }  
      `}</style>  
    </div>  
  );  
}