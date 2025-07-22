import type { Context } from "@netlify/functions";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { AgentExecutor, createToolCallingAgent } from "langchain/agents";

export default async (req: Request, context: Context) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", {
      status: 405,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
    });
  }

  try {
    const body = await req.json();
    const {
      prompt,
      chat_history = [],
      message = "Say something",
      model = "gemini-2.5-pro",
    } = body;

    const llm = new ChatGoogleGenerativeAI({
      model,
      temperature: 0.7,
    });

    const p = ChatPromptTemplate.fromMessages(prompt);
    const tools = [];
    const agent = createToolCallingAgent({ llm, tools, prompt: p });
    const agentExecutor = new AgentExecutor({
      agent,
      tools,
    });

    const response = await agentExecutor.invoke({
      input: message,
      chat_history: chat_history,
    });

    return new Response(JSON.stringify({ response }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error("LangChain API Error:", error);

    return new Response(
      JSON.stringify({
        error: "Failed to process request",
        details: error.message,
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      },
    );
  }
};
