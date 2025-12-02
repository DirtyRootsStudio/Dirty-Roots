// src/app/qa/[id]/page.tsx  
"use client";  
  
import { use, useEffect, useState, useCallback } from "react";  
import { getQuestion, setAnswer, Question } from "@/src/lib/firestore";  
import { auth } from "@/src/lib/firebase";  
import Link from "next/link";  
import ProtectedRoute from "@/src/components/ProtectedRoute";  
  
export const dynamicParams = true;  
  
function QuestionDetailPage({ params }: { params: Promise<{ id: string }> }) {  
  const { id } = use(params);  
    
  const [mounted, setMounted] = useState(false);  
  const [q, setQ] = useState<Question | null>(null);  
  const [text, setText] = useState("");  
  const [refs, setRefs] = useState("");  
  const [loading, setLoading] = useState(true);  
  const [isEditing, setIsEditing] = useState(false);  
  
  // Primer useEffect: marcar como montado  
  useEffect(() => {  
    setMounted(true);  
  }, []);  
  
  // loadQuestion con useCallback  
  const loadQuestion = useCallback(async () => {  
    try {  
      const question = await getQuestion(id);  
      setQ(question);  
        
      // Si ya hay respuesta, pre-llenar el formulario para edición  
      if (question?.answer) {  
        setText(question.answer.text);  
        setRefs(question.answer.references?.join(", ") || "");  
      }  
    } catch (error) {  
      console.error("Error loading question:", error);  
    } finally {  
      setLoading(false);  
    }  
  }, [id]);  
  
  // Segundo useEffect: cargar datos después de montar  
  useEffect(() => {  
    if (!mounted) return;  
      
    // ProtectedRoute ya garantiza autenticación con email  
    loadQuestion();  
  }, [mounted, loadQuestion]);  
  
  async function submitAnswer() {  
    if (!text.trim()) return;  
      
    try {  
      const uid = auth.currentUser?.uid;  
      if (!uid) {  
        alert("You must be logged in to submit an answer");  
        return;  
      }  
        
      await setAnswer(id, {  
        text,  
        references: refs ? refs.split(",").map(s => s.trim()).filter(Boolean) : [],  
        createdBy: uid,  
      });  
        
      // Recargar la pregunta para mostrar la respuesta actualizada  
      await loadQuestion();  
      setIsEditing(false);  
    } catch (error) {  
      console.error("Error saving response:", error);  
      alert("Error saving response. Please try again.");  
    }  
  }  
  
  // Renderizado inicial durante SSR y antes de montar en cliente  
  if (!mounted) {  
    return (  
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0B0B0B' }}>  
        <div style={{ textAlign: 'center' }}>  
          <div style={{ display: 'inline-block', width: '48px', height: '48px', border: '4px solid #A4CB3E', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '16px' }}></div>  
          <p style={{ color: '#B6B9BF', fontSize: '18px' }} translate="no">Loading...</p>  
        </div>  
        <style jsx>{`  
          @keyframes spin {  
            to { transform: rotate(360deg); }  
          }  
        `}</style>  
      </div>  
    );  
  }  
  
  // Estado de carga después de montar  
  if (loading) {  
    return (  
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0B0B0B' }}>  
        <div style={{ textAlign: 'center' }}>  
          <div style={{ display: 'inline-block', width: '48px', height: '48px', border: '4px solid #A4CB3E', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '16px' }}></div>  
          <p style={{ color: '#B6B9BF', fontSize: '18px' }}>Loading question...</p>  
        </div>  
        <style jsx>{`  
          @keyframes spin {  
            to { transform: rotate(360deg); }  
          }  
        `}</style>  
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
            Question not found  
          </p>  
          <Link  
            href="/community/questions"  
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
            ← Back to questions  
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
              💬 Question and Answer  
            </h1>  
            <p style={{ fontSize: '16px', color: '#B6B9BF' }}>  
              {hasAnswer ? 'Community response' : 'Be the first to reply'}  
            </p>  
          </div>  
          <Link  
            href="/community/questions"  
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
            ← Go back  
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
                    ✓ Answered  
                  </span>  
                ) : (  
                  <span style={{  
                    fontSize: '12px',  
                    color: '#FF60A8',  
                    background: 'rgba(255, 96, 168, 0.1)',  
                    padding: '4px 12px',  
                    borderRadius: '9999px'  
                  }}>  
                    No response  
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
                    Answer  
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
                    ✏️ Modify  
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
                    {q.answer?.text}  
                  </p>  
                        
                  {q.answer?.references && q.answer.references.length > 0 && (  
                    <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #1F1F1F' }}>  
                      <p style={{ fontSize: '12px', color: '#B6B9BF', marginBottom: '8px', fontWeight: '600' }}>  
                        References:  
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
                    This question still has no answer  
                  </p>  
                  <p style={{ color: '#757575', fontSize: '14px' }}>  
                    Use the form on the right to reply  
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
                {hasAnswer ? 'Modify response' : 'Add response'}  
              </h3>  
              <p style={{ fontSize: '14px', color: '#B6B9BF', marginBottom: '24px' }}>  
                {hasAnswer  
                  ? 'Update the existing answer with new information.'  
                  : 'Share your knowledge with the community'  
                }  
              </p>  
  
              <div style={{ marginBottom: '16px' }}>  
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: '#F5F5F5' }}>  
                  Your response  
                </label>  
                <textarea  
                  value={text}  
                  onChange={(e) => setText(e.target.value)}  
                  rows={5}  
                  placeholder="Share your knowledge with the community..."  
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
                  References (optional)  
                </label>  
                <input  
                  type="text"  
                  value={refs}  
                  onChange={(e) => setRefs(e.target.value)}  
                  placeholder="Place IDs or URLs, separated by commas"  
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
                {hasAnswer ? 'Update response' : 'Post response'}  
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

export default function ProtectedQuestionDetailPage({ params }: { params: Promise<{ id: string }> }) {  
  return (  
    <ProtectedRoute>  
      <QuestionDetailPage params={params} />  
    </ProtectedRoute>  
  );  
}