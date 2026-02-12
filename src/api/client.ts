const DEFAULT_BASE_URL = "https://api.confluent.cloud";

interface ConfluentClientConfig {
  apiKey: string;
  apiSecret: string;
  baseUrl?: string;
}

interface PaginatedResponse<T> {
  api_version: string;
  kind: string;
  metadata: {
    first?: string;
    last?: string;
    prev?: string;
    next?: string;
    total_size?: number;
  };
  data: T[];
}

interface ApiError {
  error: {
    code: number;
    message: string;
    details?: unknown[];
  };
}

export class ConfluentClient {
  private authHeader: string;
  private baseUrl: string;

  constructor(config: ConfluentClientConfig) {
    const credentials = Buffer.from(
      `${config.apiKey}:${config.apiSecret}`
    ).toString("base64");
    this.authHeader = `Basic ${credentials}`;
    this.baseUrl = (config.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, "");
  }

  static fromEnv(): ConfluentClient {
    const apiKey = process.env.CONFLUENT_CLOUD_API_KEY;
    const apiSecret = process.env.CONFLUENT_CLOUD_API_SECRET;
    const baseUrl = process.env.CONFLUENT_CLOUD_ENDPOINT;

    if (!apiKey || !apiSecret) {
      throw new Error(
        "Missing required environment variables: CONFLUENT_CLOUD_API_KEY and CONFLUENT_CLOUD_API_SECRET"
      );
    }

    return new ConfluentClient({ apiKey, apiSecret, baseUrl });
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    baseUrl?: string
  ): Promise<T> {
    const url = `${baseUrl ?? this.baseUrl}${path}`;

    const headers: Record<string, string> = {
      Authorization: this.authHeader,
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    const responseBody = await response.text();

    if (!response.ok) {
      let errorMessage: string;
      try {
        const errorJson = JSON.parse(responseBody) as ApiError;
        errorMessage =
          errorJson.error?.message ?? `HTTP ${response.status}: ${responseBody}`;
      } catch {
        errorMessage = `HTTP ${response.status}: ${responseBody}`;
      }
      throw new Error(errorMessage);
    }

    if (!responseBody) {
      return undefined as T;
    }

    return JSON.parse(responseBody) as T;
  }

  async get<T>(path: string, baseUrl?: string): Promise<T> {
    return this.request<T>("GET", path, undefined, baseUrl);
  }

  async post<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>("POST", path, body);
  }

  async patch<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>("PATCH", path, body);
  }

  async delete<T>(path: string): Promise<T> {
    return this.request<T>("DELETE", path);
  }

  async listAll<T>(path: string): Promise<T[]> {
    const results: T[] = [];
    let nextUrl: string | undefined = `${this.baseUrl}${path}`;

    while (nextUrl) {
      const separator = nextUrl.includes("?") ? "&" : "?";
      const urlWithPageSize = nextUrl.includes("page_size")
        ? nextUrl
        : `${nextUrl}${separator}page_size=100`;

      const response = await fetch(urlWithPageSize, {
        headers: {
          Authorization: this.authHeader,
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`HTTP ${response.status}: ${text}`);
      }

      const body = (await response.json()) as PaginatedResponse<T>;
      results.push(...body.data);
      nextUrl = body.metadata.next ?? undefined;
    }

    return results;
  }
}
