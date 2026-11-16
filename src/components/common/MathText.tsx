'use client';

import React, { useMemo } from 'react';
import { parseMathSegments, MathSegment } from '@/lib/math-parser';

interface MathTextProps {
  content?: string | null;
  className?: string;
  inline?: boolean;
}

/**
 * Komponen MathText: Merender narasi soal, batas waktu, opsi jawaban,
 * dan editorial dengan konversi otomatis rumus matematika (pangkat **, ^, Big-O,
 * dan simbol relasional <=, >=, !=, ->), sembari mempertahankan keaslian blok kode.
 */
export default function MathText({ content, className = '', inline = false }: MathTextProps) {
  const segments = useMemo(() => {
    if (!content) return [];
    return parseMathSegments(content);
  }, [content]);

  if (!content) return null;

  const renderSegment = (segment: MathSegment, idx: number) => {
    switch (segment.type) {
      case 'code_block':
        return (
          <pre
            key={idx}
            className="p-3 my-2.5 rounded-lg bg-[#070b14] border border-[#1e293b] font-mono text-xs text-emerald-300 overflow-x-auto whitespace-pre selection:bg-emerald-950"
          >
            <code>{segment.code}</code>
          </pre>
        );

      case 'inline_code':
        return (
          <code
            key={idx}
            className="px-1.5 py-0.5 mx-0.5 rounded bg-[#111827] border border-slate-700/60 font-mono text-emerald-300 text-[0.88em]"
          >
            {segment.code}
          </code>
        );

      case 'latex_math':
        return (
          <span
            key={idx}
            className={`inline-flex items-baseline font-serif italic text-cyan-300 px-1.5 py-0.5 mx-0.5 rounded bg-cyan-950/40 border border-cyan-800/40 text-[0.95em] ${
              segment.display ? 'block my-2 text-center p-2' : ''
            }`}
          >
            {segment.content}
          </span>
        );

      case 'big_o':
        return (
          <span
            key={idx}
            className="inline-flex items-center font-serif italic font-bold text-amber-300 px-1.5 py-0.5 mx-0.5 rounded bg-amber-500/10 border border-amber-500/25 tracking-wide text-[0.95em]"
          >
            𝒪(
            {segment.innerTokens.map((t, tIdx) => {
              if (t.type === 'power') {
                return (
                  <span key={tIdx} className="inline-flex items-baseline">
                    <span>{t.base}</span>
                    <sup className="text-[0.72em] font-sans font-bold text-cyan-300 ml-0.5 -top-[0.45em] relative">
                      {t.exponent}
                    </sup>
                  </span>
                );
              }
              if (t.type === 'symbol') {
                return <span key={tIdx}>{t.symbol}</span>;
              }
              return <span key={tIdx}>{t.content}</span>;
            })}
            )
          </span>
        );

      case 'power':
        return (
          <span key={idx} className="inline-flex items-baseline font-mono font-medium">
            <span>{segment.base}</span>
            <sup className="text-[0.72em] font-sans font-bold text-cyan-400 ml-0.5 -top-[0.45em] relative">
              {segment.exponent}
            </sup>
          </span>
        );

      case 'symbol':
        return (
          <span key={idx} className="text-cyan-300 font-semibold px-0.5 inline-block font-sans">
            {segment.symbol}
          </span>
        );

      case 'text':
      default:
        return (
          <span key={idx} className="whitespace-pre-line">
            {segment.content}
          </span>
        );
    }
  };

  const Wrapper = inline ? 'span' : 'div';

  return (
    <Wrapper className={className}>
      {segments.map((seg, i) => renderSegment(seg, i))}
    </Wrapper>
  );
}
