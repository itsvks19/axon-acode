import { useState } from "react";
import { Copy, RotateCcw, Code, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { isAcode } from "@/lib/utils";

interface ChatMessageProps {
  message: {
    id: string;
    content: string;
    role: "user" | "assistant" | "system";
    timestamp: Date;
  };
  isLatest?: boolean;
  handleExplainAgain: () => void;
  handleInsertCode: () => void;
}

export function ChatMessage({
  message,
  isLatest = false,
  handleExplainAgain,
  handleInsertCode,
}: ChatMessageProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    toast({
      title: "Copied to clipboard",
      duration: 2000,
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const isUser = message.role === "user";
  const isAssistant = message.role === "assistant";

  // Don't render system messages in the UI
  if (message.role === "system") {
    return null;
  }

  return (
    <div
      className={`flex w-full mb-4 animate-slide-up ${
        isUser ? "justify-end" : "justify-start"
      }`}
    >
      <div className={`max-w-[80%] ${isUser ? "order-2" : "order-1"}`}>
        {/* Avatar and Name */}
        <div
          className={`flex items-center mb-2 ${isUser ? "justify-end" : "justify-start"}`}
        >
          <div
            className={`flex items-center gap-2 ${isUser ? "flex-row-reverse" : "flex-row"}`}
          >
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                isUser
                  ? "bg-gradient-user text-user-bubble-foreground"
                  : "bg-gradient-ai text-ai-bubble-foreground"
              }`}
            >
              {isUser ? "Y" : "A"}
            </div>
            <span className="text-sm font-medium text-muted-foreground">
              {isUser ? "You" : "Axon"}
            </span>
          </div>
        </div>

        {/* Message Bubble */}
        <div
          className={`relative px-4 py-3 rounded-2xl shadow-bubble ${
            isUser
              ? "bg-gradient-user text-user-bubble-foreground rounded-br-md"
              : "bg-gradient-ai text-ai-bubble-foreground rounded-bl-md"
          }`}
        >
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {message.content}
          </p>

          {/* Timestamp */}
          <div
            className={`mt-2 text-xs opacity-70 ${isUser ? "text-right" : "text-left"}`}
          >
            {message.timestamp.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        </div>

        {/* Action Buttons (only for AI messages) */}
        {isAssistant && (
          <div className="flex gap-2 mt-2 animate-fade-in">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="h-7 px-2 text-xs hover:bg-accent/80 hover:text-accent-foreground transition-colors"
            >
              {copied ? (
                <Check className="w-3 h-3 mr-1" />
              ) : (
                <Copy className="w-3 h-3 mr-1" />
              )}
              {copied ? "Copied!" : "Copy"}
            </Button>

            {isAcode() && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleInsertCode}
                className="h-7 px-2 text-xs hover:bg-accent/80 hover:text-accent-foreground transition-colors"
              >
                <Code className="w-3 h-3 mr-1" />
                Insert Code
              </Button>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={handleExplainAgain}
              className="h-7 px-2 text-xs hover:bg-accent/80 hover:text-accent-foreground transition-colors"
            >
              <RotateCcw className="w-3 h-3 mr-1" />
              Explain Again
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
