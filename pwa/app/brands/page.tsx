// app/brands/page.tsx  
'use client';  
  
import { useState, useEffect } from 'react';  
import { useRouter } from 'next/navigation';  
import { useForm } from 'react-hook-form';  
import { z } from 'zod';  
import { zodResolver } from '@hookform/resolvers/zod';  
import { addBrand, listBrands, deleteBrand, updateBrand } from '@/src/lib/firestore';  
import { auth } from '@/src/lib/firebase';  
import ProtectedRoute from '@/src/components/ProtectedRoute';  
import imageCompression from 'browser-image-compression';
  
const brandSchema = z.object({  
  name: z.string().min(2, 'Brand name must be at least 2 characters'),  
  description: z.string().min(10, 'Description must be at least 10 characters'),  
  discount: z.string().optional(),  
  link: z.string().url('Must be a valid URL'),  
  imageBase64: z.string().min(1, 'Image required')  
});  
  
type BrandFormValues = z.infer<typeof brandSchema>;  
  
function BrandsPage() {  
  const [loading, setLoading] = useState(false);  
  const [error, setError] = useState('');  
  const [success, setSuccess] = useState(false);  
  const [brands, setBrands] = useState<any[]>([]);  
  const [loadingBrands, setLoadingBrands] = useState(true);  
  const [editingBrandId, setEditingBrandId] = useState<string | null>(null);  
  const router = useRouter();  
  
  const { register, handleSubmit, formState, setValue, watch, reset } = useForm<BrandFormValues>({  
    resolver: zodResolver(brandSchema),  
    defaultValues: {  
      name: '',  
      description: '',  
      discount: '',  
      link: '',  
      imageBase64: ''  
    }  
  });  
  
  const imageBase64 = watch('imageBase64');  
  
  useEffect(() => {  
    loadAllBrands();  
  }, []);  
  
  async function loadAllBrands() {  
    try {  
      const data = await listBrands(50);  
      setBrands(data);  
    } catch (error) {  
      console.error('Error loading brands:', error);  
    } finally {  
      setLoadingBrands(false);  
    }  
  }  
  
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {  
    const file = e.target.files?.[0];  
    if (!file) return;  
      
    try {  
      setError('Compressing image...');  
        
      const options = {  
        maxSizeMB: 0.4,  
        maxWidthOrHeight: 600,  
        useWebWorker: true,  
        fileType: 'image/jpeg',  
        initialinitialQuality: 0.7  
      };  
        
      const compressedFile = await imageCompression(file, options);  
        
      console.log(`Original: ${(file.size / 1024).toFixed(2)}KB`);  
      console.log(`Compressed: ${(compressedFile.size / 1024).toFixed(2)}KB`);  
        
      const reader = new FileReader();  
      reader.onloadend = () => {  
        const base64String = reader.result as string;  
        const sizeInBytes = base64String.length;  
          
        if (sizeInBytes > 900000) {  
          setError('Image is still too large after compression. Try a smaller image.');  
          return;  
        }  
          
        setValue('imageBase64', base64String);  
        setError('');  
      };  
      reader.readAsDataURL(compressedFile);  
        
    } catch (error) {  
      console.error('Image compression error:', error);  
      setError('Error processing image. Please try another image.');  
    }  
  };  
  
  const handleEditBrand = (brand: any) => {  
    setEditingBrandId(brand.id);  
    setValue('name', brand.name);  
    setValue('description', brand.description);  
    setValue('discount', brand.discount || '');  
    setValue('link', brand.link);  
    setValue('imageBase64', brand.imageBase64);  
    window.scrollTo({ top: 0, behavior: 'smooth' });  
  };  
  
  const handleCancelEdit = () => {  
    setEditingBrandId(null);  
    reset();  
    setError('');  
  };  
  
  const handleDeleteBrand = async (brandId: string) => {  
    if (!confirm('Are you sure you want to remove this brand?')) {  
      return;  
    }  
  
    try {  
      await deleteBrand(brandId);  
      setBrands(brands.filter(b => b.id !== brandId));  
      alert('✅ Brand removed');  
    } catch (error) {  
      console.error('Error deleting brand:', error);  
      alert('Error deleting brand');  
    }  
  };  
  
  const onSubmit = handleSubmit(async (values) => {  
    setError('');  
    setLoading(true);  
    setSuccess(false);  
  
    try {  
      const uid = auth.currentUser?.uid || 'anon';  
        
      if (editingBrandId) {  
        await updateBrand(editingBrandId, {  
          name: values.name,  
          description: values.description,  
          discount: values.discount,  
          link: values.link,  
          imageBase64: values.imageBase64  
        });  
          
        setBrands(brands.map(b =>   
          b.id === editingBrandId   
            ? { ...b, ...values }   
            : b  
        ));  
          
        setSuccess(true);  
        setEditingBrandId(null);  
        reset();  
      } else {  
        await addBrand({  
          name: values.name,  
          description: values.description,  
          discount: values.discount,  
          link: values.link,  
          imageBase64: values.imageBase64,  
          createdBy: uid  
        });  
          
        setSuccess(true);  
        reset();  
        await loadAllBrands();  
      }  
        
      setTimeout(() => {  
        setSuccess(false);  
      }, 2000);  
    } catch (err: any) {  
      setError(err.message || 'Error saving brand');  
    } finally {  
      setLoading(false);  
    }  
  });  
  
  return (  
    <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>  
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
            {editingBrandId ? '✏️ Edit Brand' : '➕ Create New Brand'}  
          </h2>  
          {editingBrandId && (  
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
              Cancel  
            </button>  
          )}  
        </div>  
  
        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>  
            
          {/* Brand Name */}  
          <div>  
            <label style={{  
              display: 'block',  
              fontSize: '14px',  
              fontWeight: '600',  
              marginBottom: '8px',  
              color: '#F5F5F5'  
            }}>  
              Brand Name *  
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
              placeholder="e.g., Brand Name"  
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
  
          {/* Description */}  
          <div>  
            <label style={{  
              display: 'block',  
              fontSize: '14px',  
              fontWeight: '600',  
              marginBottom: '8px',  
              color: '#F5F5F5'  
            }}>  
              Description *  
            </label>  
            <textarea  
              {...register('description')}  
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
              placeholder="Describe the brand and what makes it special..."  
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
  
          {/* Discount (Optional) */}  
          <div>  
            <label style={{  
              display: 'block',  
              fontSize: '14px',  
              fontWeight: '600',  
              marginBottom: '8px',  
              color: '#F5F5F5'  
            }}>  
              Discount (Optional)  
            </label>  
            <input  
              {...register('discount')}  
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
              placeholder="e.g., 20% OFF or Special Offer"  
              onFocus={(e) => e.currentTarget.style.borderColor = '#A4CB3E'}  
              onBlur={(e) => e.currentTarget.style.borderColor = '#2A2A2A'}  
            />  
            {formState.errors.discount && (  
              <p style={{  
                color: '#FF60A8',  
                fontSize: '12px',  
                marginTop: '4px'  
              }}>  
                {formState.errors.discount.message}  
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
              More Info Link *  
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
              placeholder="https://brand-website.com"  
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
  
          {/* Image */}  
          <div>  
            <label style={{  
              display: 'block',  
              fontSize: '14px',  
              fontWeight: '600',  
              marginBottom: '8px',  
              color: '#F5F5F5'  
            }}>  
              Brand Image * (max 1MB)  
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
                
            {/* Image Preview */}  
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
            {loading ? (editingBrandId ? 'Updating...' : 'Creating...') : (editingBrandId ? 'Update Brand' : 'Create Brand')}  
          </button>  
        </form>  
      </div>  
  
      {/* Success Message */}  
      {success && (  
        <div style={{  
          background: 'rgba(164, 203, 62, 0.1)',  
          border: '1px solid #A4CB3E',  
          borderRadius: '12px',  
          padding: '16px',  
          marginBottom: '24px',  
          textAlign: 'center',  
          color: '#A4CB3E'  
        }}>  
          ✅ {editingBrandId ? 'Brand updated successfully!' : 'Brand created successfully!'}  
        </div>  
      )}  
  
      {/* Error Message */}  
      {error && (  
        <div style={{  
          background: 'rgba(255, 96, 168, 0.1)',  
          border: '1px solid #FF60A8',  
          borderRadius: '12px',  
          padding: '16px',  
          marginBottom: '24px',  
          textAlign: 'center',  
          color: '#FF60A8'  
        }}>  
          ❌ {error}  
        </div>  
      )}  
  
      {/* Brands List */}  
      <div style={{  
        background: '#0F0F0F',  
        borderRadius: '24px',  
        border: '1px solid #242424',  
        padding: '40px'  
      }}>  
        <h2 style={{  
          fontSize: '24px',  
          fontWeight: 'bold',  
          marginBottom: '24px',  
          color: '#F5F5F5'  
        }}>  
          🏷️ Existing Brands ({brands.length})  
        </h2>  
                {loadingBrands ? (  
          <div style={{  
            textAlign: 'center',  
            padding: '40px',  
            background: '#0F0F0F',  
            borderRadius: '24px',  
            border: '1px solid #242424'  
          }}>  
            <p style={{ color: '#B6B9BF' }}>Loading brands...</p>  
          </div>  
        ) : brands.length === 0 ? (  
          <div style={{  
            textAlign: 'center',  
            padding: '40px',  
            background: '#0F0F0F',  
            borderRadius: '24px',  
            border: '1px solid #242424'  
          }}>  
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏷️</div>  
            <p style={{ color: '#B6B9BF' }}>No brands yet.</p>  
          </div>  
        ) : (  
          <div style={{  
            display: 'grid',  
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',  
            gap: '24px'  
          }}>  
            {brands.map(brand => (  
              <div  
                key={brand.id}  
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
                {/* Action Buttons */}  
                <div style={{  
                  position: 'absolute',  
                  top: '12px',  
                  right: '12px',  
                  display: 'flex',  
                  gap: '8px'  
                }}>  
                  <button  
                    onClick={() => handleEditBrand(brand)}  
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
                    onClick={() => handleDeleteBrand(brand.id)}  
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
  
                {/* Brand Image */}  
                {brand.imageBase64 && (  
                  <div style={{  
                    width: '100%',  
                    height: '200px',  
                    borderRadius: '12px',  
                    overflow: 'hidden',  
                    marginBottom: '16px',  
                    background: `url(${brand.imageBase64}) center/cover no-repeat`  
                  }} />  
                )}  
  
                {/* Brand Info */}  
                <h3 style={{  
                  fontSize: '18px',  
                  fontWeight: 'bold',  
                  color: '#F5F5F5',  
                  marginBottom: '8px',  
                  paddingRight: '120px'  
                }}>  
                  {brand.name}  
                </h3>  
  
                <p style={{  
                  fontSize: '14px',  
                  color: '#B6B9BF',  
                  lineHeight: '1.5',  
                  marginBottom: '12px'  
                }}>  
                  {brand.description}  
                </p>  
  
                {brand.discount && (  
                  <div style={{  
                    background: 'rgba(164, 203, 62, 0.1)',  
                    border: '1px solid #A4CB3E',  
                    borderRadius: '8px',  
                    padding: '8px 12px',  
                    marginBottom: '12px'  
                  }}>  
                    <span style={{  
                      fontSize: '14px',  
                      color: '#A4CB3E',  
                      fontWeight: '600'  
                    }}>  
                      🎁 {brand.discount}  
                    </span>  
                  </div>  
                )}  
  
                <a  
                  href={brand.link}  
                  target="_blank"  
                  rel="noopener noreferrer"  
                  style={{  
                    display: 'inline-block',  
                    padding: '8px 16px',  
                    background: '#A4CB3E',  
                    color: '#0B0B0B',  
                    borderRadius: '9999px',  
                    textDecoration: 'none',  
                    fontSize: '14px',  
                    fontWeight: '600',  
                    transition: 'all 0.2s'  
                  }}  
                  onMouseEnter={(e) => {  
                    e.currentTarget.style.background = '#8FB82E';  
                  }}  
                  onMouseLeave={(e) => {  
                    e.currentTarget.style.background = '#A4CB3E';  
                  }}  
                >  
                  Visit Website →  
                </a>  
              </div>  
            ))}  
          </div>  
        )}  
      </div>  
    </main>  
  );  
}  
  
export default function ProtectedBrandsPage() {  
  return (  
    <ProtectedRoute>  
      <BrandsPage />  
    </ProtectedRoute>  
  );  
}