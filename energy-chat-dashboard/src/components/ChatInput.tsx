import React, { useState } from "react";

type Props = { onSend: (text: string) => void };

export default function ChatInput({ onSend }: Props) {
    const [text, setText] = useState("");

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        onSend(text);
        setText("");
    }

    return (
        <form className="chat-input" onSubmit={handleSubmit} aria-label="Chat composer">
            <input
                className="chat-text"
                placeholder="Type your message"
                value={text}
                onChange={(e) => setText(e.target.value)}
            />
            <button className="chat-send" type="submit" aria-label="Send message">
                Send
            </button>
        </form>
    );
}
