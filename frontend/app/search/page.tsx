'use client';

import React, { useState, useRef, useEffect } from 'react';
import { SiteHeader } from '@/components/site-header';
import { streamAiAdvisor, searchWelfareAndPolicies, uploadDocument, SearchResultItem, ChatMessageItem } from '@/lib/api';
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
  ArrowUpRight,
  ImagePlus,
  X,
  Stethoscope
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
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const messagesRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleSubmit = async (text?: string) => {
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
        const equipment: Array<{ item: string; agency: string; cost_saved: string }> =
          res.extracted_data?.matched_equipment || [];
        const eqText = equipment.length
          ? `\n\nกายอุปกรณ์ที่ขอรับได้:\n${equipment
              .map((e) => `• ${e.item} (${e.agency}) — ประหยัด ${e.cost_saved}`)
              .join('\n')}`
          : '';
        const summary = `${res.extracted_data?.ai_clinical_summary || res.message || 'วิเคราะห์เอกสารเรียบร้อยแล้ว'}${eqText}`;
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: 'assistant', content: summary, isStreaming: false };
          return updated;
        });
      } catch (err) {
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: 'assistant',
            content: `เกิดข้อผิดพลาดในการอ่านเอกสาร: ${err instanceof Error ? err.message : err}`,
            isStreaming: false,
          };
          return updated;
        });
      } finally {
        setUploading(false);
      }

      if (!query) return;
    }

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
    <div className="relative h-dvh overflow-clip">
      {/* Background Liquid Mesh Orbs — clipped wrapper so they never create scrollable overflow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="liquid-mesh-orb-1 top-10 -left-10" />
        <div className="liquid-mesh-orb-2 top-1/2 right-0" />
        <div className="liquid-mesh-orb-3 bottom-0 left-1/4" />
      </div>

      <SiteHeader />

      <main className="absolute inset-x-0 top-[84px] bottom-0 z-10 flex flex-col max-w-3xl mx-auto w-full px-4 sm:px-6 pb-4">

        {/* Empty State */}
        {isEmptyState && (
          <div className="flex-1 min-h-0 overflow-y-auto flex flex-col items-center justify-center gap-6 py-10 text-center animate-apple-fade-in">
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
            <div className="flex items-center gap-3 bg-emerald-50/80 border border-emerald-200/60 rounded-2xl p-2.5 mb-2.5 animate-apple-fade-in">
              {imagePreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imagePreview} alt={attachedFile.name} className="size-12 rounded-xl object-cover border border-emerald-200/70" />
              ) : (
                <div className="size-12 rounded-xl bg-white flex items-center justify-center border border-emerald-200/70">
                  <Stethoscope className="w-5 h-5 text-emerald-600" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-emerald-900 truncate">{attachedFile.name}</p>
                <p className="text-[11px] text-emerald-700/80 font-medium">AI จะอ่านและวิเคราะห์เอกสารเมื่อกดส่ง</p>
              </div>
              <button
                type="button"
                onClick={() => handleAttach(null)}
                className="p-1.5 rounded-full hover:bg-emerald-100 text-emerald-700 transition-all cursor-pointer active:scale-90 shrink-0"
                aria-label="ลบไฟล์แนบ"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="liquid-glass rounded-[32px] p-2.5 sm:p-3 flex items-end gap-2.5 shadow-2xl border border-white/90">
            <label
              className="size-10 rounded-2xl flex items-center justify-center text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 cursor-pointer transition-all shrink-0 mb-0.5"
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
            กด Enter ส่ง · Shift+Enter ขึ้นบรรทัดใหม่ · แนบรูปได้ · AI ค้นหาจากเว็บทางการแบบ Real-time
          </p>
        </div>
      </main>
    </div>
  );
}
