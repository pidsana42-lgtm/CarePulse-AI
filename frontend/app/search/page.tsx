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
  ArrowUpRight
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
    <div className="relative min-h-screen flex flex-col overflow-hidden">
      {/* Background Liquid Mesh Orbs */}
      <div className="liquid-mesh-orb-1 top-10 -left-10" />
      <div className="liquid-mesh-orb-2 top-1/2 right-0" />
      <div className="liquid-mesh-orb-3 bottom-0 left-1/4" />

      <SiteHeader />

      <main className="relative z-10 flex-1 flex flex-col max-w-3xl mx-auto w-full px-4 sm:px-6 pb-8">

        {/* Empty State */}
        {isEmptyState && (
          <div className="flex-1 flex flex-col items-center justify-center gap-8 py-16 text-center animate-apple-fade-in">
            <div className="space-y-3">
              <div className="liquid-glass size-20 rounded-full flex items-center justify-center mx-auto shadow-2xl ring-2 ring-white/80">
                <Bot className="size-10 text-emerald-600" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight">
                อธิบายความต้องการของคุณ
              </h1>
              <p className="text-slate-600 text-sm sm:text-base max-w-md font-medium leading-relaxed">
                AI จะค้นหาสิทธิสุขภาพ สวัสดิการ และระเบียบราชการที่เกี่ยวข้องให้คุณ พร้อมดึงข้อมูลจากเว็บทางการแบบ Real-time
              </p>
            </div>

            {/* Example Prompts */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-xl">
              {EXAMPLE_PROMPTS.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => handleSubmit(prompt)}
                  className="liquid-glass-card rounded-[22px] p-4 text-left flex items-start gap-2.5 text-xs sm:text-sm text-slate-800 font-bold group cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4 mt-0.5 text-emerald-600 shrink-0 group-hover:translate-x-1 transition-transform" />
                  <span>{prompt}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Message Thread */}
        {!isEmptyState && (
          <div className="flex-1 py-6 space-y-6 animate-apple-fade-in">
            {messages.map((msg, idx) => (
              <div key={idx}>
                {msg.role === 'user' ? (
                  /* User Bubble */
                  <div className="flex justify-end">
                    <div className="flex items-end gap-2.5 max-w-[85%]">
                      <div className="liquid-btn-primary rounded-[24px] rounded-br-md px-5 py-3.5 text-sm font-bold leading-relaxed shadow-lg">
                        {msg.content}
                      </div>
                      <div className="liquid-glass size-8 shrink-0 rounded-full flex items-center justify-center shadow-xs">
                        <User className="size-4 text-slate-700" />
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Assistant Bubble */
                  <div className="flex items-start gap-2.5">
                    <div className="liquid-glass size-9 shrink-0 rounded-full flex items-center justify-center shadow-md mt-0.5 text-emerald-600">
                      <Bot className="size-5" />
                    </div>
                    <div className="flex-1 space-y-3.5 max-w-[92%]">
                      {/* AI Text Bubble */}
                      <div className="liquid-glass rounded-[28px] rounded-tl-md px-5 py-4 text-sm text-slate-900 leading-relaxed shadow-md">
                        {msg.content ? (
                          <p className="whitespace-pre-line font-medium">{msg.content}</p>
                        ) : msg.isStreaming ? (
                          <span className="flex items-center gap-2 text-slate-500 font-medium text-xs">
                            <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                            กำลังสืบค้นและวิเคราะห์ข้อมูล...
                          </span>
                        ) : null}
                        {msg.isStreaming && msg.content && (
                          <span className="inline-block w-0.5 h-4 bg-emerald-500 animate-pulse ml-0.5 align-middle" />
                        )}
                      </div>

                      {/* Web Sources */}
                      {msg.webSources && msg.webSources.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs font-black text-slate-500 flex items-center gap-1.5 px-1">
                            <Globe className="w-3.5 h-3.5 text-emerald-600" />
                            แหล่งข้อมูลที่ AI ใช้ค้นหา:
                          </p>
                          {msg.webSources.map((src, si) => (
                            <a
                              key={si}
                              href={src.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="liquid-glass-card rounded-2xl p-3 text-xs flex items-start gap-2.5 group"
                            >
                              <ExternalLink className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                              <div className="flex-1 min-w-0">
                                <span className="font-bold text-slate-800 block truncate">{src.title}</span>
                                <span className="text-slate-400 line-clamp-1 mt-0.5 text-[11px]">{src.snippet}</span>
                              </div>
                            </a>
                          ))}
                        </div>
                      )}

                      {/* Live Search Results */}
                      {!msg.isStreaming && msg.searchResults && msg.searchResults.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs font-black text-slate-500 flex items-center gap-1.5 px-1">
                            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                            เว็บไซต์ทางการที่เกี่ยวข้อง ({msg.searchResults.length} รายการ):
                          </p>
                          {msg.searchResults.map((res, ri) => (
                            <a
                              key={ri}
                              href={res.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="liquid-glass-card rounded-2xl p-4 flex items-start justify-between gap-3 group"
                            >
                              <div className="flex-1 min-w-0 space-y-1">
                                <div className="flex items-center gap-1.5">
                                  <span className="liquid-glass-pill px-2.5 py-0.5 text-[10px] font-black text-emerald-900">
                                    {res.agency}
                                  </span>
                                  {res.verified && (
                                    <span className="flex items-center gap-0.5 text-[10px] font-bold text-teal-700">
                                      <CheckCircle2 className="w-3 h-3 text-teal-600" /> ทางการ
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs font-bold text-slate-900 line-clamp-1 group-hover:text-emerald-800 transition-colors">
                                  {res.title}
                                </p>
                                <p className="text-xs text-slate-500 line-clamp-2">{res.snippet}</p>
                              </div>
                              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 shrink-0 mt-1 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
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

        {/* Input Box — Floating Liquid Capsule */}
        <div className={`${isEmptyState ? 'mt-0' : 'mt-4'} sticky bottom-4`}>
          {!isEmptyState && (
            <div className="flex justify-center mb-2">
              <button
                onClick={() => setMessages([])}
                className="liquid-glass-pill px-3.5 py-1.5 flex items-center gap-1.5 text-xs text-slate-600 font-bold transition-colors cursor-pointer shadow-sm"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                เริ่มการสนทนาใหม่
              </button>
            </div>
          )}

          <div className="liquid-glass rounded-[32px] p-2.5 sm:p-3 flex items-end gap-2.5 shadow-2xl border border-white/90">
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="อธิบายความต้องการของคุณที่นี่... เช่น แม่ติดเตียงอยากขอเตียงผู้ป่วยฟรี"
              className="flex-1 resize-none bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none leading-relaxed py-2 px-3 font-medium max-h-40"
              disabled={loading}
            />
            <button
              onClick={() => handleSubmit()}
              disabled={loading || !input.trim()}
              className="liquid-btn-primary size-10 shrink-0 flex items-center justify-center shadow-lg disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
          <p className="text-center text-[11px] text-slate-400 mt-2 font-medium">
            กด Enter ส่ง · Shift+Enter ขึ้นบรรทัดใหม่ · AI ค้นหาจากเว็บทางการแบบ Real-time
          </p>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
