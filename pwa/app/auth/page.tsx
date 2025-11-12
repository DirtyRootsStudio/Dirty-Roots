// pwa/app/auth/page.tsx  
'use client';  
  
import { useState } from 'react';  
import { useRouter } from 'next/navigation';  
import { useForm } from 'react-hook-form';  
import { z } from 'zod';  
import { zodResolver } from '@hookform/resolvers/zod';  
import { auth } from '@/src/lib/firebase';  
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';  
  
const authSchema = z.object({  
  email: z.string().email('Invalid email'),  
  password: z.string().min(6, 'The password must be at least 6 characters long'),  
});  
  
type AuthFormValues = z.infer<typeof authSchema>;  
  
export default function AuthPage() {  
  const [isLogin, setIsLogin] = useState(true);  
  const [error, setError] = useState('');  
  const [loading, setLoading] = useState(false);  
  const router = useRouter();  
      
  const { register, handleSubmit, formState } = useForm<AuthFormValues>({  
    resolver: zodResolver(authSchema),  
  });  
  
  const onSubmit = handleSubmit(async (values) => {  
    setError('');  
    setLoading(true);  
        
    try {  
      if (isLogin) {  
        await signInWithEmailAndPassword(auth, values.email, values.password);  
      } else {  
        await createUserWithEmailAndPassword(auth, values.email, values.password);  
      }  
      router.push('/');  
    } catch (error: any) {  
      setError(error.message || 'Authentication error');  
    } finally {  
      setLoading(false);  
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
          {isLogin ? '🔐 Login' : '✨ Register'}  
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
                fontSize: '14px',  
                fontFamily: 'inherit',  
                outline: 'none',  
                transition: 'all 0.2s'  
              }}  
              placeholder="tu@email.com"  
              onFocus={(e) => e.currentTarget.style.borderColor = '#A4CB3E'}  
              onBlur={(e) => e.currentTarget.style.borderColor = '#2A2A2A'}  
            />  
            {formState.errors.email && (  
              <p style={{  
                color: '#FF60A8',  
                fontSize: '12px',  
                marginTop: '4px'  
              }}>  
                {formState.errors.email.message}  
              </p>  
            )}  
          </div>  
  
          <div>  
            <label style={{  
              display: 'block',  
              fontSize: '14px',  
              fontWeight: '600',  
              marginBottom: '8px',  
              color: '#F5F5F5'  
            }}>  
              Contraseña  
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
                fontSize: '14px',  
                fontFamily: 'inherit',  
                outline: 'none',  
                transition: 'all 0.2s'  
              }}  
              placeholder="••••••••"  
              onFocus={(e) => e.currentTarget.style.borderColor = '#A4CB3E'}  
              onBlur={(e) => e.currentTarget.style.borderColor = '#2A2A2A'}  
            />  
            {formState.errors.password && (  
              <p style={{  
                color: '#FF60A8',  
                fontSize: '12px',  
                marginTop: '4px'  
              }}>  
                {formState.errors.password.message}  
              </p>  
            )}  
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
              cursor: loading ? 'not-allowed' : 'pointer',  
              transition: 'all 0.2s',  
              marginTop: '8px'  
            }}  
            onMouseEnter={(e) => {  
              if (!loading) {  
                e.currentTarget.style.background = '#8FB82E';  
                e.currentTarget.style.transform = 'scale(1.02)';  
              }  
            }}  
            onMouseLeave={(e) => {  
              if (!loading) {  
                e.currentTarget.style.background = '#A4CB3E';  
                e.currentTarget.style.transform = 'scale(1)';  
              }  
            }}  
          >  
            {loading ? 'Loading...' : (isLogin ? 'Enter' : 'Create Account')}  
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
              cursor: 'pointer',  
              transition: 'all 0.2s'  
            }}  
            onMouseEnter={(e) => e.currentTarget.style.color = '#F5F5F5'}  
            onMouseLeave={(e) => e.currentTarget.style.color = '#B6B9BF'}  
          >  
            {isLogin ? 'Dont have an account? Sign up' : 'Already have an account? Log in'}  
          </button>  
        </form>  
  
        <style jsx>{`  
          input::placeholder {  
            color: #B6B9BF;  
            opacity: 0.7;  
          }  
        `}</style>  
      </div>  
    </main>  
  );  
}