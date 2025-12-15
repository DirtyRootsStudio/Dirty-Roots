'use client';    
    
import { useState, useEffect } from 'react';    
import { useForm } from 'react-hook-form';    
import { z } from 'zod';    
import { zodResolver } from '@hookform/resolvers/zod';    
import { listAdmins, deleteAdmin, Admin } from '@/src/lib/firestore';    
import { auth } from '@/src/lib/firebase';    
import { useRouter } from 'next/navigation';    
import OwnerRoute from '@/src/components/OwnerRoute';    
    
const adminSchema = z.object({    
  email: z.string().email('Email inválido'),    
  displayName: z.string().min(2, 'The name must be at least 2 characters long'),    
  password: z.string().min(6, 'The password must be at least 6 characters long'),    
});    
    
type AdminFormValues = z.infer<typeof adminSchema>;    
    
function AdminsConsolePage() {    
  const router = useRouter();    
  const [admins, setAdmins] = useState<Admin[]>([]);    
  const [loading, setLoading] = useState(true);    
  const [saving, setSaving] = useState(false);    
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
      setError('Error loading admins');    
    } finally {    
      setLoading(false);    
    }    
  }    
    
  // Función integrada: Crear cuenta y hacer admin en un solo paso    
  async function handleCreateAndMakeAdmin(values: AdminFormValues) {    
    setError('');    
    setSaving(true);    
          
    try {    
      const currentUser = auth.currentUser;    
      if (!currentUser) throw new Error('No authenticated user');    
        
      // Llamar al backend API en lugar de crear usuario directamente    
      const response = await fetch('/api/admins/create', {    
        method: 'POST',    
        headers: {    
          'Content-Type': 'application/json',    
        },    
        body: JSON.stringify({    
          email: values.email,    
          displayName: values.displayName,    
          password: values.password,    
          ownerEmail: currentUser.email,    
        }),    
      });    
        
      const result = await response.json();    
        
      if (!response.ok) {    
        throw new Error(result.error || 'Unknow error creating admin');    
      }    
        
      setSuccess(true);    
      reset();    
      loadAdmins();    
      setTimeout(() => setSuccess(false), 3000);    
            
    } catch (error: unknown) {    
      console.error('❌ Error adding admin:', error);    
      if (error instanceof Error) {    
        setError(`Error: ${error.message}`);    
      } else {    
        setError('Unknow error deleting admin');    
      }    
    } finally {    
      setSaving(false);    
    }    
  }    
    
  async function handleDeleteAdmin(adminId: string, adminRole: string) {    
    if (adminRole === 'owner') {    
      setError('No puedes eliminar al owner');    
      return;    
    }    
        
    if (!confirm('Are you sure about deleting this admin?')) {    
      return;    
    }    
        
    try {    
      await deleteAdmin(adminId);    
      setAdmins(admins.filter(a => a.id !== adminId));    
    } catch (error) {    
      console.error('Error deleting admin:', error);    
      setError('Error deleting admin');    
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
        <div style={{ marginBottom: '32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>    
          <div>    
            <h1 style={{                     
              fontSize: '36px',                     
              fontWeight: 'bold',                     
              marginBottom: '8px',                     
              color: '#F5F5F5'                     
            }}>    
              👑 Administrators Console    
            </h1>    
            <p style={{ fontSize: '16px', color: '#B6B9BF' }}>    
              Manage system administrators    
            </p>    
          </div>    
          <button    
            onClick={() => router.back()}    
            style={{    
              padding: '10px 20px',    
              background: '#0F0F0F',    
              border: '1px solid #2A2A2A',    
              borderRadius: '12px',    
              color: '#F5F5F5',    
              fontSize: '14px',    
              cursor: 'pointer',    
              transition: 'all 0.2s'    
            }}    
            onMouseEnter={(e) => e.currentTarget.style.borderColor = '#A4CB3E'}    
            onMouseLeave={(e) => e.currentTarget.style.borderColor = '#2A2A2A'}    
          >    
            ← Go back    
          </button>    
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
            Operation completed successfully ✅    
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
            ➕ Add Administrator    
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
                placeholder="admin@example.com"    
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
                placeholder="Admin's name"    
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
                placeholder="Admin's password"    
              />    
            </div>    
    
            <button    
              type="button"    
              onClick={handleSubmit(handleCreateAndMakeAdmin)}    
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
              {saving ? 'Processing...' : '🚀 Create Account and Become an Admin'}    
            </button>    
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
            👥 Administrators ({admins.length})    
          </h2>    
    
          {admins.length === 0 ? (    
            <p style={{ color: '#B6B9BF', textAlign: 'center', padding: '32px' }}>    
              There are no registered administrators    
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
                      🗑️ Delete    
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