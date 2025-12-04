'use client';    
    
import { useState, useEffect } from 'react';    
import { useParams, useRouter } from 'next/navigation';    
import { getPlantPhoto, addLikeToPhoto, removeLikeFromPhoto, addCommentToPhoto, PlantPhoto, Comment } from '@/src/lib/firestore';    
import UserProtectedRoute from '@/src/components/UserProtectedRoute';    
import { auth } from '@/src/lib/firebase';    
  
const CATEGORIES = {    
  'new-leaf': { label: 'New Leaf Incoming 🌱', emoji: '🌱' },    
  'fresh-sprout': { label: 'Fresh Sprout 🌿', emoji: '🌿' },    
  'comeback-story': { label: 'Comeback Story ✨', emoji: '✨' },    
  'not-doing-great': { label: 'Not Doing Great 😵‍💫', emoji: '😵‍💫' },    
  'droopy-day': { label: 'Droopy Day 😔', emoji: '😔' },    
  'overwatered': { label: 'Overwatered Moments 💧', emoji: '💧' },    
  'repotting': { label: 'Repotting Time 🪴', emoji: '🪴' },    
  'pest-patrol': { label: 'Pest Patrol 🐛', emoji: '🐛' },    
  'plant-glow-up': { label: 'Plant Glow-Up ✨🌿', emoji: '✨🌿' },    
  'caught-in-4k': { label: 'Caught in 4K 📸', emoji: '📸' },    
  'accidental-jungle': { label: 'Accidental Jungle 🌴😂', emoji: '🌴😂' },    
  'back-from-vacation': { label: 'Back From Vacation 🧳🌱', emoji: '🧳🌱' },    
  'plant-funeral': { label: 'Plant Funeral ⚰️🪦', emoji: '⚰️🪦' }    
} as const;  
  
type CategoryKey = keyof typeof CATEGORIES;  
    
function PlantDetailPage() {    
  const params = useParams();    
  const router = useRouter();    
  const [plant, setPlant] = useState<PlantPhoto | null>(null);    
  const [loading, setLoading] = useState(true);    
  const [commentText, setCommentText] = useState('');    
  const [showComments, setShowComments] = useState(true);    
    
  useEffect(() => {    
    if (params?.id) {    
      loadPlant(params.id as string);    
    }    
  }, [params]);  
    
  async function loadPlant(plantId: string) {    
    try {    
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
        await removeLikeFromPhoto(plant.id!, user.uid);    
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
      loadPlant(plant.id!);    
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
        Plant not found    
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
          ← Back    
        </button>    
    
        <div style={{    
          background: '#0F0F0F',    
          borderRadius: '12px',    
          border: '1px solid #242424',    
          overflow: 'hidden',    
          marginBottom: '24px'    
        }}>    
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
              {plant.category && (  
                <div style={{  
                  marginTop: '4px',  
                  background: 'rgba(164, 203, 62, 0.2)',  
                  border: '1px solid #A4CB3E',  
                  borderRadius: '6px',  
                  padding: '2px 8px',  
                  display: 'inline-block'  
                }}>  
                  <span style={{ fontSize: '12px', color: '#A4CB3E' }}>  
                    {CATEGORIES[plant.category as CategoryKey]?.emoji} {CATEGORIES[plant.category as CategoryKey]?.label}  
                  </span>  
                </div>  
              )}  
            </div>    
          </div>    
    
          <div style={{ padding: '16px' }}>    
            <h3 style={{ color: '#F5F5F5', fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>    
              {plant.plantName}    
            </h3>    
            <p style={{ color: '#B6B9BF', fontSize: '14px', lineHeight: '1.5', marginBottom: '16px' }}>    
              {plant.description}    
            </p>    
    
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
    
                  <div style={{ display: 'flex', gap: '8px' }}>    
                    <input    
                      type="text"    
                      value={commentText}    
                      onChange={(e) => setCommentText(e.target.value)}    
                      placeholder="Add comment..."    
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
                      Send    
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