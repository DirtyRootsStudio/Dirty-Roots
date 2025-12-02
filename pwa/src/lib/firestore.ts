// src/lib/firestore.ts  
/**  
 * Firestore Data Access Layer  
 *   
 * Este módulo centraliza todas las operaciones CRUD para las colecciones de Firebase Firestore.  
 * Proporciona una API type-safe para interactuar con:  
 * - Places (lugares tranquilos)  
 * - Questions & Answers (sistema Q&A)  
 * - Live Sessions (sesiones en vivo)  
 * - Seat Reservations (reservas de asientos)  
 *   
 * Todas las funciones manejan automáticamente:  
 * - Timestamps del servidor  
 * - Geohashing para búsquedas espaciales  
 * - Validación de tipos con TypeScript  
 */  
  
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
  setDoc,  
  getDoc,  
  deleteDoc,  
  updateDoc,  
  startAt,
  startAfter,  
  endAt,  
  where  
} from "firebase/firestore";  
import { db } from "./firebase";  
import { auth } from "./firebase"; // ← Add this line  
import { LatLng, toGeohash, geohashBoundsForRadius, distanceM } from "./geoutils";  
  
// ========== TYPE DEFINITIONS ==========  
  
/**  
 * Representa un lugar tranquilo en el sistema  
 * Los lugares pueden ser parques, cafés, u otros espacios de calma  
 *   
 * @property id - ID del documento Firestore (opcional, asignado automáticamente)  
 * @property name - Nombre del lugar (requerido)  
 * @property city - Ciudad donde se encuentra (requerido)  
 * @property placeType - Tipo de lugar: "park" o "cafe"  
 * @property address - Dirección completa (opcional)  
 * @property schedule - Horario de apertura (opcional)  
 * @property description - Descripción detallada (opcional)  
 * @property photo - URL de la foto (opcional)  
 * @property coords - Coordenadas geográficas {lat, lng} (requerido)  
 * @property geohash - Hash geoespacial para búsquedas (calculado automáticamente)  
 * @property tags - Etiquetas descriptivas (opcional)  
 * @property createdBy - UID del usuario creador (requerido)  
 * @property createdAt - Timestamp de creación (asignado automáticamente)  
 * @property status - Estado de moderación: "approved" o "pending"  
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
  geohash: string;  
  tags?: string[];  
  createdBy: string;  
  createdAt: Timestamp;  
  status?: "approved" | "pending";  
};  
  
/**  
 * Representa una pregunta en el sistema Q&A  
 * Las preguntas son privadas hasta que reciben una respuesta  
 *   
 * @property id - ID del documento Firestore (opcional)  
 * @property text - Texto de la pregunta (requerido)  
 * @property context - Contexto adicional (opcional)  
 * @property createdBy - UID del usuario creador (requerido)  
 * @property createdAt - Timestamp de creación (asignado automáticamente)  
 * @property public - Indica si es visible públicamente (false por defecto)  
 * @property answer - Respuesta única a la pregunta (opcional)  
 */  
export type Question = {  
  id?: string;  
  text: string;  
  context?: string;  
  createdBy: string;  
  createdAt: Timestamp;  
  public?: boolean;  
  answer?: Answer;  
};  
  
/**  
 * Representa una respuesta a una pregunta  
 * Almacenada como campo anidado dentro del documento Question  
 *   
 * @property text - Texto de la respuesta (requerido)  
 * @property references - URLs o referencias externas (opcional)  
 * @property createdBy - UID del usuario que respondió (requerido)  
 * @property createdAt - Timestamp de creación (asignado automáticamente)  
 */  
export type Answer = {  
  text: string;  
  references?: string[];  
  createdBy: string;  
  createdAt: Timestamp;  
};  
  
/**  
 * Representa una sesión en vivo (Live Q&A)  
 * Los administradores crean sesiones con fecha y link de YouTube  
 *   
 * @property id - ID del documento Firestore (opcional)  
 * @property title - Título de la sesión (requerido)  
 * @property description - Descripción de la sesión (requerido)  
 * @property date - Fecha y hora del evento (requerido)  
 * @property youtubeLink - Link del directo programado (requerido)  
 * @property createdBy - UID del administrador creador (requerido)  
 * @property createdAt - Timestamp de creación (asignado automáticamente)  
 * @property status - Estado: "upcoming", "live" o "ended"  
 */  
export type LiveSession = {  
  id?: string;  
  title: string;  
  description: string;  
  date: Timestamp;  
  youtubeLink: string;  
  createdBy: string;  
  createdAt: Timestamp;  
  status?: "upcoming" | "live" | "ended";  
};  
  
/**  
 * Representa una reserva de asiento para una sesión en vivo  
 * Los usuarios reservan con su email para recibir el link  
 *   
 * @property id - ID del documento Firestore (opcional)  
 * @property sessionId - ID de la sesión reservada (requerido)  
 * @property email - Email del usuario (requerido)  
 * @property createdBy - UID del usuario (puede ser anónimo) (requerido)  
 * @property createdAt - Timestamp de creación (asignado automáticamente)  
 */  
export type SeatReservation = {  
  id?: string;  
  sessionId: string;  
  email: string;  
  createdBy: string;  
  createdAt: Timestamp;  
};  
  

export type SeasonalToolkit = {  
  id?: string;  
  season: 'winter' | 'spring' | 'summer' | 'autumn';  
  title: string;  
  description: string;  
  calmReminder: string;  
  checklist: string[];  
  lightMap: {  
    description: string;  
  };  
  microGuide: string;  
  downloadables: {  
    checklistPdf?: string;  
    posterPdf?: string;  
    guidePdf?: string;  
  };  
  activeFrom: Timestamp;  
  activeTo: Timestamp;  
  createdBy: string;  
  createdAt: Timestamp;  
};


export type Brand = {  
  id?: string; // Match the pattern used by other types  
  name: string;  
  description: string;  
  discount?: string;  
  link: string;  
  imageBase64: string;  
  createdBy: string;  
  createdAt: Timestamp;  
  status?: "active" | "deleted";  
  updatedAt?: Timestamp;  
  deletedAt?: Timestamp;  
};


export type PlantPhoto = {  
  id?: string;  
  plantName: string;  
  description: string;  
  imageBase64: string;  
  createdBy: string;  
  userName?: string; // Nombre del usuario que posteó  
  createdAt: Timestamp;  
  status?: "active" | "deleted";  
  likes: string[]; // Array de UIDs de usuarios que dieron like  
  likesCount: number; // Contador de likes  
  comments: Comment[]; // Array de comentarios  
};  
  
export type Comment = {  
  id: string;  
  text: string;  
  createdBy: string;  
  userName?: string;  
  createdAt: Timestamp;  
};

export type UserProfile = {  
  id?: string;  
  uid: string; // Firebase Auth UID  
  displayName: string;  
  bio?: string;  
  profileImageBase64?: string;  
  status?: 'active' | 'suspended'; // ← Añadir este campo  
  suspendedAt?: Timestamp; // ← Timestamp de suspensión  
  suspendedBy?: string; // ← UID del admin que suspendió  
  createdAt: Timestamp;  
  updatedAt?: Timestamp;
  postsCount?: number;  
  commentsCount?: number;    
};

export interface Admin {  
  id: string;  
  email: string;  
  displayName: string;  
  role: 'owner' | 'admin';  
  createdBy: string;  
  createdAt: Timestamp;  
} 



// ========== PLACES CRUD OPERATIONS ==========  
  
/**  
 * Crea un nuevo lugar en Firestore  
 *   
 * El geohash se calcula automáticamente usando las coordenadas proporcionadas  
 * para permitir búsquedas de proximidad eficientes. El status por defecto es  
 * "approved" para permitir visibilidad inmediata.  
 *   
 * @param input - Datos del lugar (sin id, createdAt ni geohash)  
 * @returns Promise<string> - ID del documento creado  
 * @throws Error si falla la creación en Firestore  
 *   
 * @example  
 * const placeId = await addPlace({  
 *   name: "Central Park",  
 *   city: "New York",  
 *   coords: { lat: 40.785091, lng: -73.968285 },  
 *   createdBy: "user123"  
 * });  
 */  
export async function addPlace(input: Omit<Place, "id" | "createdAt" | "geohash">): Promise<string> {  
  try {  
    const ref = collection(db, "places");  
    const docRef = await addDoc(ref, {  
      ...input,  
      geohash: toGeohash(input.coords),  
      createdAt: serverTimestamp(),  
      status: input.status || "approved",  
    });  
    return docRef.id;  
  } catch (error) {  
    console.error("Error adding place:", error);  
    throw new Error("Failed to create place");  
  }  
}  
  
/**  
 * Lista los lugares más recientes  
 *   
 * Retorna lugares ordenados por fecha de creación descendente (más recientes primero).  
 * Útil para mostrar los últimos lugares añadidos a la plataforma.  
 *   
 * @param n - Número máximo de lugares a retornar (default: 50, max recomendado: 100)  
 * @returns Promise<Place[]> - Array de lugares con sus IDs  
 * @throws Error si falla la consulta a Firestore  
 *   
 * @example  
 * const recentPlaces = await listLatestPlaces(20);  
 * console.log(`Loaded ${recentPlaces.length} places`);  
 */  
export async function listLatestPlaces(n = 50): Promise<Place[]> {  
  try {  
    const ref = collection(db, "places");  
    const qs = query(ref, orderBy("createdAt", "desc"), limit(n));  
    const snap = await getDocs(qs);  
    return snap.docs.map(d => ({ id: d.id, ...(d.data() as Place) }));  
  } catch (error) {  
    console.error("Error listing places:", error);  
    throw new Error("Failed to load places");  
  }  
}  


/**    
 * Lista TODOS los lugares de la colección  
 *     
 * Retorna todos los lugares ordenados por fecha de creación descendente.  
 * ADVERTENCIA: Esta función puede ser costosa si tienes muchos lugares (>1000).  
 * Considera usar paginación para colecciones grandes.  
 *     
 * @returns Promise<Place[]> - Array con todos los lugares  
 * @throws Error si falla la consulta a Firestore    
 */    
export async function listAllPlaces(): Promise<Place[]> {    
  try {    
    const ref = collection(db, "places");    
    const qs = query(ref, orderBy("createdAt", "desc"));    
    const snap = await getDocs(qs);    
    return snap.docs.map(d => ({ id: d.id, ...(d.data() as Place) }));    
  } catch (error) {    
    console.error("Error listing all places:", error);    
    throw new Error("Failed to load all places");    
  }    
}
  
/**  
 * Busca lugares cercanos a una ubicación usando geohashes  
 *   
 * Implementa búsqueda geoespacial en dos fases:  
 * 1. Filtro grueso por geohash (rápido, usando índice Firestore)  
 * 2. Filtro fino por distancia Haversine (preciso)  
 *   
 * Este enfoque optimiza el rendimiento al reducir el número de documentos  
 * que necesitan cálculo de distancia exacta.  
 *   
 * @param center - Coordenadas del centro de búsqueda {lat, lng}  
 * @param radiusM - Radio de búsqueda en metros (default: 2000m = 2km)  
 * @param hardLimit - Límite máximo de resultados (default: 100)  
 * @returns Promise<Place[]> - Array de lugares dentro del radio especificado  
 * @throws Error si falla la consulta a Firestore  
 *   
 * @example  
 * const nearbyPlaces = await listPlacesNear(  
 *   { lat: 52.520008, lng: 13.404954 },  
 *   5000, // 5km radius  
 *   50    // max 50 results  
 * );  
 */  
export async function listPlacesNear(  
  center: LatLng,  
  radiusM = 2000,  
  hardLimit = 100  
): Promise<Place[]> {  
  try {  
    const ref = collection(db, "places");  
    const bounds = geohashBoundsForRadius(center, radiusM);  
    const results: Place[] = [];  
  
    // Fase 1: Búsqueda por geohash (coarse filter)  
    await Promise.all(  
      bounds.map(async (b) => {  
        const qs = query(ref, orderBy("geohash"), startAt(b[0]), endAt(b[1]));  
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
      })  
    );  
  
    // Deduplicar resultados (geohashes pueden solaparse)  
    const dedup = new Map<string, Place>();  
    results.forEach((p) => dedup.set(p.id!, p));  
    return Array.from(dedup.values()).slice(0, hardLimit);  
  } catch (error) {  
    console.error("Error searching nearby places:", error);  
    throw new Error("Failed to search nearby places");  
  }  
}  
  
/**  
 * Elimina un lugar de Firestore  
 *   
 * Requiere permisos de administrador o ser el creador del lugar.  
 * Las reglas de seguridad de Firestore validan estos permisos.  
 *   
 * @param placeId - ID del lugar a eliminar  
 * @returns Promise<void>  
 * @throws Error si falla la eliminación o no hay permisos  
 *   
 * @example  
 * await deletePlace("place123");  
 */  
export async function deletePlace(placeId: string): Promise<void> {  
  try {  
    const ref = doc(db, "places", placeId);  
    await deleteDoc(ref);  
  } catch (error) {  
    console.error("Error deleting place:", error);  
    throw new Error("Failed to delete place");  
  }  
}  
  
// ========== Q&A CRUD OPERATIONS ==========  
  
/**  
 * Crea una nueva pregunta en Firestore  
 *   
 * Las preguntas se crean como privadas (public: false) y solo se vuelven  
 * públicas cuando reciben una respuesta mediante setAnswer().  
 *   
 * @param input - Texto, contexto y creador de la pregunta  
 * @returns Promise<string> - ID del documento creado  
 * @throws Error si falla la creación en Firestore  
 *   
 * @example  
 * const questionId = await addQuestion({  
 *   text: "¿Conoces lugares tranquilos en Berlín?",  
 *   context: "Busco cafés con terraza",  
 *   createdBy: "user123"  
 * });  
 */  
export async function addQuestion(  
  input: Pick<Question, "text" | "context" | "createdBy">  
): Promise<string> {  
  try {  
    const ref = collection(db, "questions");  
    const docRef = await addDoc(ref, {  
      ...input,  
      public: false, // Inicialmente no pública  
      createdAt: serverTimestamp(),  
      // No incluir campo 'answer' hasta que se añada una  
    });  
    return docRef.id;  
  } catch (error) {  
    console.error("Error adding question:", error);  
    throw new Error("Failed to create question");  
  }  
}  
  
/**  
 * Lista las preguntas más recientes  
 *   
 * Incluye tanto preguntas públicas como privadas.  
 * Ordenadas por fecha de creación descendente (más recientes primero).  
 *   
 * @param n - Número máximo de preguntas a retornar (default: 50)  
 * @returns Promise<Question[]> - Array de preguntas con sus IDs  
 * @throws Error si falla la consulta a Firestore  
 *   
 * @example  
 * const questions = await listQuestions(30);  
 */ 


export async function listQuestions(n = 50): Promise<Question[]> {  
  try {  
    const ref = collection(db, "questions");  
    const qs = query(ref, orderBy("createdAt", "desc"), limit(n));  
    const snap = await getDocs(qs);  
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Question) }));  
  

  } catch (error) {  
    console.error("Error listing questions:", error);  
    throw new Error("Failed to load questions");  
  }  
}  
  
/**  
 * Obtiene una pregunta específica por su ID  
 *   
 * Útil para la página de detalle de pregunta donde se muestra  
 * la pregunta completa con su respuesta (si existe).  
 *   
 * @param id - ID del documento de la pregunta  
 * @returns Promise<Question | null> - Pregunta con su ID, o null si no existe  
 * @throws Error si falla la consulta a Firestore  
 *   
 * @example  
 * const question = await getQuestion("abc123");  
 * if (question?.answer) {  
 *   console.log("Answered:", question.answer.text);  
 * }  
 */  
export async function getQuestion(id: string): Promise<Question | null> {  
  try {  
    const ref = doc(db, "questions", id);  
    const snap = await getDoc(ref);  
    if (!snap.exists()) return null;  
    return { id: snap.id, ...(snap.data() as Question) };  
  } catch (error) {  
    console.error("Error getting question:", error);  
    throw new Error("Failed to load question");  
  }  
}  
  
/**  
 * Elimina una pregunta de Firestore  
 *   
 * Requiere permisos de administrador o ser el creador de la pregunta.  
 * Las reglas de seguridad de Firestore validan estos permisos.  
 *   
 * @param questionId - ID de la pregunta a eliminar  
 * @returns Promise<void>  
 * @throws Error si falla la eliminación o no hay permisos  
 *   
 * @example  
 * await deleteQuestion("question123");  
 */  
export async function deleteQuestion(questionId: string): Promise<void> {  
  try {  
    const ref = doc(db, "questions", questionId);  
    await deleteDoc(ref);  
  } catch (error) {  
    console.error("Error deleting question:", error);  
    throw new Error("Failed to delete question");  
  }  
}  
  
/**  
 * Añade o actualiza la respuesta única de una pregunta  
 *   
 * Esta función implementa el flujo de aprobación implícita:  
 * 1. Crea objeto Answer con timestamp del servidor  
 * 2. Actualiza el documento de la pregunta con la respuesta  
 * 3. Marca automáticamente la pregunta como pública (public: true)  
 *   
 * Una vez que una pregunta tiene respuesta, se vuelve visible  
 * públicamente sin necesidad de aprobación manual.  
 *   
 * @param questionId - ID de la pregunta a responder  
 * @param input - Texto, referencias y creador de la respuesta  
 * @returns Promise<void>  
 * @throws Error si la pregunta no existe o falla la actualización  
 *   
 * @example  
 * await setAnswer("question123", {  
 *   text: "Sí, conozco varios lugares...",  
 *   references: ["https://example.com/place1"],  
 *   createdBy: "admin456"  
 * });  
 */  
export async function setAnswer(  
  questionId: string,  
  input: Pick<Answer, "text" | "references" | "createdBy">  
): Promise<void> {  
  try {  
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
  } catch (error) {  
    console.error("Error setting answer:", error);  
    throw new Error("Failed to save answer");  
  }  
}  
  
// ========== LIVE SESSIONS CRUD OPERATIONS ==========  
  
/**  
 * Crea una nueva sesión en vivo  
 *   
 * Los administradores usan esta función para programar eventos de Q&A en vivo.  
 * La sesión se crea con status "upcoming" por defecto y se puede actualizar  
 * a "live" o "ended" posteriormente.  
 *   
 * @param input - Título, descripción, fecha y link de YouTube  
 * @returns Promise<string> - ID del documento creado  
 * @throws Error si falla la creación en Firestore  
 *   
 * @example  
 * const sessionId = await addLiveSession({  
 *   title: "Q&A de Primavera 2025",  
 *   description: "Sesión sobre lugares tranquilos",  
 *   date: Timestamp.fromDate(new Date("2025-03-15T18:00:00")),  
 *   youtubeLink: "https://youtube.com/live/abc123",  
 *   createdBy: "admin123"  
 * });  
 */  
export async function addLiveSession(  
  input: Omit<LiveSession, "id" | "createdAt" | "status">  
): Promise<string> {  
  try {  
    const ref = collection(db, "liveSessions");  
    const docRef = await addDoc(ref, {  
      ...input,  
      status: "upcoming", // Por defecto es upcoming  
      createdAt: serverTimestamp(),  
    });  
    return docRef.id;  
  } catch (error) {  
    console.error("Error adding live session:", error);  
    throw new Error("Failed to create live session");  
  }  
}  
  
/**  
 * Lista las sesiones en vivo más recientes  
 *   
 * Ordenadas por fecha del evento ascendente (próximas primero).  
 * Incluye sesiones con cualquier status: upcoming, live, ended.  
 *   
 * @param n - Número máximo de sesiones a retornar (default: 50)  
 * @returns Promise<LiveSession[]> - Array de sesiones con sus IDs  
 * @throws Error si falla la consulta a Firestore  
 *   
 * @example  
 * const sessions = await listLiveSessions(20);  
 * const upcomingSessions = sessions.filter(s => s.status === "upcoming");  
 */  
export async function listLiveSessions(n = 50): Promise<LiveSession[]> {  
  try {  
    const ref = collection(db, "liveSessions");  
    const qs = query(ref, orderBy("date", "asc"), limit(n));  
    const snap = await getDocs(qs);  
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as LiveSession) }));  
  } catch (error) {  
    console.error("Error listing live sessions:", error);  
    throw new Error("Failed to load live sessions");  
  }  
}  
  
/**  
 * Obtiene una sesión específica por su ID  
 *   
 * @param id - ID de la sesión  
 * @returns Promise<LiveSession | null> - Sesión con su ID, o null si no existe  
 * @throws Error si falla la consulta a Firestore  
 *   
 * @example  
 * const session = await getLiveSession("session123");  
 * if (session) {  
 *   console.log(`Session: ${session.title} at ${session.date.toDate()}`);  
 * }  
 */  
export async function getLiveSession(id: string): Promise<LiveSession | null> {  
  try {  
    const ref = doc(db, "liveSessions", id);  
    const snap = await getDoc(ref);  
    if (!snap.exists()) return null;  
    return { id: snap.id, ...(snap.data() as LiveSession) };  
  } catch (error) {  
    console.error("Error getting live session:", error);  
    throw new Error("Failed to load live session");  
  }  
}  
  
/**  
 * Elimina una sesión en vivo  
 *   
 * Solo administradores pueden eliminar sesiones.  
 * Las reglas de Firestore validan los permisos.  
 *   
 * @param sessionId - ID de la sesión a eliminar  
 * @returns Promise<void>  
 * @throws Error si falla la eliminación o no hay permisos  
 *   
 * @example  
 * await deleteLiveSession("session123");  
 */  
export async function deleteLiveSession(sessionId: string): Promise<void> {  
  try {  
    const ref = doc(db, "liveSessions", sessionId);  
    await deleteDoc(ref);  
  } catch (error) {  
    console.error("Error deleting live session:", error);  
    throw new Error("Failed to delete live session");  
  }  
}  
  
/**  
 * Actualiza el estado de una sesión en vivo  
 *   
 * Permite cambiar entre "upcoming", "live" y "ended".  
 * Útil para marcar sesiones como en vivo durante el evento  
 * o como finalizadas después del evento.  
 *   
 * @param sessionId - ID de la sesión  
 * @param status - Nuevo estado de la sesión  
 * @returns Promise<void>  
 * @throws Error si falla la actualización  
 *   
 * @example  
 * // Marcar sesión como en vivo  
 * await updateLiveSessionStatus("session123", "live");  
 *   
 * // Marcar sesión como finalizada  
 * await updateLiveSessionStatus("session123", "ended");  
 */  
export async function updateLiveSessionStatus(  
  sessionId: string,  
  status: "upcoming" | "live" | "ended"  
): Promise<void> {  
  try {  
    const ref = doc(db, "liveSessions", sessionId);  
    await updateDoc(ref, { status });  
  } catch (error) {  
    console.error("Error updating live session status:", error);  
    throw new Error("Failed to update session status");  
  }  
}  
  
// ========== SEAT RESERVATIONS CRUD OPERATIONS ==========  
  
/**  
 * Crea una reserva de asiento para una sesión  
 *   
 * Los usuarios proporcionan su email para recibir el link de YouTube.  
 * Permite usuarios anónimos (autenticados con ensureAnonAuth()).  
 *   
 * @param input - ID de sesión, email y creador  
 * @returns Promise<string> - ID del documento creado  
 * @throws Error si falla la creación en Firestore  
 *   
 * @example  
 * await addSeatReservation({  
 *   sessionId: "session123",  
 *   email: "user@example.com",  
 *   createdBy: "anon456"  
 * });  
 */  
export async function addSeatReservation(  
  input: Omit<SeatReservation, "id" | "createdAt">  
): Promise<string> {  
  try {  
    const ref = collection(db, "seatReservations");  
    const docRef = await addDoc(ref, {  
      ...input,  
      createdAt: serverTimestamp(),  
    });  
    return docRef.id;  
  } catch (error) {  
    console.error("Error adding seat reservation:", error);  
    throw new Error("Failed to create seat reservation");  
  }  
}  
  
/**  
 * Lista todas las reservas para una sesión específica  
 *   
 * Útil para que administradores vean quién reservó asientos.  
 * Ordenadas por fecha de creación descendente (más recientes primero).  
 *   
 * NOTA: Esta función usa where() para filtrar por sessionId.  
 * Asegúrate de tener un índice compuesto en Firestore para  
 * (sessionId, createdAt) si tienes muchas reservas.  
 *   
 * @param sessionId - ID de la sesión  
 * @returns Promise<SeatReservation[]> - Array de reservas con sus IDs  
 * @throws Error si falla la consulta a Firestore  
 *   
 * @example  
 * const reservations = await listSeatReservations("session123");  
 * console.log(`${reservations.length} people reserved seats`);  
 */  
export async function listSeatReservations(  
  sessionId: string  
): Promise<SeatReservation[]> {  
  try {  
    const ref = collection(db, "seatReservations");  
    const q = query(  
      ref,  
      where("sessionId", "==", sessionId)  
      // Remove orderBy to avoid needing composite index  
    );  
    const snap = await getDocs(q);  
      
    // Sort in memory instead  
    const reservations = snap.docs  
      .map((d) => ({ id: d.id, ...(d.data() as SeatReservation) }))  
      .sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());  
      
    return reservations;  
  } catch (error) {  
    console.error("Error listing seat reservations:", error);  
    throw new Error("Failed to load seat reservations");  
  }  
} 
  
/**  
 * Obtiene lista de emails únicos para una sesión  
 *   
 * Útil para exportar emails y enviar notificaciones manuales.  
 * Elimina duplicados usando Set (por si un usuario reservó múltiples veces).  
 *   
 * @param sessionId - ID de la sesión  
 * @returns Promise<string[]> - Array de emails únicos  
 * @throws Error si falla la consulta a Firestore  
 *   
 * @example  
 * const emails = await getSessionEmails("session123");  
 * console.log(`Emails to notify:\n${emails.join('\n')}`);  
 */  
export async function getSessionEmails(sessionId: string): Promise<string[]> {  
  try {  
    const reservations = await listSeatReservations(sessionId);  
  
    // Extraer emails únicos usando Set  
    const uniqueEmails = [...new Set(reservations.map((r) => r.email))];  
  
    return uniqueEmails;  
  } catch (error) {  
    console.error("Error getting session emails:", error);  
    throw new Error("Failed to get session emails");  
  }  
}  
  
/**  
 * Elimina una reserva de asiento  
 *   
 * Solo para administradores desde /live/page.tsx.  
 * Las reglas de Firestore validan los permisos.  
 *   
 * @param reservationId - ID de la reserva a eliminar  
 * @returns Promise<void>  
 * @throws Error si falla la eliminación o no hay permisos  
 *   
 * @example  
 * await deleteSeatReservation("reservation123");  
 */  
export async function deleteSeatReservation(reservationId: string): Promise<void> {  
  try {  
    const ref = doc(db, "seatReservations", reservationId);  
    await deleteDoc(ref);  
  } catch (error) {  
    console.error("Error deleting seat reservation:", error);  
    throw new Error("Failed to delete seat reservation");  
  }  
}

// ========== PRODUCTS CRUD OPERATIONS ==========  
  
/**  
 * Representa un producto de la tienda "Things that grow slowly"  
 */  
export type Product = {  
  id?: string;  
  name: string;  
  label: string;  
  price: number;  
  link: string;  
  imageBase64: string;  
  createdBy: string;  
  createdAt: Timestamp;  
};  
  
/**  
 * Crea un nuevo producto en Firestore  
 */  
export async function addProduct(  
  input: Omit<Product, "id" | "createdAt">  
): Promise<string> {  
  try {  
    const ref = collection(db, "products");  
    const docRef = await addDoc(ref, {  
      ...input,  
      createdAt: serverTimestamp(),  
    });  
    return docRef.id;  
  } catch (error) {  
    console.error("Error adding product:", error);  
    throw new Error("Failed to create product");  
  }  
}  
  
/**  
 * Lista los productos más recientes  
 */  
export async function listProducts(n = 50): Promise<Product[]> {  
  try {  
    const ref = collection(db, "products");  
    const qs = query(ref, orderBy("createdAt", "desc"), limit(n));  
    const snap = await getDocs(qs);  
    return snap.docs.map(d => ({ id: d.id, ...(d.data() as Product) }));  
  } catch (error) {  
    console.error("Error listing products:", error);  
    throw new Error("Failed to load products");  
  }  
}  
  
/**  
 * Elimina un producto de Firestore  
 */  
export async function deleteProduct(productId: string): Promise<void> {  
  try {  
    const ref = doc(db, "products", productId);  
    await deleteDoc(ref);  
  } catch (error) {  
    console.error("Error deleting product:", error);  
    throw new Error("Failed to delete product");  
  }  
}  
  
/**  
 * Actualiza un producto existente  
 */  
export async function updateProduct(  
  productId: string,   
  updates: Partial<Omit<Product, "id" | "createdAt" | "createdBy">>  
): Promise<void> {  
  try {  
    const ref = doc(db, "products", productId);  
    await updateDoc(ref, updates);  
  } catch (error) {  
    console.error("Error updating product:", error);  
    throw new Error("Failed to update product");  
  }  
}


/**  
 * Crea un nuevo toolkit estacional en Firestore  
 */  
export async function addSeasonalToolkit(    
  input: Omit<SeasonalToolkit, "id" | "createdAt">    
): Promise<string> {    
  try {    
    const ref = collection(db, "seasonalToolkits");  
      
    // Limpiar campos undefined  
    const cleanedDownloadables: Record<string, string> = {};  
    if (input.downloadables.checklistPdf) {  
      cleanedDownloadables.checklistPdf = input.downloadables.checklistPdf;  
    }  
    if (input.downloadables.posterPdf) {  
      cleanedDownloadables.posterPdf = input.downloadables.posterPdf;  
    }  
    if (input.downloadables.guidePdf) {  
      cleanedDownloadables.guidePdf = input.downloadables.guidePdf;  
    }  
      
    const cleanedInput = {  
      ...input,  
      lightMap: {  
        description: input.lightMap.description  
      },  
      downloadables: cleanedDownloadables  
    };  
      
    const docRef = await addDoc(ref, {    
      ...cleanedInput,    
      createdAt: serverTimestamp(),    
    });    
    return docRef.id;    
  } catch (error) {    
    console.error("Error adding seasonal toolkit:", error);    
    throw new Error("Failed to create seasonal toolkit");    
  }    
}
  
/**  
 * Lista los toolkits estacionales más recientes  
 */  
export async function listSeasonalToolkits(n = 50): Promise<SeasonalToolkit[]> {  
  try {  
    const ref = collection(db, "seasonalToolkits");  
    const qs = query(ref, orderBy("createdAt", "desc"), limit(n));  
    const snap = await getDocs(qs);  
    return snap.docs.map(d => ({ id: d.id, ...(d.data() as SeasonalToolkit) }));  
  } catch (error) {  
    console.error("Error listing seasonal toolkits:", error);  
    throw new Error("Failed to load seasonal toolkits");  
  }  
}  
  
/**  
 * Elimina un toolkit estacional de Firestore  
 */  
export async function deleteSeasonalToolkit(toolkitId: string): Promise<void> {  
  try {  
    const ref = doc(db, "seasonalToolkits", toolkitId);  
    await deleteDoc(ref);  
  } catch (error) {  
    console.error("Error deleting seasonal toolkit:", error);  
    throw new Error("Failed to delete seasonal toolkit");  
  }  
}  
  
/**  
 * Actualiza un toolkit estacional existente  
 */  
export async function updateSeasonalToolkit(  
  toolkitId: string,  
  updates: Partial<Omit<SeasonalToolkit, "id" | "createdAt" | "createdBy">>  
): Promise<void> {  
  try {  
    const ref = doc(db, "seasonalToolkits", toolkitId);  
    await updateDoc(ref, updates);  
  } catch (error) {  
    console.error("Error updating seasonal toolkit:", error);  
    throw new Error("Failed to update seasonal toolkit");  
  }  
}

/**  
 * Crea una nueva marca en Firestore  
 *   
 * @param input - Datos de la marca (sin id, createdAt ni status)  
 * @returns Promise<string> - ID del documento creado  
 * @throws Error si falla la creación en Firestore  
 */  
export async function addBrand(  
  input: Omit<Brand, "id" | "createdAt" | "status">  
): Promise<string> {  
  try {  
    const ref = collection(db, "brands");  
    const docRef = await addDoc(ref, {  
      ...input,  
      createdAt: serverTimestamp(),  
      status: "active",  
    });  
    return docRef.id;  
  } catch (error) {  
    console.error("Error adding brand:", error);  
    throw new Error("Failed to create brand");  
  }  
}  
  
/**  
 * Lista las marcas más recientes  
 *   
 * @param limit - Número máximo de marcas a retornar (default: 50)  
 * @returns Promise<Brand[]> - Array de marcas con sus IDs  
 * @throws Error si falla la consulta a Firestore  
 */  
export async function listBrands(limit: number = 50): Promise<Brand[]> {  
  try {  
    const ref = collection(db, "brands");  
    const q = query(  
      ref,   
      where("status", "==", "active")  
      // Remove orderBy to avoid needing composite index  
    );  
    const snap = await getDocs(q);  
      
    // Sort in memory instead  
    const brands = snap.docs  
      .map((d) => ({ id: d.id, ...(d.data() as Brand) }))  
      .sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis())  
      .slice(0, limit);  
        
    return brands;  
  } catch (error) {  
    console.error("Error listing brands:", error);  
    throw new Error("Failed to load brands");  
  }  
}  
  
/**  
 * Actualiza una marca existente  
 *   
 * @param id - ID de la marca a actualizar  
 * @param updates - Datos a actualizar (sin id, createdAt, createdBy)  
 * @returns Promise<void>  
 * @throws Error si falla la actualización  
 */  
export async function updateBrand(  
  id: string,   
  updates: Partial<Omit<Brand, "id" | "createdAt" | "createdBy">>  
): Promise<void> {  
  try {  
    const ref = doc(db, "brands", id);  
    await updateDoc(ref, {  
      ...updates,  
      updatedAt: serverTimestamp()  
    });  
  } catch (error) {  
    console.error("Error updating brand:", error);  
    throw new Error("Failed to update brand");  
  }  
}  
  
/**  
 * Elimina una marca (soft delete)  
 *   
 * Cambia el status a 'deleted' en lugar de eliminar permanentemente  
 *   
 * @param id - ID de la marca a eliminar  
 * @returns Promise<void>  
 * @throws Error si falla la eliminación  
 */  
export async function deleteBrand(id: string): Promise<void> {  
  try {  
    const ref = doc(db, "brands", id);  
    await updateDoc(ref, {  
      status: "deleted",  
      deletedAt: serverTimestamp()  
    });  
  } catch (error) {  
    console.error("Error deleting brand:", error);  
    throw new Error("Failed to delete brand");  
  }  
}

/**  
 * Crea una nueva foto de planta en Firestore  
 *   
 * @param input - Datos de la foto (sin id, createdAt ni status)  
 * @returns Promise<string> - ID del documento creado  
 * @throws Error si falla la creación en Firestore  
 */  
export async function addPlantPhoto(  
  input: Omit<PlantPhoto, "id" | "createdAt" | "status">  
): Promise<string> {  
  try {  
    const ref = collection(db, "plantPhotos");  
    const docRef = await addDoc(ref, {  
      ...input,  
      createdAt: serverTimestamp(),  
      status: "active",  
    });  
    return docRef.id;  
  } catch (error) {  
    console.error("Error adding plant photo:", error);  
    throw new Error("Failed to create plant photo");  
  }  
} 
  
/**  
 * Lista las fotos de planta más recientes  
 *   
 * @param limit - Número máximo de fotos a retornar (default: 50)  
 * @returns Promise<PlantPhoto[]> - Array de fotos con sus IDs  
 * @throws Error si falla la consulta a Firestore  
 */  
export async function listPlantPhotos(  
  limitParam: number = 50,  
  startAfterParam?: Timestamp  
): Promise<PlantPhoto[]> {  
  try {  
    const ref = collection(db, "plantPhotos");  
      
    if (startAfterParam) {  
      // Para paginación: where → orderBy → startAfter → limit  
      const q = query(  
        ref,   
        where("status", "==", "active"),  
        orderBy("createdAt", "desc"),  
        startAfter(startAfterParam),  
        limit(limitParam)  
      );  
      const snap = await getDocs(q);  
      return snap.docs.map((d) => ({ id: d.id, ...(d.data() as PlantPhoto) }));  
    } else {  
      // Para la primera carga: where → orderBy → limit  
      const q = query(  
        ref,   
        where("status", "==", "active"),  
        orderBy("createdAt", "desc"),  
        limit(limitParam)  
      );  
      const snap = await getDocs(q);  
      return snap.docs.map((d) => ({ id: d.id, ...(d.data() as PlantPhoto) }));  
    }  
  } catch (error) {  
    console.error("Error listing plant photos:", error);  
    throw new Error("Failed to load plant photos");  
  } 
}
  
/**  
 * Elimina una foto de planta (soft delete)  
 *   
 * Cambia el status a 'deleted' en lugar de eliminar permanentemente  
 *   
 * @param id - ID de la foto a eliminar  
 * @returns Promise<void>  
 * @throws Error si falla la eliminación  
 */  
export async function deletePlantPhoto(id: string): Promise<void> {  
  try {  
    const ref = doc(db, "plantPhotos", id);  
    await updateDoc(ref, {  
      status: "deleted",  
      deletedAt: serverTimestamp()  
    });  
  } catch (error) {  
    console.error("Error deleting plant photo:", error);  
    throw new Error("Failed to delete plant photo");  
  }  
}

// Agregar like a una foto  
export async function addLikeToPhoto(photoId: string, userId: string): Promise<void> {  
  try {  
    const ref = doc(db, "plantPhotos", photoId);  
    const photoDoc = await getDoc(ref);  
    const currentLikes = photoDoc.data()?.likes || [];  
      
    if (!currentLikes.includes(userId)) {  
      await updateDoc(ref, {  
        likes: [...currentLikes, userId],  
        likesCount: currentLikes.length + 1  
      });  
    }  
  } catch (error) {  
    console.error("Error adding like:", error);  
    throw new Error("Failed to add like");  
  }  
}  
  
// Remover like de una foto  
export async function removeLikeFromPhoto(photoId: string, userId: string): Promise<void> {  
  try {  
    const ref = doc(db, "plantPhotos", photoId);  
    const photoDoc = await getDoc(ref);  
    const currentLikes = photoDoc.data()?.likes || [];  
      
    await updateDoc(ref, {  
      likes: currentLikes.filter((id: string) => id !== userId),  
      likesCount: Math.max(0, currentLikes.length - 1)  
    });  
  } catch (error) {  
    console.error("Error removing like:", error);  
    throw new Error("Failed to remove like");  
  }  
}  
  
// Agregar comentario a una foto  
export async function addCommentToPhoto(  
  photoId: string,  
  comment: Omit<Comment, "id" | "createdAt">  
): Promise<string> {  
  try {  
    const ref = doc(db, "plantPhotos", photoId);  
    const photoDoc = await getDoc(ref);  
    const currentComments = photoDoc.data()?.comments || [];  
    const commentId = `comment_${Date.now()}`;  
      
    // Crear el comentario sin timestamp por ahora  
    const newComment = {  
      ...comment,  
      id: commentId,  
      createdAt: new Date() // Usar timestamp del cliente temporalmente  
    };  
      
    await updateDoc(ref, {  
      comments: [...currentComments, newComment]  
    });  
      
    return commentId;  
  } catch (error) {  
    console.error("Error adding comment:", error);  
    throw new Error("Failed to add comment");  
  }  
} 
  
// Eliminar comentario de una foto  
export async function deleteCommentFromPhoto(photoId: string, commentId: string): Promise<void> {  
  try {  
    const ref = doc(db, "plantPhotos", photoId);  
    const photoDoc = await getDoc(ref);  
    const currentComments = photoDoc.data()?.comments || [];  
      
    await updateDoc(ref, {  
      comments: currentComments.filter((c: Comment) => c.id !== commentId)  
    });  
  } catch (error) {  
    console.error("Error deleting comment:", error);  
    throw new Error("Failed to delete comment");  
  }  
}


// Funciones CRUD para perfiles  
export async function createUserProfile(  
  input: Omit<UserProfile, "id" | "createdAt" | "updatedAt">  
): Promise<string> {  
  const ref = doc(db, "userProfiles", input.uid); // Use UID as document ID  
  await setDoc(ref, {  
    ...input,  
    createdAt: serverTimestamp(),  
    updatedAt: serverTimestamp(),  
  });  
  return input.uid;  
} 
  
export async function getUserProfile(uid: string): Promise<UserProfile | null> {  
  const ref = doc(db, "userProfiles", uid);  
  const snap = await getDoc(ref);  
  return snap.exists() ? { id: snap.id, ...(snap.data() as UserProfile) } : null;  
}  
  
export async function updateUserProfile(  
  uid: string,  
  updates: Partial<Omit<UserProfile, "id" | "uid" | "createdAt">>  
): Promise<void> {  
  const ref = doc(db, "userProfiles", uid);  
  await updateDoc(ref, {  
    ...updates,  
    updatedAt: serverTimestamp(),  
  });  
}

export async function suspendUser(  
  uid: string,  
  suspendedBy: string  
): Promise<void> {  
  const ref = doc(db, "userProfiles", uid);  
  await updateDoc(ref, {  
    status: 'suspended',  
    suspendedAt: serverTimestamp(),  
    suspendedBy,  
    updatedAt: serverTimestamp(),  
  });  
}  
  
export async function unsuspendUser(uid: string): Promise<void> {  
  const ref = doc(db, "userProfiles", uid);  
  await updateDoc(ref, {  
    status: 'active',  
    suspendedAt: null,  
    suspendedBy: null,  
    updatedAt: serverTimestamp(),  
  });  
}

// Obtener una foto de planta por ID  
export async function getPlantPhoto(id: string): Promise<PlantPhoto | null> {  
  try {  
    const ref = doc(db, "plantPhotos", id);  
    const docSnap = await getDoc(ref);  
      
    if (docSnap.exists()) {  
      return { id: docSnap.id, ...docSnap.data() } as PlantPhoto;  
    } else {  
      return null;  
    }  
  } catch (error) {  
    console.error("Error getting plant photo:", error);  
    throw new Error("Failed to get plant photo");  
  }  
}

// Contar posts de un usuario  
export async function countUserPosts(uid: string): Promise<number> {  
  try {  
    const q = query(  
      collection(db, "plantPhotos"),  
      where("createdBy", "==", uid)  
    );  
    const snapshot = await getDocs(q);  
    return snapshot.size;  
  } catch (error) {  
    console.error("Error counting posts:", error);  
    return 0;  
  }  
}  
  
// Contar comentarios de un usuario  
export async function countUserComments(uid: string): Promise<number> {  
  try {  
    const allPhotos = await listPlantPhotos(1000);  
    let commentCount = 0;  
      
    allPhotos.forEach(photo => {  
      if (photo.comments) {  
        commentCount += photo.comments.filter(  
          (c: Comment) => c.createdBy === uid  
        ).length;  
      }  
    });  
      
    return commentCount;  
  } catch (error) {  
    console.error("Error counting comments:", error);  
    return 0;  
  }  
}

// Funciones CRUD para administradores    
export async function addAdmin(input: Omit<Admin, 'id' | 'createdAt'>): Promise<string> {  
  const currentUser = auth.currentUser;  
  if (!currentUser || currentUser.isAnonymous) {  
    throw new Error('Usuario no autenticado');  
  }  
      
  console.log('=== DEBUG ADDADMIN ===');  
  console.log('Usuario actual:', currentUser.email);  
  console.log('UID actual:', currentUser.uid);  
    
  // Método 1: Buscar por email como ID del documento  
  console.log('🔍 Buscando owner documento por ID (email como ID)...');  
  const ownerDocByEmail = await getDoc(doc(db, "admins", currentUser.email || ''));  
  console.log('Documento existe por email-ID:', ownerDocByEmail.exists());  
    
  if (ownerDocByEmail.exists()) {  
    const data = ownerDocByEmail.data();  
    console.log('Datos del documento por email-ID:', data);  
    console.log('Role del documento por email-ID:', data?.role);  
      
    if (data?.role === 'owner') {  
      console.log('✅ Owner verificado por email-ID');  
    } else {  
      console.log('❌ Role incorrecto por email-ID:', data?.role);  
    }  
  } else {  
    console.log('❌ No existe documento por email-ID');  
  }  
    
  // Método 2: Buscar usando getAdminByEmail (query)  
  console.log('🔍 Buscando owner usando query getAdminByEmail...');  
  const ownerDocByQuery = await getAdminByEmail(currentUser.email || '');  
  console.log('Owner encontrado por query:', !!ownerDocByQuery);  
    
  if (ownerDocByQuery) {  
    console.log('Datos del owner por query:', ownerDocByQuery);  
    console.log('Role del owner por query:', ownerDocByQuery.role);  
    console.log('ID del documento owner:', ownerDocByQuery.id);  
  }  
    
  // Verificación final usando el método que funcione  
  let isOwner = false;  
    
  if (ownerDocByEmail.exists() && ownerDocByEmail.data()?.role === 'owner') {  
    isOwner = true;  
    console.log('✅ Verificación exitosa usando email-ID');  
  } else if (ownerDocByQuery && ownerDocByQuery.role === 'owner') {  
    isOwner = true;  
    console.log('✅ Verificación exitosa usando query');  
  }  
    
  if (!isOwner) {  
    console.log('❌ ERROR: No se pudo verificar permisos de owner');  
    console.log(' - Email-ID exists:', ownerDocByEmail.exists());  
    console.log(' - Query found:', !!ownerDocByQuery);  
    throw new Error('No tienes permisos de owner');  
  }  
      
  const ref = doc(db, "admins", input.email);  
  await setDoc(ref, {  
    ...input,  
    createdAt: serverTimestamp(),  
  });  
  return input.email;  
}
  
export async function listAdmins(): Promise<Admin[]> {  
  try {  
    const ref = collection(db, "admins");  
    const qs = query(ref, orderBy("createdAt", "desc"));  
    const snap = await getDocs(qs);  
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Admin));  
  } catch (error) {  
    console.error("Error listing admins:", error);  
    throw new Error("Failed to load admins");  
  }  
}  
  
export async function deleteAdmin(adminId: string): Promise<void> {  
  try {  
    const ref = doc(db, "admins", adminId);  
    await deleteDoc(ref);  
  } catch (error) {  
    console.error("Error deleting admin:", error);  
    throw new Error("Failed to delete admin");  
  }  
}  
  
export async function getAdminByEmail(email: string): Promise<Admin | null> {  
  try {  
    const ref = collection(db, "admins");  
    const qs = query(ref, where("email", "==", email), where("role", "==", "owner"));  
    const snap = await getDocs(qs);  
    if (snap.empty) return null;  
    return { id: snap.docs[0].id, ...snap.docs[0].data() } as Admin;  
  } catch (error) {  
    console.error("Error getting owner by email:", error);  
    return null;  
  }  
}


export async function addAdminWithOwner(    
  input: Omit<Admin, 'id' | 'createdAt'>,     
  ownerEmail: string    
): Promise<string> {    
  console.log('=== DEBUG ADDADMINWITHOWNER ===');  
  console.log('Owner email a verificar:', ownerEmail);  
  console.log('Input para nuevo admin:', input);  
    
  // Verificar si el ownerEmail tiene rol 'owner' (independientemente del usuario actual)    
  console.log('🔍 Buscando documento owner...');  
  const ownerDoc = await getAdminByEmail(ownerEmail);  
    
  console.log('Owner document encontrado:', !!ownerDoc);  
  if (ownerDoc) {  
    console.log('Datos del owner:', ownerDoc);  
    console.log('Role del owner:', ownerDoc.role);  
  }  
    
  if (!ownerDoc || ownerDoc.role !== 'owner') {    
    console.log('❌ ERROR: Owner no encontrado o role incorrecto');  
    throw new Error('No tienes permisos de owner');    
  }    
    
  console.log('✅ Owner verificado, creando documento admin...');  
  console.log('Ruta del documento:', `/admins/${input.email}`);  
  console.log('Datos a guardar:', {  
    email: input.email,  
    displayName: input.displayName,  
    role: input.role,  
    createdBy: input.createdBy  
  });  
    
  const ref = doc(db, "admins", input.email);    
  await setDoc(ref, {    
    ...input,    
    createdAt: serverTimestamp(),    
  });    
    
  console.log('✅ Admin creado exitosamente');  
  return input.email;    
}