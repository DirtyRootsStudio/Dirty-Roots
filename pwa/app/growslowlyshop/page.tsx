// pwa/app/growslowlyshop/page.tsx  
'use client';  
  
import { useState, useEffect } from 'react';  
import { useRouter } from 'next/navigation';  
import { useForm } from 'react-hook-form';  
import { z } from 'zod';  
import { zodResolver } from '@hookform/resolvers/zod';  
import { addProduct, listProducts, deleteProduct, updateProduct } from '@/src/lib/firestore';  
import { auth } from '@/src/lib/firebase';  
import ProtectedRoute from '@/src/components/ProtectedRoute';  
import imageCompression from 'browser-image-compression';  

  
const productSchema = z.object({  
  name: z.string().min(2, 'The name must be at least 2 characters long'),  
  label: z.string().min(1, 'The label is required'),  
  price: z.number().positive('The price must be positive.'),  
  link: z.string().url('It must be a valid URL'),  
  imageBase64: z.string().min(1, 'Image required')  
});  
  
type ProductFormValues = z.infer<typeof productSchema>;  
  
function GrowSlowlyShopPage() {  
  const [loading, setLoading] = useState(false);  
  const [error, setError] = useState('');  
  const [success, setSuccess] = useState(false);  
  const [products, setProducts] = useState<any[]>([]);  
  const [loadingProducts, setLoadingProducts] = useState(true);  
  const [editingProductId, setEditingProductId] = useState<string | null>(null);  
  const router = useRouter();  
  
  const { register, handleSubmit, formState, setValue, watch, reset } = useForm<ProductFormValues>({  
    resolver: zodResolver(productSchema),  
    defaultValues: {  
      name: '',  
      label: '',  
      price: 0,  
      link: '',  
      imageBase64: ''  
    }  
  });  
  
  const imageBase64 = watch('imageBase64');  
  
  // Cargar productos al montar el componente  
  useEffect(() => {  
    loadAllProducts();  
  }, []);  
  
  async function loadAllProducts() {  
    try {  
      const data = await listProducts(50);  
      setProducts(data);  
    } catch (error) {  
      console.error('Error loading products:', error);  
    } finally {  
      setLoadingProducts(false);  
    }  
  }  
  
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {  
    const file = e.target.files?.[0];  
    if (!file) return;  
    
    try {  
        setError('Compressing image...');  
        
        // Opciones de compresión agresivas  
        const options = {  
        maxSizeMB: 0.4,           // Máximo 400KB (deja margen para base64)  
        maxWidthOrHeight: 600,     // Redimensionar a máximo 600px  
        useWebWorker: true,  
        fileType: 'image/jpeg',    // Forzar JPEG (mejor compresión que PNG)  
        initialQuality: 0.7        // Calidad inicial 70%  
        };  
        
        const compressedFile = await imageCompression(file, options);  
        
        console.log(`Original: ${(file.size / 1024).toFixed(2)}KB`);  
        console.log(`Comprimido: ${(compressedFile.size / 1024).toFixed(2)}KB`);  
        
        // Convertir a base64  
        const reader = new FileReader();  
        reader.onloadend = () => {  
        const base64String = reader.result as string;  
        const sizeInBytes = base64String.length;  
            
        // Verificar que no exceda ~900KB (margen de seguridad)  
        if (sizeInBytes > 900000) {  
            setError('The image is still too large after compression. Try a smaller image.');  
            return;  
        }  
            
        setValue('imageBase64', base64String);  
        setError('');  
        };  
        reader.readAsDataURL(compressedFile);  
        
    } catch (error) {  
        console.error('Image compression error:', error);  
        setError('Error processing the image. Please try another image.');  
    }  
    };  
  
  const handleEditProduct = (product: any) => {  
    setEditingProductId(product.id);  
    setValue('name', product.name);  
    setValue('label', product.label);  
    setValue('price', product.price);  
    setValue('link', product.link);  
    setValue('imageBase64', product.imageBase64);  
    window.scrollTo({ top: 0, behavior: 'smooth' });  
  };  
  
  const handleCancelEdit = () => {  
    setEditingProductId(null);  
    reset();  
    setError('');  
  };  
  
  const handleDeleteProduct = async (productId: string) => {  
    if (!confirm('Are you sure you want to remove this product?')) {  
      return;  
    }  
  
    try {  
      await deleteProduct(productId);  
      setProducts(products.filter(p => p.id !== productId));  
      alert('✅ Product removed');  
    } catch (error) {  
      console.error('Error deleting product:', error);  
      alert('Error deleting product');  
    }  
  };  
  
  const onSubmit = handleSubmit(async (values) => {  
    setError('');  
    setLoading(true);  
    setSuccess(false);  
  
    try {  
      const uid = auth.currentUser?.uid || 'anon';  
        
      if (editingProductId) {  
        // Actualizar producto existente  
        await updateProduct(editingProductId, {  
          name: values.name,  
          label: values.label,  
          price: values.price,  
          link: values.link,  
          imageBase64: values.imageBase64  
        });  
          
        // Actualizar en el estado local  
        setProducts(products.map(p =>   
          p.id === editingProductId   
            ? { ...p, ...values }  
            : p  
        ));  
          
        setSuccess(true);  
        setEditingProductId(null);  
        reset();  
      } else {  
        // Crear nuevo producto  
        const newProductId = await addProduct({  
          name: values.name,  
          label: values.label,  
          price: values.price,  
          link: values.link,  
          imageBase64: values.imageBase64,  
          createdBy: uid  
        });  
          
        setSuccess(true);  
        reset();  
        await loadAllProducts();  
      }  
        
      setTimeout(() => {  
        setSuccess(false);  
      }, 2000);  
    } catch (err: any) {  
      setError(err.message || 'Error saving product');  
    } finally {  
      setLoading(false);  
    }  
  });  
  
  return (  
    <main style={{  
      minHeight: '100vh',  
      background: '#0B0B0B',  
      padding: '24px'  
    }}>  
      <div style={{  
        maxWidth: '1200px',  
        margin: '0 auto'  
      }}>  
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
            🛍️ Things that grow slowly shop  
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
            ← Go back  
          </button>  
        </div>  
  
        {/* Success Message */}  
        {success && (  
          <div style={{  
            borderRadius: '12px',  
            border: '1px solid #A4CB3E',  
            background: 'rgba(164, 203, 62, 0.1)',  
            padding: '16px',  
            marginBottom: '24px'  
          }}>  
            <p style={{ color: '#A4CB3E', fontSize: '14px', margin: 0 }}>  
              ✅ {editingProductId ? 'Product updated' : 'Product created'} successfully  
            </p>  
          </div>  
        )}  
  
        {/* Error Message */}  
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
  
        {/* Form Container */}  
        <div style={{  
          background: '#0F0F0F',  
          borderRadius: '24px',  
          border: '1px solid #242424',  
          padding: '40px',  
          marginBottom: '32px'  
        }}>  
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
              {editingProductId ? '✏️ Edit Product' : '➕ Create New Product'}  
            </h2>  
            {editingProductId && (  
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
              
            {/* Nombre del producto */}  
            <div>  
              <label style={{  
                display: 'block',  
                fontSize: '14px',  
                fontWeight: '600',  
                marginBottom: '8px',  
                color: '#F5F5F5'  
              }}>  
                Name of the product *  
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
                placeholder="Ej: The Art of Slow Living"  
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
  
            {/* Etiqueta */}  
            <div>  
              <label style={{  
                display: 'block',  
                fontSize: '14px',  
                fontWeight: '600',  
                marginBottom: '8px',  
                color: '#F5F5F5'  
              }}>  
                Label *  
              </label>  
              <input  
                {...register('label')}  
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
                placeholder="Ej: eBook — 2nd ed."  
                onFocus={(e) => e.currentTarget.style.borderColor = '#A4CB3E'}  
                onBlur={(e) => e.currentTarget.style.borderColor = '#2A2A2A'}  
              />  
              {formState.errors.label && (  
                <p style={{  
                  color: '#FF60A8',  
                  fontSize: '12px',  
                  marginTop: '4px'  
                }}>  
                  {formState.errors.label.message}  
                </p>  
              )}  
            </div>  
  
            {/* Precio */}  
            <div>  
              <label style={{  
                display: 'block',  
                fontSize: '14px',  
                fontWeight: '600',  
                marginBottom: '8px',  
                color: '#F5F5F5'  
              }}>  
                Price (€) *  
              </label>  
              <input  
                type="number"  
                step="0.01"  
                {...register('price', { valueAsNumber: true })}  
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
                placeholder="12.99"  
                onFocus={(e) => e.currentTarget.style.borderColor = '#A4CB3E'}  
                onBlur={(e) => e.currentTarget.style.borderColor = '#2A2A2A'}  
              />  
              {formState.errors.price && (  
                <p style={{  
                  color: '#FF60A8',  
                  fontSize: '12px',  
                  marginTop: '4px'  
                }}>  
                  {formState.errors.price.message}  
                </p>  
              )}  
            </div>  
  
            {/* Link */}  
            <div>  
              <label style={{  
                display: 'block',  
                fontSize: '14px',  
                fontWeight: '600',  
                marginBottom: '8px',  
                color: '#F5F5F5'  
              }}>  
                Link to the store *  
              </label>  
              <input  
                type="url"  
                {...register('link')}  
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
                placeholder="https://shop.example.com/product"  
                onFocus={(e) => e.currentTarget.style.borderColor = '#A4CB3E'}  
                onBlur={(e) => e.currentTarget.style.borderColor = '#2A2A2A'}  
              />  
              {formState.errors.link && (  
                <p style={{  
                  color: '#FF60A8',  
                  fontSize: '12px',  
                  marginTop: '4px'  
                }}>  
                  {formState.errors.link.message}  
                </p>  
              )}  
            </div>  
  
            {/* Imagen */}  
            <div>  
              <label style={{  
                display: 'block',  
                fontSize: '14px',  
                fontWeight: '600',  
                marginBottom: '8px',  
                color: '#F5F5F5'  
              }}>  
                Image of the product * (máx. 1MB)  
              </label>  
              <input  
                type="file"  
                accept="image/*"  
                onChange={handleImageUpload}  
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
                  cursor: 'pointer'  
                }}  
                onFocus={(e) => e.currentTarget.style.borderColor = '#A4CB3E'}  
                onBlur={(e) => e.currentTarget.style.borderColor = '#2A2A2A'}  
              />  
              {formState.errors.imageBase64 && (  
                <p style={{  
                  color: '#FF60A8',  
                  fontSize: '12px',  
                  marginTop: '4px'  
                }}>  
                  {formState.errors.imageBase64.message}  
                </p>  
              )}  
                
              {/* Preview de la imagen */}  
              {imageBase64 && (  
                <div style={{  
                  marginTop: '12px',  
                  borderRadius: '12px',  
                  overflow: 'hidden',  
                  border: '1px solid #2A2A2A'  
                }}>  
                  <img   
                    src={imageBase64}   
                    alt="Preview"   
                    style={{  
                      width: '100%',  
                      maxHeight: '300px',  
                      objectFit: 'cover'  
                    }}  
                  />  
                </div>  
              )}  
            </div>  
  
            {/* Submit Button */}  
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
                }  
              }}  
              onMouseLeave={(e) => {  
                if (!loading) {  
                  e.currentTarget.style.background = '#A4CB3E';  
                }  
              }}  
            >  
              {loading ? (editingProductId ? 'Actualizando...' : 'Creando producto...') : (editingProductId ? 'Update Product' : 'Create Product')}  
            </button>  
          </form>  
        </div>  
  
        {/* Lista de productos existentes */}  
        <div style={{  
          marginTop: '48px'  
        }}>  
          <h2 style={{  
            fontSize: '24px',  
            fontWeight: 'bold',  
            color: '#F5F5F5',  
            marginBottom: '24px'  
          }}>  
            📦 Existing Products ({products.length})  
          </h2>  
  
          {loadingProducts ? (  
            <div style={{  
              textAlign: 'center',  
              padding: '40px',  
              background: '#0F0F0F',  
              borderRadius: '24px',  
              border: '1px solid #242424'  
            }}>  
              <p style={{ color: '#B6B9BF' }}>Loading products...</p>  
            </div>  
          ) : products.length === 0 ? (  
            <div style={{  
              textAlign: 'center',  
              padding: '40px',  
              background: '#0F0F0F',  
              borderRadius: '24px',  
              border: '1px solid #242424'  
            }}>  
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🛍️</div>  
              <p style={{ color: '#B6B9BF' }}>There are no products yet.</p>  
            </div>  
          ) : (  
            <div style={{  
              display: 'grid',  
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',  
              gap: '24px'  
            }}>  
              {products.map(product => (  
                <div  
                  key={product.id}  
                  style={{  
                    background: '#0F0F0F',  
                    borderRadius: '24px',  
                    border: '1px solid #242424',  
                    padding: '20px',  
                    position: 'relative',  
                    transition: 'all 0.2s'  
                  }}  
                  onMouseEnter={(e) => {  
                    e.currentTarget.style.borderColor = 'rgba(164, 203, 62, 0.3)';  
                  }}  
                  onMouseLeave={(e) => {  
                    e.currentTarget.style.borderColor = '#242424';  
                  }}  
                >  
                  {/* Botones de acción */}  
                  <div style={{  
                    position: 'absolute',  
                    top: '12px',  
                    right: '12px',  
                    display: 'flex',  
                    gap: '8px'  
                  }}>  
                    <button  
                      onClick={() => handleEditProduct(product)}  
                      style={{  
                        background: '#A4CB3E',  
                        border: 'none',  
                        borderRadius: '8px',  
                        padding: '8px 12px',  
                        color: '#0B0B0B',  
                        fontSize: '12px',  
                        fontWeight: '600',  
                        cursor: 'pointer',  
                        transition: 'all 0.2s'  
                      }}  
                      onMouseEnter={(e) => e.currentTarget.style.background = '#8FB82E'}  
                      onMouseLeave={(e) => e.currentTarget.style.background = '#A4CB3E'}  
                    >  
                      ✏️ Edit  
                    </button>  
                    <button  
                      onClick={() => handleDeleteProduct(product.id)}  
                      style={{  
                        background: '#FF60A8',  
                        border: 'none',  
                        borderRadius: '8px',  
                        padding: '8px 12px',  
                        color: '#0B0B0B',  
                        fontSize: '12px',  
                        fontWeight: '600',  
                        cursor: 'pointer',  
                        transition: 'all 0.2s'  
                      }}  
                      onMouseEnter={(e) => e.currentTarget.style.background = '#FF4090'}  
                      onMouseLeave={(e) => e.currentTarget.style.background = '#FF60A8'}  
                    >  
                      🗑️ Delete  
                    </button>  
                  </div>  
  
                  {/* Imagen del producto */}  
                  {product.imageBase64 && (  
                    <div style={{  
                      width: '100%',  
                      height: '200px',  
                      borderRadius: '12px',  
                      overflow: 'hidden',  
                      marginBottom: '16px',  
                      background: `url(${product.imageBase64}) center/cover no-repeat`  
                    }} />  
                  )}  
  
                  {/* Información del producto */}  
                  <h3 style={{  
                    fontSize: '18px',  
                    fontWeight: 'bold',  
                    color: '#F5F5F5',  
                    marginBottom: '8px'  
                  }}>  
                    {product.name}  
                  </h3>  
  
                  <div style={{  
                    display: 'flex',  
                    justifyContent: 'space-between',  
                    alignItems: 'center',  
                    marginBottom: '12px'  
                  }}>  
                    <span style={{  
                      fontSize: '14px',  
                      color: '#B6B9BF'  
                    }}>  
                      {product.label}  
                    </span>  
                    <span style={{  
                      fontSize: '16px',  
                      fontWeight: 'bold',  
                      color: '#A4CB3E'  
                    }}>  
                      €{product.price.toFixed(2)}  
                    </span>  
                  </div>  
  
                  <a  
                    href={product.link}  
                    target="_blank"  
                    rel="noopener noreferrer"  
                    style={{  
                      display: 'inline-block',  
                      fontSize: '12px',  
                      color: '#A4CB3E',  
                      textDecoration: 'none',  
                      wordBreak: 'break-all'  
                    }}  
                  >  
                    🔗 {product.link}  
                  </a>  
                </div>  
              ))}  
            </div>  
          )}  
        </div>  
      </div>  
    </main>  
  );  
}  
  
export default function ProtectedGrowSlowlyShopPage() {  
  return (  
    <ProtectedRoute>  
      <GrowSlowlyShopPage />  
    </ProtectedRoute>  
  );  
}