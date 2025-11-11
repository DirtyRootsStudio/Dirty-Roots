// src/components/PlaceForm.tsx  
"use client";  
  
import { useState } from "react";  
import { useForm } from "react-hook-form";  
import { z } from "zod";  
import { zodResolver } from "@hookform/resolvers/zod";  
import MapCanvas from "./MapCanvas";  
import { addPlace } from "@/src/lib/firestore";  
import { ensureAnonAuth, auth } from "@/src/lib/firebase";  
  
// Schema para validación de entrada  
const inputSchema = z.object({  
  name: z.string().min(2),  
  description: z.string().optional(),  
  tags: z.string().optional(),  
  noiseLevel: z.string().optional(),  
});  
  
// Schema con transformación para salida  
const outputSchema = inputSchema.transform((data) => ({  
  ...data,  
  noiseLevel: data.noiseLevel && data.noiseLevel !== ""   
    ? Number(data.noiseLevel)   
    : undefined,  
}));  
  
type FormValues = z.infer<typeof inputSchema>;  
  
export default function PlaceForm() {  
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);  
  const { register, handleSubmit, formState, reset } = useForm<FormValues>({  
    resolver: zodResolver(inputSchema),  
  });  
  
  const onSubmit = handleSubmit(async (values) => {  
    if (!coords) {  
      alert("Haz click en el mapa para elegir ubicación.");  
      return;  
    }  
      
    // Transformar manualmente el noiseLevel  
    const noiseLevel = values.noiseLevel && values.noiseLevel !== ""   
      ? Number(values.noiseLevel)   
      : undefined;  
      
    await ensureAnonAuth();  
    const uid = auth.currentUser?.uid || "anon";  
    await addPlace({  
      name: values.name,  
      description: values.description || "",  
      coords,  
      tags: values.tags ? values.tags.split(",").map(t => t.trim()).filter(Boolean) : [],  
      noiseLevel: noiseLevel ?? 0,  
      createdBy: uid,  
    });  
    reset();  
    setCoords(null);  
    alert("Lugar creado ✅");  
  });  
  
  return (  
    <div className="space-y-4">  
      <MapCanvas selectable onSelectPosition={(lat, lng) => setCoords({ lat, lng })} />  
      <form onSubmit={onSubmit} className="space-y-3">  
        <div>  
          <label className="block text-sm mb-1">Nombre</label>  
          <input {...register("name")} className="w-full rounded border px-3 py-2 bg-transparent" placeholder="Parque silencioso…" />  
          {formState.errors.name && <p className="text-red-500 text-sm">{formState.errors.name.message}</p>}  
        </div>  
        <div>  
          <label className="block text-sm mb-1">Descripción</label>  
          <textarea {...register("description")} className="w-full rounded border px-3 py-2 bg-transparent" rows={3} placeholder="Notas, mejor hora, bancos, etc." />  
        </div>  
        <div className="grid grid-cols-2 gap-3">  
          <div>  
            <label className="block text-sm mb-1">Tags (CSV)</label>  
            <input {...register("tags")} className="w-full rounded border px-3 py-2 bg-transparent" placeholder="quiet,park,coffee" />  
          </div>  
          <div>  
            <label className="block text-sm mb-1">Nivel de ruido (0–5)</label>  
            <input type="number" {...register("noiseLevel")} className="w-full rounded border px-3 py-2 bg-transparent" min={0} max={5} />  
          </div>  
        </div>  
  
        <button type="submit" className="px-4 py-2 rounded bg-emerald-500 text-black font-medium">  
          Guardar lugar  
        </button>  
        {coords && <p className="text-sm opacity-70">Coords: {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}</p>}  
      </form>  
    </div>  
  );  
}