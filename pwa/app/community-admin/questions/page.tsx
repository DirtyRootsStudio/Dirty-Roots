// src/app/qa/page.tsx      
"use client";      
      
import { useEffect, useState } from "react";      
import { listQuestions, deleteQuestion, Question  } from "@/src/lib/firestore";      
import Link from "next/link";      
import { ensureAnonAuth } from "@/src/lib/firebase";      
      
export default function QaPage() {      
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);      
      
  useEffect(() => {      
    ensureAnonAuth();      
    (async () => {      
      try {      
        const q = await listQuestions(100);      
        setQuestions(q);      
      } catch (error) {      
        console.error("Error loading questions:", error);      
      } finally {      
        setLoading(false);      
      }      
    })();      
  }, []);      
      
  const handleDeleteQuestion = async (questionId: string) => {      
    if (!confirm("Are you sure you want to delete this question?")) {      
      return;      
    }      
          
    try {      
      await deleteQuestion(questionId);      
      setQuestions(questions.filter(q => q.id !== questionId));      
    } catch (error) {      
      console.error("Error deleting question:", error);      
      alert("Error deleting the question. Please try again.");      
    }      
  };      
      
  if (loading) {      
    return (      
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0B0B0B' }}>      
        <div style={{ textAlign: 'center' }}>      
          <div style={{ display: 'inline-block', width: '48px', height: '48px', border: '4px solid #A4CB3E', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '16px' }}></div>      
          <p style={{ color: '#B6B9BF', fontSize: '18px' }}>Loading questions...</p>      
        </div>      
      </div>      
    );      
  }      
      
  return (      
    <div style={{ minHeight: '100vh', background: '#0B0B0B', padding: '32px' }}>      
      {/* Header */}      
      <div style={{ maxWidth: '1400px', margin: '0 auto 32px auto' }}>      
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>      
          <div>      
            <h1 style={{ fontSize: '36px', fontWeight: 'bold', marginBottom: '8px', color: '#F5F5F5' }}>      
              💬 Questions and Answers      
            </h1>      
            <p style={{ fontSize: '16px', color: '#B6B9BF' }}>      
              Explore and answer community questions      
            </p>      
          </div>      
          <Link       
            href="/"       
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
            ← Inicio      
          </Link>      
        </div>      
      </div>      
      
      {/* Main Content - Una sola columna con lista de preguntas */}      
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>      
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>      
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#F5F5F5', marginBottom: '8px' }}>      
            All questions      
          </h2>      
      
          {questions.length === 0 ? (      
            <div       
              style={{       
                borderRadius: '24px',       
                padding: '40px',       
                textAlign: 'center',      
                border: '1px solid #242424',      
                background: '#0F0F0F'      
              }}      
            >      
              <div style={{ fontSize: '56px', marginBottom: '24px' }}>💬</div>      
              <p style={{ marginBottom: '16px', fontSize: '20px', color: '#B6B9BF' }}>      
                There are no questions yet.      
              </p>      
              <p style={{ fontSize: '14px', color: '#B6B9BF' }}>      
                Be the first to ask a question      
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
                      position: 'relative',      
                      borderRadius: '24px',       
                      padding: '24px',      
                      border: '1px solid #242424',      
                      background: '#0F0F0F',      
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
                    {/* Botón eliminar en la esquina superior derecha */}      
                    <div style={{ position: 'absolute', top: '16px', right: '16px', display: 'flex', gap: '8px' }}>      
                      <button      
                        onClick={(e) => {  
                          e.stopPropagation();  
                          if (q.id) {  
                            handleDeleteQuestion(q.id);  
                          }  
                        }}    
                        style={{      
                          padding: '8px 12px',      
                          borderRadius: '9999px',      
                          background: 'transparent',      
                          border: '1px solid #FF60A8',      
                          color: '#FF60A8',      
                          fontWeight: '600',      
                          fontSize: '12px',      
                          cursor: 'pointer',      
                          transition: 'all 0.2s'      
                        }}      
                        onMouseEnter={(e) => {      
                          e.currentTarget.style.background = '#FF60A8';      
                          e.currentTarget.style.color = '#0B0B0B';      
                        }}      
                        onMouseLeave={(e) => {      
                          e.currentTarget.style.background = 'transparent';      
                          e.currentTarget.style.color = '#FF60A8';      
                        }}      
                      >      
                        🗑️      
                      </button>      
                    </div>      
      
                    <Link       
                      href={`/community-admin/questions/${q.id}`}      
                      style={{ textDecoration: 'none', display: 'block' }}      
                    >      
                      <div style={{ marginBottom: '12px', paddingRight: '100px' }}>      
                        <div style={{ fontWeight: 'bold', fontSize: '18px', color: '#F5F5F5', marginBottom: '8px' }}>      
                          {q.text}      
                        </div>      
                        {q.context && (      
                          <div style={{ fontSize: '14px', color: '#B6B9BF', lineHeight: '1.5' }}>      
                            {q.context}      
                          </div>      
                        )}      
                      </div>      
      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingTop: '12px', borderTop: '1px solid #1F1F1F' }}>      
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
                            No response      
                          </span>      
                        )}    
                        {q.public && (      
                          <span style={{      
                            fontSize: '12px',      
                            color: '#A4CB3E',      
                            background: 'rgba(164, 203, 62, 0.1)',      
                            padding: '4px 12px',      
                            borderRadius: '9999px'      
                          }}>      
                            ✓ Public      
                          </span>      
                        )}      
                      </div>      
                    </Link>      
                  </div>      
                );    
              })}      
            </div>      
          )}      
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