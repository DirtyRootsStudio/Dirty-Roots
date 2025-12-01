'use client';  
  
import { useState, useEffect } from 'react';  
import { useForm } from 'react-hook-form';  
import { z } from 'zod';  
import { zodResolver } from '@hookform/resolvers/zod';  
import { addAdmin, listAdmins, deleteAdmin, Admin } from '@/src/lib/firestore';  
import { auth } from '@/src/lib/firebase';  
import { createUserWithEmailAndPassword, fetchSignInMethodsForEmail } from 'firebase/auth';  
import OwnerRoute from '@/src/components/OwnerRoute';  
  
const adminSchema = z.object({  
  email: z.string().email('Email inválido'),  
  displayName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),  
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),  
});  
  
type AdminFormValues = z.infer<typeof adminSchema>;  
  
function AdminsConsolePage() {  
  const [admins, setAdmins] = useState<Admin[]>([]);  
  const [loading, setLoading] = useState(true);  
  const [saving, setSaving] = useState(false);  
  const [creatingAccount, setCreatingAccount] = useState(false);  
  const [makingAdmin, setMakingAdmin] = useState(false);  
  const [error, setError] = useState('');  
  const [success, setSuccess] = useState(false);  
  
  const { register, handleSubmit, reset } = useForm<AdminFormValues>({  
    resolver: zodResolver(adminSchema),  
  });  
  
  useEffect(() => {  
    loadAdmins();  
  }, []);  
  
  async function loadAdmins() {  
    try {  
      const data = await listAdmins();  
      setAdmins(data);  
    } catch (error) {  
      console.error('Error loading admins:', error);  
      setError('Error cargando administradores');  
    } finally {  
      setLoading(false);  
    }  
  }  
  
  // Botón 1: Crear cuenta en Firebase Authentication  
  async function onCreateAccount(values: AdminFormValues) {  
    setError('');  
    setCreatingAccount(true);  
      
    try {  
      const signInMethods = await fetchSignInMethodsForEmail(auth, values.email);  
        
      if (signInMethods.length > 0) {  
        setError('Este email ya está registrado en Firebase Authentication');  
        return;  
      }  
  
      await createUserWithEmailAndPassword(auth, values.email, values.password);  
      setSuccess(true);  
      setTimeout(() => setSuccess(false), 3000);  
        
    } catch (error: unknown) {  
      console.error('❌ Error creating account:', error);  
      if (error instanceof Error) {  
        setError(`Error: ${error.message}`);  
      } else {  
        setError('Error desconocido al crear cuenta');  
      }  
    } finally {  
      setCreatingAccount(false);  
    }  
  }  
  
  // Botón 2: Hacer admin (añadir a Firestore)  
  async function onMakeAdmin(values: AdminFormValues) {  
    setError('');  
    setMakingAdmin(true);  
      
    try {  
      const currentUser = auth.currentUser;  
      if (!currentUser) throw new Error('No authenticated user');  
  
      // Verificar si ya es admin en Firestore  
      const existingAdmin = admins.find(a => a.email === values.email);  
      if (existingAdmin) {  
        setError('Este usuario ya es administrador');  
        return;  
      }  
  
      await addAdmin({  
        email: values.email,  
        displayName: values.displayName,  
        role: 'admin',  
        createdBy: currentUser.uid,  
      });  
  
      setSuccess(true);  
      reset();  
      loadAdmins();  
      setTimeout(() => setSuccess(false), 3000);  
        
    } catch (error: unknown) {  
      console.error('❌ Error making admin:', error);  
      if (error instanceof Error) {  
        setError(`Error: ${error.message}`);  
      } else {  
        setError('Error desconocido al hacer admin');  
      }  
    } finally {  
      setMakingAdmin(false);  
    }  
  }  
  
  async function handleDeleteAdmin(adminId: string, adminRole: string) {  
    if (adminRole === 'owner') {  
      setError('No puedes eliminar al owner');  
      return;  
    }  
  
    if (!confirm('¿Estás seguro de que quieres eliminar este administrador?')) {  
      return;  
    }  
  
    try {  
      await deleteAdmin(adminId);  
      setAdmins(admins.filter(a => a.id !== adminId));  
    } catch (error) {  
      console.error('Error deleting admin:', error);  
      setError('Error eliminando administrador');  
    }  
  }  
  
  if (loading) {  
    return (  
      <div style={{       
        minHeight: '100vh',       
        display: 'flex',       
        alignItems: 'center',       
        justifyContent: 'center',       
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
  
  return (  
    <div style={{ minHeight: '100vh', background: '#0B0B0B', padding: '32px' }}>  
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>  
        <div style={{ marginBottom: '32px' }}>  
          <h1 style={{       
            fontSize: '36px',       
            fontWeight: 'bold',       
            marginBottom: '8px',       
            color: '#F5F5F5'       
          }}>      
            👑 Consola de Administradores      
          </h1>      
          <p style={{ fontSize: '16px', color: '#B6B9BF' }}>      
            Gestiona los administradores del sistema      
          </p>      
        </div>      
  
        {error && (      
          <div style={{      
            marginBottom: '24px',      
            padding: '16px',      
            background: 'rgba(255, 96, 168, 0.1)',      
            border: '1px solid #FF60A8',      
            borderRadius: '12px',      
            color: '#FF60A8'      
          }}>      
            {error}      
          </div>      
        )}      
  
        {success && (      
          <div style={{      
            marginBottom: '24px',      
            padding: '16px',      
            background: 'rgba(164, 203, 62, 0.1)',      
            border: '1px solid #A4CB3E',      
            borderRadius: '12px',      
            color: '#A4CB3E'      
          }}>      
            Operación completada correctamente ✅      
          </div>      
        )}      
  
        {/* Formulario para añadir administrador */}      
        <div style={{      
          background: '#0F0F0F',      
          border: '1px solid #242424',      
          borderRadius: '24px',      
          padding: '32px',      
          marginBottom: '32px'      
        }}>      
          <h2 style={{       
            fontSize: '24px',       
            fontWeight: 'bold',       
            marginBottom: '24px',       
            color: '#F5F5F5'       
          }}>      
            ➕ Gestión de Administradores      
          </h2>      
  
          <form style={{       
            display: 'flex',       
            flexDirection: 'column',       
            gap: '20px'       
          }}>      
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
                placeholder="admin@ejemplo.com"      
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
                Nombre      
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
                placeholder="Nombre del administrador"      
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
                placeholder="Contraseña del administrador"      
              />      
            </div>      
  
            <div style={{ display: 'flex', gap: '16px' }}>  
              <button      
                type="button"      
                onClick={handleSubmit(onCreateAccount)}  
                disabled={creatingAccount}  
                style={{      
                  flex: 1,  
                  padding: '14px 24px',      
                  background: creatingAccount ? '#2A2A2A' : '#FF60A8',      
                  color: creatingAccount ? '#666666' : '#FFFFFF',      
                  border: 'none',      
                  borderRadius: '9999px',      
                  fontSize: '16px',      
                  fontWeight: '700',      
                  cursor: creatingAccount ? 'not-allowed' : 'pointer'      
                }}      
              >      
                {creatingAccount ? 'Creando...' : '🔐 Crear Cuenta'}      
              </button>  
  
              <button      
                type="button"      
                onClick={handleSubmit(onMakeAdmin)}  
                disabled={makingAdmin}  
                style={{      
                  flex: 1,  
                  padding: '14px 24px',      
                  background: makingAdmin ? '#2A2A2A' : '#A4CB3E',      
                  color: makingAdmin ? '#666666' : '#0B0B0B',      
                  border: 'none',      
                  borderRadius: '9999px',      
                  fontSize: '16px',      
                  fontWeight: '700',      
                  cursor: makingAdmin ? 'not-allowed' : 'pointer'      
                }}      
              >      
                {makingAdmin ? 'Haciendo admin...' : '👑 Hacer Admin'}      
              </button>  
            </div>  
          </form>      
        </div>      
  
        {/* Lista de administradores */}      
        <div style={{      
          background: '#0F0F0F',      
          border: '1px solid #242424',      
          borderRadius: '24px',      
          padding: '32px'      
        }}>      
          <h2 style={{       
            fontSize: '24px',       
            fontWeight: 'bold',       
            marginBottom: '24px',       
            color: '#F5F5F5'       
          }}>      
            👥 Administradores ({admins.length})      
          </h2>      
  
          {admins.length === 0 ? (      
            <p style={{ color: '#B6B9BF', textAlign: 'center', padding: '32px' }}>      
              No hay administradores registrados      
            </p>      
          ) : (      
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>      
              {admins.map(admin => (      
                <div      
                  key={admin.id}      
                  style={{      
                    background: '#0B0B0B',      
                    border: '1px solid #2A2A2A',      
                    borderRadius: '12px',      
                    padding: '20px',      
                    display: 'flex',      
                    justifyContent: 'space-between',      
                    alignItems: 'center'      
                  }}      
                >      
                  <div>      
                    <h3 style={{       
                      color: '#F5F5F5',       
                      fontSize: '16px',       
                      fontWeight: 'bold',       
                      margin: '0 0 4px 0'       
                    }}>      
                      {admin.displayName}      
                      {admin.role === 'owner' && (      
                        <span style={{      
                          marginLeft: '8px',      
                          padding: '4px 8px',      
                          background: '#FF60A8',      
                          color: '#FFFFFF',      
                          fontSize: '12px',      
                          borderRadius: '6px',      
                          fontWeight: '600'      
                        }}>      
                          OWNER      
                        </span>      
                      )}      
                    </h3>      
                    <p style={{ color: '#B6B9BF', fontSize: '14px', margin: 0 }}>      
                      {admin.email}      
                    </p>      
                  </div>      
  
                  {admin.role !== 'owner' && (      
                    <button      
                      onClick={() => handleDeleteAdmin(admin.id, admin.role)}      
                      style={{      
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
                      🗑️ Eliminar      
                    </button>      
                  )}      
                </div>      
              ))}      
            </div>      
          )}      
        </div>      
      </div>      
  
      <style jsx>{`      
        @keyframes spin {      
          to { transform: rotate(360deg); }      
        }      
      `}</style>      
    </div>      
  );      
}      
  
export default function ProtectedAdminsConsolePage() {      
  return (      
    <OwnerRoute>      
      <AdminsConsolePage />      
    </OwnerRoute>      
  );      
}