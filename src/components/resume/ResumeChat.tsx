import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  Send,
  Bot,
  User,
  Loader2,
} from "lucide-react";

import {
  motion,
  AnimatePresence,
} from "framer-motion";

import { chatWithResume } from "@/lib/ai-chat.functions";

interface Props {
  resumeText: string;
}

type Message = {
  role: "user" | "assistant";
  content: string;
};

const starterPrompts = [
  "Improve my summary section",
  "How can I make this more ATS friendly?",
  "Rewrite my experience bullets",
  "Suggest stronger action verbs",
];

export function ResumeChat({
  resumeText,
}: Props) {
  const [message, setMessage] = useState("");

  const [loading, setLoading] =
    useState(false);

  const [messages, setMessages] =
    useState<Message[]>([
      {
        role: "assistant",
        content:
          "Hi! I’m your AI Resume Coach. Ask me how to improve your resume, optimize ATS score, rewrite bullet points, or tailor it for a job description.",
      },
    ]);

  const bottomRef =
    useRef<HTMLDivElement | null>(null);

  const chat = useServerFn(chatWithResume);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  async function sendMessage(
    customMessage?: string
  ) {
    const finalMessage =
      customMessage || message;

    if (!finalMessage.trim() || loading)
      return;

    const userMessage: Message = {
      role: "user",
      content: finalMessage,
    };

    setMessages((prev) => [
      ...prev,
      userMessage,
    ]);

    setMessage("");

    setLoading(true);

    try {
      const response = await chat({
        data: {
          message: finalMessage,
          resumeText,
        },
      });

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: response.message,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Something went wrong while generating AI suggestions.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden rounded-[32px] border border-border bg-card shadow-sm"
    >
      {/* Header */}
      <div
        className="border-b border-border p-6"
        style={{
          background: "var(--gradient-card)",
        }}
      >
        <div className="flex items-center gap-4">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-2xl text-primary-foreground"
            style={{
              background:
                "var(--gradient-hero)",
            }}
          >
          </div>

          <div>
            <h2 className="text-2xl font-bold text-foreground">
              AI Resume Coach
            </h2>

            <p className="text-sm text-muted-foreground">
              Personalized resume
              improvements powered by AI
            </p>
          </div>
        </div>
      </div>

      {/* Starter prompts */}
      <div className="border-b border-border p-4">
        <div className="flex flex-wrap gap-2">
          {starterPrompts.map((prompt) => (
            <button
              key={prompt}
              onClick={() =>
                sendMessage(prompt)
              }
              className="rounded-full border border-border bg-background px-4 py-2 text-xs font-medium text-muted-foreground transition-all hover:border-primary hover:text-primary"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="h-125 overflow-y-auto px-4 py-6 md:px-6">
        <div className="space-y-5">
          <AnimatePresence>
            {messages.map((msg, index) => (
              <motion.div
                key={index}
                initial={{
                  opacity: 0,
                  y: 10,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                exit={{ opacity: 0 }}
                transition={{
                  duration: 0.2,
                }}
                className={`flex ${
                  msg.role === "user"
                    ? "justify-end"
                    : "justify-start"
                }`}
              >
                <div
                  className={`flex max-w-[85%] gap-3 ${
                    msg.role === "user"
                      ? "flex-row-reverse"
                      : "flex-row"
                  }`}
                >
                  {/* Avatar */}
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-primary/10 text-primary"
                    }`}
                  >
                    {msg.role === "user" ? (
                      <User className="h-5 w-5" />
                    ) : (
                      <Bot className="h-5 w-5" />
                    )}
                  </div>

                  {/* Bubble */}
                  <div
                    className={`rounded-3xl px-5 py-4 text-sm leading-7 shadow-sm ${
                      msg.role === "user"
                        ? "rounded-tr-md bg-primary text-primary-foreground"
                        : "rounded-tl-md border border-border bg-background text-foreground"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">
                      {msg.content}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Loading */}
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-3"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Bot className="h-5 w-5" />
              </div>

              <div className="flex items-center gap-2 rounded-3xl border border-border bg-background px-5 py-4 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                AI is analyzing your resume...
              </div>
            </motion.div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-border bg-background/70 p-4 md:p-5">
        <div className="flex items-end gap-3 rounded-3xl border border-border bg-card p-3 shadow-sm">
          <textarea
            value={message}
            onChange={(e) =>
              setMessage(e.target.value)
            }
            placeholder="Ask AI how to improve your resume..."
            rows={1}
            className="max-h-40 min-h-12 flex-1 resize-none bg-transparent px-2 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground"
            onKeyDown={(e) => {
              if (
                e.key === "Enter" &&
                !e.shiftKey
              ) {
                e.preventDefault();
                sendMessage();
              }
            }}
          />

          <button
            onClick={() => sendMessage()}
            disabled={
              loading || !message.trim()
            }
            className="flex h-12 w-12 items-center justify-center rounded-2xl text-primary-foreground transition-all hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50"
            style={{
              background:
                "var(--gradient-hero)",
            }}
          >
            <Send className="h-5 w-5" />
          </button>
        </div>

        <p className="mt-3 text-center text-xs text-muted-foreground">
          AI suggestions are generated
          based on your uploaded resume.
        </p>
      </div>
    </motion.div>
  );
}