import React, { useEffect, useRef } from "react";

type Msg = { role: "user" | "bot"; text: string };
type Props = { messages: Msg[] };

export default function ChatHistory({ messages }: Props) {
    const ref = useRef<HTMLDivElement | null>(null);
    useEffect(() => {
        ref.current?.scrollTo({ top: ref.current.scrollHeight, behavior: "smooth" });
    }, [messages]);

    return (
        <div className="chat-history" ref={ref} aria-label="Chat history">
            {messages.map((m, i) => (
                <div key={i} className={`chat-bubble ${m.role}`}>
                    <div className="bubble">{m.text}</div>
                </div>
            ))}
        </div>
    );
}
