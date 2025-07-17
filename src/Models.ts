import { Provider } from "@/axon";

export interface ModelOption {
  id: string;
  name: string;
  description: string;
  type: "fast" | "balanced" | "advanced";
}

export const modelMap = new Map<Provider, ModelOption[]>([
  [
    // Groq
    "groq",
    [
      {
        id: "distil-whisper-large-v3-en",
        name: "Distil Whisper Large V3 EN",
        description: "Lightweight speech-to-text model by HuggingFace",
        type: "fast",
      },
      {
        id: "gemma2-9b-it",
        name: "Gemma 2 9B Instruct",
        description: "Google's fine-tuned 9B instruction model",
        type: "fast",
      },
      {
        id: "llama-3.1-8b-instant",
        name: "LLaMA 3.1 8B Instant",
        description: "Meta’s fast LLaMA 3.1 8B model",
        type: "fast",
      },
      {
        id: "llama-3.3-70b-versatile",
        name: "LLaMA 3.3 70B Versatile",
        description: "Meta’s advanced 70B model with large context",
        type: "advanced",
      },
      {
        id: "meta-llama/llama-guard-4-12b",
        name: "LLaMA Guard 4 12B",
        description: "Guardrails model by Meta for safe generation",
        type: "balanced",
      },
      {
        id: "whisper-large-v3",
        name: "Whisper Large V3",
        description: "OpenAI’s speech-to-text model",
        type: "balanced",
      },
      {
        id: "whisper-large-v3-turbo",
        name: "Whisper Large V3 Turbo",
        description: "Turbo-optimized Whisper for lower latency",
        type: "fast",
      },
    ],
  ],

  // Anthropic
  [
    "anthropic",
    [
      {
        id: "claude-opus-4-20250514",
        name: "Claude Opus 4",
        description: "Anthropic’s most advanced Claude model (May 2025)",
        type: "advanced",
      },
      {
        id: "claude-sonnet-4-20250514",
        name: "Claude Sonnet 4",
        description: "Balanced Claude 4 model (May 2025)",
        type: "balanced",
      },
      {
        id: "claude-3-7-sonnet-20250219",
        name: "Claude 3.7 Sonnet",
        description: "Earlier Claude 3.7 Sonnet model",
        type: "balanced",
      },
      {
        id: "claude-3-5-haiku-20241022",
        name: "Claude Haiku 3.5",
        description: "Claude’s ultra-fast 3.5 model for low-latency tasks",
        type: "fast",
      },
      {
        id: "claude-3-5-sonnet-20241022",
        name: "Claude Sonnet 3.5 v2",
        description: "Improved Claude 3.5 Sonnet with updates",
        type: "balanced",
      },
      {
        id: "claude-3-5-sonnet-20240620",
        name: "Claude Sonnet 3.5",
        description: "Earlier variant of Claude 3.5 Sonnet",
        type: "balanced",
      },
      {
        id: "claude-3-haiku-20240307",
        name: "Claude Haiku 3",
        description: "Previous-gen Claude 3 Haiku model",
        type: "fast",
      },
    ],
  ],

  // OpenAI
  [
    "openai",
    [
      {
        id: "gpt-4o",
        name: "GPT-4o",
        description: "Omni‑modal GPT‑4 with highest capability",
        type: "advanced",
      },
      {
        id: "gpt-4-turbo",
        name: "GPT-4 Turbo",
        description: "Faster and cheaper GPT-4 variant",
        type: "advanced",
      },
      {
        id: "gpt-3.5-turbo",
        name: "GPT-3.5 Turbo",
        description: "Cost‑effective model for general usage",
        type: "balanced",
      },
      {
        id: "gpt-4.1",
        name: "GPT-4.1",
        description: "Latest OpenAI model optimized for coding",
        type: "advanced",
      },
      {
        id: "gpt-4.1-mini",
        name: "GPT-4.1 Mini",
        description: "Compact and efficient version of GPT-4.1",
        type: "balanced",
      },
      {
        id: "gpt-4.1-nano",
        name: "GPT-4.1 Nano",
        description: "Tiny footprint but strong for coding assistants",
        type: "fast",
      },
    ],
  ],

  // Gemini
  [
    "gemini",
    [
      {
        id: "gemini-2.5-pro",
        name: "Gemini 2.5 Pro",
        description: "Google’s most advanced multimodal reasoning model",
        type: "advanced",
      },
      {
        id: "gemini-2.5-flash",
        name: "Gemini 2.5 Flash",
        description: "Fast, cost‑optimized version of Gemini 2.5",
        type: "fast",
      },
      {
        id: "gemini-2.5-flash-lite-preview-06-17",
        name: "Gemini 2.5 Flash‑Lite (preview)",
        description: "Ultra‑lightweight flash model for high throughput",
        type: "fast",
      },
      {
        id: "gemini-embedding-001",
        name: "Gemini Embedding 001",
        description: "Versatile text embedding model across 100+ languages",
        type: "balanced",
      },
    ],
  ],

  // Mistral AI
  [
    "mistral",
    [
      {
        id: "ministral-8b-2410",
        name: "Ministral 8B",
        description: "Powerful 8B edge model with high performance/price ratio",
        type: "balanced",
      },
      {
        id: "mistral-large-2411",
        name: "Mistral Large",
        description: "Top‑tier large model with advanced reasoning & function calling",
        type: "advanced",
      },
      {
        id: "mistral-small-2407",
        name: "Mistral Small 2",
        description: "Updated small model, fast and efficient",
        type: "fast",
      },
      {
        id: "pixtral-large-2411",
        name: "Pixtral Large",
        description: "Frontier‑class multimodal model from Mistral",
        type: "advanced",
      },
      {
        id: "mistral-7b",
        name: "Mistral 7B",
        description: "Dense 7B open‑weight model — high performance",
        type: "balanced",
      },
      {
        id: "mixtral-8x22b",
        name: "Mixtral 8x22B",
        description: "Mixture‑of‑Experts 141B total params (22B active)",
        type: "advanced",
      },
      {
        id: "codestral-2501",
        name: "Codestral 25.01",
        description: "Code‑focused 24B with agentic and code generation strengths",
        type: "advanced",
      },
    ],
  ],
]);

export function getFirstModelOfProvider(provider: Provider): ModelOption {
  return modelMap.get(provider)[0]
}
