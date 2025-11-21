import React from "react";
import EUIWidget from "./EUIWidget";
import Meter from "./Meter"; // TODO: Still here for legacy but probably remove in the future.
import ImpactLabelCard from "./ImpactLabelCard";

type Props = {
    kwhUsed: number;
    lastPromptEnergyPct: number;
    totalEnergyPct: number;
    litresWater: number;

    showEUI?: boolean;
    latestPromptWh?: number | null;
    sessionTotalWh?: number | null;
    session1TotalWh?: number | null;
    session?: 1 | 2;

    // for the prompt-based semaphore label
    promptCount?: number;
};


export default function Sidebar({
    kwhUsed,
    lastPromptEnergyPct,
    totalEnergyPct,
    litresWater,
    showEUI = false,
    latestPromptWh,
    sessionTotalWh,
    session1TotalWh,
    session = 1,
    promptCount,
}: Props) {
    return (
        <div className="sidebar-inner">

            <section className="section-eui">
                <EUIWidget
                    show={showEUI}
                    latestPromptWh={latestPromptWh}
                    sessionTotalWh={sessionTotalWh}
                    session1TotalWh={session1TotalWh ?? undefined}
                    session={session}
                    variant="sidebar"
                />
            </section>

            {showEUI && (
                <section className="section-gradient">
                    <ImpactLabelCard
                        latestPromptWh={latestPromptWh}
                        sessionTotalWh={sessionTotalWh}
                        promptCount={promptCount}
                        session={session}
                    />
                </section>
            )}
        </div>
    );
}