import { useState } from "react";
import { Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading?: boolean;
}

export function ChatInput({ onSendMessage, isLoading = false }: ChatInputProps) {
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isLoading) {
      onSendMessage(message.trim());
      setMessage("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="border-t border-border bg-background/80 backdrop-blur-sm p-4">
      <form onSubmit={handleSubmit} className="flex gap-3 items-end">
        <div className="flex-1">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Axon anything... (Press Enter to send, Shift+Enter for new line)"
            className="min-h-[44px] max-h-32 resize-none bg-muted/50 border-border/50 focus:border-primary/50 rounded-xl transition-all duration-200"
            disabled={isLoading}
          />
        </div>
        
        <Button
          type="submit"
          size="sm"
          disabled={!message.trim() || isLoading}
          className="h-11 w-11 p-0 rounded-xl bg-gradient-primary hover:opacity-90 transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:scale-100"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </Button>
      </form>
      
      <div className="mt-2 text-xs text-muted-foreground text-center">
        Axon is here to help with your code. Ask questions, request explanations, or get suggestions!
      </div>
    </div>
  );
}