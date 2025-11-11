// src/lib/firestore.ts  
import {  
  collection, addDoc, serverTimestamp, Timestamp,  
  query, orderBy, limit, getDocs, doc, getDoc,  
  deleteDoc, updateDoc  
} from "firebase/firestore";  
import { db } from "./firebase";  
import { LatLng, toGeohash, geohashBoundsForRadius, distanceM } from "./geoutils";  
  
export type Place = {  
  id?: string;  
  name: string;  
  city: string;  
  description?: string;  
  photo?: string | null;  
  coords: { lat: number; lng: number };  
  geohash: string;  
  tags?: string[];  
  noiseLevel?: number;  
  createdBy: string;  
  createdAt: Timestamp;  
  status?: "approved" | "pending";  
};  
  
export type Question = {  
  id?: string;  
  text: string;  
  context?: string;  
  createdBy: string;  
  createdAt: Timestamp;  
  public?: boolean; // Solo true cuando tiene respuesta  
  answer?: Answer; // Respuesta única (opcional)  
};  
  
export type Answer = {  
  text: string;  
  references?: string[];  
  createdBy: string;  
  createdAt: Timestamp;  
};  
  
// ---------- PLACES ----------  
export async function addPlace(input: Omit<Place, "id" | "createdAt" | "geohash">) {  
  const ref = collection(db, "places");  
  const docRef = await addDoc(ref, {  
    ...input,  
    geohash: toGeohash(input.coords),  
    createdAt: serverTimestamp(),  
    status: "approved",  
  });  
  return docRef.id;  
}  
  
export async function listLatestPlaces(n = 50) {  
  const ref = collection(db, "places");  
  const qs = query(ref, orderBy("createdAt", "desc"), limit(n));  
  const snap = await getDocs(qs);  
  return snap.docs.map(d => ({ id: d.id, ...(d.data() as Place) }));  
}  
  
export async function listPlacesNear(center: LatLng, radiusM = 2000, hardLimit = 100) {  
  const ref = collection(db, "places");  
  const bounds = geohashBoundsForRadius(center, radiusM);  
  const results: Place[] = [];  
  
  await Promise.all(bounds.map(async (b) => {  
    const qs = query(  
      ref,  
      orderBy("geohash"),  
      startAt(b[0]),  
      endAt(b[1])  
    );  
    const snap = await getDocs(qs);  
    snap.forEach((docSnap) => {  
      const data = docSnap.data() as Place;  
      if (!data?.coords) return;  
      const dist = distanceM(center, data.coords);  
      if (dist <= radiusM) results.push({ id: docSnap.id, ...data });  
    });  
  }));  
  
  const dedup = new Map<string, Place>();  
  results.forEach(p => dedup.set(p.id!, p));  
  return Array.from(dedup.values()).slice(0, hardLimit);  
}  
  
export async function deletePlace(placeId: string) {  
  const ref = doc(db, "places", placeId);  
  await deleteDoc(ref);  
}  
  
// ---------- Q&A ----------  
export async function addQuestion(input: Pick<Question, "text" | "context" | "createdBy">) {  
  const ref = collection(db, "questions");  
  const docRef = await addDoc(ref, {  
    ...input,  
    public: false, // Inicialmente no pública  
    createdAt: serverTimestamp(),  
    // No incluir campo 'answer' hasta que se añada una  
  });  
  return docRef.id;  
}  
  
export async function listQuestions(n = 50) {  
  const ref = collection(db, "questions");  
  const qs = query(ref, orderBy("createdAt", "desc"), limit(n));  
  const snap = await getDocs(qs);  
  return snap.docs.map(d => ({ id: d.id, ...(d.data() as Question) }));  
}  
  
export async function getQuestion(id: string) {  
  const ref = doc(db, "questions", id);  
  const snap = await getDoc(ref);  
  if (!snap.exists()) return null;  
  return { id: snap.id, ...(snap.data() as Question) };  
}  
  
export async function deleteQuestion(questionId: string) {  
  const ref = doc(db, "questions", questionId);  
  await deleteDoc(ref);  
}  
  
// Función para añadir o actualizar la respuesta única de una pregunta  
export async function setAnswer(  
  questionId: string,   
  input: Pick<Answer, "text" | "references" | "createdBy">  
) {  
  const ref = doc(db, "questions", questionId);  
  const snap = await getDoc(ref);  
    
  if (!snap.exists()) {  
    throw new Error("Question not found");  
  }  
  
  // Crear objeto de respuesta con timestamp  
  const answer: Answer = {  
    text: input.text,  
    references: input.references || [],  
    createdBy: input.createdBy,  
    createdAt: serverTimestamp() as Timestamp,  
  };  
  
  // Actualizar el documento de la pregunta con la respuesta y marcar como pública  
  await updateDoc(ref, {  
    answer: answer,  
    public: true,  
  });  
}