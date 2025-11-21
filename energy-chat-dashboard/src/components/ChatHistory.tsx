import React, { useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";

type Msg = { role: "user" | "bot"; text: string };
type Props = { messages: Msg[]; isStreaming?: boolean };

export default function ChatHistory({ messages, isStreaming = false }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    ref.current?.scrollTo({
      top: ref.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, isStreaming]);

  return (
    <div className="chat-history" ref={ref} aria-label="Chat history">
      {messages.map((m, i) => (
        <div key={i} className={`chat-bubble ${m.role}`}>
          <div className="bubble">
            <ReactMarkdown
              components={{
                strong: ({ node, ...props }) => (
                  <strong className="markdown-bold" {...props} />
                ),
                em: ({ node, ...props }) => (
                  <em className="markdown-italic" {...props} />
                ),
                h1: ({ node, ...props }) => (
                  <h1 className="markdown-h1" {...props} />
                ),
                h2: ({ node, ...props }) => (
                  <h2 className="markdown-h2" {...props} />
                ),
                ul: ({ node, ...props }) => (
                  <ul className="markdown-ul" {...props} />
                ),
                ol: ({ node, ...props }) => (
                  <ol className="markdown-ol" {...props} />
                ),
                li: ({ node, ...props }) => (
                  <li className="markdown-li" {...props} />
                ),
                code: ({ node, ...props }) => (
                  <pre className="markdown-code-block">
                    <code {...props} />
                  </pre>
                ),
              }}
            >
              {m.text}
            </ReactMarkdown>
          </div>
        </div>
      ))}

      {isStreaming && (
        <div className="chat-bubble bot">
            <div
            className="bubble typing-indicator"
            aria-label="Assistant is responding"
            >
                <span></span>
                <span></span>
                <span></span>
            </div>
        </div>
        )}
    </div>
  );
}
