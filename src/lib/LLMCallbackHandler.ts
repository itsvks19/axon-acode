import { BaseTracer, type Run } from "@langchain/core/tracers/base";

export class LLMCallbackHandler extends BaseTracer {
  name = "llm-callback";
  private isProcessing = false;
  private currentStep = "";

  constructor(private updateStatus: (text: string) => void) {
    super();
  }

  protected persistRun(run: Run): Promise<void> {
    return Promise.resolve();
  }

  onLLMStart(run: Run): void | Promise<void> {
    this.isProcessing = true;
    this.currentStep = "llm";
    this.updateStatus("Starting...");
  }

  onLLMEnd(run: Run): void | Promise<void> {
    if (this.currentStep === "llm") {
      this.updateStatus("Success");
      this.isProcessing = false;
    }
  }

  onLLMError(run: Run): void | Promise<void> {
    this.updateStatus("Error occurred while thinking");
    this.isProcessing = false;
  }

  // Chain Events
  onChainStart(run: Run): void | Promise<void> {
    const chainName = run.name;

    if (chainName.includes("agent")) {
      this.updateStatus("Agent starting...");
    } else if (chainName.includes("retriever")) {
      this.updateStatus("Retrieving relevant information...");
    } else if (chainName.includes("parser")) {
      this.updateStatus("Parsing response...");
    } else {
      this.updateStatus("Thinking...");
    }
  }

  onChainEnd(run: Run): void | Promise<void> {
    if (!this.isProcessing) {
      this.updateStatus("completed");
    }
  }

  onChainError(run: Run): void | Promise<void> {
    this.updateStatus("execution failed");
  }

  onToolStart(run: Run): void | Promise<void> {
    this.isProcessing = true;
    this.currentStep = "tool";

    const toolName = run.name;
    console.log(toolName);
    const toolInput = run.inputs?.input || run.inputs?.query || run.inputs?.args || "";
    console.log(toolInput);

    const toolInfo = this.getToolInfo(run);

    let statusMessage = `Calling tool: ${toolInfo.displayName}`;

    if (toolInfo.functionName) {
      statusMessage += ` → ${toolInfo.functionName}()`;
    }

    // Add input preview if available and reasonable length
    if (toolInfo.inputPreview) {
      statusMessage += ` with "${toolInfo.inputPreview}"`;
    }

    this.updateStatus(statusMessage + "...");
  }

  private getToolInfo(run: Run) {
    const toolName = run.name;
    const inputs = run.inputs || {};

    // Extract function name from various possible locations
    let functionName = "";
    let inputPreview = "";
    let displayName = toolName;

    // Check for function name in different formats
    if (inputs.function) {
      functionName = inputs.function;
    } else if (inputs.tool_name) {
      functionName = inputs.tool_name;
    } else if (inputs.action) {
      functionName = inputs.action;
    } else if (toolName.includes("_")) {
      const parts = toolName.split("_");
      if (parts.length > 1) {
        displayName = parts[0];
        functionName = parts.slice(1).join("_");
      }
    } else if (toolName.includes("-")) {
      // Extract function from tool name like "web-search"
      const parts = toolName.split("-");
      if (parts.length > 1) {
        displayName = parts[0];
        functionName = parts.slice(1).join("-");
      }
    }

    // Get input preview from various sources
    const inputSources = [
      inputs.input,
      inputs.query,
      inputs.args,
      inputs.prompt,
      inputs.text,
      inputs.question,
      inputs.search_query,
      inputs.url,
      inputs.path,
      inputs.file_path,
      inputs.code,
      inputs.sql,
      inputs.expression
    ];

    for (const source of inputSources) {
      if (source && typeof source === 'string' && source.trim()) {
        inputPreview = source.length > 40 ? source.substring(0, 40) + "..." : source;
        break;
      } else if (source && typeof source === 'object') {
        // Handle object inputs
        try {
          const jsonStr = JSON.stringify(source);
          inputPreview = jsonStr.length > 40 ? jsonStr.substring(0, 40) + "..." : jsonStr;
        } catch (e) {
          inputPreview = "[object]";
        }
        break;
      }
    }

    // Clean up display name
    displayName = displayName.replace(/[-_]/g, " ");

    return {
      displayName,
      functionName,
      inputPreview,
      originalName: toolName
    };
  }

  onToolEnd(run: Run): void | Promise<void> {
    if (this.currentStep === "tool") {
      const toolInfo = this.getToolInfo(run);

      // Show completion with exact tool name
      let statusMessage = `${toolInfo.displayName}`;
      if (toolInfo.functionName) {
        statusMessage += ` → ${toolInfo.functionName}()`;
      }
      statusMessage += " completed";

      // Add result preview if available
      const result = this.getResultPreview(run);
      if (result) {
        statusMessage += ` → ${result}`;
      }

      this.updateStatus(statusMessage);
      this.isProcessing = false;
    }
  }

  onToolError(run: Run): void | Promise<void> {
    const toolInfo = this.getToolInfo(run);

    let statusMessage = `❌ ${toolInfo.displayName}`;
    if (toolInfo.functionName) {
      statusMessage += ` → ${toolInfo.functionName}()`;
    }
    statusMessage += " failed";

    // Add error details if available
    const error = run.error;
    if (error && typeof error === 'string' && error.length < 60) {
      statusMessage += `: ${error}`;
    }

    this.updateStatus(statusMessage);
    this.isProcessing = false;
  }

  // Agent Events
  onAgentAction(run: Run): void | Promise<void> {
    this.isProcessing = true;
    this.currentStep = "agent";

    const action = run.inputs?.action;
    const tool = action?.tool;
    const input = action?.toolInput || action?.input;

    if (tool) {
      // Show exact tool and function the agent decided to use
      const toolInfo = this.parseAgentToolInfo(tool, action);

      let statusMessage = `Axon is selecting tool: ${toolInfo.displayName}`;

      if (toolInfo.functionName) {
        statusMessage += ` → ${toolInfo.functionName}()`;
      }

      // Add input preview
      if (toolInfo.inputPreview) {
        statusMessage += ` with "${toolInfo.inputPreview}"`;
      }

      this.updateStatus(statusMessage + "...");
    } else {
      this.updateStatus("Axon is taking action...");
    }
  }

  private parseAgentToolInfo(tool: string, action: any) {
    let displayName = tool;
    let functionName = "";
    let inputPreview = "";

    // Extract function name from tool string
    if (tool.includes("_")) {
      const parts = tool.split("_");
      displayName = parts[0];
      functionName = parts.slice(1).join("_");
    } else if (tool.includes("-")) {
      const parts = tool.split("-");
      displayName = parts[0];
      functionName = parts.slice(1).join("-");
    }

    // Get input preview from action
    const input = action?.toolInput || action?.input || action?.args;
    if (input) {
      if (typeof input === 'string') {
        inputPreview = input.length > 40 ? input.substring(0, 40) + "..." : input;
      } else if (typeof input === 'object') {
        try {
          const jsonStr = JSON.stringify(input);
          inputPreview = jsonStr.length > 40 ? jsonStr.substring(0, 40) + "..." : jsonStr;
        } catch (e) {
          inputPreview = "[object]";
        }
      }
    }

    return {
      displayName: displayName.replace(/[-_]/g, " "),
      functionName,
      inputPreview
    };
  }

  private getResultPreview(run: Run) {
    const outputs = run.outputs;
    if (!outputs) return "";

    // Check various output formats
    const resultSources = [
      outputs.result,
      outputs.output,
      outputs.response,
      outputs.data,
      outputs.text,
      outputs.content,
      outputs.answer,
      outputs.value
    ];

    for (const source of resultSources) {
      if (source && typeof source === 'string' && source.trim()) {
        return source.length > 30 ? source.substring(0, 30) + "..." : source;
      } else if (source && typeof source === 'object') {
        try {
          const jsonStr = JSON.stringify(source);
          return jsonStr.length > 30 ? jsonStr.substring(0, 30) + "..." : jsonStr;
        } catch (e) {
          return "[result]";
        }
      }
    }

    return "";
  }

  onAgentFinish(run: Run): void | Promise<void> {
    this.updateStatus("Agent completed task");
    this.isProcessing = false;
  }

  // Retriever Events
  onRetrieverStart(run: Run): void | Promise<void> {
    this.isProcessing = true;
    this.currentStep = "retriever";

    const query = run.inputs?.query || run.inputs?.input || "";
    const context = query && query.length < 50 ? ` for "${query}"` : "";

    this.updateStatus(`Searching knowledge base${context}...`);
  }

  onRetrieverEnd(run: Run): void | Promise<void> {
    if (this.currentStep === "retriever") {
      const docs = run.outputs?.documents || [];
      const count = Array.isArray(docs) ? docs.length : 0;

      this.updateStatus(`Found ${count} relevant document${count !== 1 ? 's' : ''}`);
      this.isProcessing = false;
    }
  }

  onRetrieverError(run: Run): void | Promise<void> {
    this.updateStatus("Failed to retrieve documents");
    this.isProcessing = false;
  }

  // Text Events (for streaming)
  onText(run: Run): void | Promise<void> {
    // Only show if we're not already processing something else
    if (!this.isProcessing) {
      this.updateStatus("Generating response...");
    }
  }

  // Custom utility methods
  public setCustomStatus(status: string): void {
    this.updateStatus(status);
  }

  public isCurrentlyProcessing(): boolean {
    return this.isProcessing;
  }

  public getCurrentStep(): string {
    return this.currentStep;
  }

  // Override for more detailed run tracking
  protected override async _endTrace(run: Run): Promise<void> {
    await super._endTrace(run);

    // Final status update based on run type
    if (run.run_type === "chain" && run.name.includes("agent")) {
      this.updateStatus("Agent workflow completed");
    }
  }
}
