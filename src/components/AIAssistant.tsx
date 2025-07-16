import { useState, useRef, useEffect } from "react";
import { ChatHeader } from "./ChatHeader";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { EmptyState } from "./EmptyState";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatGroq } from "@langchain/groq";
import { ChatOpenAI } from "@langchain/openai";
import { ChatAnthropic } from "@langchain/anthropic";
import { ChatMistralAI } from "@langchain/mistralai";
import {
  AIMessage,
  HumanMessage,
  SystemMessage,
} from "@langchain/core/messages";
import { AxonProps, AxonSettings } from "@/axon";
import { useToast } from "@/hooks/use-toast";

const SYSTEM_PROMPT = `
  You are Axon, an advanced AI pair programmer, built to integrate seamlessly into Acode editor.

  Your primary goal is to help the user write high-quality code quickly and efficiently.
  You have access to the current file's contents and the user's questions.

  Your capabilities include:
  - Writing new functions, classes, or modules.
  - Refactoring existing code for readability or performance.
  - Debugging and identifying errors.
  - Providing concise explanations of code snippets.
  - Offering best practices and patterns relevant to the language.

  **Rules for responses:**
  - If providing code, always use a markdown code block with the correct language (like \`\`\`python or \`\`\`javascript).
  - Only include the minimal necessary code to answer the question. Do not repeat the entire file unless explicitly asked.
  - If the user asks for an explanation, give a short and clear technical explanation.
  - If the user says "insert this," only output the code snippet to insert, nothing else.

  You should act like a collaborative developer — keep responses short, precise, and focused on what was asked.
`;

const ABOUT_ACODE = `
  When asked about Acode, always explain it as a lightweight code editor app for Android that supports multiple programming languages, syntax highlighting, live preview, file management, and basic Git integration.
  Highlight that it's useful for web developers, students, and anyone wanting a VS Code–like experience on mobile, though simpler.

  Your responses should be clear, concise, and technical, avoiding unnecessary fluff.
  If appropriate, provide quick comparisons to other editors, or tips on workflows (like using Acode with Termux).
  Always maintain an enthusiastic, helpful tone.
`;

const ABOUT_DEVELOPER = `
  Axon was created by Vivek, a passionate developer skilled in Android, web, and software development.
  You can find his projects and contributions on GitHub at https://github.com/itsvks19.

  When asked who built you, always mention Vivek as the creator, and express appreciation for open-source communities and developer collaboration.
`;

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
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const getVisibleMessages = (messages: Message[]) =>
    messages.filter((message) => message.role !== "system");

  const llm = createLLM(settings);

  useEffect(() => {
    messages.push({
      id: Date.now().toString(),
      content: SYSTEM_PROMPT + "\n\n" + ABOUT_ACODE + "\n\n" + ABOUT_DEVELOPER,
      role: "system",
      timestamp: new Date(),
    });
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
      if (!settings.apiKey) {
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

      const conversation = [...messages].map((msg) => {
        switch (msg.role) {
          case "system":
            return new SystemMessage(msg.content);
          case "user":
            return new HumanMessage(msg.content);
          case "assistant":
            return new AIMessage(msg.content);
          default:
            return new HumanMessage(msg.content);
        }
      });

      const userWantsCodeContext =
        /\b(code|file|function|bug|refactor|fix|optimize|explain|write|editor)\b/i.test(
          content,
        );

      let context = content;
      if (userWantsCodeContext && editorManager.activeFile) {
        const filename = editorManager.activeFile.filename;
        const currentCode = editorManager.editor.getValue();
        if (currentCode.trim()) {
          context = `
            Current file: ${filename}
            Code:
            ${currentCode}

            ${content}
          `;
        }
      }

      conversation.push(new HumanMessage(context));

      const response = await llm.invoke(conversation);

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response.content.toString(),
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
    <div className="flex flex-col h-full max-w-screen mx-auto bg-background border-l border-r border-border shadow-elegant">
      <ChatHeader />

      <div className="flex-1 flex flex-col min-h-0">
        {messages.length === 0 ? (
          <ScrollArea className="flex-1">
            <EmptyState />
          </ScrollArea>
        ) : (
          <ScrollArea ref={scrollAreaRef} className="flex-1">
            <div className="p-4 space-y-4">
              {getVisibleMessages(messages).map((message, index) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  isLatest={index === getVisibleMessages(messages).length - 1}
                  handleExplainAgain={() => {
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

                    handleSendMessage(lastUserMsg?.content);
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
                        <span className="text-sm opacity-70">Thinking...</span>
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
    </div>
  );
}

function createLLM(settings: AxonSettings) {
  const temperature = 0.7;
  const apiKey = settings.apiKey || "invalid";

  switch (settings.llm) {
    case "groq": {
      return new ChatGroq({
        model: "llama-3.3-70b-versatile",
        temperature,
        apiKey,
      });
    }
    case "openai": {
      return new ChatOpenAI({
        model: "gpt-4",
        temperature,
        apiKey,
      });
    }
    case "anthropic": {
      return new ChatAnthropic({
        model: "claude-sonnet-4-0",
        temperature,
        apiKey,
      });
    }
    case "gemini": {
      return new ChatGoogleGenerativeAI({
        model: "gemini-2.0-flash",
        temperature,
        apiKey,
      });
    }
    // case "fireworks": {
    //   return new ChatFireworks({
    //     model: "accounts/fireworks/models/llama-v3p1-70b-instruct",
    //     temperature,
    //     apiKey,
    //   });
    // }
    case "mistral": {
      return new ChatMistralAI({
        model: "mistral-large-latest",
        temperature,
        apiKey,
      });
    }
    // case "vertex": {
    //   return new ChatVertexAI({
    //     model: "gemini-1.5-flash",
    //     temperature,
    //     apiKey,
    //   });
    // }
    default:
      return new ChatGoogleGenerativeAI({
        model: "gemini-2.0-flash",
        temperature,
        apiKey,
      });
  }
}
