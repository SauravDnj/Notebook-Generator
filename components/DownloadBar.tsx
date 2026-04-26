'use client';
// components/DownloadBar.tsx

import React, { useState } from 'react';
import JSZip from 'jszip';
import { NotebookConfig, GeneratedContent } from '@/types/notebook';
import { renderNotebookPage } from '@/lib/notebookRenderer';

interface DownloadBarProps {
  config: NotebookConfig;
  content: GeneratedContent;
  activePage: number;
}

export default function DownloadBar({ config, content, activePage }: DownloadBarProps) {
  const [downloading, setDownloading] = useState(false);
  const [mounted, setMounted] = useState(false);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  React.useEffect(() => { setMounted(true); }, []);

  function getOffscreenCanvas(pageIndex: number): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    renderNotebookPage(canvas, config, content, pageIndex);
    return canvas;
  }

  function downloadBlob(url: string, filename: string) {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async function downloadCurrentPNG() {
    const canvas = getOffscreenCanvas(activePage);
    const url = canvas.toDataURL('image/png');
    downloadBlob(url, `notebook-page-${activePage + 1}.png`);
  }

  async function downloadCurrentJPG() {
    const canvas = getOffscreenCanvas(activePage);
    const url = canvas.toDataURL('image/jpeg', 0.95);
    downloadBlob(url, `notebook-page-${activePage + 1}.jpg`);
  }

  async function downloadAllZIP() {
    setDownloading(true);
    try {
      const zip = new JSZip();
      const title = (content.title || 'notebook').replace(/\s+/g, '_').toLowerCase();
      for (let i = 0; i < content.pages.length; i++) {
        const canvas = getOffscreenCanvas(i);
        const dataUrl = canvas.toDataURL('image/png');
        const base64 = dataUrl.split(',')[1];
        zip.file(`${title}_page_${i + 1}.png`, base64, { base64: true });
      }
      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      downloadBlob(url, `${title}_all_pages.zip`);
    } finally {
      setDownloading(false);
    }
  }

  async function copyToClipboard() {
    const canvas = getOffscreenCanvas(activePage);
    canvas.toBlob(async (blob) => {
      if (blob) {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob }),
        ]);
      }
    });
  }

  const numPages = content.pages.length;

  return (
    <div className="download-bar">
      <button
        id="download-png-btn"
        className="btn btn-success btn-sm"
        onClick={downloadCurrentPNG}
        title="Download current page as PNG"
      >
        ⬇ PNG
      </button>
      <button
        id="download-jpg-btn"
        className="btn btn-secondary btn-sm"
        onClick={downloadCurrentJPG}
        title="Download current page as JPG"
      >
        ⬇ JPG
      </button>
      {mounted && numPages > 1 && (
        <button
          id="download-zip-btn"
          className="btn btn-secondary btn-sm"
          onClick={downloadAllZIP}
          disabled={downloading}
          title="Download all pages as ZIP"
        >
          {downloading ? '...' : `⬇ All (${numPages}) ZIP`}
        </button>
      )}
      <button
        id="copy-clipboard-btn"
        className="btn btn-secondary btn-sm"
        onClick={copyToClipboard}
        title="Copy to clipboard"
      >
        📋 Copy
      </button>
    </div>
  );
}
