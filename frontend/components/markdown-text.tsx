'use client';

import React from 'react';

/** Renders the markdown subset the AI actually emits: **bold**, • bullets, 1. numbered lists. */
function InlineText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith('**') && part.endsWith('**') && part.length > 4 ? (
          <strong key={i} className="font-extrabold text-slate-900">
            {part.slice(2, -2)}
          </strong>
        ) : (
          <React.Fragment key={i}>{part}</React.Fragment>
        )
      )}
    </>
  );
}

export function MarkdownText({ content, className = '' }: { content: string; className?: string }) {
  const lines = content.split('\n');
  const blocks: React.ReactNode[] = [];
  let listType: 'ul' | 'ol' | null = null;
  let items: string[] = [];

  const flushList = (key: string) => {
    if (!listType || items.length === 0) return;
    if (listType === 'ul') {
      blocks.push(
        <ul key={key} className="space-y-1.5 my-1.5">
          {items.map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="text-cyan-500 font-black leading-relaxed mt-px">•</span>
              <span className="flex-1"><InlineText text={item} /></span>
            </li>
          ))}
        </ul>
      );
    } else {
      blocks.push(
        <ol key={key} className="space-y-1.5 my-1.5">
          {items.map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="text-cyan-700 font-black leading-relaxed mt-px">{i + 1}.</span>
              <span className="flex-1"><InlineText text={item} /></span>
            </li>
          ))}
        </ol>
      );
    }
    listType = null;
    items = [];
  };

  lines.forEach((rawLine, idx) => {
    const line = rawLine.trim();

    const bulletMatch = line.match(/^[•\-*]\s+(.*)$/);
    const numberMatch = line.match(/^(\d+)[\).]\s+(.*)$/);

    if (bulletMatch) {
      if (listType !== 'ul') {
        flushList(`flush-${idx}`);
        listType = 'ul';
      }
      items.push(bulletMatch[1]);
      return;
    }
    if (numberMatch) {
      if (listType !== 'ol') {
        flushList(`flush-${idx}`);
        listType = 'ol';
      }
      items.push(numberMatch[2]);
      return;
    }

    flushList(`flush-${idx}`);

    if (line === '') {
      blocks.push(<div key={`gap-${idx}`} className="h-2" />);
    } else {
      blocks.push(
        <p key={`p-${idx}`} className="leading-relaxed">
          <InlineText text={line} />
        </p>
      );
    }
  });
  flushList('flush-end');

  return <div className={`space-y-0.5 ${className}`}>{blocks}</div>;
}
