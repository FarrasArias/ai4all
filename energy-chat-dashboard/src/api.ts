
export const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:8000";

export function sse(url: string, onMessage: (data: any) => void, onError?: (e: any) => void) {
  const es = new EventSource(url, { withCredentials: false });
  es.onmessage = (evt) => {
    try { onMessage(JSON.parse(evt.data)); } catch { /* ignore */ }
  };
  es.onerror = (e) => { es.close(); onError?.(e); };
  return () => es.close();
}

export async function listModels(): Promise<string[]> {
  const r = await fetch(`${API_BASE}/api/models`);
  const j = await r.json();
  return j.models ?? [];
}

export async function pullModel(name: string) {
  const body = new FormData();
  body.append("name", name);
  const r = await fetch(`${API_BASE}/api/models/pull`, { method: "POST", body });
  return r.json();
}

export async function createModel(name: string, modelfile: string) {
  const body = new FormData();
  body.append("name", name);
  body.append("modelfile", modelfile);
  const r = await fetch(`${API_BASE}/api/models/create`, { method: "POST", body });
  return r.json();
}

export async function deleteModels(models: string[]) {
  const r = await fetch(`${API_BASE}/api/models?` + new URLSearchParams({ models: models as any }), { method: "DELETE" });
  return r.json();
}

export function streamChat({ prompt, model, files }: { prompt: string; model: string; files?: File[] },
  onDelta: (text: string) => void) {
  const body = new FormData();
  body.append("prompt", prompt);
  body.append("model", model);
  (files ?? []).forEach((f) => body.append("files", f));
  return fetch(`${API_BASE}/api/chat`, { method: "POST", body })
    .then(async (res) => {
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split("\n\n")) {
          if (!line.startsWith("data:")) continue;
          const payload = JSON.parse(line.slice(5).trim());
          if (payload.delta) onDelta(payload.delta);
        }
      }
    });
}

export function streamImageAnalysis({ prompt, model, image }: { prompt: string; model: string; image: File },
  onDelta: (text: string) => void) {
  const body = new FormData();
  body.append("prompt", prompt);
  body.append("model", model);
  body.append("image", image);
  return fetch(`${API_BASE}/api/image/analyze`, { method: "POST", body })
    .then(async (res) => {
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split("\n\n")) {
          if (!line.startsWith("data:")) continue;
          const payload = JSON.parse(line.slice(5).trim());
          if (payload.delta) onDelta(payload.delta);
        }
      }
    });
}

export function streamPower(onUpdate: (summary: { latest_prompt_Wh: number; session_total_Wh: number; today_total_Wh: number }) => void) {
  return sse(`${API_BASE}/api/power/stream`, onUpdate);
}

export async function powerSummary() {
  const r = await fetch(`${API_BASE}/api/power/summary`);
  return r.json();
}

export async function listChats() {
  const r = await fetch(`${API_BASE}/api/chats`);
  return r.json();
}

export async function saveChat(name: string, history: any) {
  const body = new FormData();
  body.append("name", name);
  body.append("history_json", JSON.stringify(history));
  const r = await fetch(`${API_BASE}/api/chats/save`, { method: "POST", body });
  return r.json();
}

export async function loadChat(name: string) {
  const r = await fetch(`${API_BASE}/api/chats/${encodeURIComponent(name)}`);
  return r.json();
}

export async function saveStudySession(opts: {
  name: string;           // e.g. "SIAT-0123_s1"
  history: any;           // chat transcript array/object
  metrics?: any;          // [{ ts, text, words, chars }, ...]
  session?: any;          // { participantId, group, session, taskStartedAt, taskEndedAt, energy: {...} }
  interviewText?: string; // optional
}): Promise<{ ok: boolean }> {
  const fd = new FormData();
  fd.set("name", opts.name);
  fd.set("history_json", JSON.stringify(opts.history));
  if (opts.metrics) fd.set("metrics_json", JSON.stringify(opts.metrics));
  if (opts.session) fd.set("session_json", JSON.stringify(opts.session));
  if (opts.interviewText) fd.set("interview_text", opts.interviewText);

  const res = await fetch(`${API_BASE}/api/chats/save`, { method: "POST", body: fd });
  return { ok: res.ok };
}