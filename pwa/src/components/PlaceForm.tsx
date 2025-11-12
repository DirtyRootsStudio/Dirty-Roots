// src/components/PlaceForm.tsx  
"use client";  
  
import { useState, useEffect } from "react";  
import { useForm } from "react-hook-form";  
import { z } from "zod";  
import { zodResolver } from "@hookform/resolvers/zod";  
import MapCanvas from "./MapCanvas";  
import { addPlace } from "@/src/lib/firestore";  
import { ensureAnonAuth, auth } from "@/src/lib/firebase";  
  
const schema = z.object({  
  name: z.string().min(2),  
  description: z.string().optional(),  
  tags: z.string().optional(),  
  noiseLevel: z.number().min(0).max(5).optional(),  
}); 
  
type FormValues = z.infer<typeof schema>;  
  
export default function PlaceForm() {  
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);  
  const [coordsInput, setCoordsInput] = useState<string>("");  
  const [parsedCoords, setParsedCoords] = useState<{ lat: number; lng: number } | null>(null);  
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({ lat: 52.520008, lng: 13.404954 });  
  const [mapZoom, setMapZoom] = useState<number>(12);  
    
  const { register, handleSubmit, formState, reset } = useForm<FormValues>({  
    resolver: zodResolver(schema),  
  });  
  
  const parseDMSCoordinates = (input: string): { lat: number; lng: number } | null => {  
    // Regex para formato: 52°31'12.0"N 13°24'18.0"E  
    const regex = /(\d+)°(\d+)'([\d.]+)"([NS])\s+(\d+)°(\d+)'([\d.]+)"([EW])/;  
    const match = input.match(regex);  
      
    if (!match) return null;  
      
    const [_, latDeg, latMin, latSec, latDir, lngDeg, lngMin, lngSec, lngDir] = match;  
      
    let lat = parseInt(latDeg) + parseInt(latMin) / 60 + parseFloat(latSec) / 3600;  
    let lng = parseInt(lngDeg) + parseInt(lngMin) / 60 + parseFloat(lngSec) / 3600;  
      
    if (latDir === 'S') lat = -lat;  
    if (lngDir === 'W') lng = -lng;  
      
    return { lat, lng };  
  };  
  
  const handleCoordsInput = (value: string) => {  
    setCoordsInput(value);  
    const parsed = parseDMSCoordinates(value);  
    if (parsed) {  
      setParsedCoords(parsed);  
      setCoords(parsed);  
      setMapCenter(parsed);  
      setMapZoom(15);  
    } else {  
      setParsedCoords(null);  
    }  
  };  
  
  const onSubmit = handleSubmit(async (values) => {  
    if (!coords) {  
      alert("Haz click en el mapa para elegir ubicación o introduce coordenadas.");  
      return;  
    }  
    await ensureAnonAuth();  
    const uid = auth.currentUser?.uid || "anon";  
    await addPlace({  
      name: values.name,  
      description: values.description || "",  
      coords,  
      tags: values.tags ? values.tags.split(",").map(t => t.trim()).filter(Boolean) : [],  
      noiseLevel: values.noiseLevel ?? 0,  
      createdBy: uid,  
    });  
    reset();  
    setCoords(null);  
    setCoordsInput("");  
    setParsedCoords(null);  
    alert("Lugar creado ✅");  
  });  
  
  return (  
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>  
      {/* Campo de coordenadas DMS */}  
      <div>  
        <label style={{ display: 'block', fontSize: '14px', marginBottom: '4px', color: '#F5F5F5', fontWeight: '600' }}>  
          Coordenadas (formato: 52°31'12.0"N 13°24'18.0"E)  
        </label>  
        <input   
          value={coordsInput}  
          onChange={(e) => handleCoordsInput(e.target.value)}  
          style={{   
            width: '100%',   
            borderRadius: '12px',   
            border: parsedCoords ? '1px solid #A4CB3E' : '1px solid #2A2A2A',   
            padding: '12px 16px',   
            background: '#0B0B0B',  
            color: '#F5F5F5',  
            fontSize: '14px',  
            outline: 'none',  
            transition: 'all 0.2s'  
          }}  
          placeholder={`52°31'12.0"N 13°24'18.0"E`}
          onFocus={(e) => e.currentTarget.style.borderColor = '#A4CB3E'}  
          onBlur={(e) => e.currentTarget.style.borderColor = parsedCoords ? '#A4CB3E' : '#2A2A2A'}  
        />  
        {parsedCoords && (  
          <p style={{ fontSize: '12px', color: '#A4CB3E', marginTop: '4px' }}>  
            ✓ Coordenadas válidas: {parsedCoords.lat.toFixed(5)}, {parsedCoords.lng.toFixed(5)}  
          </p>  
        )}  
      </div>  
  
      {/* Mapa */}  
      <MapCanvas   
        selectable   
        onSelectPosition={(lat, lng) => setCoords({ lat, lng })}  
        center={mapCenter}  
        zoom={mapZoom}  
      />  
          
      <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>  
        <div>  
          <label style={{ display: 'block', fontSize: '14px', marginBottom: '4px', color: '#F5F5F5', fontWeight: '600' }}>  
            Nombre  
          </label>  
          <input   
            {...register("name")}   
            style={{   
              width: '100%',   
              borderRadius: '12px',   
              border: '1px solid #2A2A2A',   
              padding: '12px 16px',   
              background: '#0B0B0B',  
              color: '#F5F5F5',  
              fontSize: '14px',  
              outline: 'none',  
              transition: 'all 0.2s'  
            }}  
            placeholder="Parque silencioso…"  
            onFocus={(e) => e.currentTarget.style.borderColor = '#A4CB3E'}  
            onBlur={(e) => e.currentTarget.style.borderColor = '#2A2A2A'}  
          />  
          {formState.errors.name && (  
            <p style={{ color: '#FF60A8', fontSize: '12px', marginTop: '4px' }}>  
              {formState.errors.name.message}  
            </p>  
          )}  
        </div>  
  
        <div>  
          <label style={{ display: 'block', fontSize: '14px', marginBottom: '4px', color: '#F5F5F5', fontWeight: '600' }}>  
            Descripción  
          </label>  
          <textarea   
            {...register("description")}   
            style={{   
              width: '100%',   
              borderRadius: '12px',   
              border: '1px solid #2A2A2A',   
              padding: '12px 16px',   
              background: '#0B0B0B',  
              color: '#F5F5F5',  
              fontSize: '14px',  
              outline: 'none',  
              resize: 'vertical',  
              transition: 'all 0.2s',  
              fontFamily: 'inherit'  
            }}  
            rows={3}   
            placeholder="Notas, mejor hora, bancos, etc."  
            onFocus={(e) => e.currentTarget.style.borderColor = '#A4CB3E'}  
            onBlur={(e) => e.currentTarget.style.borderColor = '#2A2A2A'}  
          />  
        </div>  
  
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>  
          <div>  
            <label style={{ display: 'block', fontSize: '14px', marginBottom: '4px', color: '#F5F5F5', fontWeight: '600' }}>  
              Tags (CSV)  
            </label>  
            <input   
              {...register("tags")}   
              style={{   
                width: '100%',   
                borderRadius: '12px',   
                border: '1px solid #2A2A2A',   
                padding: '12px 16px',   
                background: '#0B0B0B',  
                color: '#F5F5F5',  
                fontSize: '14px',  
                outline: 'none',  
                transition: 'all 0.2s'  
              }}  
              placeholder="quiet,park,coffee"  
              onFocus={(e) => e.currentTarget.style.borderColor = '#A4CB3E'}  
              onBlur={(e) => e.currentTarget.style.borderColor = '#2A2A2A'}  
            />  
          </div>  
  
          <div>  
            <label style={{ display: 'block', fontSize: '14px', marginBottom: '4px', color: '#F5F5F5', fontWeight: '600' }}>  
              Nivel de ruido (0–5)  
            </label>  
            <input   
              type="number"   
              {...register("noiseLevel")}   
              style={{   
                width: '100%',   
                borderRadius: '12px',   
                border: '1px solid #2A2A2A',   
                padding: '12px 16px',   
                background: '#0B0B0B',  
                color: '#F5F5F5',  
                fontSize: '14px',  
                outline: 'none',  
                transition: 'all 0.2s'  
              }}  
              min={0}   
              max={5}  
              onFocus={(e) => e.currentTarget.style.borderColor = '#A4CB3E'}  
              onBlur={(e) => e.currentTarget.style.borderColor = '#2A2A2A'}  
            />  
          </div>  
        </div>  
  
        <button   
          type="submit"   
          style={{   
            padding: '12px 24px',   
            borderRadius: '9999px',   
            background: '#A4CB3E',  
            color: '#0B0B0B',  
            fontWeight: 'bold',  
            border: 'none',  
            cursor: 'pointer',  
            fontSize: '14px',  
            transition: 'all 0.2s',  
            marginTop: '8px'  
          }}  
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}  
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}  
        >  
          Guardar lugar  
        </button>  
  
        {coords && (  
          <p style={{ fontSize: '12px', color: '#B6B9BF', textAlign: 'center' }}>  
            Coords: {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}  
          </p>  
        )}  
      </form>  
  
      <style jsx>{`  
        input::placeholder,  
        textarea::placeholder {  
          color: #B6B9BF;  
          opacity: 0.7;  
        }  
      `}</style>  
    </div>  
  );  
}