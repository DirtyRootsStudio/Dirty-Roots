// src/components/QuestionForm.tsx  
"use client";  
  
import { useForm } from "react-hook-form";  
import { z } from "zod";  
import { zodResolver } from "@hookform/resolvers/zod";  
import { addQuestion } from "@/src/lib/firestore";  
import { ensureAnonAuth, auth } from "@/src/lib/firebase";  
  
const schema = z.object({  
  text: z.string().min(5, "Escribe una pregunta completa"),  
  context: z.string().optional(),  
});  
  
type FormValues = z.infer<typeof schema>;  
  
export default function QuestionForm({ onCreated }: { onCreated?: (id: string) => void }) {  
  const { register, handleSubmit, formState, reset } = useForm<FormValues>({ resolver: zodResolver(schema) });  
  
  const onSubmit = handleSubmit(async (values) => {  
    await ensureAnonAuth();  
    const uid = auth.currentUser?.uid || "anon";  
    const id = await addQuestion({ text: values.text, context: values.context, createdBy: uid });  
    reset();  
    onCreated?.(id);  
  });  
  
  return (  
    <>  
      <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>  
        {/* Campo de pregunta */}  
        <div>  
          <label style={{   
            display: 'block',   
            fontSize: '14px',   
            fontWeight: '600',   
            marginBottom: '8px',   
            color: '#F5F5F5'   
          }}>  
            Pregunta  
          </label>  
          <textarea   
            {...register("text")}   
            rows={3}   
            placeholder="¿Conoces sitios tranquilos en Prenzlauer Berg?"  
            style={{  
              width: '100%',  
              background: '#0B0B0B',  
              border: '1px solid #2A2A2A',  
              borderRadius: '12px',  
              padding: '12px 16px',  
              color: '#F5F5F5',  
              fontSize: '14px',  
              fontFamily: 'inherit',  
              resize: 'vertical',  
              outline: 'none',  
              transition: 'all 0.2s'  
            }}  
            onFocus={(e) => e.currentTarget.style.borderColor = '#A4CB3E'}  
            onBlur={(e) => e.currentTarget.style.borderColor = '#2A2A2A'}  
          />  
          {formState.errors.text && (  
            <p style={{   
              color: '#FF60A8',   
              fontSize: '12px',   
              marginTop: '4px'   
            }}>  
              {formState.errors.text.message}  
            </p>  
          )}  
        </div>  
  
        {/* Campo de contexto */}  
        <div>  
          <label style={{   
            display: 'block',   
            fontSize: '14px',   
            fontWeight: '600',   
            marginBottom: '8px',   
            color: '#F5F5F5'   
          }}>  
            Contexto (opcional)  
          </label>  
          <input   
            {...register("context")}   
            placeholder="Café con terraza, poco ruido"  
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
            onFocus={(e) => e.currentTarget.style.borderColor = '#A4CB3E'}  
            onBlur={(e) => e.currentTarget.style.borderColor = '#2A2A2A'}  
          />  
        </div>  
  
        {/* Botón de envío */}  
        <button   
          type="submit"  
          style={{  
            width: '100%',  
            padding: '14px 24px',  
            background: '#A4CB3E',  
            color: '#0B0B0B',  
            border: 'none',  
            borderRadius: '9999px',  
            fontSize: '16px',  
            fontWeight: '700',  
            cursor: 'pointer',  
            transition: 'all 0.2s',  
            marginTop: '8px'  
          }}  
          onMouseEnter={(e) => {  
            e.currentTarget.style.background = '#8FB82E';  
            e.currentTarget.style.transform = 'scale(1.02)';  
          }}  
          onMouseLeave={(e) => {  
            e.currentTarget.style.background = '#A4CB3E';  
            e.currentTarget.style.transform = 'scale(1)';  
          }}  
        >  
          Publicar pregunta  
        </button>  
      </form>  
  
      {/* Estilos para placeholders */}  
      <style jsx>{`  
        input::placeholder,  
        textarea::placeholder {  
          color: #B6B9BF;  
          opacity: 0.7;  
        }  
      `}</style>  
    </>  
  );  
}