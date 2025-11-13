// app/live/page.tsx  
"use client";  
  
import { useEffect, useState } from "react";  
import { useRouter } from "next/navigation";  
import { auth } from "@/src/lib/firebase";  
import {   
  listLiveSessions,   
  deleteLiveSession,  
  addLiveSession,
  listSeatReservations   
} from "@/src/lib/firestore";  
import ProtectedRoute from "@/src/components/ProtectedRoute";  
import { Timestamp } from "firebase/firestore";  

  
export default function LiveSessionsPage() {  
  const router = useRouter();  
  const [mounted, setMounted] = useState(false);  
  const [sessions, setSessions] = useState<any[]>([]);  
  const [loading, setLoading] = useState(true);  
  const [showCreateForm, setShowCreateForm] = useState(false);  
  
  // Form state  
  const [title, setTitle] = useState("");  
  const [description, setDescription] = useState("");  
  const [date, setDate] = useState("");  
  const [time, setTime] = useState("");  
  const [youtubeLink, setYoutubeLink] = useState("");  
  const [submitting, setSubmitting] = useState(false);  
  
  // Lifecycle hooks  
  useEffect(() => {  
    setMounted(true);  
  }, []);  
  
  useEffect(() => {  
    if (!mounted) return;  
      
    // ProtectedRoute ya garantiza autenticación con email  
    loadSessions();  
  }, [mounted]);  
  
  // Data loading  
  async function loadSessions() {  
    try {  
      const data = await listLiveSessions(50);  
      const sorted = data.sort((a, b) => {  
        const dateA = a.date?.toDate?.() || new Date(0);  
        const dateB = b.date?.toDate?.() || new Date(0);  
        return dateA.getTime() - dateB.getTime();  
      });  
      setSessions(sorted);  
    } catch (error) {  
      console.error("Error loading sessions:", error);  
      alert("Failed to load sessions. Please refresh the page.");  
    } finally {  
      setLoading(false);  
    }  
  }  
  
  // Session creation  
  async function handleCreateSession(e: React.FormEvent) {  
    e.preventDefault();  
      
    if (!title.trim() || !date || !time || !youtubeLink.trim()) {  
      alert("Please fill in all required fields");  
      return;  
    }  
  
    // Verificar que el usuario está autenticado con email  
    const user = auth.currentUser;  
    if (!user || user.isAnonymous) {  
      alert("You must be logged in with an email account to create sessions");  
      router.push('/auth');  
      return;  
    }  
  
    setSubmitting(true);  
    try {  
      const dateTime = new Date(`${date}T${time}`);  
  
        await addLiveSession({  
        title: title.trim(),  
        description: description.trim(),  
        date: Timestamp.fromDate(dateTime),  // ✅ Convert Date to Timestamp  
        youtubeLink: youtubeLink.trim(),  
        createdBy: user.uid,  
        });  
  
      // Reset form  
      setTitle("");  
      setDescription("");  
      setDate("");  
      setTime("");  
      setYoutubeLink("");  
      setShowCreateForm(false);  
  
      await loadSessions();  
      alert("✅ Session created successfully!");  
    } catch (error) {  
      console.error("Error creating session:", error);  
      alert("Error creating session. Please try again.");  
    } finally {  
      setSubmitting(false);  
    }  
  }  
  
  // Session deletion  
  async function handleDeleteSession(sessionId: string) {  
    if (!confirm("Are you sure you want to delete this session?")) return;  
  
    try {  
      await deleteLiveSession(sessionId);  
      setSessions(sessions.filter(s => s.id !== sessionId));  
      alert("✅ Session deleted");  
    } catch (error) {  
      console.error("Error deleting session:", error);  
      alert("Error deleting session. Please try again.");  
    }  
  }  
  
  // Export emails functionality  
  async function handleExportEmails(session: any) {  
  try {  
    // Verificar autenticación con email  
    const user = auth.currentUser;  
    if (!user || user.isAnonymous) {  
      alert("You must be logged in with an email account to export emails");  
      router.push('/auth');  
      return;  
    }  
  
    // Cargar reservas  
    const reservations = await listSeatReservations(session.id!);  
      
    // Preparar datos  
    const sessionTitle = session.title;  
    const youtubeLink = session.youtubeLink;  
    const emailList = reservations.map(r => r.email).join('\n');  
    const totalReservations = reservations.length;  
  
    // Mostrar modal con campos separados  
    const modalOverlay = document.createElement('div');  
    modalOverlay.style.cssText = `  
      position: fixed;  
      top: 0;  
      left: 0;  
      right: 0;  
      bottom: 0;  
      background: rgba(0, 0, 0, 0.8);  
      display: flex;  
      align-items: center;  
      justify-content: center;  
      z-index: 9999;  
      padding: 24px;  
    `;  
  
    modalOverlay.innerHTML = `  
      <div style="  
        background: #0F0F0F;  
        border: 1px solid #242424;  
        border-radius: 24px;  
        padding: 32px;  
        max-width: 600px;  
        width: 100%;  
        max-height: 80vh;  
        overflow-y: auto;  
      ">  
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">  
          <h2 style="color: #F5F5F5; font-size: 24px; font-weight: bold; margin: 0;">  
            Export Session Data  
          </h2>  
          <button id="close-modal" style="  
            background: transparent;  
            border: none;  
            color: #B6B9BF;  
            font-size: 24px;  
            cursor: pointer;  
            padding: 0;  
            width: 32px;  
            height: 32px;  
            display: flex;  
            align-items: center;  
            justify-content: center;  
          ">×</button>  
        </div>  
  
        <p style="color: #B6B9BF; margin-bottom: 24px; font-size: 14px;">  
          Total Reservations: <strong style="color: #A4CB3E;">${totalReservations}</strong>  
        </p>  
  
        <!-- Session Title -->  
        <div style="margin-bottom: 20px;">  
          <label style="display: block; color: #F5F5F5; font-weight: 600; margin-bottom: 8px; font-size: 14px;">  
            Session Title  
          </label>  
          <div style="display: flex; gap: 8px;">  
            <input   
              id="session-title-input"  
              type="text"   
              value="${sessionTitle}"   
              readonly  
              style="  
                flex: 1;  
                background: #0B0B0B;  
                border: 1px solid #2A2A2A;  
                border-radius: 12px;  
                padding: 12px 16px;  
                color: #F5F5F5;  
                font-size: 14px;  
                font-family: monospace;  
              "  
            />  
            <button id="copy-title" style="  
              padding: 12px 20px;  
              background: transparent;  
              border: 1px solid #A4CB3E;  
              color: #A4CB3E;  
              border-radius: 12px;  
              font-size: 14px;  
              font-weight: 600;  
              cursor: pointer;  
              white-space: nowrap;  
              transition: all 0.2s;  
            ">  
              📋 Copy  
            </button>  
          </div>  
        </div>  
  
        <!-- YouTube Link -->  
        <div style="margin-bottom: 20px;">  
          <label style="display: block; color: #F5F5F5; font-weight: 600; margin-bottom: 8px; font-size: 14px;">  
            YouTube Link  
          </label>  
          <div style="display: flex; gap: 8px;">  
            <input   
              id="youtube-link-input"  
              type="text"   
              value="${youtubeLink}"   
              readonly  
              style="  
                flex: 1;  
                background: #0B0B0B;  
                border: 1px solid #2A2A2A;  
                border-radius: 12px;  
                padding: 12px 16px;  
                color: #F5F5F5;  
                font-size: 14px;  
                font-family: monospace;  
              "  
            />  
            <button id="copy-youtube" style="  
              padding: 12px 20px;  
              background: transparent;  
              border: 1px solid #A4CB3E;  
              color: #A4CB3E;  
              border-radius: 12px;  
              font-size: 14px;  
              font-weight: 600;  
              cursor: pointer;  
              white-space: nowrap;  
              transition: all 0.2s;  
            ">  
              📋 Copy  
            </button>  
          </div>  
        </div>  
  
        <!-- Email List -->  
        <div style="margin-bottom: 20px;">  
          <label style="display: block; color: #F5F5F5; font-weight: 600; margin-bottom: 8px; font-size: 14px;">  
            Email List (${totalReservations} emails)  
          </label>  
          <div style="display: flex; gap: 8px; align-items: flex-start;">  
            <textarea   
              id="email-list-input"  
              readonly  
              rows="8"  
              style="  
                flex: 1;  
                background: #0B0B0B;  
                border: 1px solid #2A2A2A;  
                border-radius: 12px;  
                padding: 12px 16px;  
                color: #F5F5F5;  
                font-size: 14px;  
                font-family: monospace;  
                resize: vertical;  
              "  
            >${emailList}</textarea>  
            <button id="copy-emails" style="  
              padding: 12px 20px;  
              background: transparent;  
              border: 1px solid #A4CB3E;  
              color: #A4CB3E;  
              border-radius: 12px;  
              font-size: 14px;  
              font-weight: 600;  
              cursor: pointer;  
              white-space: nowrap;  
              transition: all 0.2s;  
            ">  
              📋 Copy  
            </button>  
          </div>  
        </div>  
  
        <!-- Close Button -->  
        <button id="close-modal-btn" style="  
          width: 100%;  
          padding: 14px;  
          background: #2A2A2A;  
          color: #F5F5F5;  
          border: none;  
          border-radius: 9999px;  
          font-size: 16px;  
          font-weight: 700;  
          cursor: pointer;  
          transition: all 0.2s;  
          margin-top: 8px;  
        ">  
          Close  
        </button>  
      </div>  
    `;  
  
    document.body.appendChild(modalOverlay);  
  
    // Función helper para copiar al portapapeles  
    async function copyToClipboard(text: string, buttonId: string) {  
      try {  
        await navigator.clipboard.writeText(text);  
        const button = document.getElementById(buttonId);  
        if (button) {  
          const originalText = button.innerHTML;  
          button.innerHTML = '✅ Copied!';  
          button.style.background = '#A4CB3E';  
          button.style.color = '#0B0B0B';  
          setTimeout(() => {  
            button.innerHTML = originalText;  
            button.style.background = 'transparent';  
            button.style.color = '#A4CB3E';  
          }, 2000);  
        }  
      } catch (err) {  
        alert('Failed to copy to clipboard');  
      }  
    }  
  
    // Event listeners para botones de copia  
    document.getElementById('copy-title')?.addEventListener('click', () => {  
      copyToClipboard(sessionTitle, 'copy-title');  
    });  
  
    document.getElementById('copy-youtube')?.addEventListener('click', () => {  
      copyToClipboard(youtubeLink, 'copy-youtube');  
    });  
  
    document.getElementById('copy-emails')?.addEventListener('click', () => {  
      copyToClipboard(emailList, 'copy-emails');  
    });  
  
    // Event listeners para cerrar modal  
    const closeModal = () => {  
      document.body.removeChild(modalOverlay);  
    };  
  
    document.getElementById('close-modal')?.addEventListener('click', closeModal);  
    document.getElementById('close-modal-btn')?.addEventListener('click', closeModal);  
      
    // Cerrar al hacer click fuera del modal  
    modalOverlay.addEventListener('click', (e) => {  
      if (e.target === modalOverlay) {  
        closeModal();  
      }  
    });  
  
    // Hover effects para botones de copia  
    ['copy-title', 'copy-youtube', 'copy-emails'].forEach(id => {  
      const btn = document.getElementById(id);  
      if (btn) {  
        btn.addEventListener('mouseenter', () => {  
          btn.style.background = '#A4CB3E';  
          btn.style.color = '#0B0B0B';  
        });  
        btn.addEventListener('mouseleave', () => {  
          if (!btn.innerHTML.includes('✅')) {  
            btn.style.background = 'transparent';  
            btn.style.color = '#A4CB3E';  
          }  
        });  
      }  
    });  
  
    // Hover effect para botón de cerrar  
    const closeBtn = document.getElementById('close-modal-btn');  
    if (closeBtn) {  
      closeBtn.addEventListener('mouseenter', () => {  
        closeBtn.style.background = '#3A3A3A';  
      });  
      closeBtn.addEventListener('mouseleave', () => {  
        closeBtn.style.background = '#2A2A2A';  
      });  
    }  
  
  } catch (error) {  
    console.error("Error exporting emails:", error);  
    alert("Error exporting emails. Please try again.");  
  }  
} 
  
  // Status helper  
  function getSessionStatus(session: any) {  
    const now = new Date();  
    const sessionDate = session.date?.toDate?.() || new Date(0);  
      
    if (session.status === "live") return { text: "🔴 LIVE NOW", color: "#FF60A8" };  
    if (session.status === "ended") return { text: "Ended", color: "#666666" };  
    if (sessionDate < now) return { text: "Past", color: "#666666" };  
    return { text: "Upcoming", color: "#A4CB3E" };  
  }  
  
  // Loading state  
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
    <ProtectedRoute>  
      <div style={{  
        minHeight: '100vh',  
        background: '#0B0B0B',  
        padding: '40px 20px'  
      }}>  
        <div style={{  
          maxWidth: '1200px',  
          margin: '0 auto'  
        }}>  
          {/* Header */}  
          <div style={{  
            display: 'flex',  
            justifyContent: 'space-between',  
            alignItems: 'center',  
            marginBottom: '32px'  
          }}>  
            <div>  
              <h1 style={{  
                fontSize: '32px',  
                fontWeight: 'bold',  
                color: '#F5F5F5',  
                marginBottom: '8px'  
              }}>  
                🎥 Live Sessions Management  
              </h1>  
              <p style={{ color: '#B6B9BF', fontSize: '16px' }}>  
                Create and manage live Q&A sessions  
              </p>  
            </div>  
              
            <button  
              onClick={() => setShowCreateForm(!showCreateForm)}  
              style={{  
                padding: '12px 24px',  
                background: showCreateForm ? '#2A2A2A' : '#A4CB3E',  
                color: showCreateForm ? '#F5F5F5' : '#0B0B0B',  
                border: 'none',  
                borderRadius: '9999px',  
                fontSize: '16px',  
                fontWeight: '700',  
                cursor: 'pointer',  
                transition: 'all 0.2s'  
              }}  
              onMouseEnter={(e) => {  
                if (!showCreateForm) e.currentTarget.style.background = '#8FB82E';  
              }}  
              onMouseLeave={(e) => {  
                if (!showCreateForm) e.currentTarget.style.background = '#A4CB3E';  
              }}  
            >  
              {showCreateForm ? 'Cancel' : '+ New Session'}  
            </button>  
          </div>  
  
          {/* Create Form */}  
          {showCreateForm && (  
            <div style={{  
              background: '#0F0F0F',  
              borderRadius: '24px',  
              border: '1px solid #242424',  
              padding: '32px',  
              marginBottom: '32px'  
            }}>  
              <h2 style={{  
                fontSize: '24px',  
                fontWeight: 'bold',  
                color: '#F5F5F5',  
                marginBottom: '24px'  
              }}>  
                Create New Live Session  
              </h2>  
  
              <form onSubmit={handleCreateSession}>  
                {/* Title */}  
                <div style={{ marginBottom: '20px' }}>  
                  <label style={{  
                    display: 'block',  
                    fontSize: '14px',  
                    fontWeight: '600',  
                    marginBottom: '8px',  
                    color: '#F5F5F5'  
                  }}>  
                    Session Title *  
                  </label>  
                  <input  
                    type="text"  
                    value={title}  
                    onChange={(e) => setTitle(e.target.value)}  
                    placeholder="e.g., Live Q&A — Winter Reset"  
                    required  
                    style={{  
                      width: '100%',  
                      background: '#0B0B0B',  
                      border: '1px solid #2A2A2A',  
                      borderRadius: '12px',  
                      padding: '12px 16px',  
                      color: '#F5F5F5',  
                      fontSize: '14px',  
                      outline: 'none',  
                      transition: 'all 0.2s'  
                    }}  
                    onFocus={(e) => e.currentTarget.style.borderColor = '#A4CB3E'}  
                    onBlur={(e) => e.currentTarget.style.borderColor = '#2A2A2A'}  
                  />  
                </div>  
  
                {/* Description */}  
                <div style={{ marginBottom: '20px' }}>  
                  <label style={{  
                    display: 'block',  
                    fontSize: '14px',  
                    fontWeight: '600',  
                    marginBottom: '8px',  
                    color: '#F5F5F5'  
                  }}>  
                    Description  
                  </label>  
                  <textarea  
                    value={description}  
                    onChange={(e) => setDescription(e.target.value)}  
                    placeholder="Describe what this session is about..."  
                    rows={4}  
                    style={{  
                      width: '100%',  
                      background: '#0B0B0B',  
                      border: '1px solid #2A2A2A',  
                      borderRadius: '12px',  
                      padding: '12px 16px',  
                      color: '#F5F5F5',  
                      fontSize: '14px',  
                      outline: 'none',  
                      resize: 'vertical',  
                      transition: 'all 0.2s'  
                    }}  
                    onFocus={(e) => e.currentTarget.style.borderColor = '#A4CB3E'}  
                    onBlur={(e) => e.currentTarget.style.borderColor = '#2A2A2A'}  
                  />  
                </div>  
  
                {/* Date and Time */}  
                <div style={{  
                  display: 'grid',  
                  gridTemplateColumns: '1fr 1fr',  
                  gap: '16px',  
                  marginBottom: '20px'  
                }}>  
                  <div>  
                    <label style={{  
                      display: 'block',  
                      fontSize: '14px',  
                      fontWeight: '600',  
                      marginBottom: '8px',  
                      color: '#F5F5F5'  
                    }}>  
                      Date *  
                    </label>  
                    <input  
                      type="date"  
                      value={date}  
                      onChange={(e) => setDate(e.target.value)}  
                      required  
                      style={{  
                        width: '100%',  
                        background: '#0B0B0B',  
                        border: '1px solid #2A2A2A',  
                        borderRadius: '12px',  
                        padding: '12px 16px',  
                        color: '#F5F5F5',  
                        fontSize: '14px',  
                        outline: 'none',  
                        transition: 'all 0.2s'  
                      }}  
                      onFocus={(e) => e.currentTarget.style.borderColor = '#A4CB3E'}  
                      onBlur={(e) => e.currentTarget.style.borderColor = '#2A2A2A'}  
                    />  
                  </div>  
  
                  <div>  
                    <label style={{  
                      display: 'block',  
                      fontSize: '14px',  
                      fontWeight: '600',  
                      marginBottom: '8px',  
                      color: '#F5F5F5'  
                    }}>  
                      Time *  
                    </label>  
                    <input  
                      type="time"  
                      value={time}  
                      onChange={(e) => setTime(e.target.value)}  
                      required  
                      style={{  
                        width: '100%',  
                        background: '#0B0B0B',  
                        border: '1px solid #2A2A2A',  
                        borderRadius: '12px',  
                        padding: '12px 16px',  
                        color: '#F5F5F5',  
                        fontSize: '14px',  
                        outline: 'none',  
                        transition: 'all 0.2s'  
                      }}  
                               onFocus={(e) => e.currentTarget.style.borderColor = '#A4CB3E'}  
                      onBlur={(e) => e.currentTarget.style.borderColor = '#2A2A2A'}  
                    />  
                  </div>  
                </div>  
  
                {/* YouTube Link */}  
                <div style={{ marginBottom: '24px' }}>  
                  <label style={{  
                    display: 'block',  
                    fontSize: '14px',  
                    fontWeight: '600',  
                    marginBottom: '8px',  
                    color: '#F5F5F5'  
                  }}>  
                    YouTube Live Link *  
                  </label>  
                  <input  
                    type="url"  
                    value={youtubeLink}  
                    onChange={(e) => setYoutubeLink(e.target.value)}  
                    placeholder="https://youtube.com/live/..."  
                    required  
                    style={{  
                      width: '100%',  
                      background: '#0B0B0B',  
                      border: '1px solid #2A2A2A',  
                      borderRadius: '12px',  
                      padding: '12px 16px',  
                      color: '#F5F5F5',  
                      fontSize: '14px',  
                      outline: 'none',  
                      transition: 'all 0.2s'  
                    }}  
                    onFocus={(e) => e.currentTarget.style.borderColor = '#A4CB3E'}  
                    onBlur={(e) => e.currentTarget.style.borderColor = '#2A2A2A'}  
                  />  
                </div>  
  
                {/* Submit Button */}  
                <button  
                  type="submit"  
                  disabled={submitting}  
                  style={{  
                    width: '100%',  
                    padding: '14px',  
                    background: submitting ? '#2A2A2A' : '#A4CB3E',  
                    color: submitting ? '#666666' : '#0B0B0B',  
                    border: 'none',  
                    borderRadius: '9999px',  
                    fontSize: '16px',  
                    fontWeight: '700',  
                    cursor: submitting ? 'not-allowed' : 'pointer',  
                    transition: 'all 0.2s'  
                  }}  
                  onMouseEnter={(e) => {  
                    if (!submitting) {  
                      e.currentTarget.style.background = '#8FB82E';  
                    }  
                  }}  
                  onMouseLeave={(e) => {  
                    if (!submitting) {  
                      e.currentTarget.style.background = '#A4CB3E';  
                    }  
                  }}  
                >  
                  {submitting ? 'Creating session...' : 'Create Session'}  
                </button>  
              </form>  
            </div>  
          )}  
  
          {/* Sessions List */}  
          <div style={{  
            display: 'flex',  
            flexDirection: 'column',  
            gap: '16px',  
            marginTop: showCreateForm ? '0' : '32px'  
          }}>  
            <h2 style={{  
              fontSize: '24px',  
              fontWeight: 'bold',  
              color: '#F5F5F5',  
              marginBottom: '8px'  
            }}>  
              All Sessions  
            </h2>  
  
            {loading ? (  
              <div style={{  
                textAlign: 'center',  
                padding: '40px',  
                background: '#0F0F0F',  
                borderRadius: '24px',  
                border: '1px solid #242424'  
              }}>  
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
                <p style={{ color: '#B6B9BF', fontSize: '16px' }}>Loading sessions...</p>  
              </div>  
            ) : sessions.length === 0 ? (  
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
                  No sessions yet  
                </p>  
                <p style={{  
                  fontSize: '14px',  
                  color: '#757575'  
                }}>  
                  Create your first live session  
                </p>  
              </div>  
            ) : (  
              sessions.map(session => {  
                const sessionDate = session.date?.toDate?.() || new Date(0);  
                const now = new Date();  
                const isLive = session.status === "live";  
                const isPast = sessionDate < now && !isLive;  
                const isUpcoming = sessionDate >= now && !isLive;  
  
                const formattedDate = sessionDate.toLocaleDateString('en-US', {  
                  year: 'numeric',  
                  month: 'long',  
                  day: 'numeric'  
                });  
  
                const formattedTime = sessionDate.toLocaleTimeString('en-US', {  
                  hour: '2-digit',  
                  minute: '2-digit'  
                });  
  
                let statusBadge = null;  
                if (isLive) {  
                  statusBadge = (  
                    <span style={{  
                      padding: '4px 12px',  
                      borderRadius: '9999px',  
                      background: '#A4CB3E',  
                      color: '#0B0B0B',  
                      fontSize: '12px',  
                      fontWeight: '700',  
                      animation: 'pulse 2s infinite'  
                    }}>  
                      🔴 LIVE NOW  
                    </span>  
                  );  
                } else if (isUpcoming) {  
                  statusBadge = (  
                    <span style={{  
                      padding: '4px 12px',  
                      borderRadius: '9999px',  
                      background: 'rgba(255, 96, 168, 0.1)',  
                      border: '1px solid #FF60A8',  
                      color: '#FF60A8',  
                      fontSize: '12px',  
                      fontWeight: '600'  
                    }}>  
                      Upcoming  
                    </span>  
                  );  
                } else if (isPast) {  
                  statusBadge = (  
                    <span style={{  
                      padding: '4px 12px',  
                      borderRadius: '9999px',  
                      background: 'rgba(182, 185, 191, 0.1)',  
                      border: '1px solid #757575',  
                      color: '#757575',  
                      fontSize: '12px',  
                      fontWeight: '600'  
                    }}>  
                      Past  
                    </span>  
                  );  
                } else if (session.status === "ended") {  
                  statusBadge = (  
                    <span style={{  
                      padding: '4px 12px',  
                      borderRadius: '9999px',  
                      background: 'rgba(182, 185, 191, 0.1)',  
                      border: '1px solid #757575',  
                      color: '#757575',  
                      fontSize: '12px',  
                      fontWeight: '600'  
                    }}>  
                      Ended  
                    </span>  
                  );  
                }  
  
                return (  
                  <div  
                    key={session.id}  
                    style={{  
                      background: '#0F0F0F',  
                      borderRadius: '24px',  
                      border: '1px solid #242424',  
                      padding: '24px',  
                      position: 'relative'  
                    }}  
                  >  
                    {/* Action buttons in top right */}  
                    <div style={{  
                      position: 'absolute',  
                      top: '24px',  
                      right: '24px',  
                      display: 'flex',  
                      gap: '8px',  
                      alignItems: 'center'  
                    }}>  
                      {statusBadge}  
                        
                      <button  
                        onClick={() => handleExportEmails(session)}  
                        style={{  
                          padding: '8px 16px',  
                          borderRadius: '9999px',  
                          background: 'transparent',  
                          border: '1px solid #A4CB3E',  
                          color: '#A4CB3E',  
                          fontSize: '12px',  
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
                        📧 Export Emails  
                      </button>  
  
                      <button  
                        onClick={() => handleDeleteSession(session.id!)}  
                        style={{  
                          padding: '8px 16px',  
                          borderRadius: '9999px',  
                          background: 'transparent',  
                          border: '1px solid #FF60A8',  
                          color: '#FF60A8',  
                          fontSize: '12px',  
                          fontWeight: '600',  
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
                        🗑️ Delete  
                      </button>  
                    </div>  
  
                    <h3 style={{  
                      fontSize: '20px',  
                      fontWeight: 'bold',  
                      color: '#F5F5F5',  
                      marginBottom: '8px',  
                      paddingRight: '200px'  
                    }}>  
                      {session.title}  
                    </h3>  
  
                    {session.description && (  
                      <p style={{  
                        fontSize: '14px',  
                        color: '#B6B9BF',  
                        lineHeight: '1.6',  
                        marginBottom: '12px'  
                      }}>  
                        {session.description}  
                      </p>  
                    )}  
  
                    <div style={{  
                      display: 'flex',  
                      alignItems: 'center',  
                      gap: '16px',  
                      fontSize: '14px',  
                      color: '#B6B9BF',  
                      marginBottom: '12px'  
                    }}>  
                      <span>📅 {formattedDate}</span>  
                      <span>🕐 {formattedTime}</span>  
                    </div>  
  
                    {session.youtubeLink && (  
                      <a  
                        href={session.youtubeLink}  
                        target="_blank"  
                        rel="noopener noreferrer"  
                        style={{  
                          display: 'inline-block',  
                          padding: '8px 16px',  
                          borderRadius: '9999px',  
                          background: 'rgba(164, 203, 62, 0.1)',  
                          border: '1px solid #A4CB3E',  
                          color: '#A4CB3E',  
                          fontSize: '12px',  
                          fontWeight: '600',  
                          textDecoration: 'none',  
                          transition: 'all 0.2s'  
                        }}  
                        onMouseEnter={(e) => {  
                          e.currentTarget.style.background = '#A4CB3E';  
                          e.currentTarget.style.color = '#0B0B0B';  
                        }}  
                        onMouseLeave={(e) => {  
                          e.currentTarget.style.background = 'rgba(164, 203, 62, 0.1)';  
                          e.currentTarget.style.color = '#A4CB3E';  
                        }}  
                      >  
                        🎥 YouTube Link  
                      </a>  
                    )}  
                  </div>  
                );  
              })  
            )}  
          </div>  
        </div>  
      </div>  
  
      <style jsx>{`  
        @keyframes spin {  
          to { transform: rotate(360deg); }  
        }  
          
        @keyframes pulse {  
          0%, 100% { opacity: 1; }  
          50% { opacity: 0.5; }  
        }  
          
        input::placeholder,  
        textarea::placeholder {  
          color: #B6B9BF;  
          opacity: 0.7;  
        }  
      `}</style>  
    </ProtectedRoute>  
  );  
}  