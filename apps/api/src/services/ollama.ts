import { StatementOutput, statementOutputSchema } from "@politracker/shared";

type OllamaEmbedResponse = {
  embeddings?: number[][];
  embedding?: number[];
};

export class OllamaService {
  constructor(
    private readonly baseUrl: string,
    private readonly embedModel: string,
    private readonly llmModel: string
  ) {}

  private async withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    const timeout = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`Request timeout after ${ms}ms`)), ms);
    });
    return Promise.race([promise, timeout]);
  }

  async embed(texts: string[]): Promise<number[][]> {
    const request = fetch(`${this.baseUrl}/api/embed`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ model: this.embedModel, input: texts })
    }).then((res) => {
      if (!res.ok) throw new Error(`Embed failed: ${res.status}`);
      return res.json() as Promise<OllamaEmbedResponse>;
    });

    const data = await this.withTimeout(request, 15000);
    if (data.embeddings && data.embeddings.length > 0) return data.embeddings;
    if (data.embedding && data.embedding.length > 0) return [data.embedding];
    throw new Error("Embed response missing vectors");
  }

  async analyze(prompt: string): Promise<{ parsed: StatementOutput; raw: string }> {
    const request = fetch(`${this.baseUrl}/api/generate`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        model: this.llmModel,
        prompt,
        stream: false,
        format: "json",
        options: { temperature: 0.1 }
      })
    }).then(async (res) => {
      if (!res.ok) throw new Error(`Generate failed: ${res.status}`);
      return res.json() as Promise<{ response: string }>;
    });

    const data = await this.withTimeout(request, 30000);
    const raw = data.response?.trim() || "";

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new Error(`JSON_PARSE_ERROR::${raw}`);
    }

    return { parsed: statementOutputSchema.parse(parsed), raw };
  }
}
