
// app/qa/embed/questions/page.tsx  
"use client";  
  
import { useEffect, useState } from "react";  
import QuestionForm from "@/src/components/QuestionForm";  
import { ensureAnonAuth } from "@/src/lib/firebase";  
  
export default function EmbedQuestionsPage() {  
  const [mounted, setMounted] = useState(false);  
  
  useEffect(() => {  
    setMounted(true);  
    ensureAnonAuth();  
  }, []);  
  
  if (!mounted) {  
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
      width: '100vw',  
      minHeight: '100vh',  
      display: 'flex',  
      alignItems: 'center',  
      justifyContent: 'center',  
      background: '#0B0B0B',  
      padding: '20px'  
    }}>  
      <div style={{  
        width: '100%',  
        maxWidth: '600px',  
        background: '#0F0F0F',  
        borderRadius: '24px',  
        border: '1px solid #242424',  
        padding: '32px'  
      }}>  
        <h2 style={{  
          fontSize: '24px',  
          fontWeight: 'bold',  
          marginBottom: '16px',  
          color: '#F5F5F5'  
        }}>  
          💬 Nueva pregunta  
        </h2>  
        <p style={{  
          fontSize: '14px',  
          color: '#B6B9BF',  
          marginBottom: '24px'  
        }}>  
          Las preguntas se harán públicas una vez que reciban una respuesta  
        </p>  
        <QuestionForm onCreated={(id) => {  
          // Redirigir a la página de detalle de la pregunta en la PWA principal  
          window.parent.location.href = `/qa/${id}`;  
        }} />  
      </div>  
    </div>  
  );  
}