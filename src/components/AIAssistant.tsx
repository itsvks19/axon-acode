import { acodeFs, AxonProps, type Provider } from "@/axon";
import { FileContext, type FileItem } from "@/components/FileContext.tsx";
import { ModelSelector } from "@/components/ModelSelector.tsx";
import { Button } from "@/components/ui/button.tsx";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { LLMCallbackHandler } from "@/lib/LLMCallbackHandler.ts";
import { getFirstAdvancedModel } from "@/Models";
import { getActiveFileUri, setCurrentEditorText } from "@/tools/editor.ts";
import {
  getFileName,
  getOpenedFileUris,
  readFile,
  writeFile,
} from "@/tools/fs.ts";
import { logTool } from "@/tools/logger.ts";
import { ChatAnthropic } from "@langchain/anthropic";
import { AIMessage, HumanMessage } from "@langchain/core/messages";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatGroq } from "@langchain/groq";
import { ChatMistralAI } from "@langchain/mistralai";
import { ChatOpenAI } from "@langchain/openai";
import { AgentExecutor, createToolCallingAgent } from "langchain/agents";
import { X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChatHeader } from "./ChatHeader";
import { ChatInput } from "./ChatInput";
import { ChatMessage } from "./ChatMessage";
import { EmptyState } from "./EmptyState";
import { isAcode } from "@/lib/utils";

const ACODE_SYSTEM_PROMPT = `You are Axon, a highly capable AI pair programmer embedded in Acode — a lightweight code editor for Android.

Your mission is to assist the user in writing, debugging, and improving code efficiently. You can understand the current file contents and interact using specialized tools.

You must think step-by-step and call tools when needed.

Your capabilities include:
- Understanding code context provided by the user or loaded from files.
- Detecting bugs or anti-patterns and suggesting clean, idiomatic fixes.
- Writing functions, classes, or code snippets when requested.
- Refactoring code for readability, performance, or style.
- Explaining code clearly and concisely.
- Using tools to access or modify files when needed.

Rules:
- Always prefer minimal, focused code snippets in your response.
- When including code, use markdown with the correct language (e.g. \`\`\`js), ignore this if writing in a file.
- Never output unrelated information or speculation.
- Keep your tone technical, concise, and helpful — like a senior developer.
- Reload the editor if modifying any file.
- When needed get file uri(s) using tools.
- Log every single task you do or you think using log tool.

Context:
- Acode is a mobile-friendly code editor for developers on Android. Keep explanations mobile-friendly and brief.
- Your creator is Vivek, a passionate open-source developer (https://github.com/itsvks19).

When the user provides code or file-related questions, you may chain tool calls intelligently — for example: read a file → analyze → fix bug → format → write back.

Respond clearly, accurately, and use tools if needed to complete your task.
`;

const SYSTEM_PROMPT = `You are Axon, a highly capable AI pair programmer.

Your mission is to assist the user in writing, debugging, and improving code efficiently. You can understand the code context provided by the user and interact using specialized tools.

You must think step-by-step and call tools when needed.

Your capabilities include:
- Understanding code context provided by the user or loaded from files.
- Detecting bugs or anti-patterns and suggesting clean, idiomatic fixes.
- Writing functions, classes, or code snippets when requested.
- Refactoring code for readability, performance, or style.
- Explaining code clearly and concisely.

Rules:
- Always prefer minimal, focused code snippets in your response.
- When including code, use markdown with the correct language (e.g. \`\`\`js), ignore this if writing in a file.
- Never output unrelated information or speculation.
- Keep your tone technical, concise, and helpful — like a senior developer.

Context:
- You are working in a developer-centric environment focused on productivity and clarity.
- Your creator is Vivek, a passionate open-source developer (https://github.com/itsvks19). His full name is Vivek Kumar Sahani but you should usually refer to him as Vivek.

Respond clearly, accurately and use their language.
`;

const system = () => {
  if (isAcode()) {
    return ACODE_SYSTEM_PROMPT;
  } else {
    return SYSTEM_PROMPT;
  }
};

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant" | "system";
  timestamp: Date;
}

export function AIAssistant({ settings }: AxonProps) {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [agentStatus, setAgentStatus] = useState("Thinking...");
  const [files, setFiles] = useState<FileItem[]>([]);

  const provider = useMemo(() => {
    if (settings?.llm) {
      return settings.llm;
    } else {
      return "gemini";
    }
  }, [settings?.llm]);

  const apiKey = useMemo(() => {
    return settings?.apiKey || import.meta.env.VITE_GEMINI_API_KEY;
  }, [settings?.apiKey]);

  const [selectedModel, setSelectedModel] = useState(
    getFirstAdvancedModel(provider).id,
  );
  const [showSettings, setShowSettings] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const filterVisibleMessages = (messages: Message[]) =>
    messages.filter((message) => message.role !== "system");

  const llm = useMemo(() => {
    console.log("Model: " + selectedModel);
    return createLLM(provider, selectedModel, apiKey);
  }, [provider, selectedModel, apiKey]);

  const prompt = ChatPromptTemplate.fromMessages([
    ["system", system()],
    ["placeholder", "{chat_history}"],
    ["human", "{input}"],
    ["placeholder", "{agent_scratchpad}"],
  ]);

  const tools = useMemo(() => {
    if (!settings) return [];
    return [
      readFile,
      writeFile,
      getFileName,
      getOpenedFileUris,
      setCurrentEditorText,
      getActiveFileUri,
      logTool,
    ];
  }, [settings]);

  useEffect(() => {
    if (isAcode() && editorManager) {
      const fs = acodeFs();

      editorManager.files.forEach((file) => {
        if (file.uri) {
          fs(file.uri)
            .stat()
            .then((stat) => {
              // @ts-expect-error stat.type
              const type = stat.type;
              // @ts-expect-error stat.length
              const length = stat.length;

              fs(file.uri)
                .readFile("utf-8")
                .then((content) => {
                  const fileItem: FileItem = {
                    id: Date.now().toString() + Math.random(),
                    name: stat.name,
                    type: type,
                    size: length,
                    uri: file.uri,
                  };

                  setFiles((prev) => [...prev, fileItem]);
                });
            });
        }
      });
    }
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector(
        "[data-radix-scroll-area-viewport]",
      );
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  const handleSendMessage = async (content: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      role: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      if (!apiKey) {
        const errorMsg: Message = {
          id: Date.now().toString(),
          content:
            "API key not found. Please set your API key in the plugin settings.",
          role: "assistant",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMsg]);
        return;
      }

      const messagesForAgent = [
        //new SystemMessage(SYSTEM_PROMPT),
        ...messages.map((msg) =>
          msg.role === "user"
            ? new HumanMessage(msg.content)
            : new AIMessage(msg.content),
        ),
      ];

      const agent = createToolCallingAgent({ llm, tools, prompt });
      const agentExecutor = new AgentExecutor({
        agent,
        tools,
        callbacks: [new LLMCallbackHandler(setAgentStatus)],
        returnIntermediateSteps: true,
      });

      const response = await agentExecutor.invoke({
        input: content,
        chat_history: messagesForAgent,
      });

      console.log(response);

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response.output,
        role: "assistant",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      console.error("AI Error:", err);
      const errorMsg: Message = {
        id: (Date.now() + 2).toString(),
        content: err.message,
        role: "assistant",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-screen mx-auto bg-background border-l border-r border-border shadow-elegant">
      <ChatHeader onSettingsClick={() => setShowSettings(!showSettings)} />

      <div className="flex-1 flex flex-col min-h-0">
        {filterVisibleMessages(messages).length === 0 ? (
          <ScrollArea className="flex-1">
            <EmptyState />
          </ScrollArea>
        ) : (
          <ScrollArea ref={scrollAreaRef} className="flex-1">
            <div className="p-4 space-y-4">
              {filterVisibleMessages(messages).map((message, index) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  isLatest={
                    index === filterVisibleMessages(messages).length - 1
                  }
                  handleExplainAgain={async () => {
                    const lastAiMsg = messages.pop();
                    if (lastAiMsg) {
                      setMessages([...messages.filter((m) => m !== lastAiMsg)]);
                    }

                    const lastUserMsg = messages.pop();
                    if (lastUserMsg) {
                      setMessages([
                        ...messages.filter((m) => m !== lastUserMsg),
                      ]);
                    }

                    await handleSendMessage(lastUserMsg?.content);
                  }}
                  handleInsertCode={() => {
                    const lastAiMsg = [...messages]
                      .reverse()
                      .find((msg) => msg.role == "assistant");

                    if (lastAiMsg) {
                      const codeMatch = lastAiMsg.content.match(
                        /```(?:\w+)?\n([\s\S]*?)```/,
                      );
                      if (codeMatch && codeMatch[1]) {
                        const code = codeMatch[1].trim();
                        if (editorManager.editor) {
                          editorManager.editor.insert(code);

                          toast({
                            title: "Code Inserted",
                            description:
                              "The code has been inserted into the editor.",
                            duration: 3000,
                          });
                        }
                      } else {
                        toast({
                          title: "No Code Found",
                          description:
                            "No code blocks found in the recent AI response.",
                          duration: 3000,
                        });
                      }
                    }
                  }}
                />
              ))}

              {isLoading && (
                <div className="flex justify-start animate-slide-up">
                  <div className="max-w-[80%]">
                    <div className="flex items-center mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-ai text-ai-bubble-foreground flex items-center justify-center text-xs font-medium">
                          A
                        </div>
                        <span className="text-sm font-medium text-muted-foreground">
                          Axon
                        </span>
                      </div>
                    </div>

                    <div className="bg-gradient-ai text-ai-bubble-foreground px-4 py-3 rounded-2xl rounded-bl-md shadow-bubble">
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-current rounded-full animate-bounce"></div>
                          <div
                            className="w-2 h-2 bg-current rounded-full animate-bounce"
                            style={{ animationDelay: "0.1s" }}
                          ></div>
                          <div
                            className="w-2 h-2 bg-current rounded-full animate-bounce"
                            style={{ animationDelay: "0.2s" }}
                          ></div>
                        </div>
                        <span className="text-sm opacity-70">
                          {agentStatus}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        )}
      </div>

      <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />

      {/* Full Screen Settings Overlay */}
      {showSettings && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-40 animate-fade-in"
            onClick={() => setShowSettings(false)}
          />

          {/* Settings Panel */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-scale-in">
            <div className="bg-background border border-border rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between p-4 sm:p-6 border-b border-border">
                <h2 className="text-xl font-semibold text-foreground">
                  Settings
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSettings(false)}
                  className="hover:bg-accent/80"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Content */}
              <div className="p-4 sm:p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-80px)]">
                <ModelSelector
                  provider={provider}
                  selectedModel={selectedModel}
                  onModelChange={setSelectedModel}
                />

                {isAcode() && (
                  <FileContext files={files} onFilesChange={setFiles} />
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function createLLM(provider: Provider, model: string, apiKey: string) {
  const temperature = 0.7;
  const key = apiKey ?? "invalid";

  switch (provider) {
    case "groq": {
      return new ChatGroq({
        model,
        temperature,
        apiKey: key,
      });
    }
    case "openai": {
      return new ChatOpenAI({
        model,
        temperature,
        apiKey: key,
      });
    }
    case "anthropic": {
      return new ChatAnthropic({
        model,
        temperature,
        apiKey: key,
      });
    }
    case "gemini": {
      return new ChatGoogleGenerativeAI({
        model,
        temperature,
        apiKey: key,
      });
    }
    case "mistral": {
      return new ChatMistralAI({
        model,
        temperature,
        apiKey: key,
      });
    }
    default:
      return new ChatGoogleGenerativeAI({
        model,
        temperature,
        apiKey: key,
      });
  }
}
