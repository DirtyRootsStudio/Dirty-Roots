// src/app/qa/[id]/page.tsx  
"use client";  
  
import { use, useEffect, useState } from "react";  
import { getQuestion, setAnswer } from "@/src/lib/firestore";  
import { ensureAnonAuth, auth } from "@/src/lib/firebase";  
import Link from "next/link";  
  
export const dynamicParams = true;  
  
export default function QuestionDetailPage({ params }: { params: Promise<{ id: string }> }) {  
  const { id } = use(params);  
    
  const [mounted, setMounted] = useState(false);  
  const [q, setQ] = useState<any | null>(null);  
  const [text, setText] = useState("");  
  const [refs, setRefs] = useState("");  
  const [loading, setLoading] = useState(true);  
  const [isEditing, setIsEditing] = useState(false);  
  
  // Primer useEffect: marcar como montado en el cliente  
  useEffect(() => {  
    setMounted(true);  
  }, []);  
  
  // Segundo useEffect: cargar datos solo después de montar  
  useEffect(() => {  
    if (!mounted) return;  
      
    ensureAnonAuth();  
    loadQuestion();  
  }, [id, mounted]);  
  
  async function loadQuestion() {  
    try {  
      const question = await getQuestion(id);  
      setQ(question);  
        
      // Si ya hay respuesta, pre-llenar el formulario para edición  
      if (question?.answer) {  
        setText(question.answer.text);  
        setRefs(question.answer.references?.join(", ") || "");  
      }  
    } catch (error) {  
      console.error("Error cargando pregunta:", error);  
    } finally {  
      setLoading(false);  
    }  
  }  
  
  async function submitAnswer() {  
    if (!text.trim()) return;  
      
    try {  
      await ensureAnonAuth();  
      const uid = auth.currentUser?.uid || "anon";  
        
      await setAnswer(id, {  
        text,  
        references: refs ? refs.split(",").map(s => s.trim()).filter(Boolean) : [],  
        createdBy: uid,  
      });  
        
      // Recargar la pregunta para mostrar la respuesta actualizada  
      await loadQuestion();  
      setIsEditing(false);  
    } catch (error) {  
      console.error("Error guardando respuesta:", error);  
      alert("Error al guardar la respuesta. Por favor, intenta de nuevo.");  
    }  
  }  
  
  function handleCancelEdit() {  
    if (q?.answer) {  
      setText(q.answer.text);  
      setRefs(q.answer.references?.join(", ") || "");  
    } else {  
      setText("");  
      setRefs("");  
    }  
    setIsEditing(false);  
  }  
  
  // Renderizado inicial durante SSR y antes de montar en cliente  
  if (!mounted) {  
    return (  
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0B0B0B' }}>  
        <div style={{ textAlign: 'center' }}>  
          <div style={{ display: 'inline-block', width: '48px', height: '48px', border: '4px solid #A4CB3E', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '16px' }}></div>  
          <p style={{ color: '#B6B9BF', fontSize: '18px' }}>Cargando...</p>  
        </div>  
      </div>  
    );  
  }  
  
  // Estado de carga después de montar  
  if (loading) {  
    return (  
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0B0B0B' }}>  
        <div style={{ textAlign: 'center' }}>  
          <div style={{ display: 'inline-block', width: '48px', height: '48px', border: '4px solid #A4CB3E', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '16px' }}></div>  
          <p style={{ color: '#B6B9BF', fontSize: '18px' }}>Cargando pregunta...</p>  
        </div>  
      </div>  
    );  
  }  
  
  // Pregunta no encontrada  
  if (!q) {  
    return (  
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0B0B0B' }}>  
        <div style={{ textAlign: 'center' }}>  
          <div style={{ fontSize: '56px', marginBottom: '24px' }}>❓</div>  
          <p style={{ fontSize: '20px', color: '#B6B9BF', marginBottom: '24px' }}>  
            Pregunta no encontrada  
          </p>  
          <Link   
            href="/qa"  
            style={{  
              display: 'inline-block',  
              padding: '12px 32px',  
              borderRadius: '9999px',  
              border: '1px solid #FF60A8',  
              color: '#F5F5F5',  
              fontWeight: '600',  
              textDecoration: 'none',  
              transition: 'all 0.2s'  
            }}  
          >  
            ← Volver a preguntas  
          </Link>  
        </div>  
      </div>  
    );  
  }  
  
  const hasAnswer = !!q.answer;  
  
  // Contenido principal  
  return (  
    <div style={{ minHeight: '100vh', background: '#0B0B0B', padding: '32px' }}>  
      {/* Header */}  
      <div style={{ maxWidth: '1400px', margin: '0 auto 32px auto' }}>  
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>  
          <div>  
            <h1 style={{ fontSize: '36px', fontWeight: 'bold', marginBottom: '8px', color: '#F5F5F5' }}>  
              💬 Pregunta y Respuesta  
            </h1>  
            <p style={{ fontSize: '16px', color: '#B6B9BF' }}>  
              {hasAnswer ? 'Respuesta de la comunidad' : 'Sé el primero en responder'}  
            </p>  
          </div>  
          <Link   
            href="/qa"  
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
  
      {/* Main Content - Grid de dos columnas */}  
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>  
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>  
          {/* Columna izquierda: Pregunta y respuesta */}  
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>  
            {/* Tarjeta de la pregunta */}  
            <div   
              style={{  
                borderRadius: '24px',  
                padding: '32px',  
                border: '1px solid #242424',  
                background: '#0F0F0F'  
              }}  
            >  
              <h2 style={{ fontSize: '28px', fontWeight: 'bold', color: '#F5F5F5', marginBottom: '16px' }}>  
                {q.text}  
              </h2>  
              {q.context && (  
                <p style={{ fontSize: '16px', color: '#B6B9BF', marginBottom: '16px', lineHeight: '1.6' }}>  
                  {q.context}  
                </p>  
              )}  
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingTop: '16px', borderTop: '1px solid #1F1F1F' }}>  
                {q.public ? (  
                  <span style={{  
                    fontSize: '12px',  
                    color: '#A4CB3E',  
                    background: 'rgba(164, 203, 62, 0.1)',  
                    padding: '4px 12px',  
                    borderRadius: '9999px'  
                  }}>  
                    ✓ Respondida  
                  </span>  
                ) : (  
                  <span style={{  
                    fontSize: '12px',  
                    color: '#FF60A8',  
                    background: 'rgba(255, 96, 168, 0.1)',  
                    padding: '4px 12px',  
                    borderRadius: '9999px'  
                  }}>  
                    Sin responder  
                  </span>  
                )}  
              </div>  
            </div>  
  
            {/* Sección de respuesta */}  
            {hasAnswer && !isEditing && (  
              <div   
                style={{  
                  borderRadius: '24px',  
                  padding: '32px',  
                  border: '1px solid #242424',  
                  background: '#0F0F0F'  
                }}  
              >  
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>  
                  <h3 style={{ fontSize: '24px', fontWeight: 'bold', color: '#F5F5F5' }}>  
                    Respuesta  
                  </h3>  
                  <button  
                    onClick={() => setIsEditing(true)}  
                    style={{  
                      padding: '8px 16px',  
                      borderRadius: '9999px',  
                      border: '1px solid #A4CB3E',  
                      background: 'transparent',  
                      color: '#A4CB3E',  
                      fontSize: '14px',  
                      fontWeight: '600',  
                      cursor: 'pointer',  
                      transition: 'all 0.2s'  
                    }}  
                    onMouseEnter={(e) => {  
                      e.currentTarget.style.background = '#A4CB3E';  
                      e.currentTarget.style.color = '#0B0B0B';  
                    }}  
                    onMouseLeave={(e) => {  
                      e.currentTarget.style.background = 'transparent';  
                      e.currentTarget.style.color = '#A4CB3E';  
                    }}  
                  >  
                    ✏️ Modificar  
                  </button>  
                </div>  
                  
                <div style={{   
                  padding: '24px',   
                  background: '#0B0B0B',   
                  borderRadius: '16px',  
                  border: '1px solid #1F1F1F'  
                }}>  
                  <p style={{   
                    color: '#F5F5F5',   
                    fontSize: '16px',   
                    lineHeight: '1.6',  
                    whiteSpace: 'pre-wrap'  
                  }}>  
                    {q.answer.text}  
                  </p>  
                    
                  {q.answer.references && q.answer.references.length > 0 && (  
                    <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #1F1F1F' }}>  
                      <p style={{ fontSize: '12px', color: '#B6B9BF', marginBottom: '8px', fontWeight: '600' }}>  
                        Referencias:  
                      </p>  
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>  
                        {q.answer.references.map((ref: string, i: number) => (  
                          <span   
                            key={i}  
                            style={{  
                              fontSize: '12px',  
                              color: '#A4CB3E',  
                              background: 'rgba(164, 203, 62, 0.1)',  
                              padding: '4px 12px',  
                              borderRadius: '9999px',  
                              wordBreak: 'break-all'  
                            }}  
                          >  
                            {ref}  
                          </span>  
                        ))}  
                      </div>  
                    </div>  
                  )}  
                </div>  
              </div>  
            )}  
  
            {/* Estado vacío cuando no hay respuesta y no está editando */}  
            {!hasAnswer && !isEditing && (  
              <div   
                style={{  
                  borderRadius: '24px',  
                  padding: '32px',  
                  border: '1px solid #242424',  
                  background: '#0F0F0F'  
                }}  
              >  
                <div style={{ textAlign: 'center', padding: '40px' }}>  
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>💭</div>  
                  <p style={{ color: '#B6B9BF', fontSize: '16px', marginBottom: '8px' }}>  
                    Esta pregunta aún no tiene respuesta  
                  </p>  
                  <p style={{ color: '#757575', fontSize: '14px' }}>  
                    Usa el formulario de la derecha para responder  
                  </p>  
                </div>  
              </div>  
            )}  
          </div>  
  
          {/* Columna derecha: Formulario de respuesta (sticky) */}  
          <div style={{ position: 'sticky', top: '32px', height: 'fit-content' }}>  
            <div   
              style={{  
                background: '#0F0F0F',  
                borderRadius: '24px',  
                border: '1px solid #242424',  
                padding: '32px'  
              }}  
            >  
              <h3 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px', color: '#F5F5F5' }}>  
                {hasAnswer ? 'Modificar respuesta' : 'Añadir respuesta'}  
              </h3>  
              <p style={{ fontSize: '14px', color: '#B6B9BF', marginBottom: '24px' }}>  
                {hasAnswer   
                  ? 'Actualiza la respuesta existente con nueva información'  
                  : 'Comparte tu conocimiento con la comunidad'  
                }  
              </p>  
  
  <div style={{ marginBottom: '16px' }}>  
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: '#F5F5F5' }}>  
                  Tu respuesta  
                </label>  
                <textarea  
                  value={text}  
                  onChange={(e) => setText(e.target.value)}  
                  rows={5}  
                  placeholder="Comparte tu conocimiento con la comunidad..."  
                  style={{  
                    width: '100%',  
                    background: '#0B0B0B',  
                    border: '1px solid #2A2A2A',  
                    borderRadius: '12px',  
                    padding: '12px',  
                    color: '#F5F5F5',  
                    fontSize: '14px',  
                    fontFamily: 'inherit',  
                    resize: 'vertical',  
                    transition: 'all 0.2s'  
                  }}  
                  onFocus={(e) => e.currentTarget.style.borderColor = '#A4CB3E'}  
                  onBlur={(e) => e.currentTarget.style.borderColor = '#2A2A2A'}  
                />  
              </div>  
  
              <div style={{ marginBottom: '24px' }}>  
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: '#F5F5F5' }}>  
                  Referencias (opcional)  
                </label>  
                <input  
                  type="text"  
                  value={refs}  
                  onChange={(e) => setRefs(e.target.value)}  
                  placeholder="IDs de lugares o URLs, separados por comas"  
                  style={{  
                    width: '100%',  
                    background: '#0B0B0B',  
                    border: '1px solid #2A2A2A',  
                    borderRadius: '12px',  
                    padding: '12px',  
                    color: '#F5F5F5',  
                    fontSize: '14px',  
                    fontFamily: 'inherit',  
                    transition: 'all 0.2s'  
                  }}  
                  onFocus={(e) => e.currentTarget.style.borderColor = '#A4CB3E'}  
                  onBlur={(e) => e.currentTarget.style.borderColor = '#2A2A2A'}  
                />  
              </div>  
  
              <button  
                onClick={submitAnswer}  
                disabled={!text.trim()}  
                style={{  
                  width: '100%',  
                  padding: '14px 24px',  
                  background: text.trim() ? '#A4CB3E' : '#2A2A2A',  
                  color: text.trim() ? '#0B0B0B' : '#666666',  
                  border: 'none',  
                  borderRadius: '9999px',  
                  fontSize: '16px',  
                  fontWeight: '700',  
                  cursor: text.trim() ? 'pointer' : 'not-allowed',  
                  transition: 'all 0.2s'  
                }}  
                onMouseEnter={(e) => {  
                  if (text.trim()) {  
                    e.currentTarget.style.background = '#8FB82E';  
                  }  
                }}  
                onMouseLeave={(e) => {  
                  if (text.trim()) {  
                    e.currentTarget.style.background = '#A4CB3E';  
                  }  
                }}  
              >  
                {hasAnswer ? 'Actualizar respuesta' : 'Publicar respuesta'}  
              </button>  
            </div>  
          </div>  
        </div>  
      </div>  
  
      <style jsx>{`  
        @keyframes spin {  
          to { transform: rotate(360deg); }  
        }  
          
        input::placeholder,  
        textarea::placeholder {  
          color: #B6B9BF;  
          opacity: 0.7;  
        }  
      `}</style>  
    </div>  
  );  
}