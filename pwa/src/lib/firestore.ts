// src/lib/firestore.ts      
import {      
  collection,     
  addDoc,     
  serverTimestamp,     
  Timestamp,      
  query,     
  orderBy,     
  limit,     
  getDocs,     
  doc,     
  getDoc,      
  deleteDoc,     
  updateDoc,     
  startAt,     
  endAt      
} from "firebase/firestore";    
import { db } from "./firebase";      
import { LatLng, toGeohash, geohashBoundsForRadius, distanceM } from "./geoutils";      
    
// ========== TYPE DEFINITIONS ==========    
    
/**    
 * Representa un lugar tranquilo en el sistema    
 * Los lugares pueden ser parques, cafés, etc.    
 */    
export type Place = {        
  id?: string;        
  name: string;        
  city: string;        
  placeType?: "park" | "cafe";    
  address?: string;    
  schedule?: string;    
  description?: string;        
  photo?: string | null;        
  coords: { lat: number; lng: number };        
  geohash: string; // Calculado automáticamente para búsquedas geoespaciales       
  tags?: string[];        
  createdBy: string;        
  createdAt: Timestamp;        
  status?: "approved" | "pending";        
};    
    
/**    
 * Representa una pregunta en el sistema Q&A    
 * Las preguntas son privadas hasta que reciben una respuesta    
 */    
export type Question = {      
  id?: string;      
  text: string;      
  context?: string;      
  createdBy: string;      
  createdAt: Timestamp;      
  public?: boolean; // Solo true cuando tiene respuesta      
  answer?: Answer; // Respuesta única (opcional)      
};      
    
/**    
 * Representa una respuesta a una pregunta    
 * Almacenada como campo dentro del documento Question    
 */    
export type Answer = {      
  text: string;      
  references?: string[]; // URLs o referencias externas    
  createdBy: string;      
  createdAt: Timestamp;      
};  
  
/**  
 * Representa una sesión en vivo (Live Q&A)  
 * Los administradores crean sesiones con fecha y link de YouTube  
 */  
export type LiveSession = {  
  id?: string;  
  title: string;  
  description: string;  
  date: Timestamp; // Fecha y hora del evento  
  youtubeLink: string; // Link del directo programado  
  createdBy: string;  
  createdAt: Timestamp;  
  status?: "upcoming" | "live" | "ended";  
};  
  
/**  
 * Representa una reserva de asiento para una sesión en vivo  
 * Los usuarios reservan con su email para recibir el link  
 */  
export type SeatReservation = {  
  id?: string;  
  sessionId: string; // ID de la sesión reservada  
  email: string; // Email del usuario  
  createdAt: Timestamp;  
};  
    
// ========== PLACES CRUD OPERATIONS ==========    
    
/**    
 * Crea un nuevo lugar en Firestore    
 * El geohash se calcula automáticamente para búsquedas de proximidad    
 * El status por defecto es "approved"    
 *     
 * @param input - Datos del lugar (sin id, createdAt ni geohash)    
 * @returns ID del documento creado    
 */    
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
    
/**    
 * Lista los lugares más recientes    
 * Ordenados por fecha de creación descendente    
 *     
 * @param n - Número máximo de lugares a retornar (default: 50)    
 * @returns Array de lugares con sus IDs    
 */    
export async function listLatestPlaces(n = 50) {      
  const ref = collection(db, "places");      
  const qs = query(ref, orderBy("createdAt", "desc"), limit(n));      
  const snap = await getDocs(qs);      
  return snap.docs.map(d => ({ id: d.id, ...(d.data() as Place) }));      
}    
    
/**    
 * Busca lugares cercanos a una ubicación usando geohashes    
 * Implementa búsqueda en dos fases:    
 * 1. Filtro grueso por geohash (rápido, usando índice Firestore)    
 * 2. Filtro fino por distancia Haversine (preciso)    
 *     
 * @param center - Coordenadas del centro de búsqueda    
 * @param radiusM - Radio de búsqueda en metros (default: 2000)    
 * @param hardLimit - Límite máximo de resultados (default: 100)    
 * @returns Array de lugares dentro del radio especificado    
 */    
export async function listPlacesNear(center: LatLng, radiusM = 2000, hardLimit = 100) {      
  const ref = collection(db, "places");      
  const bounds = geohashBoundsForRadius(center, radiusM);      
  const results: Place[] = [];      
      
  // Fase 1: Búsqueda por geohash (coarse filter)    
  await Promise.all(bounds.map(async (b) => {      
    const qs = query(      
      ref,      
      orderBy("geohash"),      
      startAt(b[0]),      
      endAt(b[1])      
    );      
    const snap = await getDocs(qs);      
        
    // Fase 2: Filtro por distancia exacta (fine filter)    
    snap.forEach((docSnap) => {      
      const data = docSnap.data() as Place;      
      if (!data?.coords) return;      
      const dist = distanceM(center, data.coords);      
      if (dist <= radiusM) {    
        results.push({ id: docSnap.id, ...data });    
      }      
    });      
  }));      
      
  // Deduplicar resultados (geohashes pueden solaparse)    
  const dedup = new Map<string, Place>();      
  results.forEach(p => dedup.set(p.id!, p));      
  return Array.from(dedup.values()).slice(0, hardLimit);      
}    
    
/**    
 * Elimina un lugar de Firestore    
 * Requiere permisos de administrador o ser el creador    
 *     
 * @param placeId - ID del lugar a eliminar    
 */    
export async function deletePlace(placeId: string) {      
  const ref = doc(db, "places", placeId);      
  await deleteDoc(ref);      
}    
    
// ========== Q&A CRUD OPERATIONS ==========    
    
/**    
 * Crea una nueva pregunta en Firestore    
 * Las preguntas se crean como privadas (public: false)    
 * Se vuelven públicas automáticamente cuando reciben una respuesta    
 *     
 * @param input - Texto, contexto y creador de la pregunta    
 * @returns ID del documento creado    
 */    
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
    
/**    
 * Lista las preguntas más recientes    
 * Incluye tanto preguntas públicas como privadas    
 * Ordenadas por fecha de creación descendente    
 *     
 * @param n - Número máximo de preguntas a retornar (default: 50)    
 * @returns Array de preguntas con sus IDs    
 */    
export async function listQuestions(n = 50) {      
  const ref = collection(db, "questions");      
  const qs = query(ref, orderBy("createdAt", "desc"), limit(n));      
  const snap = await getDocs(qs);      
  return snap.docs.map(d => ({ id: d.id, ...(d.data() as Question) }));      
}    
    
/**    
 * Obtiene una pregunta específica por su ID    
 *     
 * @param id - ID de la pregunta    
 * @returns Pregunta con su ID, o null si no existe    
 */    
export async function getQuestion(id: string) {      
  const ref = doc(db, "questions", id);      
  const snap = await getDoc(ref);      
  if (!snap.exists()) return null;      
  return { id: snap.id, ...(snap.data() as Question) };      
}    
    
/**    
 * Elimina una pregunta de Firestore    
 * Requiere permisos de administrador o ser el creador    
 *     
 * @param questionId - ID de la pregunta a eliminar    
 */    
export async function deleteQuestion(questionId: string) {      
  const ref = doc(db, "questions", questionId);      
  await deleteDoc(ref);      
}    
    
/**    
 * Añade o actualiza la respuesta única de una pregunta    
 * Al añadir una respuesta, la pregunta se marca automáticamente como pública    
 *     
 * Flujo de estado:    
 * 1. Pregunta creada → public: false, sin campo answer    
 * 2. Respuesta añadida → public: true, answer: {...}    
 *     
 * @param questionId - ID de la pregunta a responder    
 * @param input - Texto, referencias y creador de la respuesta    
 * @throws Error si la pregunta no existe    
 */    
export async function setAnswer(      
  questionId: string,       
  input: Pick<Answer, "text" | "references" | "createdBy">      
) {      
  const ref = doc(db, "questions", questionId);      
  const snap = await getDoc(ref);      
        
  if (!snap.exists()) {      
    throw new Error("Question not found");      
  }      
      
  // Crear objeto de respuesta con timestamp del servidor    
  const answer: Answer = {      
    text: input.text,      
    references: input.references || [],      
    createdBy: input.createdBy,      
    createdAt: serverTimestamp() as Timestamp,      
  };      
      
  // Actualizar el documento de la pregunta con la respuesta y marcar como pública      
  await updateDoc(ref, {      
    answer: answer,      
    public: true, // Transición de estado: privada → pública    
  });      
}  
  
// ========== LIVE SESSIONS CRUD OPERATIONS ==========  
  
/**  
 * Crea una nueva sesión en vivo  
 * Los administradores usan esto para programar eventos  
 *   
 * @param input - Título, descripción, fecha y link de YouTube  
 * @returns ID del documento creado  
 */  
export async function addLiveSession(input: Omit<LiveSession, "id" | "createdAt" | "status">) {  
  const ref = collection(db, "liveSessions");  
  const docRef = await addDoc(ref, {  
    ...input,  
    status: "upcoming", // Por defecto es upcoming  
    createdAt: serverTimestamp(),  
  });  
  return docRef.id;  
}  
  
/**  
 * Lista las sesiones en vivo más recientes  
 * Ordenadas por fecha del evento ascendente (próximas primero)  
 *   
 * @param n - Número máximo de sesiones a retornar (default: 50)  
 * @returns Array de sesiones con sus IDs  
 */  
export async function listLiveSessions(n = 50) {  
  const ref = collection(db, "liveSessions");  
  const qs = query(ref, orderBy("date", "asc"), limit(n));  
  const snap = await getDocs(qs);  
  return snap.docs.map(d => ({ id: d.id, ...(d.data() as LiveSession) }));  
}  
  
/**  
 * Obtiene una sesión específica por su ID  
 *   
 * @param id - ID de la sesión  
 * @returns Sesión con su ID, o null si no existe  
 */  
export async function getLiveSession(id: string) {  
  const ref = doc(db, "liveSessions", id);  
  const snap = await getDoc(ref);  
  if (!snap.exists()) return null;  
  return { id: snap.id, ...(snap.data() as LiveSession) };  
}  
  
/**  
 * Elimina una sesión en vivo  
 * Solo administradores pueden eliminar sesiones  
 *   
 * @param sessionId - ID de la sesión a eliminar  
 */  
export async function deleteLiveSession(sessionId: string) {  
  const ref = doc(db, "liveSessions", sessionId);  
  await deleteDoc(ref);  
}  
  
/**  
 * Actualiza el estado de una sesión en vivo  
 * Permite cambiar entre "upcoming", "live" y "ended"  
 *   
 * @param sessionId - ID de la sesión  
 * @param status - Nuevo estado de la sesión  
 */  
export async function updateLiveSessionStatus(  
  sessionId: string,  
  status: "upcoming" | "live" | "ended"  
) {  
  const ref = doc(db, "liveSessions", sessionId);  
  await updateDoc(ref, { status });  
}  
  
// ========== SEAT RESERVATIONS CRUD OPERATIONS ==========  
  
/**  
 * Crea una reserva de asiento para una sesión  
 * Los usuarios proporcionan su email para recibir el link  
 *   
 * @param input - ID de sesión y email del usuario  
 * @returns ID del documento creado  
 */  
export async function addSeatReservation(input: Omit<SeatReservation, "id" | "createdAt">) {  
  const ref = collection(db, "seatReservations");  
  const docRef = await addDoc(ref, {  
    ...input,  
    createdAt: serverTimestamp(),  
  });  
  return docRef.id;  
} 

/**  
 * Lista todas las reservas para una sesión específica  
 * Útil para que administradores vean quién reservó  
 *   
 * @param sessionId - ID de la sesión  
 * @returns Array de reservas ordenadas por fecha de creación  
 */  
export async function listSeatReservations(sessionId: string) {  
  const ref = collection(db, "seatReservations");  
  const q = query(  
    ref,  
    orderBy("createdAt", "desc")  
  );  
  const snap = await getDocs(q);  
    
  // Filtrar solo las reservas de esta sesión  
  const reservations = snap.docs  
    .map(d => ({ id: d.id, ...(d.data() as SeatReservation) }))  
    .filter(r => r.sessionId === sessionId);  
    
  return reservations;  
}  
  
/**  
 * Obtiene todas las reservas (para administradores)  
 * Útil para el botón "Copy All Emails" en /live/page.tsx  
 *   
 * @param sessionId - ID de la sesión  
 * @returns Array de emails únicos  
 */  
export async function getSessionEmails(sessionId: string) {  
  const reservations = await listSeatReservations(sessionId);  
    
  // Extraer emails únicos usando Set  
  const uniqueEmails = [...new Set(reservations.map(r => r.email))];  
    
  return uniqueEmails;  
}  
  
/**  
 * Elimina una reserva de asiento  
 * Solo para administradores desde /live/page.tsx  
 *   
 * @param reservationId - ID de la reserva a eliminar  
 */  
export async function deleteSeatReservation(reservationId: string) {  
  const ref = doc(db, "seatReservations", reservationId);  
  await deleteDoc(ref);  
}