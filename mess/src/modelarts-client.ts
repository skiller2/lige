import { Ollama } from "ollama";

export interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  tool_calls?: any[];
  tool_call_id?: string;
}

export interface ChatOptions {
  model: string;
  messages: ChatMessage[];
  stream?: boolean;
  temperature?: number;
  max_tokens?: number;
  tools?: any[];
  tool_choice?: "auto" | "none" | { type: "function"; function: { name: string } };
}

export interface ChatResponse {
  message: ChatMessage;
  done: boolean;
}

export interface StreamChunk {
  message: ChatMessage;
  done: boolean;
}

interface ChoiceDelta {
  content?: string;
  tool_calls?: any[];
}

interface Choice {
  index: number;
  delta: ChoiceDelta;
  message?: ChatMessage;
  finish_reason: string | null;
}

interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Choice[];
}

export class ModelArtsClient {
  private baseURL: string;
  private apiKey: string;
  private defaultHeaders: Record<string, string>;

  constructor(options: { host?: string; apiKey?: string; headers?: Record<string, string> } = {}) {
    this.baseURL = options.host || "https://api-ap-southeast-1.modelarts-maas.com/openai/v1";
    this.apiKey = options.apiKey || process.env.MODELARTS_API_KEY || "";
    this.defaultHeaders = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${this.apiKey}`,
      ...options.headers,
    };
  }

  async chat(options: ChatOptions): Promise<ChatResponse> {
    const sanitizedMessages = options.messages.map(m => {
      const msg: Record<string, any> = { role: m.role, content: m.content };
      if (m.tool_calls) msg.tool_calls = m.tool_calls;
      if (m.tool_call_id) msg.tool_call_id = m.tool_call_id;
      return msg;
    });

    const response = await fetch(`${this.baseURL}/chat/completions`, {
      method: "POST",
      headers: this.defaultHeaders,
      body: JSON.stringify({
        model: options.model,
        messages: sanitizedMessages,
        stream: false,
        temperature: options.temperature,
        max_tokens: options.max_tokens,
        tools: options.tools,
        tool_choice: options.tool_choice,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`ModelArts API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json() as ChatCompletionResponse;
    return {
      message: {
        role: "assistant",
        content: data.choices[0]?.message?.content || "",
        tool_calls: data.choices[0]?.message?.tool_calls,
      },
      done: true,
    };
  }

  async *chatStream(options: ChatOptions): AsyncGenerator<StreamChunk> {
    const sanitizedMessages = options.messages.map(m => {
      const msg: Record<string, any> = { role: m.role, content: m.content };
      if (m.tool_calls) msg.tool_calls = m.tool_calls;
      if (m.tool_call_id) msg.tool_call_id = m.tool_call_id;
      return msg;
    });

    const response = await fetch(`${this.baseURL}/chat/completions`, {
      method: "POST",
      headers: this.defaultHeaders,
      body: JSON.stringify({
        model: options.model,
        messages: sanitizedMessages,
        stream: true,
        temperature: options.temperature,
        max_tokens: options.max_tokens,
        tools: options.tools,
        tool_choice: options.tool_choice,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`ModelArts API error: ${response.status} - ${errorText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("No response body");
    }

    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6).trim();
            if (data === "[DONE]") {
              yield { message: { role: "assistant", content: "" }, done: true };
              return;
            }
            try {
              const parsed = JSON.parse(data) as ChatCompletionResponse;
              const content = parsed.choices[0]?.delta?.content || "";
              const toolCalls = parsed.choices[0]?.delta?.tool_calls;
              if (content || toolCalls) {
                yield {
                  message: {
                    role: "assistant",
                    content,
                    tool_calls: toolCalls,
                  },
                  done: false,
                };
              }
            } catch {
              // Ignore parse errors for incomplete chunks
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  // Compatibility method to match Ollama's interface
  async generate(options: { model: string; prompt: string; stream?: boolean }): Promise<{ response: string }> {
    const result = await this.chat({
      model: options.model,
      messages: [{ role: "user", content: options.prompt }],
      stream: options.stream || false,
    });
    return { response: result.message.content };
  }
}

// Factory function to create a client compatible with Ollama usage
export function createModelArtsClient(config?: { host?: string; apiKey?: string }): ModelArtsClient {
  return new ModelArtsClient(config);
}