/**
 * CP-Arena: Mathematical & Algorithmic Formula Parser
 * 
 * Mengonversi notasi pangkat Python (10**8), kalkulator (10^8), kompleksitas Big-O (O(N log N)),
 * serta simbol matematika relasional (<=, >=, !=, ->) menjadi representasi terstruktur
 * yang siap dirender secara tipografis indah untuk mahasiswa, dengan tetap melindungi
 * keaslian sintaks cuplikan kode pemrograman.
 */

export interface MathPowerToken {
  type: 'power';
  base: string;
  exponent: string;
}

export interface MathSymbolToken {
  type: 'symbol';
  symbol: string;
}

export interface MathTextToken {
  type: 'text';
  content: string;
}

export type MathInlineToken = MathPowerToken | MathSymbolToken | MathTextToken;

export interface CodeBlockSegment {
  type: 'code_block';
  code: string;
  language?: string;
}

export interface InlineCodeSegment {
  type: 'inline_code';
  code: string;
}

export interface LatexMathSegment {
  type: 'latex_math';
  content: string;
  display: boolean;
}

export interface BigOSegment {
  type: 'big_o';
  notation: string; // 'O', 'Theta', 'Omega'
  innerTokens: MathInlineToken[];
}

export interface PowerSegment {
  type: 'power';
  base: string;
  exponent: string;
}

export interface SymbolSegment {
  type: 'symbol';
  symbol: string;
}

export interface TextSegment {
  type: 'text';
  content: string;
}

export type MathSegment =
  | CodeBlockSegment
  | InlineCodeSegment
  | LatexMathSegment
  | BigOSegment
  | PowerSegment
  | SymbolSegment
  | TextSegment;

/**
 * Peta simbol matematika standar Competitive Programming
 */
export const SYMBOL_MAP: Record<string, string> = {
  '<=': '≤',
  '>=': '≥',
  '!=': '≠',
  '===': '≡',
  '->': '→',
  '<-': '←',
  '<->': '↔',
  '+-': '±',
  '+/-': '±',
  '\\le': '≤',
  '\\ge': '≥',
  '\\neq': '≠',
  '\\times': '×',
  '\\approx': '≈',
  '\\infty': '∞',
  '\\sum': '∑',
  '\\prod': '∏',
  '\\sqrt': '√',
  '\\in': '∈',
  '\\notin': '∉',
  '\\subset': '⊂',
  '\\subseteq': '⊆',
};

/**
 * Mengurai string sederhana (misal inner Big-O atau teks singkat) menjadi token inline (pangkat & teks).
 */
export function parseInlineMathTokens(raw: string): MathInlineToken[] {
  const tokens: MathInlineToken[] = [];
  // Regex mencocokkan pola pangkat: 10**8 atau 10^8 atau N**2 atau (N+1)**2
  const powerRegex = /([a-zA-Z0-9_\)]+)\s*(?:\*\*|\^)\s*([a-zA-Z0-9_\{\}\+\-]+)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = powerRegex.exec(raw)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({
        type: 'text',
        content: raw.substring(lastIndex, match.index),
      });
    }

    const base = match[1];
    let exp = match[2];
    if (exp.startsWith('{') && exp.endsWith('}')) {
      exp = exp.slice(1, -1);
    }

    tokens.push({
      type: 'power',
      base,
      exponent: exp,
    });

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < raw.length) {
    tokens.push({
      type: 'text',
      content: raw.substring(lastIndex),
    });
  }

  return tokens;
}

/**
 * Parser utama: Memecah narasi teks menjadi segmen-segmen terstruktur
 * dengan isolasi blok kode dan pemrosesan rumus matematis cerdas.
 */
export function parseMathSegments(rawText: string): MathSegment[] {
  if (!rawText) return [];

  const segments: MathSegment[] = [];

  // 1. Ekstrak blok kode ``` ... ``` dan inline code ` ... `
  // dan ekspresi LaTeX $$ ... $$ atau $ ... $
  const masterRegex = /(```(\w*)\n?([\s\S]*?)```)|(`([^`]+)`)|(\$\$([\s\S]*?)\$\$)|(\$([^\$\n]+)\$)/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = masterRegex.exec(rawText)) !== null) {
    // Teks biasa sebelum match
    if (match.index > lastIndex) {
      const prose = rawText.substring(lastIndex, match.index);
      parseProseSegments(prose, segments);
    }

    if (match[1] !== undefined) {
      // Blok kode ``` ... ```
      segments.push({
        type: 'code_block',
        language: match[2]?.trim() || undefined,
        code: match[3]?.replace(/\n$/, '') || '',
      });
    } else if (match[4] !== undefined) {
      // Inline code ` ... `
      segments.push({
        type: 'inline_code',
        code: match[5] || '',
      });
    } else if (match[6] !== undefined) {
      // Display math $$ ... $$
      segments.push({
        type: 'latex_math',
        content: match[7]?.trim() || '',
        display: true,
      });
    } else if (match[8] !== undefined) {
      // Inline math $ ... $
      segments.push({
        type: 'latex_math',
        content: match[9]?.trim() || '',
        display: false,
      });
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < rawText.length) {
    const remainingProse = rawText.substring(lastIndex);
    parseProseSegments(remainingProse, segments);
  }

  return segments;
}

/**
 * Mem-parse teks narasi non-kode untuk Big-O, pangkat, dan simbol matematika.
 */
function parseProseSegments(prose: string, output: MathSegment[]): void {
  // Regex untuk menangkap Big-O: O(...) atau Theta(...) atau Omega(...)
  // atau Pangkat: 10**8, 2**31, N**2, 10^8, 2^31
  // atau Simbol: <=, >=, !=, ->, +-
  const mathEntityRegex = /\b(O|Big-O|Theta|Omega)\s*\(([^)]+)\)|([a-zA-Z0-9_\)]+)\s*(?:\*\*|\^)\s*([a-zA-Z0-9_\{\}\+\-]+)|(<=|>=|!=|<->|->|<-|\+-|\+\/-|\\le|\\ge|\\neq|\\times|\\approx|\\infty|\\sum|\\prod|\\sqrt|\\in|\\notin|\\subset|\\subseteq)/g;

  let lastIdx = 0;
  let match: RegExpExecArray | null;

  while ((match = mathEntityRegex.exec(prose)) !== null) {
    if (match.index > lastIdx) {
      output.push({
        type: 'text',
        content: prose.substring(lastIdx, match.index),
      });
    }

    if (match[1] !== undefined) {
      // Big-O / Kompleksitas
      const notation = match[1] === 'Big-O' ? 'O' : match[1];
      const inner = match[2];
      output.push({
        type: 'big_o',
        notation,
        innerTokens: parseInlineMathTokens(inner),
      });
    } else if (match[3] !== undefined) {
      // Pangkat (Power): base ** exp atau base ^ exp
      const base = match[3];
      let exp = match[4];
      if (exp.startsWith('{') && exp.endsWith('}')) {
        exp = exp.slice(1, -1);
      }
      output.push({
        type: 'power',
        base,
        exponent: exp,
      });
    } else if (match[5] !== undefined) {
      // Simbol matematika
      const rawSymbol = match[5];
      const translated = SYMBOL_MAP[rawSymbol] || rawSymbol;
      output.push({
        type: 'symbol',
        symbol: translated,
      });
    }

    lastIdx = match.index + match[0].length;
  }

  if (lastIdx < prose.length) {
    output.push({
      type: 'text',
      content: prose.substring(lastIdx),
    });
  }
}

/**
 * Helper string normalizer murni untuk testing & representasi string terformat
 */
export function formatMathString(raw: string): string {
  const segments = parseMathSegments(raw);
  return segments
    .map((s) => {
      switch (s.type) {
        case 'code_block':
          return `\`\`\`${s.code}\`\`\``;
        case 'inline_code':
          return `\`${s.code}\``;
        case 'latex_math':
          return `$${s.content}$`;
        case 'big_o': {
          const inner = s.innerTokens
            .map((t) => {
              if (t.type === 'power') return `${t.base}^${t.exponent}`;
              if (t.type === 'symbol') return t.symbol;
              return t.content;
            })
            .join('');
          return `O(${inner})`;
        }
        case 'power':
          return `${s.base}^${s.exponent}`;
        case 'symbol':
          return s.symbol;
        case 'text':
          return s.content;
      }
    })
    .join('');
}
