'use client';

import React, { useState, useRef, useEffect } from 'react';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { streamAiAdvisor, searchWelfareAndPolicies, SearchResultItem, ChatMessageItem } from '@/lib/api';
import {
  Send,
  Sparkles,
  Loader2,
  ExternalLink,
  Globe,
  Bot,
  User,
  RefreshCw,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react';

const EXAMPLE_PROMPTS = [
  'แม่ผมติดเตียง อยากขอเตียงผู้ป่วยฟรีต้องทำยังไง',
  'ผมใช้บัตรทอง ไปหาหมอโรงพยาบาลต่างจังหวัดได้ไหม',
  'อยากขอผ้าอ้อมผู้ใหญ่ให้ผู้สูงอายุที่บ้าน ติดต่อใคร',
  'ผู้พิการมีสิทธิ์ขอรถเข็นฟรีจากรัฐไหม',
  'ประกันสังคมทำฟันฟรีได้กี่บาทต่อปี',
  'ฉุกเฉินวิกฤต UCEP คืออะไร ใช้ที่ไหนได้บ้าง',
];

interface AiMessage {
  role: 'user' | 'assistant';
  content: string;
  webSources?: Array<{ title: string; url: string; snippet: string }>;
  searchResults?: SearchResultItem[];
  isStreaming?: boolean;
}

export default function SearchPage() {
  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = 'auto';
      ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`;
    }
  }, [input]);

  const handleSubmit = async (text?: string) => {
    const query = (text ?? input).trim();
    if (!query || loading) return;

    const userMsg: AiMessage = { role: 'user', content: query };
    const assistantMsg: AiMessage = { role: 'assistant', content: '', isStreaming: true };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setInput('');
    setLoading(true);

    const chatHistory: ChatMessageItem[] = [...messages, userMsg].map((m) => ({
      role: m.role,
      content: m.content,
    }));

    // Run web search in parallel
    let searchResults: SearchResultItem[] = [];
    searchWelfareAndPolicies(query).then((res) => {
      searchResults = res.results.slice(0, 5);
      setMessages((prev) => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last.role === 'assistant') {
          last.searchResults = searchResults;
        }
        return updated;
      });
    }).catch(() => {});

    // Stream AI response
    await streamAiAdvisor(
      chatHistory,
      (delta) => {
        setMessages((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last.role === 'assistant') {
            last.content += delta;
          }
          return [...updated];
        });
      },
      () => {
        setMessages((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last.role === 'assistant') {
            last.isStreaming = false;
            last.searchResults = searchResults;
          }
          return [...updated];
        });
        setLoading(false);
      },
      (err) => {
        setMessages((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last.role === 'assistant') {
            last.content = `เกิดข้อผิดพลาด: ${err}`;
            last.isStreaming = false;
          }
          return [...updated];
        });
        setLoading(false);
      },
      (sources) => {
        setMessages((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last.role === 'assistant') {
            last.webSources = sources;
          }
          return [...updated];
        });
      }
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const isEmptyState = messages.length === 0;

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <SiteHeader />

      <main className="flex-1 flex flex-col max-w-3xl mx-auto w-full px-4 sm:px-6 pb-6">

        {/* Empty State */}
        {isEmptyState && (
          <div className="flex-1 flex flex-col items-center justify-center gap-8 py-16 text-center">
            <div className="space-y-3">
              <div className="flex size-16 items-center justify-center rounded-2xl bg-emerald-600 mx-auto shadow-lg">
                <Bot className="size-9 text-white" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                อธิบายความต้องการของคุณ
              </h1>
              <p className="text-slate-500 text-sm sm:text-base max-w-md font-medium leading-relaxed">
                AI จะค้นหาสิทธิสุขภาพ สวัสดิการ และระเบียบราชการที่เกี่ยวข้องให้คุณ พร้อมแหล่งอ้างอิงจากเว็บทางการ
              </p>
            </div>

            {/* Example Prompts */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-xl">
              {EXAMPLE_PROMPTS.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => handleSubmit(prompt)}
                  className="flex items-start gap-2.5 text-left bg-white border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50 rounded-2xl p-3.5 text-sm text-slate-700 font-medium transition-all group shadow-xs"
                >
                  <ChevronRight className="w-4 h-4 mt-0.5 text-emerald-500 shrink-0 group-hover:text-emerald-700" />
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Message Thread */}
        {!isEmptyState && (
          <div className="flex-1 py-6 space-y-6">
            {messages.map((msg, idx) => (
              <div key={idx}>
                {msg.role === 'user' ? (
                  /* User Bubble */
                  <div className="flex justify-end">
                    <div className="flex items-end gap-2 max-w-[85%]">
                      <div className="bg-emerald-600 text-white rounded-3xl rounded-br-lg px-5 py-3.5 text-sm font-medium leading-relaxed shadow-sm">
                        {msg.content}
                      </div>
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-slate-200">
                        <User className="size-4 text-slate-600" />
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Assistant Bubble */
                  <div className="flex items-start gap-2.5">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-600 shadow-sm mt-0.5">
                      <Bot className="size-4 text-white" />
                    </div>
                    <div className="flex-1 space-y-3 max-w-[92%]">
                      {/* AI Text */}
                      <div className="bg-white border border-slate-200 rounded-3xl rounded-tl-lg px-5 py-4 text-sm text-slate-800 leading-relaxed shadow-xs">
                        {msg.content ? (
                          <p className="whitespace-pre-line">{msg.content}</p>
                        ) : msg.isStreaming ? (
                          <span className="flex items-center gap-2 text-slate-400">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            กำลังค้นหาและวิเคราะห์...
                          </span>
                        ) : null}
                        {msg.isStreaming && msg.content && (
                          <span className="inline-block w-0.5 h-4 bg-emerald-500 animate-pulse ml-0.5 align-middle" />
                        )}
                      </div>

                      {/* Web Sources from AI stream */}
                      {msg.webSources && msg.webSources.length > 0 && (
                        <div className="space-y-1.5">
                          <p className="text-xs font-bold text-slate-500 flex items-center gap-1 px-1">
                            <Globe className="w-3.5 h-3.5 text-emerald-600" />
                            แหล่งข้อมูลที่ AI ใช้ค้นหา:
                          </p>
                          {msg.webSources.map((src, si) => (
                            <a
                              key={si}
                              href={src.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-start gap-2.5 bg-white border border-slate-200 hover:border-emerald-300 rounded-2xl p-3 text-xs transition-all group shadow-xs"
                            >
                              <ExternalLink className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                              <div className="flex-1 min-w-0">
                                <span className="font-bold text-slate-800 block truncate">{src.title}</span>
                                <span className="text-slate-400 line-clamp-2 mt-0.5">{src.snippet}</span>
                              </div>
                            </a>
                          ))}
                        </div>
                      )}

                      {/* Live Search Results */}
                      {!msg.isStreaming && msg.searchResults && msg.searchResults.length > 0 && (
                        <div className="space-y-1.5">
                          <p className="text-xs font-bold text-slate-500 flex items-center gap-1 px-1">
                            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                            เว็บไซต์ทางการที่เกี่ยวข้อง ({msg.searchResults.length} รายการ):
                          </p>
                          {msg.searchResults.map((res, ri) => (
                            <a
                              key={ri}
                              href={res.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-start gap-2.5 bg-white border border-slate-200 hover:border-emerald-300 rounded-2xl p-3.5 transition-all shadow-xs group"
                            >
                              <div className="flex-1 min-w-0 space-y-0.5">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                                    {res.agency}
                                  </span>
                                  {res.verified && (
                                    <span className="flex items-center gap-0.5 text-[10px] font-semibold text-teal-700">
                                      <CheckCircle2 className="w-3 h-3" /> ทางการ
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs font-bold text-slate-800 line-clamp-1">{res.title}</p>
                                <p className="text-xs text-slate-500 line-clamp-2">{res.snippet}</p>
                              </div>
                              <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 shrink-0 mt-1 transition-colors" />
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        )}

        {/* Input Box — sticky bottom */}
        <div className={`${isEmptyState ? 'mt-0' : 'mt-4'} sticky bottom-4`}>
          {/* Reset button (only when there are messages) */}
          {!isEmptyState && (
            <div className="flex justify-center mb-2">
              <button
                onClick={() => setMessages([])}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-700 font-semibold transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                เริ่มการสนทนาใหม่
              </button>
            </div>
          )}

          <div className="bg-white border border-slate-200 rounded-3xl shadow-lg p-3 flex items-end gap-2.5">
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="อธิบายความต้องการของคุณที่นี่... เช่น แม่ติดเตียงอยากขอเตียงผู้ป่วยฟรี"
              className="flex-1 resize-none bg-transparent text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none leading-relaxed py-1.5 px-2 font-medium max-h-40"
              disabled={loading}
            />
            <button
              onClick={() => handleSubmit()}
              disabled={loading || !input.trim()}
              className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
          <p className="text-center text-[11px] text-slate-400 mt-1.5 font-medium">
            กด Enter ส่ง · Shift+Enter ขึ้นบรรทัดใหม่ · AI ค้นหาจากเว็บทางการแบบ Real-time
          </p>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
