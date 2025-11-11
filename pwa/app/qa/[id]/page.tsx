// src/app/qa/[id]/page.tsx  
"use client";  
  
import { useEffect, useState } from "react";  
import { addAnswer, getQuestion, listenAnswers } from "@/src/lib/firestore";  
import { ensureAnonAuth, auth } from "@/src/lib/firebase";  
import AnswerCard from "@/src/components/AnswerCard";  
  
// Configuración para permitir rutas dinámicas  
export const dynamicParams = true;  
  
export default function QuestionDetailPage({ params }: { params: { id: string } }) {  
  const { id } = params;  
  const [q, setQ] = useState<any | null>(null);  
  const [answers, setAnswers] = useState<any[]>([]);  
  const [text, setText] = useState("");  
  const [refs, setRefs] = useState("");  
  
  useEffect(() => {  
    ensureAnonAuth();  
    (async () => setQ(await getQuestion(id)))();  
    const unsub = listenAnswers(id, (arr) => setAnswers(arr));  
    return () => unsub();  
  }, [id]);  
  
  async function submitAnswer() {  
    if (!text.trim()) return;  
    await ensureAnonAuth();  
    const uid = auth.currentUser?.uid || "anon";  
    await addAnswer(id, {  
      text,  
      references: refs ? refs.split(",").map(s => s.trim()).filter(Boolean) : [],  
      createdBy: uid,  
    });  
    setText("");  
    setRefs("");  
  }  
  
  if (!q) return <div>Cargando…</div>;  
  
  return (  
    <div className="space-y-6">  
      <div className="rounded border p-4">  
        <h1 className="text-xl font-semibold">{q.text}</h1>  
        {q.context && <p className="opacity-80 mt-1">{q.context}</p>}  
        <div className="text-xs opacity-60 mt-2">{q.answersCount} respuestas</div>  
      </div>  
  
      <section className="space-y-3">  
        <h2 className="text-lg font-semibold">Respuestas</h2>  
        <div className="space-y-2">  
          {answers.map(a => <AnswerCard key={a.id} answer={a} />)}  
          {!answers.length && <p className="opacity-70">Sin respuestas aún.</p>}  
        </div>  
      </section>  
  
      <section className="space-y-2">  
        <h3 className="font-medium">Añadir respuesta</h3>  
        <textarea  
          className="w-full rounded border px-3 py-2 bg-transparent"  
          rows={3}  
          placeholder="Tu respuesta…"  
          value={text}  
          onChange={(e) => setText(e.target.value)}  
        />  
        <input  
          className="w-full rounded border px-3 py-2 bg-transparent"  
          placeholder="Referencias (CSV): placeId o URL"  
          value={refs}  
          onChange={(e) => setRefs(e.target.value)}  
        />  
        <button onClick={submitAnswer} className="px-4 py-2 rounded bg-emerald-500 text-black font-medium">  
          Publicar respuesta  
        </button>  
      </section>  
    </div>  
  );  
}