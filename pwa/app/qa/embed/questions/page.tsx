// app/qa/embed/questions/page.tsx    
"use client";    
    
import { useEffect, useState } from "react";    
import QuestionForm from "@/src/components/QuestionForm";    
import { listQuestions } from "@/src/lib/firestore";    
import UserProtectedRoute from '@/src/components/UserProtectedRoute';    
    
function QuestionsPage() {    
  const [mounted, setMounted] = useState(false);    
  const [questions, setQuestions] = useState<any[]>([]);    
  const [loading, setLoading] = useState(true);    
  const [drawerOpen, setDrawerOpen] = useState(false);    
    
  useEffect(() => {    
    setMounted(true);    
  }, []);    
    
  useEffect(() => {    
    if (!mounted) return;    
    
    (async () => {    
      try {    
        await loadQuestions();    
      } catch (error) {    
        console.error("Error initializing:", error);    
      }    
    })();    
  }, [mounted]);    
    
  async function loadQuestions() {    
    try {    
      const allQuestions = await listQuestions(100);    
    
      const sorted = allQuestions.sort((a, b) => {    
        const aHasAnswer = !!(a.answer && a.answer.text);    
        const bHasAnswer = !!(b.answer && b.answer.text);    
    
        if (aHasAnswer && !bHasAnswer) return -1;    
        if (!aHasAnswer && bHasAnswer) return 1;    
        return 0;    
      });    
    
      setQuestions(sorted);    
    } catch (error) {    
      console.error("Error loading questions:", error);    
    } finally {    
      setLoading(false);    
    }    
  }    
    
  function handleQuestionCreated(id: string) {    
    loadQuestions();    
    setDrawerOpen(false);    
  }    
    
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
          <p style={{ color: '#B6B9BF', fontSize: '18px' }}>Loading...</p>    
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
      height: '100%',    
      position: 'relative',    
      background: '#0B0B0B',    
      overflow: 'hidden'    
    }}>    
      {/* Lista de preguntas */}    
      <div className="questions-scroll" style={{    
        width: '100%',    
        height: '100%',    
        overflowY: 'auto',  // ✅ Corregido: de 'auto' a 'hidden'  
        padding: '16px',    
        paddingBottom: '100px',    
        boxSizing: 'border-box',    
        scrollbarWidth: 'none',    
        msOverflowStyle: 'none'    
      }}>    
        <h2 style={{    
          fontSize: '24px',    
          fontWeight: 'bold',    
          marginBottom: '20px',    
          color: '#F5F5F5',    
          wordBreak: 'break-word'    
        }}>    
          💬 Ask Adam (gently)    
        </h2>    
    
        {loading ? (    
          <div style={{    
            display: 'flex',    
            alignItems: 'center',    
            justifyContent: 'center',    
            padding: '40px'    
          }}>    
            <div style={{    
              display: 'inline-block',    
              width: '48px',    
              height: '48px',    
              border: '4px solid #A4CB3E',    
              borderTopColor: 'transparent',    
              borderRadius: '50%',    
              animation: 'spin 1s linear infinite'    
            }}></div>    
          </div>    
        ) : questions.length === 0 ? (    
          <div style={{    
            borderRadius: '16px',    
            padding: '24px',    
            textAlign: 'center',    
            border: '1px solid #242424',    
            background: '#0F0F0F'    
          }}>    
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>💬</div>    
            <p style={{ marginBottom: '12px', fontSize: '18px', color: '#B6B9BF' }}>    
              No questions yet.    
            </p>    
            <p style={{ fontSize: '14px', color: '#B6B9BF' }}>    
              Be the first to ask a question.    
            </p>    
          </div>    
        ) : (    
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>    
            {questions.map(q => {    
              const hasAnswer = q.answer && q.answer.text;    
    
              return (    
                <div    
                  key={q.id}    
                  style={{    
                    borderRadius: '16px',    
                    padding: '16px',    
                    border: '1px solid #242424',    
                    background: '#0F0F0F',    
                    transition: 'all 0.2s',    
                    wordBreak: 'break-word',    
                    overflowWrap: 'break-word'    
                  }}    
                >    
                  <div style={{ marginBottom: '12px' }}>    
                    <div style={{    
                      fontWeight: 'bold',    
                      fontSize: '16px',    
                      color: '#F5F5F5',    
                      marginBottom: '8px',    
                      lineHeight: '1.4'    
                    }}>    
                      {q.text}    
                    </div>    
                    {q.context && (    
                      <div style={{    
                        fontSize: '14px',    
                        color: '#B6B9BF',    
                        lineHeight: '1.5'    
                      }}>    
                        {q.context}    
                      </div>    
                    )}    
                  </div>    
    
                  {hasAnswer && (    
                    <div style={{    
                      marginTop: '12px',    
                      paddingTop: '12px',    
                      borderTop: '1px solid #1F1F1F'    
                    }}>    
                      <div style={{    
                        fontSize: '12px',    
                        fontWeight: '600',    
                        color: '#A4CB3E',    
                        marginBottom: '8px'    
                      }}>    
                        Answer:    
                      </div>    
                      <div style={{    
                        fontSize: '14px',    
                        color: '#B6B9BF',    
                        lineHeight: '1.5',    
                        marginBottom: '8px'    
                      }}>    
                        {q.answer.text}    
                      </div>    
                      {q.answer.references && q.answer.references.length > 0 && (    
                        <div style={{ marginTop: '8px' }}>    
                          <div style={{ fontSize: '11px', color: '#757575', marginBottom: '4px' }}>    
                            References:    
                          </div>    
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>    
                            {q.answer.references.map((ref: string, i: number) => (    
                              <span    
                                key={i}    
                                style={{    
                                  fontSize: '11px',    
                                  color: '#A4CB3E',    
                                  background: 'rgba(164, 203, 62, 0.1)',    
                                  padding: '3px 8px',    
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
                  )}    
    
                  <div style={{    
                    display: 'flex',    
                    alignItems: 'center',    
                    gap: '8px',    
                    paddingTop: '12px',    
                    marginTop: '12px',    
                    borderTop: '1px solid #1F1F1F',    
                    flexWrap: 'wrap'    
                  }}>    
                    {hasAnswer ? (    
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
                        Pending Answer    
                      </span>    
                    )}    
                  </div>    
                </div>    
              );    
            })}    
          </div>    
        )}    
      </div>    
    
      {/* Botón flotante - ajustado para dejar espacio para barra inferior */}    
      <button    
        onClick={() => setDrawerOpen(!drawerOpen)}    
        style={{    
          position: 'fixed',    
          bottom: '90px', // Ajustado para dejar espacio para barra de navegación    
          right: '20px',    
          width: '56px',    
          height: '56px',    
          borderRadius: '50%',    
          background: '#A4CB3E',    
          border: 'none',    
          cursor: 'pointer',    
          display: 'flex',    
          alignItems: 'center',    
          justifyContent: 'center',    
          fontSize: '24px',    
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',    
          zIndex: 1000,    
          transition: 'transform 0.2s'    
        }}    
        onMouseEnter={(e) => {    
          e.currentTarget.style.transform = 'scale(1.1)';    
        }}    
        onMouseLeave={(e) => {    
          e.currentTarget.style.transform = 'scale(1)';    
        }}    
      >    
        {drawerOpen ? '✕' : '💬'}    
      </button>    
    
      {/* Overlay */}    
      {drawerOpen && (    
        <div    
          onClick={() => setDrawerOpen(false)}    
          style={{    
            position: 'fixed',    
            top: 0,    
            left: 0,    
            width: '100%',    
            height: '100%',    
            background: 'rgba(0, 0, 0, 0.5)',    
            zIndex: 1001,    
            animation: 'fadeIn 0.3s ease-out'    
          }}    
        />    
      )}    
    
      {/* Drawer con formulario */}    
      <div    
        className="drawer-scroll"    
        style={{    
          position: 'fixed',    
          bottom: 0,    
          left: 0,    
          width: '100%',    
          maxHeight: '85vh',    
          background: '#0F0F0F',    
          borderTopLeftRadius: '20px',    
          borderTopRightRadius: '20px',    
          boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.5)',    
          transform: drawerOpen ? 'translateY(0)' : 'translateY(100%)',    
          transition: 'transform 0.3s ease-out',    
          zIndex: 1002,    
          overflowY: 'auto',    
          padding: '20px 16px',    
          boxSizing: 'border-box',    
          scrollbarWidth: 'none',    
          msOverflowStyle: 'none'    
        }}    
      >    
        {/* Handle */}    
        <div style={{    
          width: '40px',    
          height: '4px',    
          background: '#2A2A2A',    
          borderRadius: '2px',    
          margin: '0 auto 16px',    
          cursor: 'pointer'    
        }} onClick={() => setDrawerOpen(false)} />    
    
        <h2 style={{    
          fontSize: '20px',    
          fontWeight: 'bold',    
          marginBottom: '12px',    
          color: '#F5F5F5',    
          margin: '0 0 12px 0'    
        }}>    
          💬 Ask a Question    
        </h2>    
        <p style={{    
          fontSize: '14px',    
          color: '#B6B9BF',    
          marginBottom: '20px',    
          lineHeight: '1.5'    
        }}>    
          Your question will appear in the list above once answered.    
        </p>    
        <QuestionForm onCreated={handleQuestionCreated} />    
      </div>    
    
      <style jsx>{`    
        @keyframes spin {    
          to { transform: rotate(360deg); }    
        }    
    
        @keyframes fadeIn {    
          from { opacity: 0; }    
          to { opacity: 1; }    
        }    
    
        /* Ocultar scrollbar en .questions-scroll */    
        .questions-scroll {    
          scrollbar-width: none !important; /* Firefox */    
          -ms-overflow-style: none !important; /* IE/Edge */    
        }    
    
        .questions-scroll::-webkit-scrollbar {    
          display: none !important; /* Chrome/Safari/Opera */    
          width: 0 !important;    
          height: 0 !important;    
        }    
    
        /* Ocultar scrollbar en .drawer-scroll */    
        .drawer-scroll {    
          scrollbar-width: none !important; /* Firefox */    
          -ms-overflow-style: none !important; /* IE/Edge */    
        }    
    
        .drawer-scroll::-webkit-scrollbar {    
          display: none !important; /* Chrome/Safari/Opera */    
          width: 0 !important;    
          height: 0 !important;    
        }    
      `}</style>    
    </div>    
  );    
}    
    
export default function ProtectedQuestionsPage() {    
  return (    
    <UserProtectedRoute>    
      <QuestionsPage />    
    </UserProtectedRoute>    
  );    
}