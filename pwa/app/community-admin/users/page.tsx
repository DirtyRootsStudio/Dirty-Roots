// app/community-admin/users/page.tsx  
"use client";  
  
import { useEffect, useState, useCallback } from "react";  
import { listPlantPhotos, getUserProfile, UserProfile, suspendUser, unsuspendUser } from "@/src/lib/firestore";  
import Link from "next/link";  
import ProtectedRoute from "@/src/components/ProtectedRoute";  
import { auth } from "@/src/lib/firebase";  
import Image from 'next/image';  
import { useRouter } from 'next/navigation';

// Extender el tipo UserProfile para incluir los conteos  
interface UserProfileWithStats extends UserProfile {  
  postsCount?: number;  
  commentsCount?: number;  
}  
  
function UsersPage() {  
  const [mounted, setMounted] = useState(false);  
  const [users, setUsers] = useState<UserProfileWithStats[]>([]);  
  const [loading, setLoading] = useState(true);  
  const [searchTerm, setSearchTerm] = useState("");  
  const [filter, setFilter] = useState<"all" | "active" | "suspended">("all");  
  
  useEffect(() => {  
    setMounted(true);  
  }, []);  
  
  const loadUsers = useCallback(async () => {  
    try {  
      setLoading(true);  
      const allPosts = await listPlantPhotos(1000);  
      const uniqueUids = [...new Set(allPosts.map(post => post.createdBy))];  
        
      const profiles: UserProfileWithStats[] = [];  
      for (const uid of uniqueUids) {  
        if (uid && uid !== "anon") {  
          const profile = await getUserProfile(uid);  
          if (profile) {  
            // Contar posts y comentarios  
            const postsCount = allPosts.filter(p => p.createdBy === uid).length;  
            let commentsCount = 0;  
            allPosts.forEach(photo => {  
              if (photo.comments) {  
                commentsCount += photo.comments.filter(  
                  (c: Comment) => c.createdBy === uid  
                ).length;  
              }  
            });  
              
            profiles.push({  
              ...profile,  
              postsCount,  
              commentsCount  
            });  
          }  
        }  
      }  
        
      setUsers(profiles);  
    } catch (error) {  
      console.error("Error loading users:", error);  
    } finally {  
      setLoading(false);  
    }  
  }, []);  
  
  useEffect(() => {  
    if (!mounted) return;  
    loadUsers();  
  }, [mounted, loadUsers]);  
  
  const filteredUsers = users.filter(user => {  
    const matchesSearch = user.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||   
                        user.uid.toLowerCase().includes(searchTerm.toLowerCase());  
      
    if (filter === "all") return matchesSearch;  
    if (filter === "suspended") return matchesSearch && user.status === 'suspended';  
    return matchesSearch && user.status !== 'suspended'; // 'active'  
  });  
  
  const handleSuspendUser = async (uid: string) => {  
    if (!confirm("Are you sure you want to suspend this user?")) {  
      return;  
    }  
      
    try {  
      const currentUser = auth.currentUser;  
      if (!currentUser) {  
        alert("You must be logged in to suspend users");  
        return;  
      }  
        
      await suspendUser(uid, currentUser.uid);  
      await loadUsers(); // Recargar lista  
      alert("User suspended successfully");  
    } catch (error) {  
      console.error("Error suspending user:", error);  
      alert("Error suspending user. Please try again.");  
    }  
  };  
  
  const handleUnsuspendUser = async (uid: string) => {  
    if (!confirm("Are you sure you want to unsuspend this user?")) {  
      return;  
    }  
      
    try {  
      await unsuspendUser(uid);  
      await loadUsers(); // Recargar lista  
      alert("User unsuspended successfully");  
    } catch (error) {  
      console.error("Error unsuspending user:", error);  
      alert("Error unsuspending user. Please try again.");  
    }  
  };  
  
  const handleViewUserActivity = (userId: string) => {  
    router.push(`/community-admin/users/${userId}/activity`);  
    };  
  
  if (!mounted || loading) {  
    return (  
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0B0B0B' }}>  
        <div style={{ textAlign: 'center' }}>  
          <div style={{ display: 'inline-block', width: '48px', height: '48px', border: '4px solid #A4CB3E', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '16px' }}></div>  
          <p style={{ color: '#B6B9BF', fontSize: '18px' }}>Loading users...</p>  
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
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>  
        {/* Header */}  
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>  
          <div>  
            <h1 style={{ fontSize: '36px', fontWeight: 'bold', marginBottom: '8px', color: '#F5F5F5' }}>  
              👥 User Management  
            </h1>  
            <p style={{ fontSize: '16px', color: '#B6B9BF' }}>  
              Moderate and manage community users  
            </p>  
          </div>  
          <Link  
            href="/community-admin"  
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
  
        {/* Filters */}  
        <div style={{      
          background: '#0F0F0F',      
          border: '1px solid #242424',      
          borderRadius: '24px',      
          padding: '24px',      
          marginBottom: '32px',  
          display: 'flex',  
          gap: '16px',  
          alignItems: 'center',  
          flexWrap: 'wrap'  
        }}>  
          <div style={{ flex: 1, minWidth: '300px' }}>  
            <input  
              type="text"  
              placeholder="Search users by name or ID..."  
              value={searchTerm}  
              onChange={(e) => setSearchTerm(e.target.value)}  
              style={{  
                width: '100%',  
                background: '#0B0B0B',  
                border: '1px solid #2A2A2A',  
                borderRadius: '12px',  
                padding: '12px 16px',  
                color: '#F5F5F5',  
                fontSize: '14px',  
                transition: 'all 0.2s'  
              }}  
              onFocus={(e) => e.currentTarget.style.borderColor = '#A4CB3E'}  
              onBlur={(e) => e.currentTarget.style.borderColor = '#2A2A2A'}  
            />  
          </div>  
                
          <div style={{ display: 'flex', gap: '8px' }}>  
            {[  
              { value: 'all', label: 'All Users' },  
              { value: 'active', label: 'Active' },  
              { value: 'suspended', label: 'Suspended' }  
            ].map(option => (  
              <button  
                key={option.value}  
                onClick={() => setFilter(option.value as "all" | "active" | "suspended")}  
                style={{  
                  padding: '8px 16px',  
                  background: filter === option.value ? '#A4CB3E' : 'transparent',  
                  border: `1px solid ${filter === option.value ? '#A4CB3E' : '#2A2A2A'}`,  
                  borderRadius: '8px',  
                  color: filter === option.value ? '#0B0B0B' : '#B6B9BF',  
                  fontSize: '14px',  
                  cursor: 'pointer',  
                  transition: 'all 0.2s'  
                }}  
              >  
                {option.label}  
              </button>  
            ))}  
          </div>  
        </div>  
  
        {/* Users List */}  
        {filteredUsers.length === 0 ? (  
          <div style={{  
            borderRadius: '24px',  
            padding: '40px',  
            textAlign: 'center',  
            border: '1px solid #242424',  
            background: '#0F0F0F'  
          }}>  
            <div style={{ fontSize: '56px', marginBottom: '24px' }}>👥</div>  
            <p style={{ marginBottom: '16px', fontSize: '20px', color: '#B6B9BF' }}>  
              {searchTerm ? 'No users found matching your search' : 'No users found'}  
            </p>  
            <p style={{ fontSize: '14px', color: '#B6B9BF' }}>  
              {searchTerm ? 'Try adjusting your search terms' : 'Users will appear here when they post content'}  
            </p>  
          </div>  
        ) : (  
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '24px' }}>  
            {filteredUsers.map(user => (  
              <div  
                key={user.uid}  
                style={{  
                  background: '#0F0F0F',  
                  border: '1px solid #242424',  
                  borderRadius: '24px',  
                  padding: '24px',  
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
                {/* User Header */}  
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>  
                  {user.profileImageBase64 ? (  
                    <Image  
                      src={user.profileImageBase64}  
                      alt={user.displayName}  
                      width={60}  
                      height={60}  
                      style={{  
                        width: '60px',  
                        height: '60px',  
                        borderRadius: '50%',  
                        objectFit: 'cover',  
                        border: '2px solid #2A2A2A'  
                      }}  
                    />  
                  ) : (  
                    <div style={{  
                      width: '60px',  
                      height: '60px',  
                      borderRadius: '50%',  
                      background: '#2A2A2A',  
                      display: 'flex',  
                      alignItems: 'center',  
                      justifyContent: 'center',  
                      fontSize: '24px'  
                    }}>  
                      👤  
                    </div>  
                  )}  
                      
                  <div style={{ flex: 1 }}>  
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>  
                      <h3 style={{  
                        fontSize: '18px',  
                        fontWeight: 'bold',  
                        color: '#F5F5F5',  
                        margin: 0  
                      }}>  
                        {user.displayName}  
                      </h3>  
                      {user.status === 'suspended' && (  
                        <span style={{  
                          fontSize: '10px',  
                          color: '#FF60A8',  
                          background: 'rgba(255, 96, 168, 0.1)',  
                          padding: '2px 6px',  
                          borderRadius: '4px',  
                          fontWeight: '600'  
                        }}>  
                          ⚠️ Suspended  
                        </span>  
                      )}  
                    </div>  
                    <p style={{      
                      fontSize: '12px',      
                      color: '#757575',      
                      margin: 0,  
                      fontFamily: 'monospace'  
                    }}>  
                      ID: {user.uid.slice(0, 8)}...  
                    </p>  
                  </div>  
                </div>  
  
                {/* User Bio */}  
                {user.bio && (  
                  <p style={{  
                    fontSize: '14px',  
                    color: '#B6B9BF',  
                    lineHeight: '1.5',  
                    marginBottom: '16px'  
                  }}>  
                    {user.bio.length > 100 ? `${user.bio.slice(0, 100)}...` : user.bio}  
                  </p>  
                )}  
  
                {/* User Stats */}  
                <div style={{ display: 'flex', gap: '24px', marginBottom: '16px' }}>  
                  <div style={{ textAlign: 'center' }}>  
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#A4CB3E' }}>  
                      {user.postsCount || 0}  
                    </div>  
                    <div style={{ fontSize: '12px', color: '#B6B9BF' }}>Posts</div>  
                  </div>  
                  <div style={{ textAlign: 'center' }}>  
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#A4CB3E' }}>  
                      {user.commentsCount || 0}  
                    </div>  
                    <div style={{ fontSize: '12px', color: '#B6B9BF' }}>Comments</div>  
                  </div>  
                  <div style={{ textAlign: 'center' }}>  
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#A4CB3E' }}>  
                      {user.createdAt ? new Date(user.createdAt.toMillis()).toLocaleDateString() : 'N/A'}  
                    </div>  
                    <div style={{ fontSize: '12px', color: '#B6B9BF' }}>Joined</div>  
                  </div>  
                </div>  
  
                {/* Action Buttons */}  
                <div style={{ display: 'flex', gap: '8px' }}>  
                  <button  
                    onClick={() => handleViewUserActivity()}  
                    style={{  
                      flex: 1,  
                      padding: '8px 16px',  
                      background: 'transparent',  
                      border: '1px solid #A4CB3E',  
                      color: '#A4CB3E',  
                      borderRadius: '8px',  
                      fontSize: '14px',  
                      cursor: 'pointer',  
                      transition: 'all 0.2s'  
                    }}  
                  >  
                    View Activity  
                  </button>  
                  {user.status === 'suspended' ? (  
                    <button  
                      onClick={() => handleUnsuspendUser(user.uid)}  
                      style={{  
                        flex: 1,  
                        padding: '8px 16px',  
                        background: '#A4CB3E',  
                        border: 'none',  
                        color: '#0B0B0B',  
                        borderRadius: '8px',  
                        fontSize: '14px',  
                        cursor: 'pointer',  
                        transition: 'all 0.2s'  
                      }}  
                    >  
                      Unsuspend User  
                    </button>  
                  ) : (  
                    <button  
                      onClick={() => handleSuspendUser(user.uid)}  
                      style={{  
                        flex: 1,  
                        padding: '8px 16px',  
                        background: 'transparent',  
                        border: '1px solid #FF60A8',  
                        color: '#FF60A8',  
                        borderRadius: '8px',  
                        fontSize: '14px',  
                        cursor: 'pointer',  
                        transition: 'all 0.2s'  
                      }}  
                    >  
                      Suspend User  
                    </button>  
                  )}  
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
  
// Wrapper con protección de administrador  
export default function ProtectedUsersPage() {  
  return (  
    <ProtectedRoute>  
      <UsersPage />  
    </ProtectedRoute>  
  );  
}