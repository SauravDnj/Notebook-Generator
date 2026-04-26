'use client';
// components/NotebookCanvas.tsx
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { NotebookConfig, GeneratedContent, PAGE_SIZES } from '@/types/notebook';
import { renderNotebookPage, setNotebookImageCallback } from '@/lib/notebookRenderer';

interface Props {
  config: NotebookConfig;
  content: GeneratedContent;
  activePage: number;
  onPageChange: (p: number) => void;
  showAll: boolean;
}

const ZOOM_STEPS = [0.25, 0.33, 0.5, 0.67, 0.75, 0.9, 1.0, 1.25, 1.5, 2.0, 2.5];

export default function NotebookCanvas({ config, content, activePage, onPageChange, showAll }: Props) {
  const canvasRefs = useRef<(HTMLCanvasElement | null)[]>([]);
  const outerRef   = useRef<HTMLDivElement>(null);
  const [fontsReady, setFontsReady] = useState(false);
  const [zoom, setZoom]             = useState(0); // 0 = auto-fit
  const [outerSize, setOuterSize]   = useState({ w: 900, h: 600 });

  const [renderTick, setRenderTick] = useState(0);

  useEffect(() => { document.fonts.ready.then(() => setFontsReady(true)); }, []);

  useEffect(() => {
    setNotebookImageCallback(() => {
      setRenderTick(t => t + 1);
    });
  }, []);

  useEffect(() => {
    const el = outerRef.current; if (!el) return;
    const ro = new ResizeObserver(([e]) => setOuterSize({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const renderOne = useCallback((idx: number) => {
    if (!fontsReady) return;
    const c = canvasRefs.current[idx];
    // Always render — even if page is empty (renderer shows placeholder)
    if (c) renderNotebookPage(c, config, content, idx);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config, content, fontsReady, renderTick]);

  useEffect(() => {
    if (!fontsReady) return;
    const totalPages = content.pages.length;
    if (showAll) {
      for (let i = 0; i < totalPages; i++) renderOne(i);
    } else {
      renderOne(activePage);
    }
  }, [renderOne, activePage, showAll, fontsReady, content.pages.length]);

  const dim = PAGE_SIZES[config.pageSize];
  const numPages = content.pages.length; // use actual generated pages

  // Fit scale
  const pad = 48;
  const fitScale = Math.min(
    (outerSize.w - pad) / dim.width,
    (outerSize.h - pad) / dim.height,
    1.0
  );
  const effectiveZoom = zoom === 0 ? fitScale : zoom;
  const dispW = Math.round(dim.width  * effectiveZoom);
  const dispH = Math.round(dim.height * effectiveZoom);
  const zoomPct = Math.round(effectiveZoom * 100);

  function zoomIn()  { const cur = zoom === 0 ? fitScale : zoom; const n = ZOOM_STEPS.find(s => s > cur + 0.01); if (n) setZoom(n); }
  function zoomOut() { const cur = zoom === 0 ? fitScale : zoom; const n = [...ZOOM_STEPS].reverse().find(s => s < cur - 0.01); if (n) setZoom(n); }
  function zoomFit() { setZoom(0); }

  return (
    <>
      {/* Zoom bar */}
      <div className="zoom-bar">
        <button className="btn btn-secondary btn-sm btn-icon" onClick={zoomOut} id="zoom-out-btn" title="Zoom out">−</button>
        <span className="zoom-label">{zoomPct}%</span>
        <button className="btn btn-secondary btn-sm btn-icon" onClick={zoomIn}  id="zoom-in-btn"  title="Zoom in">+</button>
        <button className="btn btn-secondary btn-sm" onClick={zoomFit} id="zoom-fit-btn" title="Fit">⊞ Fit</button>
        <span className="zoom-size-label">{dim.width}×{dim.height} · {config.pageSize}</span>

        {/* Page navigation arrows (when viewing single page) */}
        {!showAll && numPages > 1 && (
          <div className="page-nav" style={{ marginLeft: 'auto' }}>
            <button
              className="btn btn-secondary btn-sm btn-icon"
              id="prev-page-btn"
              onClick={() => onPageChange(Math.max(0, activePage - 1))}
              disabled={activePage === 0}
              title="Previous page"
            >‹</button>
            <span className="zoom-label" style={{ minWidth: 60 }}>
              {activePage + 1} / {numPages}
            </span>
            <button
              className="btn btn-secondary btn-sm btn-icon"
              id="next-page-btn"
              onClick={() => onPageChange(Math.min(numPages - 1, activePage + 1))}
              disabled={activePage === numPages - 1}
              title="Next page"
            >›</button>
          </div>
        )}
      </div>

      {/* Canvas scroll area */}
      <div className="preview-canvas-area" ref={outerRef}>
        <div
          className="canvas-inner"
          style={{
            display: 'flex',
            flexDirection: showAll ? 'row' : 'column',
            flexWrap: showAll ? 'wrap' : undefined,
            gap: showAll ? 24 : undefined,
            justifyContent: showAll ? 'center' : undefined,
            alignItems: showAll ? 'flex-start' : 'center',
          }}
        >
          {Array.from({ length: numPages }, (_, i) => {
            if (!showAll && i !== activePage) return null;
            return (
              <div
                key={`${config.pageSize}-p${i}`}
                className="canvas-wrapper"
                onClick={() => { if (showAll) onPageChange(i); }}
                style={{ cursor: showAll && numPages > 1 ? 'pointer' : 'default', flexShrink: 0 }}
              >
                <div className={`canvas-shadow${showAll && activePage === i ? ' canvas-active' : ''}`}>
                  <canvas
                    ref={el => { canvasRefs.current[i] = el; }}
                    style={{ display: 'block', width: dispW, height: dispH }}
                  />
                </div>
                {showAll && (
                  <div className="page-label">Page {i + 1}</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
