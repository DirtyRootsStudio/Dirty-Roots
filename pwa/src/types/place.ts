// src/types/place.ts  
import { Timestamp } from "firebase/firestore";  
  
export type Place = {    
  id?: string;    
  name: string;    
  city: string;    
  placeType?: "park" | "cafe"; // NUEVO  
  address?: string; // NUEVO  
  schedule?: string; // NUEVO  
  description?: string;    
  photo?: string | null;    
  coords: { lat: number; lng: number };    
  geohash: string;    
  tags?: string[];    
  // noiseLevel?: number; // ELIMINADO  
  createdBy: string;    
  createdAt: Timestamp;    
  status?: "approved" | "pending";    
};