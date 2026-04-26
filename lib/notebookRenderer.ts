// lib/notebookRenderer.ts
import {
  NotebookConfig, GeneratedContent, QAItem, NotebookPage,
  PAGE_SIZES, BACKGROUND_THEMES, BackgroundTheme, PaperTexture,
} from '@/types/notebook';

const MARGIN_LINE_X = 52;
const CONTENT_L     = 64;
const CONTENT_RP    = 30;
const TOP_PAD       = 16;
const BOTTOM_PAD    = 52;
const HEADER_GAP    = 8;
const IMAGE_HEIGHT  = 240; // Fixed reserved height for diagrams

// ── Image Cache ──────────────────────────────────────────────────────────────
const imageCache = new Map<string, HTMLImageElement | 'loading'>();
let onImageLoadCallback: (() => void) | null = null;

export function setNotebookImageCallback(cb: () => void) {
  onImageLoadCallback = cb;
}

function getOrLoadDiagram(code: string | undefined, legacyPrompt: string | undefined): HTMLImageElement | null {
  if (!code && !legacyPrompt) return null;

  // We use the code itself as the cache key
  const cacheKey = code || legacyPrompt || '';
  
  if (imageCache.has(cacheKey)) {
    const val = imageCache.get(cacheKey);
    return val === 'loading' ? null : val!;
  }

  imageCache.set(cacheKey, 'loading');

  if (code) {
    // Use Kroki.io for highly reliable Mermaid rendering
    fetch('https://kroki.io/mermaid/svg', {
      method: 'POST',
      body: code,
      headers: { 'Content-Type': 'text/plain' }
    })
      .then(res => {
        if (!res.ok) throw new Error('Kroki failed');
        return res.blob();
      })
      .then(blob => {
        const url = URL.createObjectURL(blob);
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          imageCache.set(cacheKey, img);
          if (onImageLoadCallback) onImageLoadCallback();
        };
        img.onerror = () => imageCache.delete(cacheKey);
        img.src = url;
      })
      .catch(err => {
        console.error('Diagram fetch error:', err);
        imageCache.delete(cacheKey);
      });
  } else if (legacyPrompt) {
    // Legacy Pollinations fallback
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(legacyPrompt + ', technical diagram, sketch style on white background')}?width=600&height=400&nologo=true`;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageCache.set(cacheKey, img);
      if (onImageLoadCallback) onImageLoadCallback();
    };
    img.onerror = () => imageCache.delete(cacheKey);
    img.src = url;
  }
  
  return null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function wrap(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    const t = cur ? `${cur} ${w}` : w;
    if (ctx.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; }
    else cur = t;
  }
  if (cur) lines.push(cur);
  return lines.length ? lines : [''];
}

// ── Dynamic Pagination Engine ────────────────────────────────────────────────
export function paginateContent(title: string, items: QAItem[], cfg: NotebookConfig): GeneratedContent {
  // If not in browser (SSR), fallback to simple distribution
  if (typeof document === 'undefined') {
    return { title, pages: [{ items }] };
  }

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  
  const dim = PAGE_SIZES[cfg.pageSize];
  const W = dim.width;
  const H = dim.height;
  const contentW = W - CONTENT_L - CONTENT_RP;
  const spacing = cfg.lineSpacing;
  const bodyBot = H - BOTTOM_PAD;
  
  // Calculate where body starts on page 1 (after title + header line + gap)
  ctx.font = `bold italic ${cfg.titleSize}px '${cfg.font}', cursive`;
  const tLines = wrap(ctx, title || '', contentW);
  const headerHeight = TOP_PAD + (tLines.length * cfg.titleSize) + 10 + HEADER_GAP;
  // Snap to first ruled line
  const firstPageStart = Math.ceil(headerHeight / spacing) * spacing + spacing;

  // On page 2+, start from a consistent top
  const laterPageStart = Math.ceil((TOP_PAD + HEADER_GAP) / spacing) * spacing + spacing;
  
  const pages: NotebookPage[] = [];
  let currentItems: QAItem[] = [];
  let currentY = firstPageStart;

  function measureItem(item: QAItem, index: number): number {
    let h = 0;
    // Question line(s)
    ctx.font = `bold ${cfg.questionSize}px '${cfg.font}', cursive`;
    const qPre = `${index + 1}. `;
    const qPreW = ctx.measureText(qPre).width;
    const qLns = wrap(ctx, item.question, contentW - qPreW);
    h += qLns.length * spacing;
    // "Answer:" label
    h += spacing;
    // Bullet points
    ctx.font = `${cfg.bodySize}px '${cfg.font}', cursive`;
    const txtX = CONTENT_L + 26;
    for (const ans of item.answers) {
      const aLns = wrap(ctx, ans, W - txtX - CONTENT_RP);
      h += aLns.length * spacing;
    }
    // Gap between items
    h += spacing * 0.5;
    // Image/diagram space
    if (item.mermaidCode || item.imagePrompt) {
      h += IMAGE_HEIGHT + spacing;
    }
    return h;
  }

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const itemHeight = measureItem(item, i);

    // Does this item fit on the current page?
    if (currentY + itemHeight > bodyBot - 20 && currentItems.length > 0) {
      // Push the current page and start a new one
      pages.push({ items: currentItems });
      currentItems = [item];
      currentY = laterPageStart + itemHeight;
    } else {
      currentItems.push(item);
      currentY += itemHeight;
    }
  }

  if (currentItems.length > 0) {
    pages.push({ items: currentItems });
  }

  // Ensure at least config.numPages pages (so the user can add blank pages)
  while (pages.length < Math.max(1, cfg.numPages)) {
    pages.push({ items: [] });
  }

  return { title, pages };
}


// ── Paper Textures ────────────────────────────────────────────────────────────
function applyTexture(ctx: CanvasRenderingContext2D, W: number, H: number, SCALE: number, texture: PaperTexture) {
  if (texture === 'none') return;
  ctx.save();
  if (texture === 'fine-grain') {
    const img = ctx.getImageData(0, 0, W * SCALE, H * SCALE);
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const n = (Math.random() - 0.5) * 10;
      d[i] = Math.min(255, Math.max(0, d[i] + n));
      d[i+1] = Math.min(255, Math.max(0, d[i+1] + n));
      d[i+2] = Math.min(255, Math.max(0, d[i+2] + n));
    }
    ctx.putImageData(img, 0, 0);
  } else if (texture === 'heavy-grain') {
    const img = ctx.getImageData(0, 0, W * SCALE, H * SCALE);
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const n = (Math.random() - 0.5) * 28;
      d[i] = Math.min(255, Math.max(0, d[i] + n));
      d[i+1] = Math.min(255, Math.max(0, d[i+1] + n));
      d[i+2] = Math.min(255, Math.max(0, d[i+2] + n));
    }
    ctx.putImageData(img, 0, 0);
  } else if (texture === 'watercolor') {
    for (let i = 0; i < 80; i++) {
      const x = Math.random() * W;
      const y = Math.random() * H;
      const r = 20 + Math.random() * 60;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, `rgba(${Math.random() > 0.5 ? '180,160,130' : '200,200,220'},0.06)`);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(x, y, r, r * (0.6 + Math.random() * 0.7), Math.random() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }
    const img = ctx.getImageData(0, 0, W * SCALE, H * SCALE);
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const n = (Math.random() - 0.5) * 8;
      d[i] = Math.min(255, Math.max(0, d[i] + n));
      d[i+1] = Math.min(255, Math.max(0, d[i+1] + n));
      d[i+2] = Math.min(255, Math.max(0, d[i+2] + n));
    }
    ctx.putImageData(img, 0, 0);
  } else if (texture === 'vintage') {
    const img = ctx.getImageData(0, 0, W * SCALE, H * SCALE);
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const n = (Math.random() - 0.5) * 18;
      d[i]   = Math.min(255, Math.max(0, d[i]   + n + 4)); 
      d[i+1] = Math.min(255, Math.max(0, d[i+1] + n + 2)); 
      d[i+2] = Math.min(255, Math.max(0, d[i+2] + n - 4)); 
    }
    ctx.putImageData(img, 0, 0);
    const vg = ctx.createRadialGradient(W/2, H/2, H*0.3, W/2, H/2, H*0.75);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(80,50,20,0.18)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);
  } else if (texture === 'dot-grid') {
    const dotSpacing = 20;
    ctx.fillStyle = 'rgba(100,120,160,0.2)';
    for (let x = dotSpacing; x < W; x += dotSpacing) {
      for (let y = dotSpacing; y < H; y += dotSpacing) {
        ctx.beginPath(); ctx.arc(x, y, 1, 0, Math.PI * 2); ctx.fill();
      }
    }
  } else if (texture === 'crosshatch') {
    ctx.strokeStyle = 'rgba(100,110,140,0.08)';
    ctx.lineWidth = 0.5;
    const step = 18;
    for (let i = -H; i < W + H; i += step) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i + H, H); ctx.stroke(); }
    for (let i = -H; i < W + H; i += step) { ctx.beginPath(); ctx.moveTo(i, H); ctx.lineTo(i + H, 0); ctx.stroke(); }
  } else if (texture === 'canvas-weave') {
    ctx.strokeStyle = 'rgba(120,100,80,0.07)';
    ctx.lineWidth = 1;
    const step = 4;
    for (let x = 0; x < W; x += step) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += step) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  }
  ctx.restore();
}

// ── Page Shadow ───────────────────────────────────────────────────────────────
function drawPageShadow(ctx: CanvasRenderingContext2D, W: number, H: number) {
  const rg = ctx.createLinearGradient(W - 12, 0, W, 0);
  rg.addColorStop(0, 'rgba(0,0,0,0)'); rg.addColorStop(1, 'rgba(0,0,0,0.1)');
  ctx.fillStyle = rg; ctx.fillRect(W - 12, 0, 12, H);
  const bg = ctx.createLinearGradient(0, H - 12, 0, H);
  bg.addColorStop(0, 'rgba(0,0,0,0)'); bg.addColorStop(1, 'rgba(0,0,0,0.12)');
  ctx.fillStyle = bg; ctx.fillRect(0, H - 12, W, 12);
  const lg = ctx.createLinearGradient(0, 0, 6, 0);
  lg.addColorStop(0, 'rgba(0,0,0,0.05)'); lg.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = lg; ctx.fillRect(0, 0, 6, H);
}

// ── Footer ────────────────────────────────────────────────────────────────────
function drawFooter(ctx: CanvasRenderingContext2D, W: number, H: number, cfg: NotebookConfig, pi: number, total: number) {
  const sz = Math.max(10, Math.round(cfg.bodySize * 0.65));
  ctx.save();
  ctx.font = `${sz}px '${cfg.font}', cursive`;
  ctx.beginPath();
  ctx.strokeStyle = 'rgba(150,150,150,0.3)';
  ctx.lineWidth = 0.5;
  ctx.moveTo(CONTENT_L, H - BOTTOM_PAD + 6);
  ctx.lineTo(W - CONTENT_RP, H - BOTTOM_PAD + 6);
  ctx.stroke();

  if (cfg.footer.enabled) {
    const parts: string[] = [];
    if (cfg.footer.name) parts.push(cfg.footer.name);
    if (cfg.footer.linkedinHandle) parts.push(`🔗 linkedin.com/in/${cfg.footer.linkedinHandle}`);
    if (cfg.footer.githubHandle) parts.push(`⌥ github.com/${cfg.footer.githubHandle}`);
    if (cfg.footer.customText) parts.push(cfg.footer.customText);

    ctx.fillStyle = cfg.footer.color;
    ctx.textAlign = 'center';
    if (parts.length > 2) {
      const line1 = parts.slice(0, Math.ceil(parts.length / 2)).join('  ·  ');
      const line2 = parts.slice(Math.ceil(parts.length / 2)).join('  ·  ');
      ctx.fillText(line1, W / 2, H - BOTTOM_PAD + 20);
      ctx.fillText(line2, W / 2, H - BOTTOM_PAD + 34);
    } else {
      ctx.fillText(parts.join('  ·  '), W / 2, H - BOTTOM_PAD + 24);
    }
  }
  if (cfg.showPageNumber && total > 1) {
    ctx.fillStyle = 'rgba(140,140,140,0.9)';
    ctx.textAlign = 'right';
    ctx.fillText(`${pi + 1} / ${total}`, W - CONTENT_RP, H - BOTTOM_PAD + 24);
  }
  ctx.restore();
}

// ── MAIN RENDER ───────────────────────────────────────────────────────────────
export function renderNotebookPage(
  canvas: HTMLCanvasElement,
  cfg: NotebookConfig,
  content: GeneratedContent,
  pi: number
): void {
  const dim = PAGE_SIZES[cfg.pageSize];
  const W = dim.width; const H = dim.height;
  const SCALE = 2;
  canvas.width = W * SCALE; canvas.height = H * SCALE;
  canvas.style.width = `${W}px`; canvas.style.height = `${H}px`;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(SCALE, SCALE);

  const knownTheme = cfg.theme in BACKGROUND_THEMES;
  const theme = knownTheme ? BACKGROUND_THEMES[cfg.theme as BackgroundTheme] : { bg: cfg.customBgColor, line: cfg.customLineColor, margin: '#F4A0A0' };
  const bgColor = knownTheme ? theme.bg : cfg.customBgColor;
  const lineColor = knownTheme ? theme.line : cfg.customLineColor;
  const marginColor = theme.margin ?? '#F4A0A0';
  const isDark = bgColor === '#1A1F2E';

  // 1. Background
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, W, H);

  // 2. Title (Only on first page)
  const font = cfg.font;
  const tSz = cfg.titleSize;
  const contentW = W - CONTENT_L - CONTENT_RP;
  let y = TOP_PAD;
  let headerLineY = y;

  if (pi === 0) {
    ctx.save();
    ctx.font = `bold italic ${tSz}px '${font}', cursive`;
    ctx.fillStyle = cfg.titleColor;
    ctx.textAlign = cfg.titleAlign === 'center' ? 'center' : cfg.titleAlign === 'right' ? 'right' : 'left';
    const tx = cfg.titleAlign === 'center' ? W / 2 : cfg.titleAlign === 'right' ? W - CONTENT_RP : CONTENT_L;
    const tLines = wrap(ctx, content.title || '', contentW);
    for (const tl of tLines) { y += tSz; ctx.fillText(tl, tx, y); }
    y += 10;
    ctx.restore();

    // 3. Header divider line
    headerLineY = y;
    ctx.save();
    ctx.beginPath(); ctx.strokeStyle = cfg.titleColor; ctx.lineWidth = 1.2; ctx.globalAlpha = 0.45;
    ctx.moveTo(0, headerLineY); ctx.lineTo(W, headerLineY); ctx.stroke();
    ctx.globalAlpha = 1; ctx.restore();
    y += HEADER_GAP;
  } else {
    // For page 2+, the header area is just the top padding
    headerLineY = TOP_PAD;
    y = TOP_PAD + HEADER_GAP;
  }

  // 4. Ruled lines (body area)
  const spacing = cfg.lineSpacing;
  const bodyBot = H - BOTTOM_PAD;
  // Start ruled lines from consistent position
  const ruledStart = pi === 0 ? headerLineY + HEADER_GAP : TOP_PAD + HEADER_GAP;
  ctx.save();
  ctx.strokeStyle = lineColor; ctx.lineWidth = 0.8; ctx.globalAlpha = 0.6;
  const firstRY = Math.ceil((ruledStart) / spacing) * spacing + spacing;
  for (let ry = firstRY; ry < bodyBot + spacing; ry += spacing) {
    ctx.beginPath(); ctx.moveTo(0, ry); ctx.lineTo(W, ry); ctx.stroke();
  }
  ctx.globalAlpha = 1; ctx.restore();

  // 5. Left margin line
  if (cfg.showMarginLine) {
    ctx.save();
    ctx.strokeStyle = marginColor; ctx.lineWidth = 1.2; ctx.globalAlpha = 0.5;
    ctx.beginPath(); ctx.moveTo(MARGIN_LINE_X, pi === 0 ? headerLineY + 2 : TOP_PAD); ctx.lineTo(MARGIN_LINE_X, bodyBot + 4); ctx.stroke();
    ctx.globalAlpha = 1; ctx.restore();
  }

  // 6. Page shadow
  if (cfg.showShadow) drawPageShadow(ctx, W, H);

  // 7. Q&A content — start on the first ruled line
  y = firstRY;
  const page = content.pages[pi];

  // For global question numbering
  // We need to figure out what index this page starts at
  let globalQi = 0;
  for (let p = 0; p < pi; p++) {
    globalQi += content.pages[p]?.items?.length || 0;
  }

  if (page?.items && page.items.length > 0) {
    for (let qi = 0; qi < page.items.length; qi++) {
      const item: QAItem = page.items[qi];
      const qNum = globalQi + qi + 1;
      
      const snap = Math.ceil((y - TOP_PAD) / spacing) * spacing + TOP_PAD;
      y = Math.max(y + 2, snap);

      // Question
      ctx.save();
      ctx.font = `bold ${cfg.questionSize}px '${font}', cursive`;
      ctx.fillStyle = cfg.questionColor; ctx.textAlign = 'left';
      const qPre = `${qNum}. `;
      const qPreW = ctx.measureText(qPre).width;
      const qLns = wrap(ctx, item.question, contentW - qPreW);
      ctx.fillText(qPre, CONTENT_L, y);
      for (let li = 0; li < qLns.length; li++) {
        ctx.fillText(qLns[li], CONTENT_L + qPreW, y);
        if (li < qLns.length - 1) y += spacing;
      }
      y += spacing; ctx.restore();

      // Answer label
      ctx.save();
      ctx.font = `${Math.round(cfg.bodySize * 0.88)}px '${font}', cursive`;
      ctx.fillStyle = isDark ? '#9999aa' : '#666666';
      ctx.fillText('Answer:', CONTENT_L + 4, y);
      y += spacing; ctx.restore();

      // Bullets
      const dotX = CONTENT_L + 12; const txtX = CONTENT_L + 26;
      for (const ans of item.answers) {
        ctx.save();
        ctx.font = `${cfg.bodySize}px '${font}', cursive`;
        ctx.fillStyle = cfg.textColor; ctx.textAlign = 'left';
        const aLns = wrap(ctx, ans, W - txtX - CONTENT_RP);
        ctx.beginPath(); ctx.arc(dotX, y - cfg.bodySize * 0.3, 2.6, 0, Math.PI * 2); ctx.fill();
        for (let li = 0; li < aLns.length; li++) {
          ctx.fillText(aLns[li], txtX, y);
          if (li < aLns.length - 1) y += spacing;
        }
        y += spacing; ctx.restore();
      }
      y += spacing * 0.2;

      // Draw Diagram/Image if present
      if (item.mermaidCode || item.imagePrompt) {
        const snapImg = Math.ceil((y - TOP_PAD) / spacing) * spacing + TOP_PAD;
        y = Math.max(y + 2, snapImg);

        const img = getOrLoadDiagram(item.mermaidCode, item.imagePrompt);
        
        ctx.save();
        ctx.strokeStyle = 'rgba(150,150,150,0.3)';
        ctx.lineWidth = 1;
        ctx.fillStyle = isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.5)';
        
        // Draw container
        const imgX = CONTENT_L + 20;
        const imgW = W - imgX - CONTENT_RP;
        ctx.beginPath();
        ctx.roundRect(imgX, y, imgW, IMAGE_HEIGHT, 8);
        ctx.fill();
        ctx.stroke();

        if (img) {
          // Draw actual image (clip to rounded rect)
          ctx.clip();
          // Try to fit the image nicely
          const iRatio = img.width / img.height;
          const bRatio = imgW / IMAGE_HEIGHT;
          let dW = imgW, dH = IMAGE_HEIGHT, dX = imgX, dY = y;
          if (iRatio > bRatio) {
            dH = imgW / iRatio;
            dY = y + (IMAGE_HEIGHT - dH) / 2;
          } else {
            dW = IMAGE_HEIGHT * iRatio;
            dX = imgX + (imgW - dW) / 2;
          }
          ctx.globalAlpha = 0.9; // Slight fade to blend into notebook
          ctx.drawImage(img, dX, dY, dW, dH);
          ctx.globalAlpha = 1.0;
        } else {
          // Loading placeholder
          ctx.font = `italic ${Math.round(cfg.bodySize * 0.8)}px '${font}', cursive`;
          ctx.fillStyle = isDark ? '#aaaaaa' : '#888888';
          ctx.textAlign = 'center';
          ctx.fillText('Drawing diagram...', imgX + imgW / 2, y + IMAGE_HEIGHT / 2 + 4);
        }
        
        ctx.restore();
        y += IMAGE_HEIGHT + spacing;
      }
    }
  } else {
    // Empty page placeholder
    ctx.save();
    ctx.font = `${cfg.bodySize * 0.9}px '${font}', cursive`;
    ctx.fillStyle = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)';
    ctx.textAlign = 'center';
    ctx.fillText(`Page ${pi + 1}`, W / 2, H / 2 - 10);
    ctx.restore();
  }

  // 8. Footer
  drawFooter(ctx, W, H, cfg, pi, content.pages.length);

  // 9. Paper texture
  if (cfg.enableTexture) {
    applyTexture(ctx, W, H, SCALE, cfg.paperTexture);
  }
}

// ── Parse raw text ────────────────────────────────────────────────────────────
// If the user pastes raw text, we just flat-parse it, and then paginate it via paginateContent in the UI.
export function parseRawTextToContent(rawText: string): QAItem[] {
  const lines = rawText.split('\n').filter(l => l.trim());
  const items: QAItem[] = [];
  let curr: QAItem | null = null;
  for (const line of lines) {
    const t = line.trim();
    if (/^\d+\./.test(t)) {
      if (curr) items.push(curr);
      curr = { question: t.replace(/^\d+\.\s*/, ''), answers: [] };
    } else if (/^[-•*]/.test(t)) {
      curr?.answers.push(t.replace(/^[-•*]\s*/, ''));
    } else if (t.toLowerCase() === 'answer:') {
      /* skip */
    } else if (t.toLowerCase().startsWith('[image:')) {
      if (curr) curr.imagePrompt = t.replace(/^\[image:\s*/i, '').replace(/\]$/, '');
    } else if (t.toLowerCase().startsWith('graph ') || t.toLowerCase().startsWith('sequenceDiagram') || t.toLowerCase().startsWith('classDiagram')) {
      if (curr) curr.mermaidCode = t;
    } else if (curr) {
      curr.answers.push(t);
    }
  }
  if (curr) items.push(curr);
  return items;
}

export type { GeneratedContent };
