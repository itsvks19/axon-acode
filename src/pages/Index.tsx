import { AxonProps } from "@/axon";
import { AIAssistant } from "@/components/AIAssistant";

const Index = ({ settings }: AxonProps) => {
  return (
    <div className="h-full box-border m-0 p-0 bg-muted/30">
      <AIAssistant settings={settings} />
    </div>
  );
};

export default Index;
