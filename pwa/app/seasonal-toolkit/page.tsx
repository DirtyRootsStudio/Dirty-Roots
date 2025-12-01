// pwa/app/seasonal-toolkit/page.tsx  
'use client';  
  
import { useState, useEffect } from 'react';  
import { useRouter } from 'next/navigation';  
import { useForm } from 'react-hook-form';  
import { z } from 'zod';  
import { zodResolver } from '@hookform/resolvers/zod';  
import {   
  addSeasonalToolkit,   
  listSeasonalToolkits,   
  deleteSeasonalToolkit,   
  updateSeasonalToolkit,
  SeasonalToolkit   
} from '@/src/lib/firestore';  
import { auth } from '@/src/lib/firebase';  
import ProtectedRoute from '@/src/components/ProtectedRoute';  
import { Timestamp } from 'firebase/firestore';  
  
// Schema de validación SIN lightMapImageUrl ni lightMapPdf  
const toolkitSchema = z.object({  
  season: z.enum(['winter', 'spring', 'summer', 'autumn']),  
  title: z.string().min(2, 'Title must be at least 2 characters'),  
  description: z.string().min(10, 'Description must be at least 10 characters'),  
  calmReminder: z.string().min(5, 'Calm reminder is required'),  
  checklist: z.string().min(10, 'Checklist items required (one per line)'),  
  lightMapDescription: z.string().min(10, 'Light map description required'),  
  microGuide: z.string().min(20, 'Micro-guide must be at least 20 characters'),  
  checklistPdf: z.string().url().optional().or(z.literal('')),  
  posterPdf: z.string().url().optional().or(z.literal('')),  
  guidePdf: z.string().url().optional().or(z.literal('')),  
  activeFromDate: z.string().min(1, 'Start date required'),  
  activeToDate: z.string().min(1, 'End date required')  
});  
  
type ToolkitFormValues = z.infer<typeof toolkitSchema>;  
  
function SeasonalToolkitPage() {  
  const [loading, setLoading] = useState(false);    
  const [error, setError] = useState('');    
  const [success, setSuccess] = useState(false);    
  const [toolkits, setToolkits] = useState<SeasonalToolkit[]>([]);    
  const [loadingToolkits, setLoadingToolkits] = useState(true);    
  const [editingToolkitId, setEditingToolkitId] = useState<string | null>(null);    
  const router = useRouter(); ;  
  
  const { register, handleSubmit, formState, setValue, reset } = useForm<ToolkitFormValues>({  
    resolver: zodResolver(toolkitSchema),  
    defaultValues: {  
      season: 'winter',  
      title: '',  
      description: '',  
      calmReminder: '',  
      checklist: '',  
      lightMapDescription: '',  
      microGuide: '',  
      checklistPdf: '',  
      posterPdf: '',  
      guidePdf: '',  
      activeFromDate: '',  
      activeToDate: ''  
    }  
  });  
  
  useEffect(() => {  
    loadAllToolkits();  
  }, []);  
  
  async function loadAllToolkits() {  
    try {  
      const data = await listSeasonalToolkits(50);  
      setToolkits(data);  
    } catch (error) {  
      console.error('Error loading toolkits:', error);  
    } finally {  
      setLoadingToolkits(false);  
    }  
  }  
  
  const handleEditToolkit = (toolkit: SeasonalToolkit) => {  
    setEditingToolkitId(toolkit.id || null);  
    setValue('season', toolkit.season);  
    setValue('title', toolkit.title);  
    setValue('description', toolkit.description);  
    setValue('calmReminder', toolkit.calmReminder);  
    setValue('checklist', toolkit.checklist.join('\n'));  
    setValue('lightMapDescription', toolkit.lightMap.description);  
    setValue('microGuide', toolkit.microGuide);  
    setValue('checklistPdf', toolkit.downloadables?.checklistPdf || '');  
    setValue('posterPdf', toolkit.downloadables?.posterPdf || '');  
    setValue('guidePdf', toolkit.downloadables?.guidePdf || '');  
    setValue('activeFromDate', toolkit.activeFrom.toDate().toISOString().split('T')[0]);  
    setValue('activeToDate', toolkit.activeTo.toDate().toISOString().split('T')[0]);  
    window.scrollTo({ top: 0, behavior: 'smooth' });  
  };  
  
  const handleCancelEdit = () => {  
    setEditingToolkitId(null);  
    reset();  
    setError('');  
  };  
  
  const handleDeleteToolkit = async (toolkitId: string) => {  
    if (!confirm('Are you sure you want to delete this toolkit?')) {  
      return;  
    }  
  
    try {  
      await deleteSeasonalToolkit(toolkitId);  
      setToolkits(toolkits.filter(t => t.id !== toolkitId));  
      alert('✅ Toolkit deleted');  
    } catch (error) {  
      console.error('Error deleting toolkit:', error);  
      alert('Error deleting toolkit');  
    }  
  };  
  
  const onSubmit = handleSubmit(async (values) => {  
    setError('');  
    setLoading(true);  
    setSuccess(false);  
  
    try {  
      const uid = auth.currentUser?.uid || 'anon';  
        
      // Construir downloadables solo con campos que tienen valor  
      const downloadables: Record<string, string> = {};  
      if (values.checklistPdf) downloadables.checklistPdf = values.checklistPdf;  
      if (values.posterPdf) downloadables.posterPdf = values.posterPdf;  
      if (values.guidePdf) downloadables.guidePdf = values.guidePdf;  
        
      const toolkitData = {  
        season: values.season,  
        title: values.title,  
        description: values.description,  
        calmReminder: values.calmReminder,  
        checklist: values.checklist.split('\n').filter(line => line.trim()),  
        lightMap: {  
          description: values.lightMapDescription  
          // NO incluir imageUrl - el mapa es interactivo  
        },  
        microGuide: values.microGuide,  
        downloadables: downloadables, // Solo campos con valor  
        activeFrom: Timestamp.fromDate(new Date(values.activeFromDate)),  
        activeTo: Timestamp.fromDate(new Date(values.activeToDate)),  
        createdBy: uid  
      };  
  
      if (editingToolkitId) {  
        await updateSeasonalToolkit(editingToolkitId, toolkitData);  
        setToolkits(toolkits.map(t =>   
          t.id === editingToolkitId   
            ? { ...t, ...toolkitData }  
            : t  
        ));  
        setSuccess(true);  
        setEditingToolkitId(null);  
        reset();  
      } else {  
        await addSeasonalToolkit(toolkitData);  
        setSuccess(true);  
        reset();  
        await loadAllToolkits();  
      }  
        
      setTimeout(() => {  
        setSuccess(false);  
      }, 2000);  
    } catch (err: unknown) {  
      const errorMessage = err instanceof Error ? err.message : 'Error saving toolkit';  
      setError(errorMessage);  
    } finally {  
      setLoading(false);  
    }  
  });  
  
  const seasonEmojis = {  
    winter: '❄️',  
    spring: '🌱',  
    summer: '☀️',  
    autumn: '🍂'  
  };  
  
  if (loadingToolkits) {  
    return (  
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0B0B0B' }}>  
        <div style={{ textAlign: 'center' }}>  
          <div style={{ display: 'inline-block', width: '48px', height: '48px', border: '4px solid #A4CB3E', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '16px' }}></div>  
          <p style={{ color: '#B6B9BF', fontSize: '18px' }}>Loading toolkits...</p>  
        </div>  
      </div>  
    );  
  }  
  
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
            🌿 LITFA Seasonal Toolkit  
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
              ✅ {editingToolkitId ? 'Toolkit updated' : 'Toolkit created'} successfully  
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
          padding: '32px',  
          marginBottom: '32px'  
        }}>  
          <h2 style={{ color: '#F5F5F5', fontSize: '24px', marginBottom: '24px' }}>  
            {editingToolkitId ? 'Edit Toolkit' : 'Create New Toolkit'}  
          </h2>  
  
          <form onSubmit={onSubmit}>  
            {/* Season Selection */}  
            <div style={{ marginBottom: '24px' }}>  
              <label style={{ display: 'block', color: '#B6B9BF', fontSize: '14px', marginBottom: '8px' }}>  
                Season *  
              </label>  
              <select  
                {...register('season')}  
                style={{  
                  width: '100%',  
                  padding: '12px',  
                  background: '#0B0B0B',  
                  border: '1px solid #2A2A2A',  
                  borderRadius: '12px',  
                  color: '#F5F5F5',  
                  fontSize: '14px'  
                }}  
              >  
                <option value="winter">❄️ Winter</option>  
                <option value="spring">🌱 Spring</option>  
                <option value="summer">☀️ Summer</option>  
                <option value="autumn">🍂 Autumn</option>  
              </select>  
              {formState.errors.season && (  
                <p style={{ color: '#FF60A8', fontSize: '12px', marginTop: '4px' }}>  
                  {formState.errors.season.message}  
                </p>  
              )}  
            </div>  
  
            {/* Title */}  
            <div style={{ marginBottom: '24px' }}>  
              <label style={{ display: 'block', color: '#B6B9BF', fontSize: '14px', marginBottom: '8px' }}>  
                Title * (e.g., &quot;Winter Calm Kit&quot;)
              </label>  
              <input  
                {...register('title')}  
                type="text"  
                placeholder="Winter Calm Kit"  
                style={{  
                  width: '100%',  
                  padding: '12px',  
                  background: '#0B0B0B',  
                  border: '1px solid #2A2A2A',  
                  borderRadius: '12px',  
                  color: '#F5F5F5',  
                  fontSize: '14px'  
                }}  
              />  
              {formState.errors.title && (  
                <p style={{ color: '#FF60A8', fontSize: '12px', marginTop: '4px' }}>  
                  {formState.errors.title.message}  
                </p>  
              )}  
            </div>  
  
            {/* Description */}  
            <div style={{ marginBottom: '24px' }}>  
              <label style={{ display: 'block', color: '#B6B9BF', fontSize: '14px', marginBottom: '8px' }}>  
                Description * (Short summary)  
              </label>  
              <input  
                {...register('description')}  
                type="text"  
                placeholder="Keep the soil dry, rotate once a week, lower expectations."  
                style={{  
                  width: '100%',  
                  padding: '12px',  
                  background: '#0B0B0B',  
                  border: '1px solid #2A2A2A',  
                  borderRadius: '12px',  
                  color: '#F5F5F5',  
                  fontSize: '14px'  
                }}  
              />  
              {formState.errors.description && (  
                <p style={{ color: '#FF60A8', fontSize: '12px', marginTop: '4px' }}>  
                  {formState.errors.description.message}  
                </p>  
              )}  
            </div>  
  
            {/* Calm Reminder */}  
            <div style={{ marginBottom: '24px' }}>  
              <label style={{ display: 'block', color: '#B6B9BF', fontSize: '14px', marginBottom: '8px' }}>  
                Calm Reminder * (LITFA philosophy phrase)  
              </label>  
              <input  
                {...register('calmReminder')}  
                type="text"  
                placeholder="Nothing grows fast. Neither should you."  
                style={{  
                  width: '100%',  
                  padding: '12px',  
                  background: '#0B0B0B',  
                  border: '1px solid #2A2A2A',  
                  borderRadius: '12px',  
                  color: '#F5F5F5',  
                  fontSize: '14px'  
                }}  
              />  
              {formState.errors.calmReminder && (  
                <p style={{ color: '#FF60A8', fontSize: '12px', marginTop: '4px' }}>  
                  {formState.errors.calmReminder.message}  
                </p>  
              )}  
            </div>  
  
            {/* Checklist */}  
            <div style={{ marginBottom: '24px' }}>  
              <label style={{ display: 'block', color: '#B6B9BF', fontSize: '14px', marginBottom: '8px' }}>  
                Checklist * (one item per line)  
              </label>  
              <textarea  
                {...register('checklist')}  
                rows={6}  
                placeholder="Touch soil only once every 10–14 days.&#10;Rotate plants weekly, gently.&#10;Dust leaves (once).&#10;Lower expectations. Growth is sleeping."  
                style={{  
                  width: '100%',  
                  padding: '12px',  
                  background: '#0B0B0B',  
                  border: '1px solid #2A2A2A',  
                  borderRadius: '12px',  
                  color: '#F5F5F5',  
                  fontSize: '14px',  
                  fontFamily: 'inherit',  
                  resize: 'vertical'  
                }}  
              />  
              {formState.errors.checklist && (  
                <p style={{ color: '#FF60A8', fontSize: '12px', marginTop: '4px' }}>  
                  {formState.errors.checklist.message}  
                </p>  
              )}  
            </div>  
  
            {/* Light Map Description */}  
            <div style={{ marginBottom: '24px' }}>  
              <label style={{ display: 'block', color: '#B6B9BF', fontSize: '14px', marginBottom: '8px' }}>  
                Light Map Description * (Shown below interactive map)  
              </label>  
              <textarea  
                {...register('lightMapDescription')}  
                rows={4}  
                placeholder="In winter, your south window is now… mediocre. Move the anxious ones closer. Ignore the drama queens."  
                style={{  
                  width: '100%',  
                  padding: '12px',  
                  background: '#0B0B0B',  
                  border: '1px solid #2A2A2A',  
                  borderRadius: '12px',  
                  color: '#F5F5F5',  
                  fontSize: '14px',  
                  fontFamily: 'inherit',  
                  resize: 'vertical'  
                }}  
              />  
              {formState.errors.lightMapDescription && (  
                <p style={{ color: '#FF60A8', fontSize: '12px', marginTop: '4px' }}>  
                  {formState.errors.lightMapDescription.message}  
                </p>  
              )}  
            </div>  
  
            {/* Micro Guide */}  
            <div style={{ marginBottom: '24px' }}>  
              <label style={{ display: 'block', color: '#B6B9BF', fontSize: '14px', marginBottom: '8px' }}>  
                Micro-Guide * (Care instructions)  
              </label>  
              <textarea  
                {...register('microGuide')}  
                rows={6}  
                placeholder="Winter soil dries slowly. Don't confuse cold with thirst. Most plants prefer you to wait. Give more light, less water, and 20% more observation."  
                style={{  
                  width: '100%',  
                  padding: '12px',  
                  background: '#0B0B0B',  
                  border: '1px solid #2A2A2A',  
                  borderRadius: '12px',  
                  color: '#F5F5F5',  
                  fontSize: '14px',  
                  fontFamily: 'inherit',  
                  resize: 'vertical'  
                }}  
              />  
              {formState.errors.microGuide && (  
                <p style={{ color: '#FF60A8', fontSize: '12px', marginTop: '4px' }}>  
                  {formState.errors.microGuide.message}  
                </p>  
              )}  
            </div>  
  
            {/* Downloadables Section */}  
            <div style={{  
              padding: '24px',  
              background: '#0B0B0B',  
              borderRadius: '16px',  
              border: '1px solid #2A2A2A',  
              marginBottom: '24px'  
            }}>  
              <h3 style={{  
                fontSize: '18px',  
                fontWeight: 'bold',  
                color: '#F5F5F5',  
                marginBottom: '16px'  
              }}>  
                📥 Downloadable PDFs (Optional)  
              </h3>  
  
              {/* Checklist PDF */}  
              <div style={{ marginBottom: '16px' }}>  
                <label style={{ display: 'block', color: '#B6B9BF', fontSize: '14px', marginBottom: '8px' }}>  
                  Checklist PDF URL  
                </label>  
                <input  
                  {...register('checklistPdf')}  
                  type="url"  
                  placeholder="https://example.com/winter-checklist.pdf"  
                  style={{  
                    width: '100%',  
                    padding: '12px',  
                    background: '#0F0F0F',  
                    border: '1px solid #2A2A2A',  
                    borderRadius: '12px',  
                    color: '#F5F5F5',  
                    fontSize: '14px'  
                  }}  
                />  
                {formState.errors.checklistPdf && (  
                  <p style={{ color: '#FF60A8', fontSize: '12px', marginTop: '4px' }}>  
                    {formState.errors.checklistPdf.message}  
                  </p>  
                )}  
              </div>  
  
              {/* Poster PDF */}  
              <div style={{ marginBottom: '16px' }}>  
                <label style={{ display: 'block', color: '#B6B9BF', fontSize: '14px', marginBottom: '8px' }}>  
                  Poster PDF URL  
                </label>  
                <input  
                  {...register('posterPdf')}  
                  type="url"  
                  placeholder="https://example.com/winter-poster.pdf"  
                  style={{  
                    width: '100%',  
                    padding: '12px',  
                    background: '#0F0F0F',  
                    border: '1px solid #2A2A2A',  
                    borderRadius: '12px',  
                    color: '#F5F5F5',  
                    fontSize: '14px'  
                  }}  
                />  
                {formState.errors.posterPdf && (  
                  <p style={{ color: '#FF60A8', fontSize: '12px', marginTop: '4px' }}>  
                    {formState.errors.posterPdf.message}  
                  </p>  
                )}  
              </div>  
  
              {/* Guide PDF */}  
              <div>  
                <label style={{ display: 'block', color: '#B6B9BF', fontSize: '14px', marginBottom: '8px' }}>  
                  Guide PDF URL  
                </label>  
                <input  
                  {...register('guidePdf')}  
                  type="url"  
                  placeholder="https://example.com/winter-guide.pdf"  
                  style={{  
                    width: '100%',  
                    padding: '12px',  
                    background: '#0F0F0F',  
                    border: '1px solid #2A2A2A',  
                    borderRadius: '12px',  
                    color: '#F5F5F5',  
                    fontSize: '14px'  
                  }}  
                />  
                {formState.errors.guidePdf && (  
                  <p style={{ color: '#FF60A8', fontSize: '12px', marginTop: '4px' }}>  
                    {formState.errors.guidePdf.message}  
                  </p>  
                )}  
              </div>  
            </div>  
  
            {/* Active Period */}  
            <div style={{  
              display: 'grid',  
              gridTemplateColumns: '1fr 1fr',  
              gap: '16px',  
              marginBottom: '24px'  
            }}>  
              <div>  
                <label style={{ display: 'block', color: '#B6B9BF', fontSize: '14px', marginBottom: '8px' }}>  
                  Active From Date *  
                </label>  
                <input  
                  {...register('activeFromDate')}  
                  type="date"  
                  style={{  
                    width: '100%',  
                    padding: '12px',  
                    background: '#0B0B0B',  
                    border: '1px solid #2A2A2A',  
                    borderRadius: '12px',  
                    color: '#F5F5F5',  
                    fontSize: '14px'  
                  }}  
                />  
                {formState.errors.activeFromDate && (  
                  <p style={{ color: '#FF60A8', fontSize: '12px', marginTop: '4px' }}>  
                    {formState.errors.activeFromDate.message}  
                  </p>  
                )}  
              </div>  
  
              <div>  
                <label style={{ display: 'block', color: '#B6B9BF', fontSize: '14px', marginBottom: '8px' }}>  
                  Active To Date *  
                </label>  
                <input  
                  {...register('activeToDate')}  
                  type="date"  
                  style={{  
                    width: '100%',  
                    padding: '12px',  
                    background: '#0B0B0B',  
                    border: '1px solid #2A2A2A',  
                    borderRadius: '12px',  
                    color: '#F5F5F5',  
                    fontSize: '14px'  
                  }}  
                />  
                {formState.errors.activeToDate && (  
                  <p style={{ color: '#FF60A8', fontSize: '12px', marginTop: '4px' }}>  
                    {formState.errors.activeToDate.message}  
                  </p>  
                )}  
              </div>  
            </div>  
  
            {/* Submit Buttons */}  
            <div style={{  
              display: 'flex',  
              gap: '12px',  
              justifyContent: 'flex-end'  
            }}>  
              {editingToolkitId && (  
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
                  Cancel  
                </button>  
              )}  
              <button  
                type="submit"  
                disabled={loading}  
                style={{  
                  padding: '12px 24px',  
                  background: loading ? '#2A2A2A' : '#A4CB3E',  
                  border: 'none',  
                  borderRadius: '12px',  
                  color: '#0B0B0B',  
                  fontSize: '14px',  
                  fontWeight: '600',  
                  cursor: loading ? 'not-allowed' : 'pointer',  
                  transition: 'all 0.2s'  
                }}  
                onMouseEnter={(e) => {  
                  if (!loading) e.currentTarget.style.background = '#8FB32E';  
                }}  
                onMouseLeave={(e) => {  
                  if (!loading) e.currentTarget.style.background = '#A4CB3E';  
                }}  
              >  
                {loading ? 'Saving...' : editingToolkitId ? 'Update Toolkit' : 'Create Toolkit'}  
              </button>  
            </div>  
          </form>  
        </div>  
  
        {/* Existing Toolkits List */}  
        <div style={{  
          background: '#0F0F0F',  
          borderRadius: '24px',  
          border: '1px solid #242424',  
          padding: '32px'  
        }}>  
          <h2 style={{ color: '#F5F5F5', fontSize: '24px', marginBottom: '24px' }}>  
            Existing Toolkits ({toolkits.length})  
          </h2>  
  
          {toolkits.length === 0 ? (  
            <p style={{ color: '#B6B9BF', textAlign: 'center', padding: '40px 0' }}>  
              No toolkits created yet. Create your first one above!  
            </p>  
          ) : (  
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>  
              {toolkits.map((toolkit) => (  
                <div  
                  key={toolkit.id}  
                  style={{  
                    background: '#0B0B0B',  
                    borderRadius: '16px',  
                    border: '1px solid #2A2A2A',  
                    padding: '24px',  
                    position: 'relative'  
                  }}  
                >  
                  {/* Season Badge */}  
                  <div style={{  
                    position: 'absolute',  
                    top: '16px',  
                    right: '16px',  
                    padding: '6px 12px',  
                    background: '#1F1F1F',  
                    borderRadius: '9999px',  
                    fontSize: '14px',  
                    color: '#F5F5F5',  
                    fontWeight: '600',  
                    display: 'flex',  
                    alignItems: 'center',  
                    gap: '6px'  
                  }}>  
                    {seasonEmojis[toolkit.season as keyof typeof seasonEmojis]} {toolkit.season.charAt(0).toUpperCase() + toolkit.season.slice(1)}  
                  </div>  
  
                  {/* Title */}  
                  <h3 style={{  
                    fontSize: '20px',  
                    fontWeight: 'bold',  
                    color: '#F5F5F5',  
                    marginBottom: '8px',  
                    paddingRight: '120px'  
                  }}>  
                    {toolkit.title}  
                  </h3>  
  
                  {/* Description */}  
                  <p style={{  
                    fontSize: '14px',  
                    color: '#B6B9BF',  
                    marginBottom: '16px',  
                    lineHeight: '1.5'  
                  }}>  
                    {toolkit.description}  
                  </p>  
  
                  {/* Calm Reminder */}  
                  <div style={{  
                    padding: '12px 16px',  
                    background: '#0F0F0F',  
                    borderRadius: '12px',  
                    border: '1px solid #2A2A2A',  
                    marginBottom: '16px'  
                  }}>  
                    <p style={{  
                      fontSize: '14px',  
                      color: '#A4CB3E',  
                      fontStyle: 'italic',  
                      margin: 0  
                    }}>  
                    &quot;{toolkit.calmReminder}&quot;
                                          </p>  
                  </div>  
  
                  {/* Active Period */}  
                  <div style={{  
                    display: 'flex',  
                    gap: '16px',  
                    marginBottom: '16px',  
                    fontSize: '12px',  
                    color: '#757575'  
                  }}>  
                    <span>  
                      📅 Active: {toolkit.activeFrom.toDate().toLocaleDateString()} - {toolkit.activeTo.toDate().toLocaleDateString()}  
                    </span>  
                  </div>  
  
                  {/* Action Buttons */}  
                  <div style={{  
                    display: 'flex',  
                    gap: '8px',  
                    marginTop: '16px'  
                  }}>  
                    <button  
                      onClick={() => handleEditToolkit(toolkit)}  
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
                      ✏️ Edit  
                    </button>  
  
                    <button  
                      onClick={() => handleDeleteToolkit(toolkit.id!)}  
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
                      🗑️ Delete  
                    </button>  
                  </div>  
                </div>  
              ))}  
            </div>  
          )}  
        </div>  
      </div>  
  
      {/* Animations */}  
      <style jsx>{`  
        @keyframes spin {  
          to { transform: rotate(360deg); }  
        }  
      `}</style>  
    </main>  
  );  
}  
  
export default function ProtectedSeasonalToolkitPage() {  
  return (  
    <ProtectedRoute>  
      <SeasonalToolkitPage />  
    </ProtectedRoute>  
  );  
}