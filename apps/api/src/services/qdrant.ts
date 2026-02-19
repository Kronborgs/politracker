import { QdrantClient } from "qdrant-client";

export type ChunkPayload = {
  snippet: string;
  chunk_hash: string;
  source_url: string;
  domain: string;
  date?: string;
};

export class QdrantService {
  private vectorSize: number | null = null;
  readonly client: QdrantClient;

  constructor(private readonly url: string, private readonly collection: string) {
    this.client = new QdrantClient({ url });
  }

  private async withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    const timeout = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`Qdrant timeout after ${ms}ms`)), ms);
    });
    return Promise.race([promise, timeout]);
  }

  async ensureCollection(vectorSize: number) {
    this.vectorSize = vectorSize;
    const collections = await this.withTimeout(this.client.getCollections(), 10000);
    const exists = collections.collections.some((c) => c.name === this.collection);

    if (!exists) {
      await this.withTimeout(
        this.client.createCollection(this.collection, {
        vectors: {
          size: vectorSize,
          distance: "Cosine"
        }
        }),
        10000
      );
    }
  }

  async upsert(points: Array<{ id: string; vector: number[]; payload: ChunkPayload }>) {
    if (!this.vectorSize && points[0]) {
      await this.ensureCollection(points[0].vector.length);
    }

    await this.withTimeout(
      this.client.upsert(this.collection, {
        wait: true,
        points: points.map((point) => ({
          id: point.id,
          vector: point.vector,
          payload: point.payload
        }))
      }),
      10000
    );
  }

  async search(vector: number[], limit = 5) {
    if (!this.vectorSize) {
      await this.ensureCollection(vector.length);
    }

    return this.withTimeout(
      this.client.search(this.collection, {
        vector,
        limit,
        with_payload: true
      }),
      10000
    );
  }
}
