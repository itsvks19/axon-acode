import { Provider } from "@/axon.tsx";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { modelMap } from "@/Models";
import { Brain } from "lucide-react";

interface ModelSelectorProps {
  provider: Provider;
  selectedModel: string;
  onModelChange: (model: string) => void;
}

export function ModelSelector({ provider, selectedModel, onModelChange }: ModelSelectorProps) {
  const models = modelMap.get(provider) ?? [];
  const selectedModelData = models.find(model => model.id === selectedModel) || models[0];

  const typeColor = (type: string) => {
    switch (type) {
      case "fast":
        return "bg-green-500/10 text-green-700 dark:text-green-400";
      case "balanced":
        return "bg-blue-500/10 text-blue-700 dark:text-blue-400";
      case "advanced":
        return "bg-purple-500/10 text-purple-700 dark:text-purple-400";
      default:
        return "bg-muted text-muted-foreground";
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Brain className="h-4 w-4 text-muted-foreground"/>
        <span className="text-sm font-medium text-foreground">AI Model</span>
      </div>

      <Select value={selectedModel} onValueChange={onModelChange}>
        <SelectTrigger className="w-full">
          <SelectValue>
            <div className="flex items-center justify-between w-full">
              <span className="text-sm">{selectedModelData.name}</span>
              <Badge
                variant="secondary"
                className={`text-xs capitalize ${typeColor(selectedModelData.type)}`}
              >
                {selectedModelData.type}
              </Badge>
            </div>
          </SelectValue>
        </SelectTrigger>

        <SelectContent>
          {models.map((model) => (
            <SelectItem key={model.id} value={model.id} className={"group"}>
              <div className="flex items-center justify-between w-full">
                <div className="flex flex-col">
                  <span className="font-medium">{model.name}</span>
                  <span className="text-xs text-muted-foreground group-focus:text-primary-foreground/70">{model.description}</span>
                </div>
                <Badge
                  variant="secondary"
                  className={`text-xs capitalize ml-2 ${typeColor(model.type)} group-focus:bg-primary-foreground`}
                >
                  {model.type}
                </Badge>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

