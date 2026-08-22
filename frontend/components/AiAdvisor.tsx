'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, User, Sparkles, RefreshCw, ChevronDown, Camera } from 'lucide-react';
import { streamAiAdvisor, uploadDocument, ChatMessageItem } from '@/lib/api';

const QUICK_QUESTIONS = [
  'สิทธิ 30 บาทรักษาทุกที่ ใช้ต่างจังหวัดได้ไหม?',
  'ประกันสังคม ทำฟันฟรี 900 บาทต้องสำรองจ่ายไหม?',
  'กรณีฉุกเฉินวิกฤต UCEP ครอบคลุมอะไรบ้าง?',
  'ผู้สูงอายุ 60 ปีขึ้นไป มีสิทธิประโยชน์อะไรเพิ่มบ้าง?',
];

export default function AiAdvisor() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessageItem[]>([
    {
      role: 'assistant',
      content: 'สวัสดีครับ! ผมคือ **CarePulse AI Assistant** ยินดีให้คำปรึกษาเกี่ยวกับสิทธิประโยชน์ทางการแพทย์ เช่น บัตรทอง 30 บาท, ประกันสังคม ม.33/39/40, ข้าราชการ CSMBS, กายอุปกรณ์ และสิทธิ UCEP ฉุกเฉินวิกฤตครับ ถามผมได้เลย!',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeModel, setActiveModel] = useState('Qwen 3.8 + Live Web Search');
  const [searchingWeb, setSearchingWeb] = useState(false);
  const [latestWebSources, setLatestWebSources] = useState<Array<{ title: string; url: string; snippet: string }>>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || input.trim();
    if (!query || loading) return;

    const userMessage: ChatMessageItem = { role: 'user', content: query };
    const newMessages: ChatMessageItem[] = [...messages, userMessage];
    
    setMessages([...newMessages, { role: 'assistant', content: '' }]);
    setInput('');
    setLoading(true);
    setSearchingWeb(false);
    setLatestWebSources([]);

    await streamAiAdvisor(
      newMessages,
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
        setLoading(false);
        setSearchingWeb(false);
      },
      (error) => {
        setMessages((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last.role === 'assistant') {
            last.content = `เกิดข้อผิดพลาด: ${error}`;
          }
          return [...updated];
        });
        setLoading(false);
        setSearchingWeb(false);
      },
      (webSources) => {
        setLatestWebSources(webSources);
      }
    );
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Floating Liquid Capsule Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="liquid-glass rounded-full py-3 px-5 flex items-center gap-3 shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300 ring-4 ring-emerald-500/15 cursor-pointer group border border-white/80"
        >
          <div className="size-9 rounded-full bg-gradient-to-tr from-emerald-500 via-teal-500 to-emerald-700 flex items-center justify-center text-white shadow-md group-hover:rotate-12 transition-transform">
            <Bot className="w-5 h-5" />
          </div>
          <span className="text-sm font-black text-slate-900 tracking-tight">ถาม AI สิทธิสุขภาพ</span>
          <span className="liquid-glass-pill bg-emerald-100/90 text-emerald-900 text-[10px] px-2.5 py-0.5 font-black uppercase">
            Live Web
          </span>
        </button>
      )}

      {/* Chat Window — VisionOS Liquid Glass */}
      {isOpen && (
        <div className="w-[360px] sm:w-[420px] h-[580px] max-h-[85vh] liquid-glass rounded-[36px] shadow-2xl border border-white/80 flex flex-col overflow-hidden animate-apple-fade-in">
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-600/90 via-teal-600/90 to-emerald-700/90 text-white p-4 flex items-center justify-between border-b border-white/20 backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md shadow-inner">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-black text-sm flex items-center gap-1.5">
                  CarePulse AI Advisor
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                </h3>
                <p className="text-[11px] text-emerald-100/90 font-semibold">
                  {activeModel}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 rounded-full hover:bg-white/20 active:scale-90 transition-all text-white cursor-pointer"
            >
              <ChevronDown className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Container */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-white/30 backdrop-blur-md">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex gap-2.5 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.role === 'assistant' && (
                  <div className="liquid-glass size-8 rounded-full text-emerald-700 flex items-center justify-center shrink-0 text-sm mt-0.5 shadow-xs">
                    <Bot className="w-4 h-4" />
                  </div>
                )}
                <div
                  className={`rounded-[22px] px-4.5 py-3 text-xs sm:text-sm leading-relaxed max-w-[82%] shadow-sm font-medium ${
                    m.role === 'user'
                      ? 'liquid-btn-primary rounded-br-xs text-white'
                      : 'liquid-glass rounded-bl-xs text-slate-900 border border-white/90'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.content}</p>
                </div>
                {m.role === 'user' && (
                  <div className="liquid-glass size-8 rounded-full text-slate-700 flex items-center justify-center shrink-0 text-sm mt-0.5 shadow-xs">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}

            {searchingWeb && (
              <div className="liquid-glass-pill flex gap-2 items-center text-teal-900 text-xs px-3 py-2 w-fit">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-teal-600" />
                <span className="font-bold">AI กำลังค้นหาข้อมูลจากอินเทอร์เน็ตสดๆ...</span>
              </div>
            )}

            {latestWebSources.length > 0 && (
              <div className="liquid-glass-card rounded-2xl p-3 text-xs space-y-1.5">
                <div className="font-black text-emerald-950 flex items-center gap-1">
                  <span>แหล่งข้อมูลอินเทอร์เน็ตที่ AI ดึงมาอ้างอิง:</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {latestWebSources.slice(0, 3).map((src, i) => (
                    <a
                      key={i}
                      href={src.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="liquid-glass-pill px-2.5 py-1 text-emerald-800 font-bold text-[11px] truncate max-w-[240px] block"
                      title={src.title}
                    >
                      {src.title}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {loading && !searchingWeb && (
              <div className="liquid-glass-pill flex gap-2.5 items-center text-slate-600 text-xs px-3 py-2 w-fit">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                <span className="font-bold">Qwen AI กำลังพิมพ์คำตอบ...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Question Chips */}
          <div className="px-3 py-2 bg-white/40 border-t border-black/[0.04] overflow-x-auto flex gap-1.5 no-scrollbar">
            {QUICK_QUESTIONS.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(q)}
                className="liquid-glass-pill whitespace-nowrap text-xs font-bold text-slate-700 hover:text-emerald-800 px-3 py-1.5 transition-all shrink-0 cursor-pointer"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <div className="p-3 bg-white/70 border-t border-white/60 flex items-center gap-2">
            <label className="liquid-glass size-10 rounded-2xl flex items-center justify-center text-slate-600 hover:text-emerald-700 cursor-pointer transition-all shrink-0" title="ส่งรูปใบรับรองแพทย์ให้ AI วิเคราะห์">
              <Camera className="w-4 h-4 text-emerald-600" />
              <input
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const userMsg: ChatMessageItem = {
                    role: 'user',
                    content: `[แนบรูปภาพใบรับรองแพทย์]: ${file.name}`
                  };
                  setMessages((prev) => [...prev, userMsg, { role: 'assistant', content: 'กำลังอ่านและวิเคราะห์ภาพใบรับรองแพทย์ด้วย Qwen Vision AI & Real OCR...' }]);
                  setLoading(true);
                  try {
                    const res = await uploadDocument(file, 'medical_certificate');
                    const summary = res.extracted_data?.ai_clinical_summary || 'วิเคราะห์เอกสารเรียบร้อยแล้ว';
                    setMessages((prev) => {
                      const next = [...prev];
                      next[next.length - 1] = {
                        role: 'assistant',
                        content: summary
                      };
                      return next;
                    });
                  } catch (err: any) {
                    setMessages((prev) => {
                      const next = [...prev];
                      next[next.length - 1] = {
                        role: 'assistant',
                        content: `เกิดข้อผิดพลาดในการวิเคราะห์ภาพ: ${err.message}`
                      };
                      return next;
                    });
                  } finally {
                    setLoading(false);
                  }
                }}
              />
            </label>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="พิมพ์คำถาม หรือแนบรูปใบรับรองแพทย์..."
              className="flex-1 px-4 py-2.5 bg-white/80 rounded-2xl text-xs sm:text-sm border border-black/[0.06] focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 placeholder:text-slate-400 font-medium"
            />
            <button
              onClick={() => handleSend()}
              disabled={loading || !input.trim()}
              className="liquid-btn-primary size-10 flex items-center justify-center shrink-0 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
