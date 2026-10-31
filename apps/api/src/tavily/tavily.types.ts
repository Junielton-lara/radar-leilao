export type TavilySearchResult = {
  title: string;
  url: string;
  content: string;
  score?: number;
  raw_content?: string | null;
};

export type TavilySearchResponse = {
  query: string;
  results: TavilySearchResult[];
  answer?: string | null;
  response_time?: number;
  cached?: boolean;
  creditsEstimated?: number;
};

export type TavilyExtractResponse = {
  results: Array<{
    url: string;
    raw_content?: string | null;
    images?: string[];
  }>;
  failed_results?: Array<{ url: string; error: string }>;
  cached?: boolean;
  creditsEstimated?: number;
};

export type TavilyStatus = {
  configured: boolean;
  active: boolean;
  disabledByLimit: boolean;
  dailyLimit: number;
  monthlyLimit: number;
  dailyUsed: number;
  monthlyUsed: number;
  source: 'integration' | 'env' | 'none';
  message: string;
};
