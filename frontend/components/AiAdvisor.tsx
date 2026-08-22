'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, User, Sparkles, AlertCircle, RefreshCw, ChevronDown, ChevronUp, MessageSquare, Camera } from 'lucide-react';
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
      content: 'สวัสดีครับ! ผมคือ **CarePulse AI Assistant (Qwen 3.8 27B)** ยินดีให้คำปรึกษาเกี่ยวกับสิทธิประโยชน์ทางการแพทย์ เช่น บัตรทอง 30 บาท, ประกันสังคม ม.33/39/40, ข้าราชการ CSMBS, ผู้สูงอายุ และ UCEP ฉุกเฉินวิกฤตครับ ถามผมได้เลย!',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeModel, setActiveModel] = useState('Qwen3.8-27B-FP8 + Live Web Search');
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
    
    // Add empty assistant placeholder for streaming
    setMessages([...newMessages, { role: 'assistant', content: '' }]);
    setInput('');
    setLoading(true);
    setSearchingWeb(true);
    setLatestWebSources([]);

    let accumulatedContent = '';

    await streamAiAdvisor(
      newMessages,
      (delta: string) => {
        setSearchingWeb(false);
        accumulatedContent += delta;
        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = {
            role: 'assistant',
            content: accumulatedContent,
          };
          return next;
        });
      },
      () => {
        setLoading(false);
        setSearchingWeb(false);
      },
      (error: string) => {
        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = {
            role: 'assistant',
            content: `ขออภัยครับ เกิดข้อผิดพลาด: ${error}`,
          };
          return next;
        });
        setLoading(false);
        setSearchingWeb(false);
      },
      (sources) => {
        setSearchingWeb(false);
        setLatestWebSources(sources);
      }
    );
  };



  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-3 apple-glass border border-black/10 text-slate-900 font-bold py-3.5 px-5 rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300 ring-4 ring-emerald-500/10 cursor-pointer group"
        >
          <div className="size-8 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-sm group-hover:rotate-12 transition-transform">
            <Bot className="w-4 h-4" />
          </div>
          <span className="text-sm font-bold tracking-tight">ถาม AI สิทธิสุขภาพ</span>
          <span className="bg-emerald-100 text-emerald-900 text-[10px] px-2 py-0.5 rounded-full font-extrabold uppercase tracking-wide">
            Live Web
          </span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="w-[360px] sm:w-[420px] h-[580px] max-h-[85vh] apple-glass bg-white/95 rounded-[32px] shadow-2xl border border-black/[0.08] flex flex-col overflow-hidden animate-apple-fade-in">
          {/* Header */}
          <div className="apple-glass bg-emerald-700/90 text-white p-4 flex items-center justify-between border-b border-white/10 backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md shadow-inner">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-sm flex items-center gap-1.5">
                  CarePulse AI Advisor
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                </h3>
                <p className="text-[11px] text-emerald-100/90 font-medium">
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
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-[#fbfbfd]">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex gap-2.5 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 text-sm mt-0.5 shadow-sm">
                    <Bot className="w-4 h-4" />
                  </div>
                )}
                <div
                  className={`rounded-2xl px-4 py-3 text-sm leading-relaxed max-w-[82%] shadow-sm ${
                    m.role === 'user'
                      ? 'bg-emerald-600 text-white rounded-br-none font-medium'
                      : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-none'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.content}</p>
                </div>
                {m.role === 'user' && (
                  <div className="w-8 h-8 rounded-xl bg-slate-700 text-white flex items-center justify-center flex-shrink-0 text-sm mt-0.5 shadow-sm">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}

            {searchingWeb && (
              <div className="flex gap-2 items-center text-teal-700 text-xs bg-teal-50 p-2.5 rounded-xl border border-teal-200 w-fit">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-teal-600" />
                <span className="font-bold">🌐 AI กำลังค้นหาข้อมูลจากอินเทอร์เน็ตสดๆ (Live Web Search)...</span>
              </div>
            )}

            {latestWebSources.length > 0 && (
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-2.5 text-xs space-y-1.5">
                <div className="font-bold text-emerald-900 flex items-center gap-1">
                  <span>🌐 แหล่งข้อมูลอินเทอร์เน็ตที่ AI ดึงมาอ้างอิง:</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {latestWebSources.slice(0, 3).map((src, i) => (
                    <a
                      key={i}
                      href={src.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-1 rounded-lg font-medium text-[11px] truncate max-w-[240px] block"
                      title={src.title}
                    >
                      🔗 {src.title}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {loading && !searchingWeb && (
              <div className="flex gap-2.5 items-center text-slate-500 text-sm bg-white p-3 rounded-2xl border border-slate-200 w-fit">
                <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
                <span className="font-medium">Qwen AI กำลังพิมพ์คำตอบ...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>


          {/* Quick Question Chips */}
          <div className="px-3 py-2 bg-slate-100/80 border-t border-slate-200/60 overflow-x-auto flex gap-1.5 no-scrollbar">
            {QUICK_QUESTIONS.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(q)}
                className="whitespace-nowrap text-xs font-semibold bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200 hover:border-emerald-300 px-2.5 py-1.5 rounded-full transition-all flex-shrink-0 shadow-xs"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <div className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
            <label className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl cursor-pointer transition-all flex-shrink-0" title="ส่งรูปใบรับรองแพทย์ให้ AI วิเคราะห์">
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
                    content: `📷 [แนบรูปภาพใบรับรองแพทย์]: ${file.name}`
                  };
                  setMessages((prev) => [...prev, userMsg, { role: 'assistant', content: '🤖 กำลังอ่านและวิเคราะห์ภาพใบรับรองแพทย์ด้วย Qwen Vision AI & Real OCR...' }]);
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
              className="flex-1 px-3.5 py-2.5 bg-slate-100 rounded-xl text-sm border-0 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 placeholder:text-slate-400"
            />
            <button
              onClick={() => handleSend()}
              disabled={loading || !input.trim()}
              className="p-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-xl shadow-md transition-all flex-shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

