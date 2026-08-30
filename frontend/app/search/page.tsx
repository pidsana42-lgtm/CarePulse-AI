'use client';

import React, { useState, useRef, useEffect } from 'react';
import { SiteHeader } from '@/components/site-header';
import ChatAssessmentCard from '@/components/chat-assessment-card';
import { MarkdownText } from '@/components/markdown-text';
import { streamAiAdvisor, searchWelfareAndPolicies, uploadDocument, SearchResultItem, ChatMessageItem } from '@/lib/api';
import { rememberDocumentInsight } from '@/lib/session-memory';
import {
  Send,
  Loader2,
  ExternalLink,
  Bot,
  User,
  RefreshCw,
  CheckCircle2,
  ChevronRight,
  ArrowUpRight,
  ImagePlus,
  X,
  Stethoscope,
  ChevronDown,
  Brain,
  Sparkles
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
  thinking?: string;
  isThinking?: boolean;
  webSources?: Array<{ title: string; url: string; snippet: string }>;
  searchResults?: SearchResultItem[];
  isStreaming?: boolean;
  assessmentForm?: boolean;
}

// Collapsible World-Class AI Thinking / Reasoning Accordion
function ThinkingBox({
  thinking,
  isThinking,
  isStreaming,
}: {
  thinking?: string;
  isThinking?: boolean;
  isStreaming?: boolean;
}) {
  // Start open while thinking or streaming, then can be toggled
  const [open, setOpen] = useState(true);
  const [autoCollapsed, setAutoCollapsed] = useState(false);

  // Auto collapse slightly after thinking finishes and final answer is flowing
  useEffect(() => {
    if (!isThinking && !isStreaming && thinking && !autoCollapsed) {
      // Keep it available in accordion
      setAutoCollapsed(true);
    }
  }, [isThinking, isStreaming, thinking, autoCollapsed]);

  if (!thinking && !isThinking) return null;

  return (
    <div className="mb-3 overflow-hidden border-y border-black/[0.1] transition-all duration-300">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-2.5 text-left transition-colors hover:bg-cyan-100/30 cursor-pointer select-none"
      >
        <div className="flex items-center gap-2.5">
          <div className={`size-6 rounded-xl flex items-center justify-center shadow-xs transition-all ${
            isThinking ? 'bg-gradient-to-tr from-cyan-600 to-cyan-600 text-white animate-pulse' : 'bg-cyan-100 text-cyan-700'
          }`}>
            <Brain className="w-3.5 h-3.5" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-black tracking-tight bg-gradient-to-r from-cyan-800 via-cyan-700 to-cyan-800 bg-clip-text text-transparent">
              {isThinking ? 'กำลังคิดวิเคราะห์ข้อกฎหมายและสิทธิ...' : 'กระบวนการคิดวิเคราะห์'}
            </span>
            {isThinking && (
              <span className="size-2 rounded-full bg-cyan-500 animate-ping inline-block ml-0.5" />
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 text-slate-400 hover:text-slate-700">
          <span className="text-[10px] font-bold">{open ? 'ซ่อน' : 'ดูกระบวนการคิด'}</span>
          <ChevronDown className={`w-3.5 h-3.5 text-cyan-600 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {open && (
        <div className="px-4.5 pb-3.5 pt-1 text-[11px] font-mono leading-relaxed text-slate-600 border-t border-cyan-100/60 bg-white/50 animate-apple-fade-in whitespace-pre-wrap selection:bg-cyan-100 max-h-64 overflow-y-auto">
          {thinking || 'กำลังสืบค้นระเบียบราชการและตรวจสอบสิทธิประโยชน์ที่เกี่ยวข้อง...'}
          {isThinking && (
            <span className="inline-block w-1.5 h-3.5 bg-cyan-600 animate-pulse ml-1 align-middle rounded-sm" />
          )}
        </div>
      )}
    </div>
  );
}

// Questions about rights/benefits/equipment get an inline assessment form attached to the reply
const ASSESSMENT_INTENT = /สิทธิ|ประเมิน|สวัสดิการ|เบิก|ขอรับ|วางแผน|ค่ารักษา|บัตรทอง|ประกันสังคม|ข้าราชการ|ติดเตียง|เตียง|รถเข็น|ผ้าอ้อม|ออกซิเจน|คนพิการ|กายอุปกรณ์|ดูแลผู้ป่วย/;

// Compact expandable section — keeps replies clean until the reader wants sources
function CollapsibleSources({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  if (count === 0) return null;
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="liquid-glass-pill flex items-center gap-1.5 px-3.5 py-1.5 text-[11px] font-bold text-slate-600 hover:text-cyan-800 transition-all cursor-pointer shadow-sm"
      >
        <ChevronDown className={`w-3.5 h-3.5 text-cyan-600 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
        {title} ({count} รายการ)
      </button>
      {open && <div className="mt-2.5 space-y-2 animate-apple-fade-in">{children}</div>}
    </div>
  );
}

export default function SearchPage() {
  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [includeFullResultContext, setIncludeFullResultContext] = useState(false);
  const messagesRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const autoSentRef = useRef(false);

  // Auto-send the question passed from the home page (/search?q=...)
  useEffect(() => {
    if (autoSentRef.current) return;
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q');
    const fromResults = params.get('from') === 'results';
    if (q && q.trim()) {
      autoSentRef.current = true;
      setIncludeFullResultContext(fromResults);
      handleSubmit(q, fromResults);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAttach = (file: File | null) => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setAttachedFile(file);
    setImagePreview(file && file.type.startsWith('image/') ? URL.createObjectURL(file) : null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Keep the message list pinned to the latest message (only this container scrolls)
  useEffect(() => {
    const el = messagesRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = 'auto';
      ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`;
    }
  }, [input]);

  const handleSubmit = async (text?: string, sendFullResultContext: boolean = includeFullResultContext) => {
    const query = (text ?? input).trim();
    if (loading || uploading) return;
    if (!query && !attachedFile) return;

    // Attached document flow — OCR + AI analysis shown as an assistant reply
    if (attachedFile) {
      const file = attachedFile;
      const label = query
        ? `${query} (แนบ ${file.name})`
        : `[แนบรูปใบรับรองแพทย์]: ${file.name}`;
      setMessages((prev) => [
        ...prev,
        { role: 'user', content: label },
        { role: 'assistant', content: '', isStreaming: true },
      ]);
      setInput('');
      handleAttach(null);
      setUploading(true);

      try {
        const res = await uploadDocument(file, 'medical_certificate');
        rememberDocumentInsight(res, file.name);
        const equipment: Array<{ item: string; agency: string; cost_saved: string }> =
          res.extracted_data?.matched_equipment || [];
        const eqText = equipment.length
          ? `\n\nกายอุปกรณ์ที่ขอรับได้:\n${equipment
              .map((e) => `• ${e.item} (${e.agency}) — ประหยัด ${e.cost_saved}`)
              .join('\n')}`
          : '';
        const summary = `${res.extracted_data?.ai_clinical_summary || res.message || 'วิเคราะห์เอกสารเรียบร้อยแล้ว'}${eqText}`;
        setMessages((prev) => {
          if (prev.length === 0) return prev;
          const lastIdx = prev.length - 1;
          return prev.map((msg, i) =>
            i === lastIdx && msg.role === 'assistant'
              ? { ...msg, content: summary, isStreaming: false }
              : msg
          );
        });
      } catch (err) {
        setMessages((prev) => {
          if (prev.length === 0) return prev;
          const lastIdx = prev.length - 1;
          return prev.map((msg, i) =>
            i === lastIdx && msg.role === 'assistant'
              ? {
                  ...msg,
                  content: `เกิดข้อผิดพลาดในการอ่านเอกสาร: ${err instanceof Error ? err.message : err}`,
                  isStreaming: false,
                }
              : msg
          );
        });
      } finally {
        setUploading(false);
      }

      if (!query) return;
    }

    const userMsg: AiMessage = { role: 'user', content: query };
    const assistantMsg: AiMessage = {
      role: 'assistant',
      content: '',
      thinking: '',
      isThinking: true,
      isStreaming: true
    };

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
        if (prev.length === 0) return prev;
        const lastIdx = prev.length - 1;
        return prev.map((msg, i) =>
          i === lastIdx && msg.role === 'assistant'
            ? { ...msg, searchResults }
            : msg
        );
      });
    }).catch(() => {});

    // Stream AI response with live thinking process (Pure Immutable State Updates)
    await streamAiAdvisor(
      chatHistory,
      (delta) => {
        setMessages((prev) => {
          if (prev.length === 0) return prev;
          const lastIdx = prev.length - 1;
          return prev.map((msg, i) =>
            i === lastIdx && msg.role === 'assistant'
              ? {
                  ...msg,
                  isThinking: false,
                  content: (msg.content || '') + delta,
                }
              : msg
          );
        });
      },
      () => {
        setMessages((prev) => {
          if (prev.length === 0) return prev;
          const lastIdx = prev.length - 1;
          return prev.map((msg, i) => {
            if (i !== lastIdx || msg.role !== 'assistant') return msg;
            let finalContent = msg.content || '';
            if (!finalContent.trim() && msg.thinking) {
              const thaiIdx = msg.thinking.search(/[\u0E01-\u0E5B]/);
              if (thaiIdx !== -1) {
                finalContent = msg.thinking.slice(thaiIdx).trim();
              }
            }
            return {
              ...msg,
              content: finalContent,
              isThinking: false,
              isStreaming: false,
              searchResults,
              assessmentForm: ASSESSMENT_INTENT.test(query) ? true : msg.assessmentForm,
            };
          });
        });
        setLoading(false);
      },
      (err) => {
        setMessages((prev) => {
          if (prev.length === 0) return prev;
          const lastIdx = prev.length - 1;
          return prev.map((msg, i) =>
            i === lastIdx && msg.role === 'assistant'
              ? {
                  ...msg,
                  content: `เกิดข้อผิดพลาด: ${err}`,
                  isThinking: false,
                  isStreaming: false,
                }
              : msg
          );
        });
        setLoading(false);
      },
      (sources) => {
        setMessages((prev) => {
          if (prev.length === 0) return prev;
          const lastIdx = prev.length - 1;
          return prev.map((msg, i) =>
            i === lastIdx && msg.role === 'assistant'
              ? { ...msg, webSources: sources }
              : msg
          );
        });
      },
      true, // useRag
      (thought) => {
        setMessages((prev) => {
          if (prev.length === 0) return prev;
          const lastIdx = prev.length - 1;
          return prev.map((msg, i) =>
            i === lastIdx && msg.role === 'assistant'
              ? {
                  ...msg,
                  isThinking: true,
                  thinking: (msg.thinking || '') + thought,
                }
              : msg
          );
        });
      },
      sendFullResultContext,
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
    <div className="apple-page relative h-dvh overflow-clip">
      <SiteHeader />

      <main className="absolute inset-x-0 top-12 bottom-0 z-10 flex flex-col max-w-6xl mx-auto w-full px-4 sm:px-8 pb-4">

        {/* Empty State */}
        {isEmptyState && (
          <div className="flex-1 min-h-0 overflow-y-auto flex flex-col items-center justify-center gap-6 py-10 text-center animate-apple-fade-in">
            <div className="space-y-3">
              <div className="flex size-20 items-center justify-center rounded-full bg-[#e8f1ff] mx-auto">
                <Bot className="size-10 text-[#115af2]" />
              </div>
              <p className="apple-eyebrow">ผู้ช่วยวิเคราะห์สิทธิ CarePulse</p>
              <h1 className="apple-headline text-4xl sm:text-5xl">
                อธิบายความต้องการของคุณ
              </h1>
              <p className="apple-subhead text-sm sm:text-base max-w-md">
                AI จะค้นหาสิทธิสุขภาพ สวัสดิการ และระเบียบราชการที่เกี่ยวข้องให้คุณ พร้อมดึงข้อมูลล่าสุดจากเว็บไซต์ทางการ
              </p>
            </div>

            {/* Example Prompts */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-xl">
              {EXAMPLE_PROMPTS.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => handleSubmit(prompt)}
                  className="border-t border-black/[0.1] py-4 text-left flex items-start gap-2.5 text-xs sm:text-sm text-slate-800 font-semibold group cursor-pointer transition-colors hover:text-[#115af2]"
                >
                  <ChevronRight className="w-4 h-4 mt-0.5 text-cyan-600 shrink-0 group-hover:translate-x-1 transition-transform" />
                  <span>{prompt}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Message Thread — internal scroll only */}
        {!isEmptyState && (
          <div ref={messagesRef} className="flex-1 min-h-0 overflow-y-auto overscroll-contain py-6 space-y-6 animate-apple-fade-in">
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
                    <div className="liquid-glass size-9 shrink-0 rounded-full flex items-center justify-center shadow-md mt-0.5 text-cyan-600">
                      <Bot className="size-5" />
                    </div>
                    <div className="flex-1 space-y-3 max-w-[92%]">
                      {/* Thinking Process Accordion (World-Class AI Reasoning UI) */}
                      {(msg.thinking || msg.isThinking) && (
                        <ThinkingBox
                          thinking={msg.thinking}
                          isThinking={msg.isThinking}
                          isStreaming={msg.isStreaming}
                        />
                      )}

                      {/* AI Main Answer Bubble */}
                      <div className="rounded-[22px] rounded-tl-md bg-white px-5 py-4 text-sm text-slate-900 leading-relaxed border border-black/[0.07]">
                        {msg.content ? (
                          <MarkdownText content={msg.content} className="font-medium" />
                        ) : msg.isStreaming && !msg.isThinking && !msg.thinking ? (
                          <span className="flex items-center gap-2 text-slate-500 font-medium text-xs">
                            <Loader2 className="w-4 h-4 animate-spin text-cyan-600" />
                            กำลังสืบค้นและวิเคราะห์ข้อมูล...
                          </span>
                        ) : msg.isStreaming && !msg.content ? (
                          <span className="flex items-center gap-2 text-slate-500 font-medium text-xs">
                            <Loader2 className="w-4 h-4 animate-spin text-cyan-600" />
                            กำลังเรียบเรียงคำตอบ...
                          </span>
                        ) : null}
                        {msg.isStreaming && msg.content && (
                          <span className="inline-block w-0.5 h-4 bg-cyan-500 animate-pulse ml-0.5 align-middle" />
                        )}
                      </div>

                      {/* Web Sources */}
                      {msg.webSources && msg.webSources.length > 0 && (
                        <CollapsibleSources title="แหล่งข้อมูลที่ AI ใช้ค้นหา" count={msg.webSources.length}>
                          {msg.webSources.map((src, si) => (
                            <a
                              key={si}
                              href={src.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="liquid-glass-card rounded-2xl p-3 text-xs flex items-start gap-2.5 group"
                            >
                              <ExternalLink className="w-3.5 h-3.5 text-cyan-600 mt-0.5 shrink-0" />
                              <div className="flex-1 min-w-0">
                                <span className="font-bold text-slate-800 block truncate">{src.title}</span>
                                <span className="text-slate-400 line-clamp-1 mt-0.5 text-[11px]">{src.snippet}</span>
                              </div>
                            </a>
                          ))}
                        </CollapsibleSources>
                      )}

                      {/* Live Search Results (Shown only if no webSources provided) */}
                      {!msg.isStreaming && (!msg.webSources || msg.webSources.length === 0) && msg.searchResults && msg.searchResults.length > 0 && (
                        <CollapsibleSources title="เว็บไซต์ทางการที่เกี่ยวข้อง" count={msg.searchResults.length}>
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
                                  <span className="liquid-glass-pill px-2.5 py-0.5 text-[10px] font-black text-cyan-900">
                                    {res.agency}
                                  </span>
                                  {res.verified && (
                                    <span className="flex items-center gap-0.5 text-[10px] font-bold text-cyan-700">
                                      <CheckCircle2 className="w-3 h-3 text-cyan-600" /> ทางการ
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs font-bold text-slate-900 line-clamp-1 group-hover:text-cyan-800 transition-colors">
                                  {res.title}
                                </p>
                                <p className="text-xs text-slate-500 line-clamp-2">{res.snippet}</p>
                              </div>
                              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-cyan-600 shrink-0 mt-1 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                            </a>
                          ))}
                        </CollapsibleSources>
                      )}

                      {/* Inline eligibility assessment form */}
                      {!msg.isStreaming && msg.assessmentForm && <ChatAssessmentCard />}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Input Box — anchored at the bottom, never moves */}
        <div className="pt-3 shrink-0">
          {!isEmptyState && (
            <div className="flex justify-center mb-2">
              <button
                onClick={() => {
                  setMessages([]);
                  handleAttach(null);
                }}
                className="liquid-glass-pill px-3.5 py-1.5 flex items-center gap-1.5 text-xs text-slate-600 font-bold transition-colors cursor-pointer shadow-sm"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                เริ่มการสนทนาใหม่
              </button>
            </div>
          )}

          {/* Attached Image Preview */}
          {attachedFile && (
            <div className="flex items-center gap-3 bg-cyan-50/80 border border-cyan-200/60 rounded-2xl p-2.5 mb-2.5 animate-apple-fade-in">
              {imagePreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imagePreview} alt={attachedFile.name} className="size-12 rounded-xl object-cover border border-cyan-200/70" />
              ) : (
                <div className="size-12 rounded-xl bg-white flex items-center justify-center border border-cyan-200/70">
                  <Stethoscope className="w-5 h-5 text-cyan-600" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-cyan-900 truncate">{attachedFile.name}</p>
                <p className="text-[11px] text-cyan-700/80 font-medium">AI จะอ่านและวิเคราะห์เอกสารเมื่อกดส่ง</p>
              </div>
              <button
                type="button"
                onClick={() => handleAttach(null)}
                className="p-1.5 rounded-full hover:bg-cyan-100 text-cyan-700 transition-all cursor-pointer active:scale-90 shrink-0"
                aria-label="ลบไฟล์แนบ"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="rounded-[24px] border border-black/[0.08] bg-white p-2.5 sm:p-3 flex items-end gap-2.5 shadow-[0_18px_50px_-34px_rgba(0,0,0,0.45)]">
            <label
              className="size-10 rounded-2xl flex items-center justify-center text-cyan-600 hover:text-cyan-700 hover:bg-cyan-50 cursor-pointer transition-all shrink-0 mb-0.5"
              title="แนบรูปใบรับรองแพทย์ หรือเอกสารสิทธิ"
            >
              <ImagePlus className="w-5 h-5" />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={(e) => handleAttach(e.target.files?.[0] || null)}
              />
            </label>
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="อธิบายความต้องการของคุณที่นี่..."
              className="flex-1 resize-none bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none leading-relaxed py-2 px-1 font-medium max-h-40"
              disabled={loading || uploading}
            />
            <button
              onClick={() => handleSubmit()}
              disabled={loading || uploading || (!input.trim() && !attachedFile)}
              className="liquid-btn-primary size-10 shrink-0 flex items-center justify-center shadow-lg disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading || uploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
          <p className="text-center text-[11px] text-slate-400 mt-2 font-medium">
            กดปุ่มเอ็นเทอร์เพื่อส่ง · กดชิฟต์พร้อมเอ็นเทอร์เพื่อขึ้นบรรทัดใหม่ · แนบรูปได้ · AI ค้นหาข้อมูลล่าสุดจากเว็บไซต์ทางการ
          </p>
        </div>
      </main>
    </div>
  );
}
