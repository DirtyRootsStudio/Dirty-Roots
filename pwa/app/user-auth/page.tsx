// pwa/app/user-auth/page.tsx  
'use client';  
  
import { useState } from 'react';  
import { useRouter } from 'next/navigation';  
import { useForm } from 'react-hook-form';  
import { z } from 'zod';  
import { zodResolver } from '@hookform/resolvers/zod';  
import { auth } from '@/src/lib/firebase';  
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';  
  
const userAuthSchema = z.object({  
  displayName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').optional().or(z.literal('')),  
  email: z.string().email('Email inválido'),  
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),  
}); 
  
type UserAuthFormValues = z.infer<typeof userAuthSchema>;  
  
export default function UserAuthPage() {  
  const [isLogin, setIsLogin] = useState(true);  
  const [error, setError] = useState('');  
  const [loading, setLoading] = useState(false);  
  const router = useRouter();  
          
  const { register, handleSubmit } = useForm<UserAuthFormValues>({  
    resolver: zodResolver(userAuthSchema),  
  });  
  
  const onSubmit = handleSubmit(async (values) => {  
    setError('');  
    setLoading(true);  
            
    try {  
      if (isLogin) {  
        await signInWithEmailAndPassword(auth, values.email, values.password);  
      } else {  
        const result = await createUserWithEmailAndPassword(auth, values.email, values.password);  
        await updateProfile(result.user, { displayName: values.displayName });  
      }  
      router.push('/community/herbarium');  
    } catch (error: unknown) {  
      if (error instanceof Error) {  
        setError(error.message);  
      } else {  
        setError('Error de autenticación');  
      }  
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
          {isLogin ? '🌿 Entrar' : '🌱 Crear Cuenta'}  
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
                Nombre de Usuario  
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
                placeholder="Tu nombre"  
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
              placeholder="tu@email.com"  
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
            {loading ? 'Cargando...' : (isLogin ? 'Entrar' : 'Crear Cuenta')}  
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
            {isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Entra'}  
          </button>  
        </form>  
      </div>  
    </main>  
  );  
}