import React, { useEffect, useState } from "react";
import { listModels, pullModel, deleteModels, createModel } from "../api";

export default function ModelManagerPane() {
    const [models, setModels] = useState<string[]>([]);
    const [pullName, setPullName] = useState("");
    const [createName, setCreateName] = useState("");
    const [modelfile, setModelfile] = useState("FROM mistral\nSYSTEM You are helpful.");

    const refresh = () => listModels().then(setModels);

    useEffect(() => {
        refresh();
    }, []);

    return (
        <div className="panel-body" style={{ display: "grid", gap: 16 }}>
            <div><strong>Installed models ({models.length}):</strong><div>{models.join(", ") || "—"}</div></div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input placeholder="ollama library name e.g. llama3" value={pullName} onChange={(e) => setPullName(e.target.value)} />
                <button onClick={() => pullModel(pullName).then(refresh)}>Pull</button>
            </div>
            <div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <input placeholder="new model name" value={createName} onChange={(e) => setCreateName(e.target.value)} />
                    <button onClick={() => createModel(createName, modelfile).then(refresh)}>Create</button>
                </div>
                <textarea value={modelfile} onChange={(e) => setModelfile(e.target.value)} rows={6} style={{ width: "100%" }} />
            </div>
            <div>
                <button onClick={() => deleteModels(models).then(refresh)}>Delete ALL (careful)</button>
            </div>
            <button onClick={refresh}>Refresh</button>
        </div>
    );
}
