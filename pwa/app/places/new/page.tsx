// src/app/places/new/page.tsx  
"use client";  
  
import { useRouter } from "next/navigation";  
import PlaceForm from "@/src/components/PlaceForm";  
import Link from "next/link";  
  
export default function NewPlacePage() {  
  const router = useRouter();  
  
  return (  
    <div style={{ minHeight: '100vh', background: '#0B0B0B', padding: '32px' }}>  
      {/* Header */}  
      <div style={{ maxWidth: '1400px', margin: '0 auto 32px auto' }}>  
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>  
          <div>  
            <h1 style={{ fontSize: '36px', fontWeight: 'bold', marginBottom: '8px', color: '#F5F5F5' }}>  
              🌿 Add a quiet place  
            </h1>  
            <p style={{ fontSize: '16px', color: '#B6B9BF' }}>  
              Share a quiet place you've discovered  
            </p>  
          </div>  
          <Link   
            href="/places"   
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
            ← Volver  
          </Link>  
        </div>  
      </div>  
  
      {/* Form Container */}  
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>  
        <div   
          style={{   
            borderRadius: '24px',   
            padding: '32px',  
            border: '1px solid #242424',  
            background: '#0F0F0F',  
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'  
          }}  
        >  
          <PlaceForm />  
        </div>  
      </div>  
    </div>  
  );  
}