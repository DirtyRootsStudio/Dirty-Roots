'use client';  
  
import { useState, useEffect } from 'react';  
import { useParams, useRouter } from 'next/navigation';  
import { getPlantPhoto, addLikeToPhoto, removeLikeFromPhoto, addCommentToPhoto, PlantPhoto, Comment } from '@/src/lib/firestore';  
import UserProtectedRoute from '@/src/components/UserProtectedRoute';  
import { auth } from '@/src/lib/firebase';  
  
function PlantDetailPage() {  
  const params = useParams();  
  const router = useRouter();  
  const [plant, setPlant] = useState<PlantPhoto | null>(null);  
  const [loading, setLoading] = useState(true);  
  const [commentText, setCommentText] = useState('');  
  const [showComments, setShowComments] = useState(true);  
  
  useEffect(() => {  
    if (params.id) {  
      loadPlant(params.id as string);  
    }  
  }, [params.id]);  
  
  async function loadPlant(plantId: string) {  
    try {  
      // Necesitarás añadir esta función a firestore.ts  
      const plantData = await getPlantPhoto(plantId);  
      setPlant(plantData);  
    } catch (error) {  
      console.error('Error loading plant:', error);  
    } finally {  
      setLoading(false);  
    }  
  }  
  
  async function handleLike() {  
    if (!plant) return;  
    const user = auth.currentUser;  
    if (!user) return;  
  
    try {  
      if (plant.likes?.includes(user.uid)) {  
        await removeLikeToPhoto(plant.id!, user.uid);  
        setPlant({  
          ...plant,  
          likes: plant.likes.filter(id => id !== user.uid),  
          likesCount: Math.max(0, plant.likesCount - 1)  
        });  
      } else {  
        await addLikeToPhoto(plant.id!, user.uid);  
        setPlant({  
          ...plant,  
          likes: [...(plant.likes || []), user.uid],  
          likesCount: (plant.likesCount || 0) + 1  
        });  
      }  
    } catch (error) {  
      console.error('Error toggling like:', error);  
    }  
  }  
  
  async function handleComment() {  
    if (!plant || !commentText.trim()) return;  
    const user = auth.currentUser;  
    if (!user) return;  
  
    try {  
      await addCommentToPhoto(plant.id!, {  
        text: commentText.trim(),  
        createdBy: user.uid,  
        userName: user.displayName || 'Usuario'  
      });  
      setCommentText('');  
      loadPlant(plant.id!); // Recargar para mostrar el nuevo comentario  
    } catch (error) {  
      console.error('Error adding comment:', error);  
    }  
  }  
  
  if (loading) {  
    return (  
      <div style={{  
        display: 'flex',  
        alignItems: 'center',  
        justifyContent: 'center',  
        height: '100vh',  
        background: '#0B0B0B'  
      }}>  
        <div style={{  
          width: '48px',  
          height: '48px',  
          border: '4px solid #A4CB3E',  
          borderTopColor: 'transparent',  
          borderRadius: '50%',  
          animation: 'spin 1s linear infinite'  
        }}></div>  
      </div>  
    );  
  }  
  
  if (!plant) {  
    return (  
      <div style={{  
        display: 'flex',  
        alignItems: 'center',  
        justifyContent: 'center',  
        height: '100vh',  
        background: '#0B0B0B',  
        color: '#F5F5F5'  
      }}>  
        Planta no encontrada  
      </div>  
    );  
  }  
  
  const user = auth.currentUser;  
  const isLiked = user && plant.likes?.includes(user.uid);  
  
  return (  
    <main style={{  
      width: '100%',  
      height: '100%',  
      background: '#0B0B0B',  
      overflowY: 'auto',  
      padding: '16px',  
      boxSizing: 'border-box'  
    }}>  
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>  
        {/* Botón de regreso */}  
        <button  
          onClick={() => router.back()}  
          style={{  
            background: 'none',  
            border: 'none',  
            color: '#B6B9BF',  
            fontSize: '16px',  
            cursor: 'pointer',  
            marginBottom: '24px',  
            display: 'flex',  
            alignItems: 'center',  
            gap: '8px'  
          }}  
        >  
          ← Volver  
        </button>  
  
        {/* Card de la planta */}  
        <div style={{  
          background: '#0F0F0F',  
          borderRadius: '12px',  
          border: '1px solid #242424',  
          overflow: 'hidden',  
          marginBottom: '24px'  
        }}>  
          {/* Imagen */}  
          <div style={{  
            height: '400px',  
            backgroundImage: `url(${plant.imageBase64})`,  
            backgroundSize: 'cover',  
            backgroundPosition: 'center',  
            position: 'relative'  
          }}>  
            <div style={{  
              position: 'absolute',  
              top: 0,  
              left: 0,  
              right: 0,  
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.5), transparent)',  
              padding: '12px 16px',  
              color: '#F5F5F5'  
            }}>  
              <p style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>  
                {plant.userName || 'Usuario'}  
              </p>  
            </div>  
          </div>  
  
          {/* Contenido */}  
          <div style={{ padding: '16px' }}>  
            <h3 style={{ color: '#F5F5F5', fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>  
              {plant.plantName}  
            </h3>  
            <p style={{ color: '#B6B9BF', fontSize: '14px', lineHeight: '1.5', marginBottom: '16px' }}>  
              {plant.description}  
            </p>  
  
            {/* Botones de interacción */}  
            <div style={{ borderTop: '1px solid #242424', paddingTop: '12px' }}>  
              <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>  
                <button  
                  onClick={handleLike}  
                  style={{  
                    background: 'none',  
                    border: 'none',  
                    color: isLiked ? '#FF60A8' : '#B6B9BF',  
                    cursor: 'pointer',  
                    fontSize: '14px',  
                    padding: 0  
                  }}  
                >  
                  {isLiked ? '🍃' : '🍂'} {plant.likesCount || 0}  
                </button>  
                <button  
                  onClick={() => setShowComments(!showComments)}  
                  style={{  
                    background: 'none',  
                    border: 'none',  
                    color: '#B6B9BF',  
                    cursor: 'pointer',  
                    fontSize: '14px',  
                    padding: 0  
                  }}  
                >  
                  💬 {plant.comments?.length || 0}  
                </button>  
              </div>  
  
              {/* Comentarios */}  
              {showComments && (  
                <div>  
                  {plant.comments?.map((comment: Comment) => (  
                    <div key={comment.id} style={{  
                      background: '#0B0B0B',  
                      borderRadius: '8px',  
                      padding: '8px 12px',  
                      marginBottom: '8px'  
                    }}>  
                      <p style={{ margin: 0, fontSize: '12px', color: '#A4CB3E', fontWeight: '600' }}>  
                        {comment.userName || 'Usuario'}  
                      </p>  
                      <p style={{ margin: 0, fontSize: '13px', color: '#F5F5F5', marginTop: '2px' }}>  
                        {comment.text}  
                      </p>  
                    </div>  
                  ))}  
  
                  {/* Input de comentario */}  
                  <div style={{ display: 'flex', gap: '8px' }}>  
                    <input  
                      type="text"  
                      value={commentText}  
                      onChange={(e) => setCommentText(e.target.value)}  
                      placeholder="Añadir comentario..."  
                      style={{  
                        flex: 1,  
                        background: '#0B0B0B',  
                        border: '1px solid #2A2A2A',  
                        borderRadius: '8px',  
                        padding: '8px 12px',  
                        color: '#F5F5F5',  
                        fontSize: '12px'  
                      }}  
                    />  
                    <button  
                      onClick={handleComment}  
                      style={{  
                        background: '#A4CB3E',  
                        border: 'none',  
                        borderRadius: '8px',  
                        padding: '8px 12px',  
                        color: '#0B0B0B',  
                        fontSize: '12px',  
                        fontWeight: '600',  
                        cursor: 'pointer'  
                      }}  
                    >  
                      Enviar  
                    </button>  
                  </div>  
                </div>  
              )}  
            </div>  
          </div>  
        </div>  
      </div>  
  
      <style jsx>{`  
        @keyframes spin {  
          to { transform: rotate(360deg); }  
        }  
      `}</style>  
    </main>  
  );  
}  
  
export default function ProtectedPlantDetailPage() {  
  return (  
    <UserProtectedRoute>  
      <PlantDetailPage />  
    </UserProtectedRoute>  
  );  
}