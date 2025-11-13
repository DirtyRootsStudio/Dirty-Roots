// app/live/embed/page.tsx    
"use client";    
    
import { useEffect, useState } from "react";    
import { ensureAnonAuth } from "@/src/lib/firebase";    
import { listLiveSessions, addSeatReservation } from "@/src/lib/firestore";    
    
export default function EmbedLiveSessionsPage() {    
  const [mounted, setMounted] = useState(false);    
  const [sessions, setSessions] = useState<any[]>([]);    
  const [loading, setLoading] = useState(true);    
  const [email, setEmail] = useState("");    
  const [submitting, setSubmitting] = useState(false);    
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);    
  const [successMessage, setSuccessMessage] = useState<string | null>(null);  
    
  // Primer useEffect: marcar como montado    
  useEffect(() => {    
    setMounted(true);    
  }, []);    
    
  // Segundo useEffect: cargar datos después de montar    
  useEffect(() => {    
    if (!mounted) return;    
    
    (async () => {    
      try {    
        await ensureAnonAuth();    
        await loadSessions();    
      } catch (error) {    
        console.error("Error initializing:", error);    
      }    
    })();    
  }, [mounted]);    
    
  async function loadSessions() {    
    try {    
      const allSessions = await listLiveSessions(50);    
      // Filtrar solo sesiones upcoming o live    
      const activeSessions = allSessions.filter(    
        s => s.status === "upcoming" || s.status === "live"    
      );    
      // Ordenar por fecha (más próximas primero)    
      activeSessions.sort((a, b) => a.date.toMillis() - b.date.toMillis());    
      setSessions(activeSessions);    
    } catch (error) {    
      console.error("Error loading sessions:", error);    
    } finally {    
      setLoading(false);    
    }    
  }    
    
  async function handleSaveSeat(sessionId: string) {    
    if (!email.trim()) {    
      alert("Please enter your email address");    
      return;    
    }    
    
    // Validación básica de email    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;    
    if (!emailRegex.test(email)) {    
      alert("Please enter a valid email address");    
      return;    
    }    
    
    setSubmitting(true);    
    try {    
      await addSeatReservation({    
        sessionId,    
        email: email.trim(),    
        createdBy: "anonymous"    
      });    
    
      // Encontrar la sesión para mostrar el link de YouTube  
      const session = sessions.find(s => s.id === sessionId);  
        
      setSuccessMessage(  
        session?.youtubeLink   
          ? `✅ Seat reserved! YouTube link: ${session.youtubeLink}`  
          : "✅ Seat reserved! You'll receive the YouTube link before the session."  
      );  
        
      setEmail("");    
      setSelectedSessionId(null);  
        
      // Limpiar mensaje después de 5 segundos  
      setTimeout(() => setSuccessMessage(null), 5000);  
    } catch (error) {    
      console.error("Error reserving seat:", error);    
      alert("Error reserving seat. Please try again.");    
    } finally {    
      setSubmitting(false);    
    }    
  }    
    
  if (!mounted || loading) {    
    return (    
      <div style={{    
        width: '100%',    
        height: '100%',    
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
          <p style={{ color: '#B6B9BF', fontSize: '18px' }}>Loading sessions...</p>    
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
      display: 'flex',    
      flexDirection: 'column',    
      background: '#0B0B0B',    
      overflow: 'hidden'    
    }}>    
      <div style={{    
        flex: 1,    
        overflowY: 'auto',    
        padding: '32px'    
      }} className="sessions-scroll">    
        {/* Header */}    
        <div style={{    
          marginBottom: '32px',    
          textAlign: 'center'    
        }}>    
          <h1 style={{    
            fontSize: '32px',    
            fontWeight: 'bold',    
            color: '#F5F5F5',    
            marginBottom: '8px'    
          }}>    
            🎙️ Live Q&A Sessions    
          </h1>    
          <p style={{    
            fontSize: '16px',    
            color: '#B6B9BF'    
          }}>    
            Join our seasonal live sessions with Adam    
          </p>    
        </div>    
  
        {/* Success Message */}  
        {successMessage && (  
          <div style={{  
            marginBottom: '24px',  
            padding: '16px',  
            background: 'rgba(164, 203, 62, 0.1)',  
            border: '1px solid #A4CB3E',  
            borderRadius: '12px',  
            color: '#A4CB3E',  
            fontSize: '14px',  
            textAlign: 'center'  
          }}>  
            {successMessage}  
          </div>  
        )}  
    
        {/* Sessions List */}    
        {sessions.length === 0 ? (    
          <div style={{    
            textAlign: 'center',    
            padding: '60px 20px',    
            background: '#0F0F0F',    
            borderRadius: '24px',    
            border: '1px solid #242424'    
          }}>    
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>📅</div>    
            <p style={{    
              fontSize: '18px',    
              color: '#B6B9BF',    
              marginBottom: '8px'    
            }}>    
              No upcoming sessions    
            </p>    
            <p style={{    
              fontSize: '14px',    
              color: '#757575'    
            }}>    
              Check back soon for new live Q&A dates    
            </p>    
          </div>    
        ) : (    
          <div style={{    
            display: 'flex',    
            flexDirection: 'column',    
            gap: '24px'    
          }}>    
            {sessions.map(session => {    
              const sessionDate = session.date.toDate();    
              const isLive = session.status === "live";    
              const formattedDate = sessionDate.toLocaleDateString('en-US', {    
                weekday: 'long',    
                year: 'numeric',    
                month: 'long',    
                day: 'numeric'    
              });    
              const formattedTime = sessionDate.toLocaleTimeString('en-US', {    
                hour: '2-digit',    
                minute: '2-digit'    
              });    
    
              return (    
                <div    
                  key={session.id}    
                  style={{    
                    background: '#0F0F0F',    
                    borderRadius: '24px',    
                    border: isLive ? '2px solid #A4CB3E' : '1px solid #242424',    
                    padding: '32px',    
                    position: 'relative'    
                  }}    
                >    
                  {/* Live Badge */}    
                  {isLive && (    
                    <div style={{    
                      position: 'absolute',    
                      top: '16px',    
                      right: '16px',    
                      background: '#A4CB3E',    
                      color: '#0B0B0B',    
                      padding: '6px 12px',    
                      borderRadius: '9999px',    
                      fontSize: '12px',    
                      fontWeight: '700',    
                      display: 'flex',    
                      alignItems: 'center',    
                      gap: '6px'    
                    }}>    
                      <span style={{    
                        width: '8px',    
                        height: '8px',    
                        background: '#0B0B0B',    
                        borderRadius: '50%',    
                        animation: 'pulse 2s infinite'    
                      }}></span>    
                      LIVE NOW    
                    </div>    
                  )}    
    
                  {/* Session Title */}    
                  <h2 style={{    
                    fontSize: '24px',    
                    fontWeight: 'bold',    
                    color: '#F5F5F5',    
                    marginBottom: '12px'    
                  }}>    
                    {session.title}    
                  </h2>    
    
                  {/* Session Description */}    
                  <p style={{    
                    fontSize: '16px',    
                    color: '#B6B9BF',    
                    lineHeight: '1.6',    
                    marginBottom: '20px'    
                  }}>    
                    {session.description}    
                  </p>    
    
                  {/* Date & Time */}    
                  <div style={{    
                    display: 'flex',    
                    alignItems: 'center',    
                    gap: '16px',    
                    marginBottom: '24px',    
                    flexWrap: 'wrap'    
                  }}>    
                    <div style={{    
                      display: 'flex',    
                      alignItems: 'center',    
                      gap: '8px',    
                      fontSize: '14px',    
                      color: '#B6B9BF'    
                    }}>    
                      <span>📅</span>    
                      <span>{formattedDate}</span>    
                    </div>    
                    <div style={{    
                      display: 'flex',    
                      alignItems: 'center',    
                      gap: '8px',    
                      fontSize: '14px',    
                      color: '#B6B9BF'    
                    }}>    
                      <span>🕐</span>    
                      <span>{formattedTime}</span>    
                    </div>    
                  </div>    
    
                  {/* Email Input & Save Seat Button */}    
                  {selectedSessionId === session.id ? (    
                    <div style={{    
                      display: 'flex',    
                      gap: '12px',    
                      alignItems: 'center',  
                      flexWrap: 'wrap'  
                    }}>    
                      <input    
                        type="email"    
                        value={email}    
                        onChange={(e) => setEmail(e.target.value)}    
                        placeholder="your@email.com"    
                        disabled={submitting}    
                        style={{    
                          flex: 1,  
                          minWidth: '200px',  
                          background: '#0B0B0B',    
                          border: '1px solid #2A2A2A',    
                          borderRadius: '12px',    
                          padding: '14px 16px',    
                          color: '#F5F5F5',    
                          fontSize: '16px',    
                          outline: 'none',    
                          transition: 'all 0.2s'    
                        }}    
                        onFocus={(e) => e.currentTarget.style.borderColor = '#A4CB3E'}    
                        onBlur={(e) => e.currentTarget.style.borderColor = '#2A2A2A'}    
                      />    
                      <button    
                        onClick={() => handleSaveSeat(session.id!)}    
                        disabled={submitting || !email.trim()}    
                        style={{    
                          padding: '14px 24px',    
                          background: submitting || !email.trim() ? '#2A2A2A' : '#A4CB3E',    
                          color: submitting || !email.trim() ? '#666666' : '#0B0B0B',    
                          border: 'none',    
                          borderRadius: '9999px',    
                          fontSize: '16px',    
                          fontWeight: '700',    
                          cursor: submitting || !email.trim() ? 'not-allowed' : 'pointer',    
                          transition: 'all 0.2s',    
                          whiteSpace: 'nowrap'    
                        }}    
                        onMouseEnter={(e) => {    
                          if (!submitting && email.trim()) {    
                            e.currentTarget.style.background = '#8FB82E';    
                          }    
                        }}    
                        onMouseLeave={(e) => {    
                          if (!submitting && email.trim()) {    
                            e.currentTarget.style.background = '#A4CB3E';    
                          }    
                        }}    
                      >    
                        {submitting ? 'Saving...' : 'Confirm'}    
                      </button>    
                      <button    
                        onClick={() => {    
                          setSelectedSessionId(null);    
                          setEmail("");    
                        }}    
                        disabled={submitting}    
                        style={{    
                          padding: '14px 20px',    
                          background: 'transparent',    
                          color: '#B6B9BF',    
                          border: '1px solid #2A2A2A',    
                          borderRadius: '9999px',    
                          fontSize: '16px',    
                          fontWeight: '600',    
                          cursor: submitting ? 'not-allowed' : 'pointer',    
                          transition: 'all 0.2s'    
                        }}    
                      >    
                        Cancel    
                      </button>    
                    </div>    
                  ) : (    
                    <button 
                    onClick={() => setSelectedSessionId(session.id!)}  
                      style={{  
                        width: '100%',  
                        padding: '14px 20px',  
                        background: isLive ? '#A4CB3E' : 'transparent',  
                        color: isLive ? '#0B0B0B' : '#FF60A8',  
                        border: isLive ? 'none' : '1px solid #FF60A8',  
                        borderRadius: '9999px',  
                        fontSize: '16px',  
                        fontWeight: '700',  
                        cursor: 'pointer',  
                        transition: 'all 0.2s'  
                      }}  
                      onMouseEnter={(e) => {  
                        if (isLive) {  
                          e.currentTarget.style.background = '#8FB82E';  
                        } else {  
                          e.currentTarget.style.background = 'rgba(255, 96, 168, 0.1)';  
                        }  
                      }}  
                      onMouseLeave={(e) => {  
                        if (isLive) {  
                          e.currentTarget.style.background = '#A4CB3E';  
                        } else {  
                          e.currentTarget.style.background = 'transparent';  
                        }  
                      }}  
                    >  
                      {isLive ? '🎥 Join Live Session' : '💌 Save Your Seat'}  
                    </button>  
                  )}  
                </div>  
              );  
            })}  
          </div>  
        )}  
      </div>  
  
      <style jsx>{`  
        @keyframes spin {  
          to { transform: rotate(360deg); }  
        }  
          
        @keyframes pulse {  
          0%, 100% { opacity: 1; }  
          50% { opacity: 0.5; }  
        }  
          
        input::placeholder {  
          color: #B6B9BF;  
          opacity: 0.7;  
        }  
      `}</style>  
    </div>  
  );  
}