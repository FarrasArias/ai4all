
import React, { useEffect, useState } from "react";
import { listModels, streamImageAnalysis, listChats } from "../api";

type Turn = [string, string | null];
export default function ImageAnalysisPane() {
  const [models, setModels] = useState<string[]>([]);
  const [model, setModel] = useState<string>("");
  const [image, setImage] = useState<File | null>(null);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [prompt, setPrompt] = useState("Describe this image");
  useEffect(() => { listModels().then((ms) => setModels(ms.filter(m => m.includes("llava") || m.includes("bakllava")))); }, []);

  function ask() {
    if (!image || !model) return;
    setTurns((t) => [...t, [prompt, null]]);
    let acc = "";
    streamImageAnalysis({ prompt, model, image }, (delta) => {
      acc += delta;
      setTurns((t) => {
        const copy = t.slice();
        copy[copy.length - 1] = [copy[copy.length - 1][0], acc];
        return copy;
      });
    });
  }

  return (
    <div className="panel-body" style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <label>Model:</label>
        <select value={model} onChange={(e) => setModel(e.target.value)}>
          <option value="" disabled>Select LLaVA model…</option>
          {models.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
        <input type="file" accept="image/*" onChange={(e) => setImage(e.target.files?.[0] ?? null)} />
      </div>
      <div style={{ display: "grid", gap: 8 }}>
        <input value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Ask about the image…" />
        <button onClick={ask}>Ask</button>
      </div>
      <div className="chat-history">
        {turns.map(([q, a], i) => (
          <div key={i} className="chat-bubble bot">
            <div className="bubble"><strong>Q:</strong> {q}<br/>{a ?? "…"}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
