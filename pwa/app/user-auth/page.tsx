// pwa/app/user-auth/page.tsx    
'use client';    
    
import { useState, useEffect } from 'react';    
import { useRouter } from 'next/navigation';    
import { useForm } from 'react-hook-form';    
import { z } from 'zod';    
import { zodResolver } from '@hookform/resolvers/zod';    
import { auth } from '@/src/lib/firebase';    
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, signOut  } from 'firebase/auth';    
import { getUserProfile } from '@/src/lib/firestore';    
  
    
const userAuthSchema = z.object({    
  displayName: z.string().min(2, 'The name must be at least 2 characters long').optional().or(z.literal('')),    
  email: z.string().email('Invalid email'),    
  password: z.string().min(6, 'The password must be at least 6 characters long'),    
});    
    
type UserAuthFormValues = z.infer<typeof userAuthSchema>;    
    
export default function UserAuthPage() {    
  const [isLogin, setIsLogin] = useState(true);    
  const [error, setError] = useState('');    
  const [loading, setLoading] = useState(false);    
  const [inviteCode, setInviteCode] = useState<string | null>(null);    
  const router = useRouter();    
    
  useEffect(() => {    
    // Capturar código de invitación de la URL    
    const urlParams = new URLSearchParams(window.location.search);    
    const code = urlParams.get('invite');    
    console.log('🔍 [INVITATION] Checking URL for invite code...', { url: window.location.search, code });    
          
    if (code) {    
      console.log('✉️ [INVITATION] Invite code found:', code);    
      setInviteCode(code);    
    } else {    
      console.log('❌ [INVITATION] No invite code in URL');    
    }    
  }, []);    
    
  const { register, handleSubmit } = useForm<UserAuthFormValues>({    
    resolver: zodResolver(userAuthSchema),    
  });    
    
  const onSubmit = handleSubmit(async (values) => {    
    setError('');    
    setLoading(true);    
          
    console.log('🚀 [AUTH] Starting authentication...', { isLogin, hasInviteCode: !!inviteCode });    
                    
    try {    
      if (isLogin) {    
        console.log('🔑 [AUTH] Attempting sign in with email/password');    
        const result = await signInWithEmailAndPassword(auth, values.email, values.password);    
        console.log('✅ [AUTH] Sign in successful');    
  
        // NUEVA VERIFICACIÓN: Consultar perfil del usuario    
        const userProfile = await getUserProfile(result.user.uid);    
        if (userProfile?.status === 'suspended') {    
          await signOut(auth);    
          setError('Tu cuenta ha sido suspendida. Contacta al administrador.');    
          return;    
        }    
      } else {    
        console.log('👤 [AUTH] Creating new user account...');    
        const result = await createUserWithEmailAndPassword(auth, values.email, values.password);    
        console.log('✅ [AUTH] User created successfully:', { uid: result.user.uid, email: result.user.email });    
              
        console.log('📝 [AUTH] Updating user profile with displayName:', values.displayName);    
        await updateProfile(result.user, { displayName: values.displayName });    
        console.log('✅ [AUTH] Profile updated successfully');    
                
        // Si hay código de invitación, procesarlo    
        if (inviteCode) {    
          console.log('🎯 [INVITATION] Processing invitation registration...', {       
            inviteCode,       
            registeredUid: result.user.uid       
          });    
                
          try {    
            const response = await fetch('/api/invitations/process', {    
              method: 'POST',    
              headers: {    
                'Content-Type': 'application/json',    
              },    
              body: JSON.stringify({    
                inviteCode,    
                registeredUid: result.user.uid,    
              }),    
            });    
                  
            if (!response.ok) {    
              throw new Error('Error procesando invitación');    
            }    
                
            console.log('✅ [INVITATION] Invitation processed successfully');    
          } catch (inviteError) {    
            console.error('❌ [INVITATION] Failed to process invitation:', inviteError);    
            throw inviteError;    
          }    
        } else {    
          console.log('ℹ️ [INVITATION] No invitation code to process');    
        }    
      }    
            
      console.log('🏠 [NAV] Redirecting to /community/herbarium');    
      router.push('/community/herbarium');    
    } catch (error: unknown) {    
      console.error('❌ [ERROR] Authentication failed:', error);    
            
      if (error instanceof Error) {    
        console.error('❌ [ERROR] Error message:', error.message);    
        setError(error.message);    
      } else {    
        console.error('❌ [ERROR] Unknown error type');    
        setError('Error de autenticación');    
      }    
    } finally {    
      setLoading(false);    
      console.log('🏁 [AUTH] Authentication process completed');    
    }    
  });    
    
  return (    
    <main style={{    
      minHeight: '100vh',    
      display: 'flex',    
      alignItems: 'center',    
      justifyContent: 'center',    
      background: '#0B0B0B',    
      padding: '24px'    
    }}>    
      <div style={{    
        width: '100%',    
        maxWidth: '480px',    
        background: '#0F0F0F',    
        borderRadius: '24px',    
        border: '1px solid #242424',    
        padding: '40px'    
      }}>    
        <h1 style={{    
          fontSize: '32px',    
          fontWeight: 'bold',    
          textAlign: 'center',    
          marginBottom: '32px',    
          color: '#F5F5F5'    
        }}>    
          {isLogin ? '🌿 Enter' : '🌱 Create Account'}    
        </h1>    
                      
        {error && (    
          <div style={{    
            borderRadius: '12px',    
            border: '1px solid #FF60A8',    
            background: 'rgba(255, 96, 168, 0.1)',    
            padding: '16px',    
            marginBottom: '24px'    
          }}>    
            <p style={{ color: '#FF60A8', fontSize: '14px', margin: 0 }}>    
              {error}    
            </p>    
          </div>    
        )}    
    
        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>    
          {!isLogin && (    
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
                type="text"    
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
          )}    
    
          <div>    
            <label style={{    
              display: 'block',    
              fontSize: '14px',    
              fontWeight: '600',    
              marginBottom: '8px',    
              color: '#F5F5F5'    
            }}>    
              Email    
            </label>    
            <input    
              type="email"    
              {...register('email')}    
              style={{    
                width: '100%',    
                background: '#0B0B0B',    
                border: '1px solid #2A2A2A',    
                borderRadius: '12px',    
                padding: '12px 16px',    
                color: '#F5F5F5',    
                fontSize: '14px'    
              }}    
              placeholder="your@email.com"    
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
              Password    
            </label>    
            <input    
              type="password"    
              {...register('password')}    
              style={{    
                width: '100%',    
                background: '#0B0B0B',    
                border: '1px solid #2A2A2A',    
                borderRadius: '12px',    
                padding: '12px 16px',    
                color: '#F5F5F5',    
                fontSize: '14px'    
              }}    
              placeholder="••••••••"    
            />    
          </div>    
    
          <button    
            type="submit"    
            disabled={loading}    
            style={{    
              width: '100%',    
              padding: '14px 24px',    
              background: loading ? '#2A2A2A' : '#A4CB3E',    
              color: loading ? '#666666' : '#0B0B0B',    
              border: 'none',    
              borderRadius: '9999px',    
              fontSize: '16px',    
              fontWeight: '700',    
              cursor: loading ? 'not-allowed' : 'pointer'    
            }}    
          >    
            {loading ? 'Loading...' : (isLogin ? 'Enter' : 'Create account')}    
          </button>    
    
          <button    
            type="button"    
            onClick={() => setIsLogin(!isLogin)}    
            style={{    
              width: '100%',    
              padding: '12px',    
              background: 'transparent',    
              border: 'none',    
              color: '#B6B9BF',    
              fontSize: '14px',    
              cursor: 'pointer'    
            }}    
          >    
            {isLogin ? "Don't have an account? Sign up" : "Do you already have an account? Log in"}  
          </button>    
        </form>    
      </div>    
    </main>    
  );    
}