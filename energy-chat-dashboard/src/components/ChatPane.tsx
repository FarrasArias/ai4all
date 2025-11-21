import React, { useEffect, useState } from "react";
import ChatHistory from "./ChatHistory";
import ChatInput from "./ChatInput";
import { listModels, streamChat, listChats, saveChat, loadChat } from "../api";

type Msg = { role: "user" | "bot"; text: string };

type Props = {
  onUserPrompt?: (m: { ts: number; text: string; words: number; chars: number }) => void;
  onHistoryChange?: (history: Msg[]) => void;
};

export default function ChatPane({ onUserPrompt, onHistoryChange }: Props) {
  const [messages, setMessages] = useState<Msg[]>([
    { role: "bot", text: "Hi! Ask me anything." },
  ]);
  const [models, setModels] = useState<string[]>([]);
  const [model, setModel] = useState<string>("");
  const [files, setFiles] = useState<File[]>([]);
  const [chats, setChats] = useState<string[]>([]);
  const [chatName, setChatName] = useState<string>("");

  const [isStreaming, setIsStreaming] = useState(false);

  useEffect(() => {
    listModels().then(setModels);
    listChats().then((j) => setChats(j.chats ?? []));
  }, []);

  useEffect(() => {
    onHistoryChange?.(messages);
  }, [messages, onHistoryChange]);

  async function handleSend(text: string) {
    if (!text.trim() || !model) return;

    if (onUserPrompt) {
      const words = text.trim().length ? text.trim().split(/\s+/).length : 0;
      const chars = text.length;
      onUserPrompt({ ts: Date.now(), text, words, chars });
    }

    // Add user message
    setMessages((m) => [...m, { role: "user", text }]);
    setIsStreaming(true);

    let acc = "";

    try {
      await streamChat({ prompt: text, model, files }, (delta: string) => {
        acc += delta;
        setMessages((m) => {
          const withoutBotTail = m[m.length - 1]?.role === "bot" ? m.slice(0, -1) : m;
          return [...withoutBotTail, { role: "bot", text: acc }];
        });
      });
    } catch (err) {
      console.error(err);
      setMessages((m) => [
        ...m,
        { role: "bot", text: "Sorry, something went wrong while generating a response." },
      ]);
    } finally {
      setIsStreaming(false);
    }
  }

  function handleSave() {
    if (!chatName) return;
    saveChat(chatName, messages).then(() =>
      listChats().then((j) => setChats(j.chats ?? []))
    );
  }

  async function handleLoad(name: string) {
    const j = await loadChat(name);
    if (Array.isArray(j)) {
      setMessages(j as any);
    } else if (j && j.length) {
      setMessages(j as any);
    } else if (j && j.history) {
      setMessages(j.history as any);
    }
    setChatName(name);
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateRows: "auto 1fr auto",
        gap: 12,
        height: "100%",
        minHeight: 0,
      }}
    >
      {/* Toolbar */}
      <div className="panel">
        <div
          className="panel-body"
          style={{ display: "flex", gap: 8, alignItems: "center" }}
        >
          <label>Model:</label>
          <select value={model} onChange={(e) => setModel(e.target.value)}>
            <option value="" disabled>
              Select model
            </option>
            {models.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>

          <input
            type="file"
            multiple
            accept=".pdf,.txt"
            onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
          />

          <input
            placeholder="Chat name"
            value={chatName}
            onChange={(e) => setChatName(e.target.value)}
          />
          <button onClick={handleSave}>Save</button>

          <select onChange={(e) => handleLoad(e.target.value)} value="">
            <option value="" disabled>
              Load saved chat
            </option>
            {chats.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Chat history */}
      <div className="panel" style={{ minHeight: 0 }}>
        <div className="panel-body" style={{ height: "100%", padding: 0 }}>
          <ChatHistory messages={messages} isStreaming={isStreaming} />
        </div>
      </div>

      {/* Input */}
      <div className="panel">
        <div className="panel-body">
          <ChatInput onSend={handleSend} />
        </div>
      </div>
    </div>
  );
}
