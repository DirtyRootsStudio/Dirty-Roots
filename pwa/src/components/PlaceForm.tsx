// src/components/PlaceForm.tsx    
"use client";    
    
import { useState } from "react";    
import { useForm } from "react-hook-form";    
import { z } from "zod";    
import { zodResolver } from "@hookform/resolvers/zod";    
import { addPlace } from "@/src/lib/firestore";    
import { ensureAnonAuth, auth } from "@/src/lib/firebase";    
import dynamic from "next/dynamic";    
    
const MapCanvas = dynamic(() => import("./MapCanvas"), {    
  ssr: false,    
});    
  
const schema = z.object({    
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),    
  placeType: z.enum(["park", "cafe"]), // Sin segundo parámetro  
  city: z.string().optional(),  
  address: z.string().optional(),  
  schedule: z.string().optional(),  
  description: z.string().optional(),    
  tags: z.string().optional(),    
});
    
type FormValues = z.infer<typeof schema>;    
    
export default function PlaceForm() {    
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);    
  const [coordsInput, setCoordsInput] = useState<string>("");    
  const [parsedCoords, setParsedCoords] = useState<{ lat: number; lng: number } | null>(null);    
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({ lat: 52.520008, lng: 13.404954 });    
  const [mapZoom, setMapZoom] = useState<number>(12);    
  const [loadingAddress, setLoadingAddress] = useState(false);  
      
  const { register, handleSubmit, formState, reset, setValue } = useForm<FormValues>({    
    resolver: zodResolver(schema),    
  });    
    
  const parseDecimalCoordinates = (input: string): { lat: number; lng: number } | null => {  
  // Formato esperado: "52.520008, 13.404954" o "52.520008,13.404954"  
  const parts = input.split(',').map(s => s.trim());  
    
  if (parts.length !== 2) return null;  
    
  const lat = parseFloat(parts[0]);  
  const lng = parseFloat(parts[1]);  
    
  // Validar que son números válidos y están en rangos correctos  
  if (isNaN(lat) || isNaN(lng)) return null;  
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;  
    
  return { lat, lng };  
};  
  
const getAddressFromCoords = async (lat: number, lng: number): Promise<{address: string, city: string}> => {  
  try {  
    setLoadingAddress(true);  
    const response = await fetch(  
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`  
    );  
    const data = await response.json();  
      
    // Extraer ciudad de la respuesta de Nominatim  
    const city = data.address?.city ||   
                 data.address?.town ||   
                 data.address?.village ||   
                 data.address?.municipality ||   
                 "";  
      
    return {  
      address: data.display_name || "",  
      city: city  
    };  
  } catch (error) {  
    console.error("Error obteniendo dirección:", error);  
    return { address: "", city: "" };  
  } finally {  
    setLoadingAddress(false);  
  }  
};
    
const handleCoordsInput = async (value: string) => {  
  setCoordsInput(value);  
  const parsed = parseDecimalCoordinates(value);  
  if (parsed) {  
    setParsedCoords(parsed);  
    setCoords(parsed);  
    setMapCenter(parsed);  
    setMapZoom(15);  
      
    // Obtener dirección y ciudad automáticamente  
    const { address, city } = await getAddressFromCoords(parsed.lat, parsed.lng);  
    if (address) {  
      setValue("address", address);  
    }  
    if (city) {  
      setValue("city", city); // NUEVO: actualizar ciudad  
    }  
  } else {  
    setParsedCoords(null);  
  }  
};  
  
const handleMapClick = async (lat: number, lng: number) => {  
  setCoords({ lat, lng });  
    
  // Obtener dirección y ciudad automáticamente  
  const { address, city } = await getAddressFromCoords(lat, lng);  
  if (address) {  
    setValue("address", address);  
  }  
  if (city) {  
    setValue("city", city); // NUEVO: actualizar ciudad  
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
    placeType: values.placeType,  
    city: values.city || "", // NUEVO campo  
    address: values.address,  
    schedule: values.schedule,  
    description: values.description || "",  
    coords,  
    tags: values.tags ? values.tags.split(",").map(t => t.trim()).filter(Boolean) : [],  
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
          Coordinates (decimal format: lat, lng)  
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
          placeholder="52.520008, 13.404954"  
          onFocus={(e) => e.currentTarget.style.borderColor = '#A4CB3E'}  
          onBlur={(e) => e.currentTarget.style.borderColor = parsedCoords ? '#A4CB3E' : '#2A2A2A'}  
        /> 
        {parsedCoords && (    
          <p style={{ fontSize: '12px', color: '#A4CB3E', marginTop: '4px' }}>    
            ✓ Coordinates válidas: {parsedCoords.lat.toFixed(5)}, {parsedCoords.lng.toFixed(5)}    
          </p>    
        )}    
      </div>    
    
      {/* Mapa */}    
      <MapCanvas     
        selectable     
        onSelectPosition={handleMapClick}    
        center={mapCenter}    
        zoom={mapZoom}    
      />    
            
      <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>    
        <div>    
          <label style={{ display: 'block', fontSize: '14px', marginBottom: '4px', color: '#F5F5F5', fontWeight: '600' }}>    
            Name *  
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
            placeholder="Parque del Retiro, Café Central..."    
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
            City {loadingAddress && <span style={{ color: '#A4CB3E' }}>⏳ Obteniendo...</span>}  
          </label>  
          <input   
            {...register("city")}  
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
            placeholder="It will be completed automatically..."  
            onFocus={(e) => e.currentTarget.style.borderColor = '#A4CB3E'}  
            onBlur={(e) => e.currentTarget.style.borderColor = '#2A2A2A'}  
          />  
        </div>

        <div>    
          <label style={{ display: 'block', fontSize: '14px', marginBottom: '4px', color: '#F5F5F5', fontWeight: '600' }}>    
            Type of place *  
          </label>    
          <select  
            {...register("placeType")}  
            style={{     
              width: '100%',     
              borderRadius: '12px',     
              border: '1px solid #2A2A2A',     
              padding: '12px 16px',     
              background: '#0B0B0B',    
              color: '#F5F5F5',    
              fontSize: '14px',    
              outline: 'none',    
              transition: 'all 0.2s',  
              cursor: 'pointer'  
            }}    
            onFocus={(e) => e.currentTarget.style.borderColor = '#A4CB3E'}    
            onBlur={(e) => e.currentTarget.style.borderColor = '#2A2A2A'}    
          >  
            <option value="">Select a type...</option>  
            <option value="park">🌳 Park/Garden</option>  
            <option value="cafe">☕ Cafe/Restaurant</option>  
          </select>  
          {formState.errors.placeType && (    
            <p style={{ color: '#FF60A8', fontSize: '12px', marginTop: '4px' }}>    
              {formState.errors.placeType.message}    
            </p>    
          )}    
        </div>  
  
        <div>    
          <label style={{ display: 'block', fontSize: '14px', marginBottom: '4px', color: '#F5F5F5', fontWeight: '600' }}>    
            Address {loadingAddress && <span style={{ color: '#A4CB3E' }}>⏳ Obtaining...</span>}  
          </label>    
          <input     
            {...register("address")}     
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
            placeholder="It will be completed automatically..."    
            onFocus={(e) => e.currentTarget.style.borderColor = '#A4CB3E'}    
            onBlur={(e) => e.currentTarget.style.borderColor = '#2A2A2A'}    
          />    
        </div>  
  
        <div>    
          <label style={{ display: 'block', fontSize: '14px', marginBottom: '4px', color: '#F5F5F5', fontWeight: '600' }}>    
            Schedule  
          </label>    
          <input     
            {...register("schedule")}     
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
            placeholder="Ex: 9:00-18:00, Mon-Fri 8:00-20:00..."    
            onFocus={(e) => e.currentTarget.style.borderColor = '#A4CB3E'}    
            onBlur={(e) => e.currentTarget.style.borderColor = '#2A2A2A'}    
          />    
        </div>  
    
        <div>    
          <label style={{ display: 'block', fontSize: '14px', marginBottom: '4px', color: '#F5F5F5', fontWeight: '600' }}>    
            Description    
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
            placeholder="Notes, best time, banks, etc."    
            onFocus={(e) => e.currentTarget.style.borderColor = '#A4CB3E'}    
            onBlur={(e) => e.currentTarget.style.borderColor = '#2A2A2A'}    
          />    
        </div>    
    
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
          Save place    
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