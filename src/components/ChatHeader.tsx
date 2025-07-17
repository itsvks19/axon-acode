import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Bot, Minimize2, Settings2 } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";

interface ChatHeaderProps {
  onSettingsClick: () => void;
}

export function ChatHeader({ onSettingsClick }: ChatHeaderProps) {
  const { toast } = useToast();

  return (
    <div className="flex items-center justify-between p-4 border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center">
            <Bot className="w-4 h-4 text-primary-foreground animate-wave"/>
          </div>
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-success rounded-full border-2 border-background"></div>
        </div>

        <div>
          <h2 className="font-semibold text-foreground">Axon</h2>
          <p className="text-xs text-muted-foreground">
            Your AI pair programmer
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <ThemeToggle/>

        <Button
          variant="ghost"
          size="sm"
          onClick={onSettingsClick}
          className="hover:bg-accent/80"
        >
          <Settings2 className="h-4 w-4"/>
        </Button>

        {/*<Button*/}
        {/*  variant="ghost"*/}
        {/*  size="sm"*/}
        {/*  className="h-8 w-8 p-0"*/}
        {/*  onClick={() => {*/}
        {/*    toast({*/}
        {/*      title: "Hello",*/}
        {/*      description: "Simple hello message",*/}
        {/*      duration: 3000,*/}
        {/*    });*/}
        {/*  }}*/}
        {/*>*/}
        {/*  <Minimize2 className="w-4 h-4"/>*/}
        {/*</Button>*/}
      </div>
    </div>
  );
}
