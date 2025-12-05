'use client';    
    
import { useState, useEffect, useCallback } from 'react';    
import { useForm } from 'react-hook-form';    
import { z } from 'zod';    
import { zodResolver } from '@hookform/resolvers/zod';    
import UserProtectedRoute from '@/src/components/UserProtectedRoute';    
import imageCompression from 'browser-image-compression';    
import { auth } from '@/src/lib/firebase';    
import { signOut } from 'firebase/auth';    
import { useRouter } from 'next/navigation';    
import Link from 'next/link';    
import {     
  getUserProfile,     
  updateUserProfile,     
  createUserProfile,     
  listPlantPhotos,     
  PlantPhoto,     
  generateInviteLink,    
  listDiscountTiers,  
  checkDiscountEligibility,  // ← AÑADIR ESTA IMPORTACIÓN  
  DiscountTier,  
  UserProfile       
} from '@/src/lib/firestore'; 

const profileSchema = z.object({    
  displayName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),    
  bio: z.string().optional(),    
  profileImageBase64: z.string().optional(),    
});    
    
type ProfileFormValues = z.infer<typeof profileSchema>;    
    
// Componente de invitación de amigos  
const InviteFriendsComponent = () => {  
  const [inviteLink, setInviteLink] = useState('');  
  const [copied, setCopied] = useState(false);  
  const [generating, setGenerating] = useState(false);  
  const [discountTiers, setDiscountTiers] = useState<DiscountTier[]>([]);  
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);  
  const [loadingTiers, setLoadingTiers] = useState(true);  
  
  // Cargar tiers y perfil del usuario  
  useEffect(() => {  
    const loadData = async () => {  
      try {  
        const user = auth.currentUser;  
        if (user) {  
          // Cargar tiers configurados  
          const tiers = await listDiscountTiers();  
          setDiscountTiers(tiers.filter(t => t.active));  
            
          // Cargar perfil del usuario  
          const profile = await getUserProfile(user.uid);  
          setUserProfile(profile);  
        }  
      } catch (error) {  
        console.error('Error loading data:', error);  
      } finally {  
        setLoadingTiers(false);  
      }  
    };  
      
    loadData();  
  }, []);  
  
  const generateLink = async () => {  
    setGenerating(true);  
    try {  
      const user = auth.currentUser;  
      if (user) {  
        const link = await generateInviteLink(user.uid);  
        setInviteLink(link);  
      }  
    } catch (error) {  
      console.error('Error generating invite link:', error);  
    } finally {  
      setGenerating(false);  
    }  
  };  
  
  const copyToClipboard = () => {  
    navigator.clipboard.writeText(inviteLink);  
    setCopied(true);  
    setTimeout(() => setCopied(false), 2000);  
  };  
  
  const invitedCount = userProfile?.challengeProgress?.invitedFriends?.length || 0;  
  const photoCount = userProfile?.challengeProgress?.photoDates?.length || 0;  
  
  return (  
    <div style={{  
      background: '#0F0F0F',  
      border: '1px solid #2A2A2A',  
      borderRadius: '12px',  
      padding: '20px',  
      marginTop: '32px'  
    }}>  
      <h3 style={{  
        fontSize: '18px',  
        fontWeight: 'bold',  
        marginBottom: '16px',  
        color: '#F5F5F5',  
        display: 'flex',  
        alignItems: 'center',  
        gap: '8px'  
      }}>  
        🎉 Invita a tus amigos y gana descuentos  
      </h3>  
  
      {/* Mensaje principal dinámico */}  
      {!loadingTiers && discountTiers.length > 0 && (  
        <p style={{  
          color: '#B6B9BF',  
          fontSize: '14px',  
          marginBottom: '16px',  
          lineHeight: '1.5'  
        }}>  
          {discountTiers[0]?.description || 'Invita amigos y publica fotos para obtener descuentos especiales.'}  
        </p>  
      )}  
  
      {/* Progreso actual */}  
      <div style={{  
        background: '#0B0B0B',  
        border: '1px solid #2A2A2A',  
        borderRadius: '8px',  
        padding: '12px',  
        marginBottom: '16px'  
      }}>  
        <div style={{  
          display: 'flex',  
          justifyContent: 'space-between',  
          marginBottom: '8px',  
          fontSize: '12px',  
          color: '#B6B9BF'  
        }}>  
          <span>👥 Amigos invitados: {invitedCount}</span>  
          <span>📸 Fotos publicadas: {photoCount}/3 días</span>  
        </div>  
          
        {/* Barra de progreso de fotos */}  
        <div style={{  
          fontSize: '11px',  
          color: '#666',  
          marginBottom: '4px'  
        }}>  
          Progreso de fotos: {Math.min(photoCount, 3)}/3 días distintos  
        </div>  
        <div style={{  
          height: '4px',  
          background: '#2A2A2A',  
          borderRadius: '2px',  
          overflow: 'hidden'  
        }}>  
          <div style={{  
            height: '100%',  
            width: `${Math.min((photoCount / 3) * 100, 100)}%`,  
            background: photoCount >= 3 ? '#A4CB3E' : '#FF60A8',  
            transition: 'width 0.3s ease'  
          }} />  
        </div>  
      </div>  
  
      {/* Niveles de descuento */}  
      {!loadingTiers && discountTiers.length > 0 && (  
        <div style={{ marginBottom: '16px' }}>  
          <h4 style={{  
            fontSize: '14px',  
            fontWeight: '600',  
            color: '#F5F5F5',  
            marginBottom: '12px'  
          }}>  
            🎁 Niveles de descuento disponibles:  
          </h4>  
          {discountTiers.map((tier) => {  
            const isAchieved = invitedCount >= tier.friendsRequired && photoCount >= 1;  
            const hasCode = userProfile?.challengeProgress?.earnedDiscounts?.[`level${tier.level}`];  
              
            console.log(`🎯 [TIER] Level ${tier.level}:`, {  
                title: tier.title,  
                friendsRequired: tier.friendsRequired,  
                invitedCount,  
                photoCount,  
                isAchieved,  
                hasCode,  
                tierKey: `level${tier.level}`  
              });  

            return (  
              <div  
                key={tier.id}  
                style={{  
                  background: isAchieved ? 'rgba(164, 203, 62, 0.1)' : 'rgba(255, 96, 168, 0.1)',  
                  border: `1px solid ${isAchieved ? '#A4CB3E' : '#FF60A8'}`,  
                  borderRadius: '8px',  
                  padding: '12px',  
                  marginBottom: '8px'  
                }}  
              >  
                <div style={{  
                  display: 'flex',  
                  justifyContent: 'space-between',  
                  alignItems: 'center',  
                  marginBottom: '4px'  
                }}>  
                  <span style={{  
                    fontSize: '13px',  
                    fontWeight: '600',  
                    color: isAchieved ? '#A4CB3E' : '#FF60A8'  
                  }}>  
                    {tier.title}  
                  </span>  
                  <span style={{  
                    fontSize: '12px',  
                    color: '#B6B9BF'  
                  }}>  
                    {tier.shortMessage}  
                  </span>  
                </div>  
                  
                {/* Barra de progreso para este nivel */}  
                <div style={{  
                  fontSize: '11px',  
                  color: '#666',  
                  marginBottom: '4px'  
                }}>  
                  Amigos: {Math.min(invitedCount, tier.friendsRequired)}/{tier.friendsRequired}  
                </div>  
                <div style={{  
                  height: '3px',  
                  background: '#2A2A2A',  
                  borderRadius: '2px',  
                  overflow: 'hidden',  
                  marginBottom: '4px'  
                }}>  
                  <div style={{  
                    height: '100%',  
                    width: `${Math.min((invitedCount / tier.friendsRequired) * 100, 100)}%`,  
                    background: isAchieved ? '#A4CB3E' : '#FF60A8',  
                    transition: 'width 0.3s ease'  
                  }} />  
                </div>  
  
                {/* Mostrar código si está logrado */}  
                {hasCode && (  
                  <div style={{  
                    fontSize: '11px',  
                    color: '#A4CB3E',  
                    fontWeight: '600'  
                  }}>  
                    ✅ Código obtenido: {hasCode}  
                  </div>  
                )}  
              </div>  
            );  
          })}  
        </div>  
      )}  
  
      <button  
        onClick={generateLink}  
        disabled={generating}  
        style={{  
          width: '100%',  
          padding: '12px 20px',  
          background: generating ? '#2A2A2A' : '#FF60A8',  
          color: '#F5F5F5',  
          border: 'none',  
          borderRadius: '9999px',  
          fontSize: '14px',  
          fontWeight: '600',  
          cursor: generating ? 'not-allowed' : 'pointer',  
          marginBottom: '16px'  
        }}  
      >  
        {generating ? 'Generando...' : 'Generar enlace de invitación'}  
      </button>  
  
      {inviteLink && (  
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>  
          <input  
            value={inviteLink}  
            readOnly  
            style={{  
              flex: 1,  
              background: '#0B0B0B',  
              border: '1px solid #2A2A2A',  
              borderRadius: '8px',  
              padding: '10px 12px',  
              color: '#B6B9BF',  
              fontSize: '12px'  
            }}  
          />  
          <button  
            onClick={copyToClipboard}  
            style={{  
              padding: '10px 16px',  
              background: copied ? '#A4CB3E' : '#2A2A2A',  
              color: copied ? '#0B0B0B' : '#F5F5F5',  
              border: 'none',  
              borderRadius: '8px',  
              fontSize: '12px',  
              fontWeight: '600',  
              cursor: 'pointer',  
              whiteSpace: 'nowrap'  
            }}  
          >  
            {copied ? '¡Copiado!' : 'Copiar'}  
          </button>  
        </div>  
      )}  
    </div>  
  );  
};   
    
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
    
  const loadProfile = useCallback(async () => {  
  try {  
    const user = auth.currentUser;  
    if (!user) return;  
      
    console.log('🔍 [PROFILE] Loading profile for user:', user.uid);  


    const profile = await getUserProfile(user.uid); 
    console.log('📊 [PROFILE] Profile loaded:', {  
      uid: profile?.uid,  
      challengeProgress: profile?.challengeProgress  
    }); 

    if (profile) {  
      reset({  
        displayName: profile.displayName,  
        bio: profile.bio || '',  
        profileImageBase64: profile.profileImageBase64 || '',  
      });  
    }  
      
    const plants = await listPlantPhotos(50);  
    const userPlants = plants.filter(p => p.createdBy === user.uid);  
    setUserPlants(userPlants);  
      
    console.log('🌿 [PROFILE] User plants loaded:', userPlants.length);  


    // NUEVO: Actualizar photoDates del challengeProgress  
    const uniqueDates = [...new Set(  
      userPlants.map(plant =>   
        plant.createdAt.toDate().toISOString().split('T')[0] // YYYY-MM-DD  
      )  
    )];  
      

    console.log('📅 [PROFILE] Unique photo dates calculated:', uniqueDates);  
    console.log('📅 [PROFILE] Current photoDates in profile:', profile?.challengeProgress?.photoDates);  
      
    // Actualizar perfil solo si las fechas han cambiado  
    if (profile &&   
        JSON.stringify(profile.challengeProgress?.photoDates || []) !==   
        JSON.stringify(uniqueDates)) {  
        
        console.log('🔄 [PROFILE] Updating photoDates from',   
                profile.challengeProgress?.photoDates, 'to', uniqueDates);

        await updateUserProfile(user.uid, {  
          challengeProgress: {  
            photoDates: uniqueDates,  
            invitedFriends: profile.challengeProgress?.invitedFriends || [],  
            earnedDiscounts: profile.challengeProgress?.earnedDiscounts || {}  
          }  
      });  

      console.log('✅ [PROFILE] Profile updated with new photoDates');  
      console.log('🎯 [PROFILE] Checking discount eligibility...')
        
      await checkDiscountEligibility(user.uid);  

      // Recargar perfil para ver si se actualizó  
      const updatedProfile = await getUserProfile(user.uid);  
      console.log('📊 [PROFILE] Profile after eligibility check:', {  
        challengeProgress: updatedProfile?.challengeProgress  
      });  
    } else {  
      console.log('ℹ️ [PROFILE] Photo dates unchanged, skipping update');  
    } 
      
  } catch (error) {  
    console.error('Error loading profile:', error);  
  } finally {  
    setLoading(false);  
  }  
}, [reset]); 
      
  useEffect(() => {    
    loadProfile();    
  }, [loadProfile]);  
    
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
        router.push('/user-auth');    
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
                  
            <div style={{     
              display: 'flex',     
              alignItems: 'center',     
              gap: '16px',    
              flexDirection: window.innerWidth < 768 ? 'column' : 'row'    
            }}>    
              {profileImageBase64 ? (    
                <div style={{    
                  width: window.innerWidth < 768 ? '100px' : '80px',    
                  height: window.innerWidth < 768 ? '100px' : '80px',    
                  borderRadius: '50%',    
                  backgroundImage: `url(${profileImageBase64})`,    
                  backgroundSize: 'cover',    
                  backgroundPosition: 'center',    
                  border: '2px solid #2A2A2A',    
                  flexShrink: 0    
                }} />    
              ) : (    
                <div style={{    
                  width: window.innerWidth < 768 ? '100px' : '80px',    
                  height: window.innerWidth < 768 ? '100px' : '80px',    
                  borderRadius: '50%',    
                  background: '#0F0F0F',    
                  border: '2px solid #2A2A2A',    
                  display: 'flex',    
                  alignItems: 'center',    
                  justifyContent: 'center',    
                  fontSize: '32px',    
                  color: '#B6B9BF',    
                  flexShrink: 0    
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
                  fontSize: '14px',    
                  minWidth: window.innerWidth < 768 ? '100%' : 'auto'    
                }}    
              />    
            </div>    
          </div>    
    
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
    
        <InviteFriendsComponent />    
    
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
                  onClick={() => router.push(`/community/plant/${plant.id}`)}    
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
                You haven&apos;t uploaded any plants yet <Link href="/community/herbarium" style={{ color: '#A4CB3E' }}>Upload your first plant</Link>    
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