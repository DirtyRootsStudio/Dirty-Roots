'use client';  
  
import { useState, useEffect } from 'react';  
import { useForm } from 'react-hook-form';  
import { z } from 'zod';  
import { zodResolver } from '@hookform/resolvers/zod';  
import { getUserProfile, updateUserProfile, createUserProfile, listPlantPhotos, PlantPhoto } from '@/src/lib/firestore';  
import UserProtectedRoute from '@/src/components/UserProtectedRoute';  
import imageCompression from 'browser-image-compression';  
import { auth } from '@/src/lib/firebase';  
import { signOut } from 'firebase/auth';  
import { useRouter } from 'next/navigation';  
import Link from 'next/link';  
 
const profileSchema = z.object({  
  displayName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),  
  bio: z.string().optional(),  
  profileImageBase64: z.string().optional(),  
});  
  
type ProfileFormValues = z.infer<typeof profileSchema>;  
  
function ProfilePage() {  
  const [loading, setLoading] = useState(true);  
  const [saving, setSaving] = useState(false);  
  const [error, setError] = useState('');  
  const [success, setSuccess] = useState(false);  
  const [userPlants, setUserPlants] = useState<PlantPhoto[]>([]);  
  const router = useRouter();  
  
  const { register, handleSubmit, setValue, watch, reset } = useForm<ProfileFormValues>({  
    resolver: zodResolver(profileSchema),  
  });  
  
  const profileImageBase64 = watch('profileImageBase64');  
  
  useEffect(() => {  
    loadProfile();  
  }, []);  
  
  async function loadProfile() {  
    try {  
      const user = auth.currentUser;  
      if (!user) return;  
  
      const profile = await getUserProfile(user.uid);  
      if (profile) {  
        reset({  
          displayName: profile.displayName,  
          bio: profile.bio || '',  
          profileImageBase64: profile.profileImageBase64 || '',  
        });  
      }  
  
      // Cargar plantas del usuario  
      const plants = await listPlantPhotos(50);  
      setUserPlants(plants.filter(p => p.createdBy === user.uid));  
    } catch (error) {  
      console.error('Error loading profile:', error);  
    } finally {  
      setLoading(false);  
    }  
  }  
  
  async function handleImageUpload(file: File) {  
    try {  
      setError('Comprimiendo imagen...');  
          
      const options = {  
        maxSizeMB: 0.4,  
        maxWidthOrHeight: 600,  
        useWebWorker: true,  
        fileType: 'image/jpeg',  
        initialQuality: 0.7  
      };  
          
      const compressedFile = await imageCompression(file, options);  
          
      const reader = new FileReader();  
      reader.onloadend = () => {  
        const base64String = reader.result as string;  
        const sizeInBytes = base64String.length;  
            
        if (sizeInBytes > 900000) {  
          setError('The image is too large. Try a smaller image.');  
          return;  
        }  
            
        setValue('profileImageBase64', base64String);  
        setError('');  
      };  
      reader.readAsDataURL(compressedFile);  
          
    } catch (error) {  
      console.error('Error en compresión de imagen:', error);  
      setError('Error processing the image. Please try another image.');  
    }  
  }  
  
  const onSubmit = handleSubmit(async (values) => {  
    try {  
      setSaving(true);  
      setError('');  
      setSuccess(false);  
  
      const user = auth.currentUser;  
      if (!user) return;  
  
      const profileData = {  
        uid: user.uid,  
        displayName: values.displayName,  
        bio: values.bio || '',  
        profileImageBase64: values.profileImageBase64 || '',  
      };  
  
      const existingProfile = await getUserProfile(user.uid);  
      if (existingProfile) {  
        await updateUserProfile(user.uid, profileData);  
      } else {  
        await createUserProfile(profileData);  
      }  
  
      setSuccess(true);  
      setTimeout(() => setSuccess(false), 3000);  
    } catch (error) {  
      console.error('Error saving profile:', error);  
      setError('Error saving profile. Please try again.');  
    } finally {  
      setSaving(false);  
    }  
  });  
  
  async function handleLogout() {  
    try {  
        await signOut(auth);  
        router.push('/user-auth'); // ← Cambiar de /auth a /user-auth  
    } catch (error) {  
        console.error('Error al cerrar sesión:', error);  
    }  
  } 
  
  if (loading) {  
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
    <main style={{  
      width: '100%',  
      height: '100%',  
      background: '#0B0B0B',  
      overflowY: 'auto',  
      padding: '16px',  
      boxSizing: 'border-box'  
    }}>  
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>  
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>  
          <h2 style={{  
            fontSize: '24px',  
            fontWeight: 'bold',  
            color: '#F5F5F5'  
          }}>  
            👤 My Profile  
          </h2>  
          <button  
            onClick={handleLogout}  
            style={{  
              padding: '10px 20px',  
              borderRadius: '9999px',  
              border: '1px solid #FF60A8',  
              background: 'transparent',  
              color: '#F5F5F5',  
              fontWeight: '600',  
              fontSize: '14px',  
              cursor: 'pointer'  
            }}  
          >  
            Logout  
          </button>  
        </div>  
  
        {error && (  
          <div style={{  
            borderRadius: '12px',  
            border: '1px solid #FF60A8',  
            background: 'rgba(255, 96, 168, 0.1)',  
            padding: '16px',  
            marginBottom: '24px',  
            color: '#FF60A8',  
            fontSize: '14px'  
          }}>  
            {error}  
          </div>  
        )}  
  
        {success && (  
          <div style={{  
            borderRadius: '12px',  
            border: '1px solid #A4CB3E',  
            background: 'rgba(164, 203, 62, 0.1)',  
            padding: '16px',  
            marginBottom: '24px',  
            color: '#A4CB3E',  
            fontSize: '14px'  
          }}>  
            ✅ Profile saved successfully  
          </div>  
        )}  
  
        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>  
          {/* Foto de perfil */}  
          <div>  
            <label style={{  
              display: 'block',  
              fontSize: '14px',  
              fontWeight: '600',  
              marginBottom: '8px',  
              color: '#F5F5F5'  
            }}>  
              Profile Photo  
            </label>  
                
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>  
              {profileImageBase64 ? (  
                <div style={{  
                  width: '80px',  
                  height: '80px',  
                  borderRadius: '50%',  
                  backgroundImage: `url(${profileImageBase64})`,  
                  backgroundSize: 'cover',  
                  backgroundPosition: 'center',  
                  border: '2px solid #2A2A2A'  
                }} />  
              ) : (  
                <div style={{  
                  width: '80px',  
                  height: '80px',  
                  borderRadius: '50%',  
                  background: '#0F0F0F',  
                  border: '2px solid #2A2A2A',  
                  display: 'flex',  
                  alignItems: 'center',  
                  justifyContent: 'center',  
                  fontSize: '32px',  
                  color: '#B6B9BF'  
                }}>  
                  👤  
                </div>  
              )}  
                  
              <input  
                type="file"  
                accept="image/*"  
                onChange={(e) => {  
                  const file = e.target.files?.[0];  
                  if (file) {  
                    handleImageUpload(file);  
                  }  
                }}  
                style={{  
                  flex: 1,  
                  background: '#0B0B0B',  
                  border: '1px solid #2A2A2A',  
                  borderRadius: '12px',  
                  padding: '12px 16px',  
                  color: '#F5F5F5',  
                  fontSize: '14px'  
                }}  
              />  
            </div>  
          </div>  
  
          {/* Nombre */}  
          <div>  
            <label style={{  
              display: 'block',  
              fontSize: '14px',  
              fontWeight: '600',  
              marginBottom: '8px',  
              color: '#F5F5F5'  
            }}>  
              Name  
            </label>  
            <input  
              {...register('displayName')}  
              style={{  
                width: '100%',  
                background: '#0B0B0B',  
                border: '1px solid #2A2A2A',  
                borderRadius: '12px',  
                padding: '12px 16px',  
                color: '#F5F5F5',  
                fontSize: '14px'  
              }}  
              placeholder="Your name"  
            />  
          </div>  
  
          {/* Bio */}  
          <div>  
            <label style={{  
              display: 'block',  
              fontSize: '14px',  
              fontWeight: '600',  
              marginBottom: '8px',  
              color: '#F5F5F5'  
            }}>  
              Bio (optional)  
            </label>  
            <textarea  
              {...register('bio')}  
              rows={3}  
              style={{  
                width: '100%',  
                background: '#0B0B0B',  
                border: '1px solid #2A2A2A',  
                borderRadius: '12px',  
                padding: '12px 16px',  
                color: '#F5F5F5',  
                fontSize: '14px',  
                resize: 'vertical'  
              }}  
              placeholder="Tell us about you and your plants..."  
            />  
          </div>  
  
          <button  
            type="submit"  
            disabled={saving}  
            style={{  
              width: '100%',  
              padding: '14px 24px',  
              background: saving ? '#2A2A2A' : '#A4CB3E',  
              color: saving ? '#666666' : '#0B0B0B',  
              border: 'none',  
              borderRadius: '9999px',  
              fontSize: '16px',  
              fontWeight: '700',  
              cursor: saving ? 'not-allowed' : 'pointer'  
            }}  
          >  
            {saving ? 'Saving...' : 'Save Profile'}  
          </button>  
        </form>  
  
        {/* Sección de plantas del usuario */}  
        <div style={{ marginTop: '40px' }}>  
          <h3 style={{  
            fontSize: '20px',  
            fontWeight: 'bold',  
            marginBottom: '16px',  
            color: '#F5F5F5',  
            display: 'flex',  
            alignItems: 'center',  
            gap: '8px'  
          }}>  
            🌿 My Plants  
            <span style={{  
              fontSize: '14px',  
              color: '#B6B9BF',  
              fontWeight: 'normal'  
            }}>  
              ({userPlants.length})  
            </span>  
          </h3>  
  
          {userPlants.length > 0 ? (  
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>  
              {userPlants.map(plant => (  
                <div  
                  key={plant.id}  
                  onClick={() => router.push(`/qa/embed/plant/${plant.id}`)}  
                  style={{  
                    cursor: 'pointer',  
                    borderRadius: '12px',  
                    overflow: 'hidden',  
                    border: '1px solid #2A2A2A',  
                    background: '#0B0B0B'  
                  }}  
                >  
                  <div style={{  
                    height: '150px',  
                    backgroundImage: `url(${plant.imageBase64})`,  
                    backgroundSize: 'cover',  
                    backgroundPosition: 'center'  
                  }} />  
                  <div style={{ padding: '12px' }}>  
                    <h3 style={{ color: '#F5F5F5', fontSize: '14px', fontWeight: 'bold', margin: '0 0 4px 0' }}>  
                      {plant.plantName}  
                    </h3>  
                    <p style={{ color: '#B6B9BF', fontSize: '12px', margin: 0 }}>  
                      {new Date(plant.createdAt.toMillis()).toLocaleDateString()}  
                    </p>  
                  </div>  
                </div>  
              ))}  
            </div>  
          ) : (  
            <p style={{ color: '#B6B9BF', textAlign: 'center', padding: '32px' }}>  
                You haven&apos;t uploaded any floors yet <Link href="/qa/embed/herbarium" style={{ color: '#A4CB3E' }}>Upload your first floor</Link>  
            </p>  
          )}  
        </div>  
      </div>  
    </main>  
  );  
}  
  
export default function ProtectedProfilePage() {  
  return (  
    <UserProtectedRoute>  
      <ProfilePage />  
    </UserProtectedRoute>  
  );  
}