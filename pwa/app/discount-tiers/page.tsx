// pwa/app/discount-tiers/page.tsx    
'use client';    
  
import { useState, useEffect } from 'react';    
import { useForm } from 'react-hook-form';    
import { z } from 'zod';    
import { zodResolver } from '@hookform/resolvers/zod';    
import { auth } from '@/src/lib/firebase';    
import ProtectedRoute from '@/src/components/ProtectedRoute';    
import { useRouter } from 'next/navigation';    
import { Timestamp } from "firebase/firestore";    
import {    
  listDiscountTiers   
} from '@/src/lib/firestore';    
 
// Schema para discount tiers  
const discountTierSchema = z.object({  
  level: z.number().min(1, 'El nivel debe ser al menos 1'),  
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),  
  friendsRequired: z.number().min(1, 'Se requiere al menos 1 amigo'),  
  discountPercentage: z.number().min(1, 'El descuento debe ser al menos 1%').max(100, 'Máximo 100%'),  
  active: z.boolean(),  
  title: z.string().min(2, 'El título es requerido'),  
  description: z.string().min(10, 'La descripción debe tener al menos 10 caracteres'),  
  shortMessage: z.string().min(5, 'El mensaje corto es requerido'),  
  longDescription: z.string().optional()  
});  
  
type DiscountTierFormValues = z.infer<typeof discountTierSchema>;  
  
interface DiscountTier {  
  id: string;  
  level: number;  
  name: string;  
  friendsRequired: number;  
  discountPercentage: number;  
  active: boolean;  
  title: string;  
  description: string;  
  shortMessage: string;  
  longDescription?: string;  
  createdAt: Timestamp;  // ← Changed from 'any'  
  updatedAt?: Timestamp; // ← Changed from 'any'  
}
  
function DiscountTiersPage() {  
  const [loading, setLoading] = useState(false);  
  const [error, setError] = useState('');  
  const [success, setSuccess] = useState(false);  
  const [tiers, setTiers] = useState<DiscountTier[]>([]);  
  const [loadingTiers, setLoadingTiers] = useState(true);  
  const [editingTierId, setEditingTierId] = useState<string | null>(null);  
  const router = useRouter();  
  
  const { register, handleSubmit, formState, setValue, reset } = useForm<DiscountTierFormValues>({  
    resolver: zodResolver(discountTierSchema),  
    defaultValues: {  
      level: 1,  
      name: '',  
      friendsRequired: 1,  
      discountPercentage: 10,  
      active: true,  
      title: '',  
      description: '',  
      shortMessage: '',  
      longDescription: ''  
    }  
  });  
  
  useEffect(() => {  
    loadAllTiers();  
  }, []);  
  
  async function loadAllTiers() {  
      try {  
          const data = await listDiscountTiers();  
          // No conversion needed - data is already in correct Timestamp format  
          setTiers(data);  
        } catch (error) {  
          console.error('Error loading tiers:');  
        } finally {  
          setLoadingTiers(false);  
        }  
    }   
      
  const handleEditTier = (tier: DiscountTier) => {  
    setEditingTierId(tier.id || null);  
    setValue('level', tier.level);  
    setValue('name', tier.name);  
    setValue('friendsRequired', tier.friendsRequired);  
    setValue('discountPercentage', tier.discountPercentage);  
    setValue('active', tier.active);  
    setValue('title', tier.title);  
    setValue('description', tier.description);  
    setValue('shortMessage', tier.shortMessage);  
    setValue('longDescription', tier.longDescription || '');  
    window.scrollTo({ top: 0, behavior: 'smooth' });  
  };  
  
  const handleCancelEdit = () => {  
    setEditingTierId(null);  
    reset();  
    setError('');  
  };  
  
  const handleDeleteTier = async (tierId: string) => {  
    if (!confirm('¿Estás seguro de que quieres eliminar este nivel de descuento?')) {  
      return;  
    }  
  
    try {  
      // await deleteDiscountTier(tierId);  
      setTiers(tiers.filter(t => t.id !== tierId));  
      alert('✅ Nivel eliminado');  
    } catch (error) {  
      console.error('Error deleting tier:', error);  
      alert('Error eliminando nivel');  
    }  
  };  
  
  const onSubmit = handleSubmit(async (values) => {  
    setError('');  
    setLoading(true);  
    setSuccess(false);  
  
    try {    
      if (editingTierId) {  
        // await updateDiscountTier(editingTierId, values);  
        setTiers(tiers.map(t =>     
            t.id === editingTierId     
                ? { ...t, ...values, updatedAt: Timestamp.fromDate(new Date()) }    
                : t    
            ));
        setSuccess(true);  
        setEditingTierId(null);  
        reset();  
      } else {  
        // const newId = await addDiscountTier({ ...values, createdBy: uid });  
        setSuccess(true);  
        reset();  
        await loadAllTiers();  
      }  
  
      setTimeout(() => {  
        setSuccess(false);  
      }, 2000);  
    } catch (err: unknown) {  
      const errorMessage = err instanceof Error ? err.message : 'Error guardando nivel';  
      setError(errorMessage);  
    } finally {  
      setLoading(false);  
    }  
  });  
  
  return (  
    <main style={{ minHeight: '100vh', background: '#0B0B0B', padding: '24px' }}>  
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>  
        {/* Header */}  
        <div style={{  
          marginBottom: '32px',  
          display: 'flex',  
          alignItems: 'center',  
          justifyContent: 'space-between'  
        }}>  
          <h1 style={{  
            fontSize: '32px',  
            fontWeight: 'bold',  
            color: '#F5F5F5',  
            margin: 0  
          }}>  
            🎯 Niveles de Descuento  
          </h1>  
          <button  
            onClick={() => router.push('/')}  
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
            ← Volver  
          </button>  
        </div>  
  
        <div style={{  
          display: 'flex',  
          justifyContent: 'space-between',  
          alignItems: 'center',  
          marginBottom: '24px'  
        }}>  
          <h2 style={{  
            fontSize: '24px',  
            fontWeight: 'bold',  
            color: '#F5F5F5',  
            margin: 0  
          }}>  
            {editingTierId ? '✏️ Editar Nivel' : '➕ Crear Nuevo Nivel'}  
          </h2>  
          {editingTierId && (  
            <button  
              onClick={handleCancelEdit}  
              style={{  
                padding: '8px 16px',  
                background: 'transparent',  
                border: '1px solid #FF60A8',  
                borderRadius: '9999px',  
                color: '#FF60A8',  
                fontSize: '14px',  
                cursor: 'pointer',  
                transition: 'all 0.2s'  
              }}  
              onMouseEnter={(e) => {  
                e.currentTarget.style.background = '#FF60A8';  
                e.currentTarget.style.color = '#0B0B0B';  
              }}  
              onMouseLeave={(e) => {  
                e.currentTarget.style.background = 'transparent';  
                e.currentTarget.style.color = '#FF60A8';  
              }}  
            >  
              Cancelar  
            </button>  
          )}  
        </div>  
  
        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>  
          {/* Nivel */}  
          <div>  
            <label style={{  
              display: 'block',  
              fontSize: '14px',  
              fontWeight: '600',  
              marginBottom: '8px',  
              color: '#F5F5F5'  
            }}>  
              Nivel *  
            </label>  
            <input  
              type="number"  
              {...register('level', { valueAsNumber: true })}  
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
              placeholder="1, 2, 3..."  
              onFocus={(e) => e.currentTarget.style.borderColor = '#A4CB3E'}  
              onBlur={(e) => e.currentTarget.style.borderColor = '#2A2A2A'}  
            />  
            {formState.errors.level && (  
              <p style={{  
                color: '#FF60A8',  
                fontSize: '12px',  
                marginTop: '4px'  
              }}>  
                {formState.errors.level.message}  
              </p>  
            )}  
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
              Nombre del Nivel *  
            </label>  
            <input  
              {...register('name')}  
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
              placeholder="Básico, Medio, Premium..."  
              onFocus={(e) => e.currentTarget.style.borderColor = '#A4CB3E'}  
              onBlur={(e) => e.currentTarget.style.borderColor = '#2A2A2A'}  
            />  
            {formState.errors.name && (  
              <p style={{  
                color: '#FF60A8',  
                fontSize: '12px',  
                marginTop: '4px'  
              }}>  
                {formState.errors.name.message}  
              </p>  
            )}  
          </div>  
  
          {/* Amigos Requeridos y Descuento */}  
          <div style={{ display: 'flex', gap: '16px' }}>  
            <div style={{ flex: 1 }}>  
              <label style={{  
                display: 'block',  
                fontSize: '14px',  
                fontWeight: '600',  
                marginBottom: '8px',  
                color: '#F5F5F5'  
              }}>  
                Amigos Requeridos *  
              </label>  
              <input  
                type="number"  
                {...register('friendsRequired', { valueAsNumber: true })}  
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
                placeholder="3, 5, 10..."  
                onFocus={(e) => e.currentTarget.style.borderColor = '#A4CB3E'}  
                onBlur={(e) => e.currentTarget.style.borderColor = '#2A2A2A'}  
              />  
              {formState.errors.friendsRequired && (  
                <p style={{  
                  color: '#FF60A8',  
                  fontSize: '12px',  
                  marginTop: '4px'  
                }}>  
                  {formState.errors.friendsRequired.message}  
                </p>  
              )}  
            </div>  
  
            <div style={{ flex: 1 }}>  
              <label style={{  
                display: 'block',  
                fontSize: '14px',  
                fontWeight: '600',  
                marginBottom: '8px',  
                color: '#F5F5F5'  
              }}>  
                Descuento (%) *  
              </label>  
              <input  
                type="number"  
                {...register('discountPercentage', { valueAsNumber: true })}  
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
                placeholder="10, 15, 25..."  
                onFocus={(e) => e.currentTarget.style.borderColor = '#A4CB3E'}  
                onBlur={(e) => e.currentTarget.style.borderColor = '#2A2A2A'}  
              />  
              {formState.errors.discountPercentage && (  
                <p style={{  
                  color: '#FF60A8',  
                  fontSize: '12px',  
                  marginTop: '4px'  
                }}>  
                  {formState.errors.discountPercentage.message}  
                </p>  
              )}  
            </div>  
          </div>  
  
          {/* Activo */}  
          <div>  
            <label style={{  
              display: 'flex',  
              alignItems: 'center',  
              fontSize: '14px',  
              fontWeight: '600',  
              color: '#F5F5F5',  
              cursor: 'pointer'  
            }}>  
              <input  
                type="checkbox"  
                {...register('active')}  
                style={{  
                  marginRight: '8px',  
                  width: '16px',  
                  height: '16px'  
                }}  
              />  
              Nivel Activo  
            </label>  
          </div>  
  
          {/* Título */}  
          <div>  
            <label style={{  
              display: 'block',  
              fontSize: '14px',  
              fontWeight: '600',  
              marginBottom: '8px',  
              color: '#F5F5F5'  
            }}>  
              Título para Usuario *  
            </label>  
            <input  
              {...register('title')}  
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
              placeholder="Descuento Básico, Descuento Premium..."  
              onFocus={(e) => e.currentTarget.style.borderColor = '#A4CB3E'}  
              onBlur={(e) => e.currentTarget.style.borderColor = '#2A2A2A'}  
            />  
            {formState.errors.title && (  
              <p style={{  
                color: '#FF60A8',  
                fontSize: '12px',  
                marginTop: '4px'  
              }}>  
                {formState.errors.title.message}  
              </p>  
            )}  
          </div>  
  
          {/* Descripción */}  
          <div>  
            <label style={{  
              display: 'block',  
              fontSize: '14px',  
              fontWeight: '600',  
              marginBottom: '8px',  
              color: '#F5F5F5'  
            }}>  
              Descripción *  
            </label>  
            <textarea  
              {...register('description')}  
              rows={3}  
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
                transition: 'all 0.2s',  
                resize: 'vertical'  
              }}  
              placeholder="Invita a 3 amigos y obtén 10% de descuento..."  
              onFocus={(e) => e.currentTarget.style.borderColor = '#A4CB3E'}  
              onBlur={(e) => e.currentTarget.style.borderColor = '#2A2A2A'}  
            />  
            {formState.errors.description && (  
              <p style={{  
                color: '#FF60A8',  
                fontSize: '12px',  
                marginTop: '4px'  
              }}>  
                {formState.errors.description.message}  
              </p>  
            )}  
          </div>  
  
          {/* Mensaje Corto */}  
          <div>  
            <label style={{  
              display: 'block',  
              fontSize: '14px',  
              fontWeight: '600',  
              marginBottom: '8px',  
              color: '#F5F5F5'  
            }}>  
              Mensaje Corto *  
            </label>  
            <input  
              {...register('shortMessage')}  
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
               placeholder="3 amigos = 10% OFF"  
              onFocus={(e) => e.currentTarget.style.borderColor = '#A4CB3E'}  
              onBlur={(e) => e.currentTarget.style.borderColor = '#2A2A2A'}  
            />  
            {formState.errors.shortMessage && (  
              <p style={{  
                color: '#FF60A8',  
                fontSize: '12px',  
                marginTop: '4px'  
              }}>  
                {formState.errors.shortMessage.message}  
              </p>  
            )}  
          </div>  
  
          {/* Descripción Larga */}  
          <div>  
            <label style={{  
              display: 'block',  
              fontSize: '14px',  
              fontWeight: '600',  
              marginBottom: '8px',  
              color: '#F5F5F5'  
            }}>  
              Descripción Detallada  
            </label>  
            <textarea  
              {...register('longDescription')}  
              rows={4}  
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
                transition: 'all 0.2s',  
                resize: 'vertical'  
              }}  
              placeholder="Descripción completa para mostrar en el perfil del usuario..."  
              onFocus={(e) => e.currentTarget.style.borderColor = '#A4CB3E'}  
              onBlur={(e) => e.currentTarget.style.borderColor = '#2A2A2A'}  
            />  
          </div>  
  
          {/* Activo */}  
          <div>  
            <label style={{  
              display: 'flex',  
              alignItems: 'center',  
              fontSize: '14px',  
              fontWeight: '600',  
              color: '#F5F5F5',  
              cursor: 'pointer'  
            }}>  
              <input  
                {...register('active')}  
                type="checkbox"  
                style={{  
                  marginRight: '8px',  
                  width: '16px',  
                  height: '16px'  
                }}  
              />  
              Nivel activo  
            </label>  
          </div>  
  
          {/* Submit Buttons */}  
          <div style={{  
            display: 'flex',  
            gap: '12px',  
            justifyContent: 'flex-end'  
          }}>  
            {editingTierId && (  
              <button  
                type="button"  
                onClick={handleCancelEdit}  
                style={{  
                  padding: '12px 24px',  
                  background: 'transparent',  
                  border: '1px solid #FF60A8',  
                  borderRadius: '12px',  
                  color: '#FF60A8',  
                  fontSize: '14px',  
                  fontWeight: '600',  
                  cursor: 'pointer',  
                  transition: 'all 0.2s'  
                }}  
                onMouseEnter={(e) => {  
                  e.currentTarget.style.background = '#FF60A8';  
                  e.currentTarget.style.color = '#0B0B0B';  
                }}  
                onMouseLeave={(e) => {  
                  e.currentTarget.style.background = 'transparent';  
                  e.currentTarget.style.color = '#FF60A8';  
                }}  
              >  
                Cancelar  
              </button>  
            )}  
            <button  
              type="submit"  
              disabled={loading}  
              style={{  
                padding: '12px 24px',  
                background: loading ? '#2A2A2A' : '#A4CB3E',  
                color: loading ? '#666666' : '#0B0B0B',  
                border: 'none',  
                borderRadius: '12px',  
                fontSize: '14px',  
                fontWeight: '600',  
                cursor: loading ? 'not-allowed' : 'pointer',  
                transition: 'all 0.2s'  
              }}  
            >  
              {loading ? 'Guardando...' : (editingTierId ? 'Actualizar Nivel' : 'Crear Nivel')}  
            </button>  
          </div>  
        </form>  
      </div>  
  
      {/* Lista de Niveles Existentes */}  
      <div style={{  
        background: '#0F0F0F',  
        borderRadius: '24px',  
        border: '1px solid #242424',  
        padding: '40px'  
      }}>  
        <h2 style={{  
          fontSize: '24px',  
          fontWeight: 'bold',  
          color: '#F5F5F5',  
          marginBottom: '24px'  
        }}>  
          📊 Niveles de Descuento Configurados  
        </h2>  
  
        {loadingTiers ? (  
          <div style={{  
            display: 'flex',  
            justifyContent: 'center',  
            padding: '40px'  
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
        ) : tiers.length === 0 ? (  
          <p style={{ color: '#B6B9BF', textAlign: 'center' }}>  
            No hay niveles configurados  
          </p>  
        ) : (  
          <div style={{  
            display: 'grid',  
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',  
            gap: '20px'  
          }}>  
            {tiers.sort((a, b) => a.level - b.level).map((tier) => (  
              <div key={tier.id} style={{  
                background: '#0B0B0B',  
                border: `1px solid ${tier.active ? '#A4CB3E' : '#2A2A2A'}`,  
                borderRadius: '16px',  
                padding: '20px',  
                position: 'relative'  
              }}>  
                {!tier.active && (  
                  <div style={{  
                    position: 'absolute',  
                    top: '10px',  
                    right: '10px',  
                    background: '#FF60A8',  
                    color: '#0B0B0B',  
                    padding: '4px 8px',  
                    borderRadius: '6px',  
                    fontSize: '12px',  
                    fontWeight: '600'  
                  }}>  
                    Inactivo  
                  </div>  
                )}  
                  
                <h3 style={{  
                  fontSize: '18px',  
                  fontWeight: 'bold',  
                  color: '#F5F5F5',  
                  marginBottom: '8px'  
                }}>  
                  Nivel {tier.level}: {tier.name}  
                </h3>  
                  
                <p style={{  
                  color: '#A4CB3E',  
                  fontSize: '16px',  
                  fontWeight: '600',  
                  marginBottom: '12px'  
                }}>  
                  {tier.friendsRequired} amigos = {tier.discountPercentage}% OFF  
                </p>  
                  
                <p style={{  
                  color: '#B6B9BF',  
                  fontSize: '14px',  
                  marginBottom: '16px',  
                  lineHeight: '1.4'  
                }}>  
                  {tier.description}  
                </p>  
                  
                {tier.longDescription && (  
                  <p style={{  
                    color: '#757575',  
                    fontSize: '12px',  
                    marginBottom: '16px',  
                    lineHeight: '1.4'  
                  }}>  
                    {tier.longDescription}  
                  </p>  
                )}  
  
                <div style={{  
                  display: 'flex',  
                  gap: '8px',  
                  justifyContent: 'flex-end'  
                }}>  
                  <button  
                    onClick={() => handleEditTier(tier)}  
                    style={{  
                      padding: '8px 16px',  
                      background: 'transparent',  
                      border: '1px solid #A4CB3E',  
                      borderRadius: '9999px',  
                      color: '#A4CB3E',  
                      fontSize: '12px',  
                      fontWeight: '600',  
                      cursor: 'pointer',  
                      transition: 'all 0.2s'  
                    }}  
                    onMouseEnter={(e) => {  
                      e.currentTarget.style.background = '#A4CB3E';  
                      e.currentTarget.style.color = '#0B0B0B';  
                    }}  
                    onMouseLeave={(e) => {  
                      e.currentTarget.style.background = 'transparent';  
                      e.currentTarget.style.color = '#A4CB3E';  
                    }}  
                  >  
                    ✏️ Editar  
                  </button>  
  
                  <button  
                    onClick={() => handleDeleteTier(tier.id!)}  
                    style={{  
                      padding: '8px 16px',  
                      background: 'transparent',  
                      border: '1px solid #FF60A8',  
                      borderRadius: '9999px',  
                      color: '#FF60A8',  
                      fontSize: '12px',  
                      fontWeight: '600',  
                      cursor: 'pointer',  
                      transition: 'all 0.2s'  
                    }}  
                    onMouseEnter={(e) => {  
                      e.currentTarget.style.background = '#FF60A8';  
                      e.currentTarget.style.color = '#0B0B0B';  
                    }}  
                    onMouseLeave={(e) => {  
                      e.currentTarget.style.background = 'transparent';  
                      e.currentTarget.style.color = '#FF60A8';  
                    }}  
                  >  
                    🗑️ Eliminar  
                  </button>  
                </div>  
              </div>  
            ))}  
          </div>  
        )}  
      </div>  
    </main>  
  );  
}  
  
export default function ProtectedDiscountTiersPage() {  
  return (  
    <ProtectedRoute>  
      <DiscountTiersPage />  
    </ProtectedRoute>  
  );  
}