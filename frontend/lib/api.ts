import {
  AssessmentInput,
  AssessmentResult,
  DocumentScanResult,
  MockRegistryResponse,
} from '@/types';
import { getAiSessionContext } from '@/lib/session-memory';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export async function lookupMockRegistry(input: AssessmentInput): Promise<MockRegistryResponse> {
  const response = await fetch(`${API_BASE_URL}/eligibility/registry/mock-lookup`, {
    method: 'POST',
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      citizen_id: input.citizen_id,
      full_name: input.full_name,
      birth_date: input.birth_date || null,
      registered_province: input.registered_province,
      consent: input.consent_to_assess,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '');
    throw new Error(`ค้นทะเบียนสิทธิจำลองไม่สำเร็จ (${response.status}): ${errorBody}`);
  }

  return await response.json();
}

export async function submitAssessment(input: AssessmentInput): Promise<AssessmentResult> {
  const response = await fetch(`${API_BASE_URL}/eligibility/assess`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '');
    throw new Error(`การประเมินสิทธิล้มเหลว (Status ${response.status}): ${errorBody}`);
  }

  return await response.json();
}

export async function uploadDocument(file: File, documentType: string = 'id_card'): Promise<DocumentScanResult> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('document_type', documentType);

  const response = await fetch(`${API_BASE_URL}/documents/scan`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '');
    throw new Error(`การอัปโหลดและสแกนเอกสารล้มเหลว (Status ${response.status}): ${errorBody}`);
  }

  return await response.json();
}

export interface SearchResultItem {
  title: string;
  snippet: string;
  source: string;
  url: string;
  agency: string;
  type: string;
  verified: boolean;
}

export interface SearchResponse {
  query: string;
  total: number;
  results: SearchResultItem[];
  official_portals: Array<{ name: string; domain: string; hotline: string }>;
}

export async function searchWelfareAndPolicies(query: string, agency?: string): Promise<SearchResponse> {
  const url = new URL(`${API_BASE_URL}/search`);
  url.searchParams.set('q', query);
  if (agency) {
    url.searchParams.set('agency', agency);
  }

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`การค้นหาล้มเหลว (${response.status})`);
  }

  return await response.json();
}

export interface ChatMessageItem {

  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatAdvisorResponse {
  content: string;
  model: string;
  retrieved_contexts?: Array<{ title: string; scheme: string }>;
  provider: string;
  status: string;
}

function withSessionContext(messages: ChatMessageItem[], includeFullAssessment: boolean = false): ChatMessageItem[] {
  const sessionContext = getAiSessionContext(includeFullAssessment);
  if (!sessionContext) return messages;
  return [{ role: 'system', content: sessionContext }, ...messages];
}

export async function askAiAdvisor(
  messages: ChatMessageItem[],
  useRag: boolean = true,
  useWebSearch: boolean = true,
): Promise<ChatAdvisorResponse> {
  const response = await fetch(`${API_BASE_URL}/ai/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messages: withSessionContext(messages),
      use_rag: useRag,
      use_web_search: useWebSearch,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '');
    throw new Error(`AI advisor request failed (${response.status}): ${errorBody}`);
  }

  return await response.json();
}

export async function streamAiAdvisor(
  messages: ChatMessageItem[],
  onChunk: (delta: string) => void,
  onDone: () => void,
  onError: (error: string) => void,
  onWebSources?: (sources: Array<{ title: string; url: string; snippet: string }>) => void,
  useRag: boolean = true,
  onThinking?: (thought: string) => void,
  includeFullAssessment: boolean = false,
): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/ai/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: withSessionContext(messages, includeFullAssessment),
        use_rag: useRag,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '');
      throw new Error(`AI stream failed (${response.status}): ${errorBody}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('ReadableStream not supported');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) continue;
        const dataStr = trimmed.slice(6);
        if (dataStr === '[DONE]') {
          onDone();
          return;
        }
        try {
          const parsed = JSON.parse(dataStr);
          if (parsed.error) {
            onError(parsed.error);
            return;
          }
          if (parsed.web_sources && onWebSources) {
            onWebSources(parsed.web_sources);
          }
          if (parsed.thinking && onThinking) {
            onThinking(parsed.thinking);
          }
          if (parsed.delta) {
            onChunk(parsed.delta);
          }
        } catch {
          // ignore parse errors on partial frames
        }
      }
    }
    onDone();
  } catch (err: any) {
    onError(err.message || 'Stream error');
  }
}
