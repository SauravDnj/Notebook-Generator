'use client';
import React, { useState } from 'react';
import {
  NotebookConfig, HandwritingFont, BackgroundTheme, PageSize, PaperTexture,
  PAGE_SIZES, BACKGROUND_THEMES, PAPER_TEXTURES,
} from '@/types/notebook';

const FONTS: HandwritingFont[] = [
  'Caveat',
  'Dancing Script',
  'Patrick Hand',
  'Kalam',
  'Permanent Marker',
  'Indie Flower',
  'Shadows Into Light',
  'Rock Salt',
];

const TEXT_COLORS = [
  { color: '#1565C0', label: 'Blue Ink' },
  { color: '#000000', label: 'Black' },
  { color: '#C62828', label: 'Red' },
  { color: '#2E7D32', label: 'Green' },
  { color: '#6A1B9A', label: 'Purple' },
  { color: '#E65100', label: 'Orange' },
  { color: '#00695C', label: 'Teal' },
  { color: '#AD1457', label: 'Pink' },
  { color: '#37474F', label: 'Slate' },
  { color: '#BF8700', label: 'Gold' },
  { color: '#1B5E20', label: 'Dark Green' },
  { color: '#0D47A1', label: 'Dark Blue' },
  { color: '#880E4F', label: 'Deep Pink' },
  { color: '#4A148C', label: 'Deep Purple' },
  { color: '#01579B', label: 'Light Blue' },
  { color: '#33691E', label: 'Lime' },
];

const TITLE_COLORS = [
  { color: '#C62828', label: 'Red' },
  { color: '#1565C0', label: 'Blue' },
  { color: '#2E7D32', label: 'Green' },
  { color: '#6A1B9A', label: 'Purple' },
  { color: '#E65100', label: 'Orange' },
  { color: '#AD1457', label: 'Pink' },
  { color: '#37474F', label: 'Slate' },
  { color: '#000000', label: 'Black' },
  { color: '#BF360C', label: 'Deep Orange' },
  { color: '#00695C', label: 'Teal' },
  { color: '#0277BD', label: 'Light Blue' },
  { color: '#558B2F', label: 'Light Green' },
  { color: '#F57F17', label: 'Amber' },
  { color: '#4527A0', label: 'Indigo' },
  { color: '#00838F', label: 'Cyan' },
  { color: '#283593', label: 'Navy' },
];

const NOTE_STYLES = [
  { id: 'student', label: '🎒 Student' },
  { id: 'formal', label: '📚 Formal' },
  { id: 'creative', label: '🎨 Creative' },
  { id: 'interview', label: '💼 Interview' },
];

interface ControlPanelProps {
  config: NotebookConfig;
  onChange: (patch: Partial<NotebookConfig>) => void;
  onGenerate: (topic: string, style: string, detailLevel: string, includeDiagrams: boolean, aiPages: number, model: string) => Promise<void>;
  onReset: () => void;
  isGenerating: boolean;
  error: string | null;
}

function Toggle({
  checked,
  onChange,
  id,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  id: string;
}) {
  return (
    <label className="toggle" htmlFor={id}>
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="toggle-slider" />
    </label>
  );
}

function SliderRow({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="form-group">
      <label>{label}</label>
      <div className="slider-row">
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
        />
        <span className="slider-val">{value}</span>
      </div>
    </div>
  );
}

export default function ControlPanel({
  config,
  onChange,
  onGenerate,
  onReset,
  isGenerating,
  error,
}: ControlPanelProps) {
  const [topic, setTopic] = useState('');
  const [noteStyle, setNoteStyle] = useState('student');
  const [detailLevel, setDetailLevel] = useState('level2');
  const [includeDiagrams, setIncludeDiagrams] = useState(false);
  const [aiPages, setAiPages] = useState(1);
  const [model, setModel] = useState('llama-3.3-70b-versatile');

  const handleGenerate = () => {
    if (topic.trim()) onGenerate(topic, noteStyle, detailLevel, includeDiagrams, aiPages, model);
  };

  return (
    <div className="control-panel">

      {/* ── AI Generate ── */}
      <div className="panel-section">
        <div className="section-title">✨ AI Content Generator</div>
        <div className="form-group">
          <label htmlFor="ai-model-select">AI Model</label>
          <select id="ai-model-select" value={model} onChange={(e) => setModel(e.target.value)}>
            <option value="llama-3.3-70b-versatile">Llama 4 / 3.3 70B (Best/Deepest)</option>
            <option value="llama-3.1-8b-instant">Llama-3 8B (Instant)</option>
            <option value="llama3-70b-8192">Llama-3 70B</option>
            <option value="llama3-8b-8192">Llama-3 8B (Fast/Backup)</option>
            <option value="mixtral-8x7b-32768">Mixtral 8x7B (Great context)</option>
            <option value="gemma2-9b-it">Gemma-2 9B (Creative)</option>
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="topic-input">Topic or Subject</label>
          <textarea
            id="topic-input"
            placeholder="e.g. Python OOP concepts, React hooks, Data Structures..."
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            rows={3}
          />
        </div>
        <div className="form-group">
          <label>Note Style</label>
          <div className="style-chips">
            {NOTE_STYLES.map((s) => (
              <button
                key={s.id}
                className={`style-chip ${noteStyle === s.id ? 'selected' : ''}`}
                onClick={() => setNoteStyle(s.id)}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
        <div className="form-group">
          <label htmlFor="ai-pages-input">Target Pages</label>
          <input
            type="number"
            id="ai-pages-input"
            min={1}
            max={50}
            value={aiPages}
            onChange={(e) => {
              const v = parseInt(e.target.value, 10);
              if (!isNaN(v) && v >= 1) setAiPages(v);
              else if (e.target.value === '') setAiPages(1);
            }}
            onFocus={(e) => e.target.select()}
          />
        </div>
        <div className="form-group">
          <label>Detail Level</label>
          <div className="style-chips">
            <button className={`style-chip ${detailLevel === 'level1' ? 'selected' : ''}`} onClick={() => setDetailLevel('level1')}>Level 1</button>
            <button className={`style-chip ${detailLevel === 'level2' ? 'selected' : ''}`} onClick={() => setDetailLevel('level2')}>Level 2</button>
            <button className={`style-chip ${detailLevel === 'level3' ? 'selected' : ''}`} onClick={() => setDetailLevel('level3')}>Level 3</button>
            <button className={`style-chip ${detailLevel === 'level4' ? 'selected' : ''}`} onClick={() => setDetailLevel('level4')}>Level 4</button>
            <button className={`style-chip ${detailLevel === 'level5' ? 'selected' : ''}`} onClick={() => setDetailLevel('level5')}>Level 5</button>
          </div>
        </div>
        <div className="toggle-row">
          <span>Include Diagrams</span>
          <Toggle id="toggle-diagrams" checked={includeDiagrams} onChange={(v) => setIncludeDiagrams(v)} />
        </div>
        <button
          id="generate-btn"
          className="btn btn-primary"
          onClick={handleGenerate}
          disabled={isGenerating || !topic.trim()}
        >
          {isGenerating ? (
            <>
              <span className="spinner" />
              Generating...
            </>
          ) : (
            '⚡ Generate Notes'
          )}
        </button>
        {error && <div className="alert alert-error" style={{ marginTop: 8 }}>{error}</div>}
      </div>

      {/* ── Manual Text ── */}
      <div className="panel-section">
        <div className="section-title">✏️ Manual Content</div>
        <div className="form-group">
          <label htmlFor="title-input">Page Title</label>
          <input
            type="text"
            id="title-input"
            placeholder="My Study Notes"
            value={config.title}
            onChange={(e) => onChange({ title: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label htmlFor="raw-text">
            Raw Text{' '}
            <span style={{ fontSize: 10, color: 'var(--ui-text-muted)' }}>
              (use &quot;1. Question&quot; and &quot;- Answer&quot; format)
            </span>
          </label>
          <textarea
            id="raw-text"
            placeholder={'1. What is React?\n- A JavaScript library\n- For building UIs\n\n2. What is a Hook?\n- Functions for state\n- useEffect, useState'}
            value={config.rawText}
            onChange={(e) => onChange({ rawText: e.target.value })}
            rows={5}
          />
        </div>
      </div>

      {/* ── Page Settings ── */}
      <div className="panel-section">
        <div className="section-title">📄 Page Settings</div>
        <div className="form-group">
          <label>Page Size</label>
          <div className="page-size-grid">
            {(Object.entries(PAGE_SIZES) as [PageSize, typeof PAGE_SIZES[PageSize]][]).map(
              ([key, val]) => (
                <button
                  key={key}
                  id={`pagesize-${key}`}
                  className={`page-size-btn ${config.pageSize === key ? 'selected' : ''}`}
                  onClick={() => onChange({ pageSize: key })}
                >
                  <strong>{key}</strong>
                  <span className="size-label">{val.label.split('(')[1]?.replace(')', '') || ''}</span>
                </button>
              )
            )}
          </div>
        </div>
        <div className="form-group">
          <label htmlFor="num-pages">Number of Pages <span style={{color:'var(--ui-text-muted)',fontSize:10}}>(any number)</span></label>
          <input
            type="number"
            id="num-pages"
            min={1}
            value={config.numPages}
            onChange={(e) => {
              const v = Math.max(1, parseInt(e.target.value) || 1);
              onChange({ numPages: v });
            }}
            style={{ width: '100%' }}
          />
        </div>
        <div className="form-group">
          <label htmlFor="line-spacing">Line Spacing</label>
          <div className="slider-row">
            <input
              type="range"
              id="line-spacing"
              min={28}
              max={60}
              value={config.lineSpacing}
              onChange={(e) => onChange({ lineSpacing: Number(e.target.value) })}
            />
            <span className="slider-val">{config.lineSpacing}</span>
          </div>
        </div>
        <div className="form-group">
          <label>Title Alignment</label>
          <div className="style-chips">
            {(['left', 'center', 'right'] as const).map((a) => (
              <button
                key={a}
                id={`align-${a}`}
                className={`style-chip ${config.titleAlign === a ? 'selected' : ''}`}
                onClick={() => onChange({ titleAlign: a })}
              >
                {a === 'left' ? '⬅ Left' : a === 'center' ? '↔ Center' : '➡ Right'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Typography ── */}
      <div className="panel-section">
        <div className="section-title">🔤 Typography</div>
        <div className="form-group">
          <label htmlFor="font-select">Handwriting Font</label>
          <select
            id="font-select"
            value={config.font}
            onChange={(e) => onChange({ font: e.target.value as HandwritingFont })}
          >
            {FONTS.map((f) => (
              <option key={f} value={f} style={{ fontFamily: f }}>
                {f}
              </option>
            ))}
          </select>
          <div
            className="font-preview"
            style={{ fontFamily: `'${config.font}', cursive`, marginTop: 6 }}
          >
            The quick brown fox — Aa Bb Cc 123
          </div>
        </div>
        <SliderRow label="Title Size (px)" value={config.titleSize} min={20} max={60} onChange={(v) => onChange({ titleSize: v })} />
        <SliderRow label="Question Size (px)" value={config.questionSize} min={14} max={36} onChange={(v) => onChange({ questionSize: v })} />
        <SliderRow label="Body Size (px)" value={config.bodySize} min={12} max={28} onChange={(v) => onChange({ bodySize: v })} />
      </div>

      {/* ── Text Colors ── */}
      <div className="panel-section">
        <div className="section-title">🎨 Text Colors</div>
        <div className="form-group">
          <label>Title Color</label>
          <div className="color-grid">
            {TITLE_COLORS.map((c) => (
              <div
                key={c.color}
                className={`color-swatch ${config.titleColor === c.color ? 'selected' : ''}`}
                style={{ background: c.color }}
                title={c.label}
                onClick={() => onChange({ titleColor: c.color })}
              />
            ))}
          </div>
          <div className="color-picker-row" style={{ marginTop: 6 }}>
            <input
              type="color"
              id="title-color-custom"
              value={config.titleColor}
              onChange={(e) => onChange({ titleColor: e.target.value })}
            />
            <span>Custom title color: {config.titleColor}</span>
          </div>
        </div>
        <div className="form-group">
          <label>Body Text Color</label>
          <div className="color-grid">
            {TEXT_COLORS.map((c) => (
              <div
                key={c.color}
                className={`color-swatch ${config.textColor === c.color ? 'selected' : ''}`}
                style={{ background: c.color }}
                title={c.label}
                onClick={() => onChange({ textColor: c.color })}
              />
            ))}
          </div>
          <div className="color-picker-row" style={{ marginTop: 6 }}>
            <input
              type="color"
              id="text-color-custom"
              value={config.textColor as string}
              onChange={(e) => onChange({ textColor: e.target.value })}
            />
            <span>Custom: {config.textColor}</span>
          </div>
        </div>
        <div className="form-group">
          <label>Question Color</label>
          <div className="color-grid">
            {TEXT_COLORS.map((c) => (
              <div
                key={c.color}
                className={`color-swatch ${config.questionColor === c.color ? 'selected' : ''}`}
                style={{ background: c.color }}
                title={c.label}
                onClick={() => onChange({ questionColor: c.color })}
              />
            ))}
          </div>
          <div className="color-picker-row" style={{ marginTop: 6 }}>
            <input
              type="color"
              id="question-color-custom"
              value={config.questionColor}
              onChange={(e) => onChange({ questionColor: e.target.value })}
            />
            <span>Custom: {config.questionColor}</span>
          </div>
        </div>
      </div>

      {/* ── Background ── */}
      <div className="panel-section">
        <div className="section-title">🖼️ Background Theme</div>
        <div className="form-group">
          <div className="page-size-grid">
            {(Object.entries(BACKGROUND_THEMES) as [BackgroundTheme, typeof BACKGROUND_THEMES[BackgroundTheme]][]).map(
              ([key, val]) => (
                <button
                  key={key}
                  id={`theme-${key}`}
                  className={`page-size-btn ${config.theme === key ? 'selected' : ''}`}
                  style={{
                    borderLeft: `4px solid ${val.bg === '#1A1F2E' ? '#555' : val.bg}`,
                  }}
                  onClick={() => onChange({ theme: key })}
                >
                  {val.label}
                </button>
              )
            )}
          </div>
        </div>
        <div className="form-group">
          <label>Custom Background Color</label>
          <div className="color-picker-row">
            <input
              type="color"
              id="bg-color-custom"
              value={config.customBgColor}
              onChange={(e) => onChange({ customBgColor: e.target.value, theme: 'white' })}
            />
            <span>{config.customBgColor}</span>
          </div>
        </div>
        <div className="form-group">
          <label>Custom Line Color</label>
          <div className="color-picker-row">
            <input
              type="color"
              id="line-color-custom"
              value={config.customLineColor}
              onChange={(e) => onChange({ customLineColor: e.target.value })}
            />
            <span>{config.customLineColor}</span>
          </div>
        </div>
      </div>

      {/* ── Page Effects ── */}
      <div className="panel-section">
        <div className="section-title">✨ Page Effects</div>
        <div className="toggle-row">
          <span>Page Shadow</span>
          <Toggle id="toggle-shadow" checked={config.showShadow} onChange={(v) => onChange({ showShadow: v })} />
        </div>
        <div className="toggle-row">
          <span>Left Margin Line</span>
          <Toggle id="toggle-margin" checked={config.showMarginLine} onChange={(v) => onChange({ showMarginLine: v })} />
        </div>
        <div className="toggle-row">
          <span>Page Numbers</span>
          <Toggle id="toggle-pagenum" checked={config.showPageNumber} onChange={(v) => onChange({ showPageNumber: v })} />
        </div>
      </div>

      {/* ── Paper Textures ── */}
      <div className="panel-section">
        <div className="section-title">🗒️ Paper Texture</div>
        <div className="toggle-row">
          <span>Enable Texture</span>
          <Toggle id="toggle-enable-texture" checked={config.enableTexture} onChange={(v) => onChange({ enableTexture: v })} />
        </div>
        <div className="texture-grid" style={{ opacity: config.enableTexture ? 1 : 0.5, pointerEvents: config.enableTexture ? 'auto' : 'none' }}>
          {(Object.entries(PAPER_TEXTURES) as [PaperTexture, typeof PAPER_TEXTURES[PaperTexture]][]).map(([key, val]) => (
            <button
              key={key}
              id={`texture-${key}`}
              className={`texture-btn${config.paperTexture === key ? ' selected' : ''}`}
              onClick={() => onChange({ paperTexture: key })}
              title={val.description}
            >
              <span className="texture-icon">{val.icon}</span>
              <span className="texture-label">{val.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="panel-section">
        <div className="section-title">📝 Footer</div>
        <div className="toggle-row">
          <span>Show Footer</span>
          <Toggle
            id="toggle-footer"
            checked={config.footer.enabled}
            onChange={(v) => onChange({ footer: { ...config.footer, enabled: v } })}
          />
        </div>
        {config.footer.enabled && (
          <>
            <div className="form-group">
              <label htmlFor="footer-name">Your Name</label>
              <input
                type="text"
                id="footer-name"
                placeholder="Saurav Danej"
                value={config.footer.name}
                onChange={(e) =>
                  onChange({ footer: { ...config.footer, name: e.target.value } })
                }
              />
            </div>
            <div className="form-group">
              <label htmlFor="footer-linkedin">
                <span style={{ color: '#0077B5' }}>in</span> LinkedIn Handle
              </label>
              <input
                type="text"
                id="footer-linkedin"
                placeholder="sauravdanej"
                value={config.footer.linkedinHandle}
                onChange={(e) =>
                  onChange({ footer: { ...config.footer, linkedinHandle: e.target.value } })
                }
              />
            </div>
            <div className="form-group">
              <label htmlFor="footer-github">
                <span>⬡</span> GitHub Handle
              </label>
              <input
                type="text"
                id="footer-github"
                placeholder="sauravdanej"
                value={config.footer.githubHandle}
                onChange={(e) =>
                  onChange({ footer: { ...config.footer, githubHandle: e.target.value } })
                }
              />
            </div>
            <div className="form-group">
              <label htmlFor="footer-custom">Custom Footer Text</label>
              <input
                type="text"
                id="footer-custom"
                placeholder="@myhandle · mywebsite.com"
                value={config.footer.customText}
                onChange={(e) =>
                  onChange({ footer: { ...config.footer, customText: e.target.value } })
                }
              />
            </div>
            <div className="form-group">
              <label>Footer Color</label>
              <div className="color-picker-row">
                <input
                  type="color"
                  id="footer-color"
                  value={config.footer.color}
                  onChange={(e) =>
                    onChange({ footer: { ...config.footer, color: e.target.value } })
                  }
                />
                <span>{config.footer.color}</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Reset ── */}
      <div className="panel-section">
        <button className="btn btn-secondary" onClick={onReset} style={{ width: '100%' }}>
          🔄 Reset to Defaults
        </button>
      </div>
    </div>
  );
}
