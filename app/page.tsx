'use client';
import React, { useState, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import ControlPanel from '@/components/ControlPanel';
import DownloadBar from '@/components/DownloadBar';
import ApiKeyModal from '@/components/ApiKeyModal';
import { NotebookConfig, QAItem, DEFAULT_CONFIG } from '@/types/notebook';
import { parseRawTextToContent, paginateContent } from '@/lib/notebookRenderer';

const NotebookCanvas = dynamic(() => import('@/components/NotebookCanvas'), {
  ssr: false,
  loading: () => (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ui-text-muted)' }}>
      Loading canvas…
    </div>
  ),
});

interface RawData {
  title: string;
  items: QAItem[];
}

const DEFAULT_RAW: RawData = {
  title: 'API Interview Questions and Answers',
  items: [
    { question: 'What is an API?', answers: ['API stands for Application Programming Interface', 'A set of rules for software systems to communicate', 'Allows different applications to interact with each other', 'Example: Weather app using a weather API to get data'] },
    { question: 'What are the types of APIs?', answers: ['Open APIs (Public): Available to all developers', 'Partner APIs: Require specific access rights', 'Internal APIs: Used within an organization', 'Composite APIs: Combine multiple data or service APIs'] },
    { 
      question: 'What is REST API?', 
      answers: ['REST stands for Representational State Transfer', 'Architectural style for designing networked applications', 'Uses HTTP methods: GET, POST, PUT, DELETE', 'Stateless — each request is independent'],
      imagePrompt: 'A simple REST API diagram showing client sending HTTP requests to a server and receiving JSON responses' 
    },
    { question: 'What are HTTP methods in REST?', answers: ['GET — Retrieve data', 'POST — Create a new resource', 'PUT — Update an existing resource', 'DELETE — Remove a resource', 'PATCH — Partial update of a resource'] },
  ],
};

type Status = 'idle' | 'loading' | 'error' | 'success';

export default function HomePage() {
  const [config, setConfig]           = useState<NotebookConfig>(DEFAULT_CONFIG);
  const [rawContent, setRawContent]   = useState<RawData>(DEFAULT_RAW);
  const [activePage, setActivePage]   = useState(0);
  const [showAll, setShowAll]         = useState(false);
  const [status, setStatus]           = useState<Status>('idle');
  const [statusMsg, setStatusMsg]     = useState('Ready');
  const [error, setError]             = useState<string | null>(null);
  const [mounted, setMounted]         = useState(false);
  const [apiKey, setApiKey]           = useState('');
  const [keyReady, setKeyReady]       = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    const saved = localStorage.getItem('groq_api_key');
    if (saved) {
      setApiKey(saved);
      setKeyReady(true);
    }
  }, []);

  const handleApiKeySubmit = useCallback((key: string) => {
    setApiKey(key);
    localStorage.setItem('groq_api_key', key);
    setKeyReady(true);
  }, []);

  // Modal logic moved to the main return to avoid skipping React hooks

  // Dynamically paginate the flat items into canvas pages
  const content = paginateContent(rawContent.title, rawContent.items, config);

  // Parse raw text into content
  useEffect(() => {
    if (config.rawText.trim()) {
      const items = parseRawTextToContent(config.rawText);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRawContent({ title: config.title || 'My Notes', items });
    }
  }, [config.rawText, config.title]);

  // Sync title change
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!config.rawText.trim()) setRawContent(prev => ({ ...prev, title: config.title }));
  }, [config.title, config.rawText]);

  // Clamp active page when total pages decreases
  useEffect(() => {
    const totalPages = content.pages.length;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (activePage >= totalPages) setActivePage(Math.max(0, totalPages - 1));
  }, [content.pages.length, activePage]);

  const handleConfigChange = useCallback((patch: Partial<NotebookConfig>) => {
    setConfig(prev => ({ ...prev, ...patch }));
  }, []);

  const handleGenerate = useCallback(async (topic: string, style: string, detailLevel: string, includeDiagrams: boolean, aiPages: number, model: string) => {
    if (!apiKey.trim()) {
      setError('Please enter your Groq API key first.');
      setStatus('error'); setStatusMsg('No API key');
      return;
    }
    setStatus('loading'); setStatusMsg(`Generating with ${model}…`); setError(null);
    try {
      const res  = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, style, numPages: aiPages, detailLevel, includeDiagrams, model, apiKey: apiKey.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      
      // Convert AI JSON output into the raw text format for the manual editor
      const generatedRawText = data.items.map((item: QAItem, i: number) => {
        let text = `${i + 1}. ${item.question}\n`;
        item.answers.forEach((a: string) => text += `- ${a}\n`);
        if (item.mermaidCode) {
          // Flatten multi-line mermaid codes into a single line for the basic parser
          text += `${item.mermaidCode.replace(/\n/g, ' ')}\n`;
        }
        return text;
      }).join('\n');

      setRawContent({ title: data.title, items: data.items });
      setConfig(prev => ({ ...prev, title: data.title || prev.title, rawText: generatedRawText }));
      setActivePage(0);
      setStatus('success');
      setStatusMsg(`Generated with ${model} ✓`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      setError(msg); setStatus('error'); setStatusMsg('Generation failed');
    }
  }, [apiKey]);

  const handleReset = useCallback(() => {
    setConfig(DEFAULT_CONFIG); setRawContent(DEFAULT_RAW);
    setActivePage(0); setStatus('idle'); setStatusMsg('Reset'); setError(null);
  }, []);

  const numPages = content.pages.length;
  const statusDotClass = `status-dot${status === 'loading' ? ' loading' : status === 'error' ? ' error' : ''}`;

  // Page tabs — show up to 10 direct tabs, then prev/next only
  const MAX_TABS = 10;
  const showTabs = numPages <= MAX_TABS;

  return (
    <>
      {mounted && !keyReady && (
        <ApiKeyModal onKeySubmit={handleApiKeySubmit} />
      )}
      
      <div className="app-shell" style={{ filter: mounted && !keyReady ? 'blur(8px)' : 'none', pointerEvents: mounted && !keyReady ? 'none' : 'auto' }}>
        <header className="app-header">
        <div className="app-header-logo">
          <span className="logo-icon">📓</span>
          NoteAI
          <span className="badge badge-purple" style={{ marginLeft: 4 }}>GROQ Powered</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => { setKeyReady(false); }}
            title="Change API Key"
            style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}
          >
            🔑 Change Key
          </button>
          <DownloadBar config={config} content={content} activePage={activePage} />
        </div>
      </header>

      <div className="app-body">
        <ControlPanel
          config={config}
          onChange={handleConfigChange}
          onGenerate={handleGenerate}
          onReset={handleReset}
          isGenerating={status === 'loading'}
          error={error}
        />

        <div className="preview-panel">
          {/* Toolbar with page tabs */}
          <div className="preview-toolbar">
            <div className="preview-toolbar-left">
              <span>📄</span>
              <span style={{ fontWeight: 500, color: 'var(--ui-text)' }}>{content.title}</span>
              <span style={{ color: 'var(--ui-text-muted)' }}>
                · {mounted ? numPages : 1} page{(mounted ? numPages : 1) !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="preview-toolbar-right">
              {/* Only render dynamic navigation after hydration to prevent mismatch */}
              {mounted && (
                <>
                  {/* Page tabs (up to 10) */}
                  {numPages > 1 && !showAll && showTabs && (
                    <div className="page-tabs">
                      {Array.from({ length: numPages }, (_, i) => (
                        <button
                          key={i}
                          id={`page-tab-${i + 1}`}
                          className={`page-tab${activePage === i ? ' active' : ''}`}
                          onClick={() => setActivePage(i)}
                        >{i + 1}</button>
                      ))}
                    </div>
                  )}
                  {/* More than 10: show compact selector */}
                  {numPages > MAX_TABS && !showAll && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <label style={{ fontSize: 12, color: 'var(--ui-text-muted)', marginBottom: 0 }}>Page:</label>
                      <select
                        value={activePage}
                        onChange={e => setActivePage(Number(e.target.value))}
                        style={{ width: 80 }}
                      >
                        {Array.from({ length: numPages }, (_, i) => (
                          <option key={i} value={i}>Page {i + 1}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  {/* Show all button */}
                  {numPages > 1 && (
                    <button
                      id="show-all-btn"
                      className={`btn btn-sm ${showAll ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setShowAll(v => !v)}
                    >
                      {showAll ? '🔍 Single' : '📋 All Pages'}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          <NotebookCanvas
            config={config}
            content={content}
            activePage={activePage}
            onPageChange={setActivePage}
            showAll={showAll}
          />

          <div className="status-bar">
            <div className={statusDotClass} />
            <span>{statusMsg}</span>
            {status === 'loading' && <span className="spinner" style={{ marginLeft: 4 }} />}
            <span style={{ marginLeft: 'auto', color: 'var(--ui-text-muted)' }}>
              {config.font} · {config.pageSize} · {mounted ? numPages : 1} pages
            </span>
          </div>
        </div>
      </div>
      </div>
    </>
  );
}
