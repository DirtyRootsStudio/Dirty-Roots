// app/community-admin/posts/page.tsx      
"use client";      
      
import { useEffect, useState, useCallback, useRef } from "react";      
import { listPlantPhotos, deletePlantPhoto, deleteCommentFromPhoto, PlantPhoto, Comment } from "@/src/lib/firestore";      
import Link from "next/link";      
import ProtectedRoute from "@/src/components/ProtectedRoute";      
import { Timestamp } from "firebase/firestore";      
  
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
      
function PostsPage() {      
  const [mounted, setMounted] = useState(false);      
  const [posts, setPosts] = useState<PlantPhoto[]>([]);      
  const [loading, setLoading] = useState(true);      
  const [loadingMore, setLoadingMore] = useState(false);      
  const [hasMore, setHasMore] = useState(true);      
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey | 'all'>('all');  
  const lastVisibleRef = useRef<Timestamp | null>(null);      
      
  useEffect(() => {      
    setMounted(true);      
  }, []);      
      
  const loadPosts = useCallback(async (loadMore = false) => {      
    try {      
      if (loadMore) {      
        setLoadingMore(true);      
      } else {      
        setLoading(true);      
        lastVisibleRef.current = null;      
      }      
      
      const data = await listPlantPhotos(      
        50,      
        loadMore && lastVisibleRef.current ? lastVisibleRef.current : undefined,  
        selectedCategory !== 'all' ? selectedCategory : undefined  
      );      
      
      if (loadMore) {      
        setPosts(prev => [...prev, ...data]);      
      } else {      
        setPosts(data);      
      }      
      
      setHasMore(data.length === 50);      
      if (data.length > 0) {      
        lastVisibleRef.current = data[data.length - 1].createdAt;      
      }      
    } catch (error) {      
      console.error("Error loading posts:", error);      
      alert("Error loading posts. Please refresh the page.");      
    } finally {      
      setLoading(false);      
      setLoadingMore(false);      
    }      
  }, [selectedCategory]);      
      
  useEffect(() => {      
    if (!mounted) return;      
    loadPosts();      
  }, [mounted, loadPosts]);      
      
  const handleDeletePost = async (postId: string) => {      
    if (!confirm("Are you sure you want to delete this post? This cannot be undone.")) {      
      return;      
    }      
      
    try {      
      await deletePlantPhoto(postId);      
      setPosts(posts.filter(p => p.id !== postId));      
    } catch (error) {      
      console.error("Error deleting post:", error);      
      alert("Error deleting the post. Please try again.");      
    }      
  };      
      
  const handleDeleteComment = async (postId: string, commentId: string) => {      
    if (!confirm("Delete this comment?")) {      
      return;      
    }      
      
    try {      
      await deleteCommentFromPhoto(postId, commentId);      
      await loadPosts();      
    } catch (error) {      
      console.error("Error deleting comment:", error);      
      alert("Error deleting the comment. Please try again.");      
    }      
  };      
      
  if (!mounted || loading) {      
    return (      
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0B0B0B' }}>      
        <div style={{ textAlign: 'center' }}>      
          <div style={{ display: 'inline-block', width: '48px', height: '48px', border: '4px solid #A4CB3E', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '16px' }}></div>      
          <p style={{ color: '#B6B9BF', fontSize: '18px' }}>Loading posts...</p>      
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
    <div style={{ minHeight: '100vh', background: '#0B0B0B', padding: '32px' }}>      
      <div style={{ maxWidth: '1400px', margin: '0 auto 32px auto' }}>      
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>      
          <div>      
            <h1 style={{ fontSize: '36px', fontWeight: 'bold', marginBottom: '8px', color: '#F5F5F5' }}>      
              🌿 Posts & Comments Management      
            </h1>      
            <p style={{ fontSize: '16px', color: '#B6B9BF' }}>      
              Moderate community plant photos and comments      
            </p>      
          </div>      
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>  
            <select  
              value={selectedCategory}  
              onChange={(e) => setSelectedCategory(e.target.value as CategoryKey | 'all')}  
              style={{  
                background: '#0B0B0B',  
                border: '1px solid #2A2A2A',  
                borderRadius: '12px',  
                padding: '10px 16px',  
                color: '#F5F5F5',  
                fontSize: '14px',  
                fontWeight: '500'  
              }}  
            >  
              <option value="all">All Categories</option>  
              {Object.entries(CATEGORIES).map(([key, value]) => (  
                <option key={key} value={key}>  
                  {value.emoji} {value.label}  
                </option>  
              ))}  
            </select>  
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
              ← Back to Admin      
            </Link>      
          </div>      
        </div>      
      </div>      
      
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>      
        {posts.length === 0 ? (      
          <div style={{ textAlign: 'center', padding: '64px' }}>      
            <div style={{ fontSize: '56px', marginBottom: '24px' }}>🌿</div>      
            <p style={{ fontSize: '20px', color: '#B6B9BF', marginBottom: '24px' }}>      
              No posts found      
            </p>      
            <p style={{ fontSize: '16px', color: '#757575' }}>      
              Community members haven&apos;t shared any plant photos yet.      
            </p>      
          </div>      
        ) : (      
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '24px' }}>      
            {posts.map((post) => (      
              <div key={post.id} style={{      
                background: '#0F0F0F',      
                borderRadius: '12px',      
                border: '1px solid #242424',      
                overflow: 'hidden',      
                display: 'flex',      
                flexDirection: 'column'      
              }}>      
                <div style={{      
                  height: '300px',      
                  backgroundImage: `url(${post.imageBase64})`,      
                  backgroundSize: 'cover',      
                  backgroundPosition: 'center',      
                  position: 'relative'      
                }}>      
                  <div style={{      
                    position: 'absolute',      
                    top: '12px',      
                    right: '12px',      
                    display: 'flex',      
                    gap: '8px'      
                  }}>      
                    <button      
                      onClick={() => post.id && handleDeletePost(post.id)}      
                      style={{      
                        background: 'rgba(255, 96, 168, 0.9)',      
                        border: 'none',      
                        borderRadius: '8px',      
                        padding: '8px 12px',      
                        color: '#F5F5F5',      
                        fontSize: '12px',      
                        fontWeight: '600',      
                        cursor: 'pointer',      
                        transition: 'all 0.2s'      
                      }}      
                    >      
                      🗑️ Delete Post      
                    </button>      
                  </div>      
                </div>      
      
                <div style={{ padding: '16px', flex: 1 }}>      
                  <div style={{ marginBottom: '8px' }}>  
                    <h3 style={{ color: '#F5F5F5', fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>      
                      {post.plantName}      
                    </h3>  
                    {post.category && (  
                      <div style={{  
                        background: 'rgba(164, 203, 62, 0.2)',  
                        border: '1px solid #A4CB3E',  
                        borderRadius: '6px',  
                        padding: '4px 8px',  
                        display: 'inline-block',  
                        marginBottom: '8px'  
                      }}>  
                        <span style={{ fontSize: '12px', color: '#A4CB3E', fontWeight: '500' }}>  
                          {CATEGORIES[post.category as CategoryKey]?.emoji} {CATEGORIES[post.category as CategoryKey]?.label}  
                        </span>  
                      </div>  
                    )}  
                  </div>  
                  <p style={{ color: '#B6B9BF', fontSize: '14px', lineHeight: '1.5', marginBottom: '16px' }}>      
                    {post.description}      
                  </p>      
      
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px', fontSize: '12px', color: '#757575' }}>      
                    <span>👤 {post.userName || 'Anonymous'}</span>      
                    <span>🍃 {post.likesCount || 0} likes</span>      
                    <span>💬 {post.comments?.length || 0} comments</span>      
                  </div>      
      
                  {post.comments && post.comments.length > 0 && (      
                    <div style={{ borderTop: '1px solid #242424', paddingTop: '12px' }}>      
                      <h4 style={{ color: '#F5F5F5', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>      
                        Comments ({post.comments.length})      
                      </h4>      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>      
                        {post.comments.slice(0, 3).map((comment: Comment) => (      
                          <div key={comment.id} style={{      
                            background: '#0B0B0B',      
                            borderRadius: '8px',      
                            padding: '8px 12px'      
                          }}>      
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '4px' }}>      
                              <span style={{ fontSize: '12px', color: '#A4CB3E', fontWeight: '600' }}>      
                                {comment.userName || 'Anonymous'}      
                              </span>      
                              <button      
                                onClick={() => post.id && handleDeleteComment(post.id, comment.id)}      
                                style={{      
                                  background: 'rgba(255, 96, 168, 0.8)',      
                                  border: 'none',      
                                  borderRadius: '4px',      
                                  padding: '2px 6px',      
                                  color: '#F5F5F5',      
                                  fontSize: '10px',      
                                  fontWeight: '600',      
                                  cursor: 'pointer',      
                                  transition: 'all 0.2s'      
                                }}      
                              >      
                                🗑️      
                              </button>      
                            </div>      
                            <p style={{ margin: 0, fontSize: '13px', color: '#F5F5F5' }}>      
                              {comment.text}      
                            </p>      
                          </div>      
                        ))}      
                        {post.comments.length > 3 && (      
                          <p style={{ margin: 0, fontSize: '12px', color: '#757575', textAlign: 'center' }}>      
                            ... and {post.comments.length - 3} more comments      
                          </p>      
                        )}      
                      </div>      
                    </div>      
                  )}      
                </div>      
              </div>      
            ))}      
          </div>      
        )}      
      
        {hasMore && posts.length > 0 && (      
          <div style={{ textAlign: 'center', marginTop: '32px' }}>      
            <button      
              onClick={() => loadPosts(true)}      
              disabled={loadingMore}      
              style={{      
                padding: '12px 32px',      
                background: loadingMore ? '#2A2A2A' : '#A4CB3E',      
                border: 'none',      
                borderRadius: '9999px',      
                color: loadingMore ? '#666666' : '#0B0B0B',      
                fontSize: '16px',      
                fontWeight: '600',      
                cursor: loadingMore ? 'not-allowed' : 'pointer',      
                transition: 'all 0.2s'      
              }}      
            >      
              {loadingMore ? 'Loading...' : 'Load More Posts'}      
            </button>      
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
      
export default function ProtectedPostsPage() {      
  return (      
    <ProtectedRoute>      
      <PostsPage />      
    </ProtectedRoute>      
  );      
}