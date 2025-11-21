import { useEffect, useState } from "react";
import Sidebar from "./components/Sidebar";
import ChatPane from "./components/ChatPane";
import ModelManagerPane from "./components/ModelManagerPane";
// import ImageAnalysisPane from "./components/ImageAnalysisPane";
// import AnalyticsPane from "./components/AnalyticsPane";
import { streamPower, saveStudySession } from "./api";

import StudyControls, { loadPersistedStudySettings } from "./components/StudyControls";
import type { StudySettings, PromptMetric } from "./components/StudyControls";

// Keep in sync with ChatPane's message shape
type Msg = { role: "user" | "bot"; text: string };

export default function App() {
    const [kwhUsed, setKwhUsed] = useState(0);
    const [lastPromptEnergyPct, setLastPromptEnergyPct] = useState(0);
    const [totalEnergyPct, setTotalEnergyPct] = useState(0);
    const [litresWater, setLitresWater] = useState(0);
    const [tab, setTab] = useState<"input" | "chat" | "image" | "models" | "analytics">("chat");

    const [latestPromptWh, setLatestPromptWh] = useState<number | null>(null);
    const [sessionTotalWh, setSessionTotalWh] = useState<number | null>(null);
    const [todayTotalWh, setTodayTotalWh] = useState<number | null>(null);

    // ----- Study settings & metrics -----
    const persisted = loadPersistedStudySettings() || {};
    const [study, setStudy] = useState<StudySettings>({
        participantId: persisted.participantId || "",
        group: (persisted.group as any) || "control",
        session: (persisted.session as any) || 1,
        taskStartedAt: null,
        taskEndedAt: null,
    });
    const [promptMetrics, setPromptMetrics] = useState<PromptMetric[]>([]);
    const [s1TotalWh, setS1TotalWh] = useState<number | null>(() => {
        try {
            const key = `ai4all.study.s1TotalWh.${persisted.participantId || "anon"}`;
            const raw = localStorage.getItem(key);
            return raw ? Number(raw) : null;
        } catch {
            return null;
        }
    });

    // OPTIONAL: keep a copy of the transcript in App so we can save it with the study bundle
    const [messages, setMessages] = useState<Msg[]>([]);

    // Collapse behaviour
    const [controlsCollapsed, setControlsCollapsed] = useState(false);

    // ----- Power stream (kept) + expose raw Wh for EUI -----
    useEffect(() => {
        const stop = streamPower((s) => {
            const latestWh = s.latest_prompt_Wh ?? 0;
            const sessionWh = s.session_total_Wh ?? 0;
            const todayWh = s.today_total_Wh ?? 0;

            // legacy sidebar metrics. TODO: Check if should remove.
            setKwhUsed(todayWh / 1000);
            setLastPromptEnergyPct(Math.min(100, (latestWh / 1.0) * 100)); // vs 1 Wh baseline
            setTotalEnergyPct(Math.min(100, (sessionWh / 10.0) * 100)); // vs 10 Wh baseline
            setLitresWater(0); // TODO: placeholder

            // raw Wh for EUI widget
            setLatestPromptWh(latestWh);
            setSessionTotalWh(sessionWh);
            setTodayTotalWh(todayWh);
        });
        return stop;
    }, []);

    // ----- Study handlers -----
    function handleStudyChange(next: StudySettings) {
        setStudy((s) => ({ ...s, ...next }));
        // if participantId changes, try to load their S1 total (so Session 2 can show it)
        if (next.participantId && next.participantId !== study.participantId) {
            try {
                const key = `ai4all.study.s1TotalWh.${next.participantId}`;
                const raw = localStorage.getItem(key);
                setS1TotalWh(raw ? Number(raw) : null);
            } catch {
                // ignore
            }
        }
    }

    function handleStartTask() {
        setStudy((s) => ({ ...s, taskStartedAt: Date.now(), taskEndedAt: null }));
        setPromptMetrics([]); // reset metrics for the new task window
    }

    async function handleEndTask() {
        const endedAt = Date.now();
        setStudy((s) => ({ ...s, taskEndedAt: endedAt }));

        // Persist Session-1 total locally so Session-2 can reference it
        if (study.session === 1 && typeof sessionTotalWh === "number") {
            const key = `ai4all.study.s1TotalWh.${study.participantId || "anon"}`;
            localStorage.setItem(key, String(sessionTotalWh));
            setS1TotalWh(sessionTotalWh);
        }

        // Build folder name and save full study bundle via existing /api/chats/save
        const sessionName = `${(study.participantId || "anon").trim()}_s${study.session}`;

        await saveStudySession({
            name: sessionName,
            history: messages, // transcript lifted from ChatPane via onHistoryChange
            metrics: promptMetrics,
            session: {
                participantId: study.participantId,
                group: study.group,
                session: study.session,
                taskStartedAt: study.taskStartedAt,
                taskEndedAt: endedAt,
                energy: {
                    latestPromptWh: latestPromptWh ?? null,
                    sessionTotalWh: sessionTotalWh ?? null,
                    todayTotalWh: todayTotalWh ?? null,
                    session1TotalWh: s1TotalWh ?? null, // handy for Session 2 audits
                },
            },
        });
    }

    return (
        <div className="app-grid">
            <aside className="sidebar">
                <Sidebar
                    kwhUsed={kwhUsed}
                    lastPromptEnergyPct={lastPromptEnergyPct}
                    totalEnergyPct={totalEnergyPct}
                    litresWater={litresWater}
                    showEUI={study.group === "intervention"}
                    latestPromptWh={latestPromptWh}
                    sessionTotalWh={sessionTotalWh}
                    session1TotalWh={s1TotalWh}
                    session={study.session}
                    promptCount={promptMetrics.length}   
                />
            </aside>

            <section className="chat">
                {/* Top bar tabs (row 1: auto) */}
                <div className="panel">
                    <div className="panel-body" style={{ display: "flex", gap: 8 }}>
                        <button onClick={() => setTab("chat")}>Chat</button>
                        {/* <button onClick={() => setTab("image")}>Image</button> */}
                        <button onClick={() => setTab("models")}>Models</button>
                        {/* <button onClick={() => setTab("analytics")}>Analytics</button> */}
                    </div>
                </div>

                {/* Main area (row 2: 1fr) */}
                <div className="chat-main">
                    {tab === "chat" && (
                        <>
                            <StudyControls
                                settings={study}
                                onSettingsChange={handleStudyChange}
                                onStartTask={handleStartTask}
                                onEndTask={handleEndTask}
                                prompts={promptMetrics}
                                s1TotalWh={s1TotalWh}
                                collapsible
                                collapsed={controlsCollapsed}
                                onToggleCollapsed={() => setControlsCollapsed((v) => !v)}
                            />
                            {/* Chat fills remaining space */}
                            <ChatPane
                                onUserPrompt={(m) => setPromptMetrics((arr) => [...arr, m])}
                                onHistoryChange={(history) => setMessages(history)}
                            />
                        </>
                    )}

                    {tab === "models" && <ModelManagerPane />}
                    {/* {tab === "image" && <ImageAnalysisPane />} */}
                    {/* {tab === "analytics" && <AnalyticsPane />} */}
                </div>
            </section>
        </div>
    );
}
