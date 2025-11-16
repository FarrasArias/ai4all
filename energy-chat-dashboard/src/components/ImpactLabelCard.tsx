// components/ImpactLabelCard.tsx
import React, { useMemo } from "react";

import labelA from "../assets/Impact_Labels_A.png";
import labelB from "../assets/Impact_Labels_B.png";
import labelC from "../assets/Impact_Labels_C.png";
import labelD from "../assets/Impact_Labels_D.png";
import labelE from "../assets/Impact_Labels_E.png";

type Grade = "A" | "B" | "C" | "D" | "E";

const LABEL_IMAGES: Record<Grade, string> = {
    A: labelA,
    B: labelB,
    C: labelC,
    D: labelD,
    E: labelE,
};

const LABEL_DESCRIPTIONS: Record<Grade, string> = {
    A: "Very low estimated impact for this session.",
    B: "Low estimated impact – efficient use of the system.",
    C: "Moderate impact – consider streamlining your prompts.",
    D: "High impact – try shorter / fewer prompts where possible.",
    E: "Very high impact – substantial resource use in this session.",
};

export type ImpactLabelCardProps = {
    latestPromptWh?: number | null;
    sessionTotalWh?: number | null;
    promptCount?: number;
    session?: 1 | 2;
};

/**
 * NOTE ABOUT THE SCORING:
 * -----------------------
 * Right now this uses simple thresholds on sessionTotalWh to assign A–E.
 * TODO: Replace with Vanessa's upgraded equation :).
 */
function computeGrade(sessionTotalWh?: number | null, latestPromptWh?: number | null): Grade {
    const v = sessionTotalWh ?? latestPromptWh ?? 0;

    if (v <= 1) return "A";
    if (v <= 3) return "B";
    if (v <= 6) return "C";
    if (v <= 10) return "D";
    return "E";
}

export default function ImpactLabelCard({
    latestPromptWh,
    sessionTotalWh,
    promptCount,
    session = 1,
}: ImpactLabelCardProps) {
    const grade = useMemo(
        () => computeGrade(sessionTotalWh, latestPromptWh),
        [sessionTotalWh, latestPromptWh]
    );

    const description = LABEL_DESCRIPTIONS[grade];

    const totalWh = sessionTotalWh ?? 0;
    const lastWh = latestPromptWh ?? null;

    return (
        <div className="gradient-card impact-card">
            <div className="impact-header">
                <div className="gradient-title">Impact Overview</div>
                <div className="gradient-subtitle">
                    Environmental impact label for this session
                    {session === 2 ? " (Session 2)" : ""}
                </div>
            </div>

            <div className="impact-body">
                <div className="impact-image-wrap">
                    <img
                        src={LABEL_IMAGES[grade]}
                        alt={`Environmental impact label ${grade}`}
                        className="impact-image"
                    />
                </div>

                <div className="impact-details">
                    <div className="impact-grade-text">Score: {grade}</div>
                    <div className="impact-description">{description}</div>

                    <div className="impact-metrics">
                        <span>{totalWh.toFixed(2)} Wh this session</span>
                        {lastWh !== null && (
                            <span>{lastWh.toFixed(2)} Wh last prompt</span>
                        )}
                        {typeof promptCount === "number" && promptCount > 0 && (
                            <span>{promptCount} prompts so far</span>
                        )}
                    </div>
                </div>
            </div>

            <div className="impact-footer">
                This label updates as you continue the conversation and use more prompts.
            </div>
        </div>
    );
}
