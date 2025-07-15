import { Bot, Code, Lightbulb, MessageCircle } from "lucide-react";

export function EmptyState() {
  const suggestions = [
    {
      icon: Code,
      title: "Code Review",
      description: "Help me review this function for potential issues",
    },
    {
      icon: Lightbulb,
      title: "Optimization",
      description: "How can I make this code more efficient?",
    },
    {
      icon: MessageCircle,
      title: "Explanation",
      description: "Explain how this algorithm works step by step",
    },
  ];

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
      <div className="relative mb-6">
        <div className="w-16 h-16 rounded-full bg-gradient-primary flex items-center justify-center animate-bounce-gentle">
          <Bot className="w-8 h-8 text-primary-foreground" />
        </div>
        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-success rounded-full border-2 border-background"></div>
      </div>
      
      <h3 className="text-xl font-semibold text-foreground mb-2">
        Hi! I'm Axon 👋
      </h3>
      
      <p className="text-muted-foreground mb-8 max-w-md leading-relaxed">
        I'm your AI pair programmer, ready to help you write better code, 
        debug issues, and learn new concepts. What would you like to work on today?
      </p>
      
      <div className="grid gap-3 w-full max-w-md">
        {suggestions.map((suggestion, index) => (
          <div
            key={index}
            className="flex items-center gap-3 p-3 rounded-xl border border-border/50 hover:border-primary/10 hover:bg-accent/10 transition-all duration-200 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center group-hover:bg-primary transition-colors">
              <suggestion.icon className="w-4 h-4 text-muted-foreground group-hover:text-primary-foreground" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-foreground">{suggestion.title}</p>
              <p className="text-xs text-muted-foreground">{suggestion.description}</p>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-8 text-xs text-muted-foreground">
        💡 Pro tip: You can ask me about any programming language or framework!
      </div>
    </div>
  );
}