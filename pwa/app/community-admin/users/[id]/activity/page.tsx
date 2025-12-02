// app/community-admin/users/[id]/activity/page.tsx  
"use client";  
  
import { use, useEffect, useState } from "react";  
import { listPlantPhotos, listQuestions, getUserProfile, UserProfile, PlantPhoto, Question } from "@/src/lib/firestore";  
import Link from "next/link";  
import ProtectedRoute from "@/src/components/ProtectedRoute";  
import Image from 'next/image';  
  
function UserActivityPage({ params }: { params: Promise<{ id: string }> }) {  
  const { id } = use(params);  
  const [mounted, setMounted] = useState(false);  
  const [user, setUser] = useState<UserProfile | null>(null);  
  const [posts, setPosts] = useState<PlantPhoto[]>([]);  
  const [questions, setQuestions] = useState<Question[]>([]);  
  const [loading, setLoading] = useState(true);  
  
  useEffect(() => {  
    setMounted(true);  
  }, []);  
  
  useEffect(() => {  
    if (!mounted) return;  
      
    (async () => {  
      try {  
        // Cargar perfil del usuario  
        const userProfile = await getUserProfile(id);  
        setUser(userProfile);  
  
        // Cargar posts del usuario  
        const allPosts = await listPlantPhotos(1000);  
        const userPosts = allPosts.filter(post => post.createdBy === id);  
        setPosts(userPosts);  
  
        // Cargar preguntas del usuario  
        const allQuestions = await listQuestions(1000);  
        const userQuestions = allQuestions.filter(q => q.createdBy === id);  
        setQuestions(userQuestions);  
      } catch (error) {  
        console.error("Error loading user activity:", error);  
      } finally {  
        setLoading(false);  
      }  
    })();  
  }, [mounted, id]);  
  
  if (loading) {  
    return (  
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0B0B0B' }}>  
        <div style={{ textAlign: 'center' }}>  
          <div style={{   
            width: '40px',   
            height: '40px',   
            border: '3px solid #242424',   
            borderTop: '3px solid #A4CB3E',   
            borderRadius: '50%',   
            animation: 'spin 1s linear infinite',  
            margin: '0 auto 16px'  
          }}></div>  
          <p style={{ color: '#B6B9BF' }}>Loading user activity...</p>  
        </div>  
      </div>  
    );  
  }  
  
  if (!user) {  
    return (  
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0B0B0B' }}>  
        <div style={{ textAlign: 'center' }}>  
          <p style={{ color: '#F5F5F5', fontSize: '18px' }}>User not found</p>  
          <Link href="/community-admin/users" style={{ color: '#A4CB3E', textDecoration: 'none' }}>  
            ← Back to Users  
          </Link>  
        </div>  
      </div>  
    );  
  }  
  
  return (  
    <div style={{ minHeight: '100vh', background: '#0B0B0B', padding: '32px' }}>  
      {/* Header */}  
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>  
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>  
          <Link   
            href="/community-admin/users"  
            style={{   
              padding: '8px 16px',   
              background: '#0F0F0F',   
              border: '1px solid #242424',   
              borderRadius: '8px',   
              color: '#F5F5F5',   
              textDecoration: 'none',  
              fontSize: '14px'  
            }}  
          >  
            ← Back to Users  
          </Link>  
          <div>  
            <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#F5F5F5', marginBottom: '4px' }}>  
              {user.displayName}'s Activity  
            </h1>  
            <p style={{ color: '#B6B9BF', fontSize: '14px' }}>  
              UID: {user.uid} • Joined {user.createdAt ? new Date(user.createdAt.toMillis()).toLocaleDateString() : 'N/A'}  
            </p>  
          </div>  
        </div>  
      </div>  
  
      {/* Stats Summary */}  
      <div style={{   
        display: 'grid',   
        gridTemplateColumns: 'repeat(3, 1fr)',   
        gap: '24px',   
        marginBottom: '32px'   
      }}>  
        <div style={{   
          background: '#0F0F0F',   
          padding: '24px',   
          borderRadius: '16px',   
          border: '1px solid #242424',  
          textAlign: 'center'  
        }}>  
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#A4CB3E', marginBottom: '8px' }}>  
            {posts.length}  
          </div>  
          <div style={{ color: '#B6B9BF' }}>Plant Photos</div>  
        </div>  
        <div style={{   
          background: '#0F0F0F',   
          padding: '24px',   
          borderRadius: '16px',   
          border: '1px solid #242424',  
          textAlign: 'center'  
        }}>  
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#A4CB3E', marginBottom: '8px' }}>  
            {posts.reduce((acc, post) => acc + (post.comments?.length || 0), 0)}  
          </div>  
          <div style={{ color: '#B6B9BF' }}>Comments</div>  
        </div>  
        <div style={{   
          background: '#0F0F0F',   
          padding: '24px',   
          borderRadius: '16px',   
          border: '1px solid #242424',  
          textAlign: 'center'  
        }}>  
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#A4CB3E', marginBottom: '8px' }}>  
            {questions.length}  
          </div>  
          <div style={{ color: '#B6B9BF' }}>Questions</div>  
        </div>  
      </div>  
  
      {/* Plant Photos */}  
      <div style={{ marginBottom: '32px' }}>  
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#F5F5F5', marginBottom: '16px' }}>  
          🌿 Plant Photos ({posts.length})  
        </h2>  
        {posts.length === 0 ? (  
          <div style={{   
            background: '#0F0F0F',   
            padding: '32px',   
            borderRadius: '16px',   
            border: '1px solid #242424',  
            textAlign: 'center'  
          }}>  
            <p style={{ color: '#B6B9BF' }}>No plant photos posted</p>  
          </div>  
        ) : (  
          <div style={{   
            display: 'grid',   
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',   
            gap: '16px'   
          }}>  
            {posts.map(post => (  
              <div key={post.id} style={{   
                background: '#0F0F0F',   
                borderRadius: '12px',   
                border: '1px solid #242424',  
                overflow: 'hidden'  
              }}>  
                <Image  
                  src={post.imageBase64}  
                  alt={post.plantName}  
                  width={300}  
                  height={200}  
                  style={{   
                    width: '100%',   
                    height: '200px',   
                    objectFit: 'cover'   
                  }}  
                />  
                <div style={{ padding: '16px' }}>  
                  <h3 style={{ color: '#F5F5F5', marginBottom: '8px' }}>{post.plantName}</h3>  
                  <p style={{ color: '#B6B9BF', fontSize: '14px', marginBottom: '12px' }}>  
                    {post.description}  
                  </p>  
                  <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#757575' }}>  
                    <span>❤️ {post.likesCount}</span>  
                    <span>💬 {post.comments?.length || 0}</span>  
                    <span>{post.createdAt.toDate().toLocaleDateString()}</span>  
                  </div>  
                </div>  
              </div>  
            ))}  
          </div>  
        )}  
      </div>  
  
      {/* Questions */}  
      <div style={{ marginBottom: '32px' }}>  
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#F5F5F5', marginBottom: '16px' }}>  
          💬 Questions ({questions.length})  
        </h2>  
        {questions.length === 0 ? (  
          <div style={{   
            background: '#0F0F0F',   
            padding: '32px',   
            borderRadius: '16px',   
            border: '1px solid #242424',  
            textAlign: 'center'  
          }}>  
            <p style={{ color: '#B6B9BF' }}>No questions asked</p>  
          </div>  
        ) : (  
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>  
            {questions.map(question => (  
              <div key={question.id} style={{   
                background: '#0F0F0F',   
                padding: '20px',   
                borderRadius: '12px',   
                border: '1px solid #242424'  
              }}>  
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>  
                  <h3 style={{ color: '#F5F5F5', margin: 0 }}>{question.text}</h3>  
                  {question.answer ? (  
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
                {question.context && (  
                  <p style={{ color: '#B6B9BF', fontSize: '14px', marginBottom: '8px' }}>  
                    {question.context}  
                  </p>  
                )}  
                <div style={{ fontSize: '12px', color: '#757575' }}>  
                  Asked {question.createdAt.toDate().toLocaleDateString()}  
                </div>  
              </div>  
            ))}  
          </div>  
        )}  
      </div>  
  
      <style jsx>{`  
        @keyframes spin {  
          to { transform: rotate(360deg); }  
        }  
      `}</style>  
    </div>  
  );  
}  
  
export default function ProtectedUserActivityPage({ params }: { params: Promise<{ id: string }> }) {  
  return (  
    <ProtectedRoute>  
      <UserActivityPage params={params} />  
    </ProtectedRoute>  
  );  
}