'use client';
import React, { useState } from 'react';

interface ApiKeyModalProps {
  onKeySubmit: (key: string) => void;
}

export default function ApiKeyModal({ onKeySubmit }: ApiKeyModalProps) {
  const [key, setKey] = useState('');
  const [status, setStatus] = useState<'idle' | 'validating' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async () => {
    if (!key.trim()) {
      setErrorMsg('Please paste your API key.');
      setStatus('error');
      return;
    }
    setStatus('validating');
    setErrorMsg('');

    try {
      // Quick validation: make a tiny request to Groq to check the key
      const res = await fetch('/api/validate-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: key.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Invalid key');

      setStatus('success');
      // Short delay to show success, then close
      setTimeout(() => {
        onKeySubmit(key.trim());
      }, 1200);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Invalid API key';
      setErrorMsg(msg);
      setStatus('error');
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        {/* Logo */}
        <div className="modal-logo">
          <span className="modal-logo-icon">📓</span>
          <span className="modal-logo-text">NoteAI</span>
          <span className="badge badge-purple" style={{ marginLeft: 6 }}>GROQ Powered</span>
        </div>

        <p className="modal-desc">
          Generate beautiful AI-powered study notebooks instantly.
          <br />
          To get started, paste your <strong>free Groq API key</strong> below.
        </p>

        {/* Key input */}
        <div className="modal-input-group">
          <label htmlFor="modal-api-key">Groq API Key</label>
          <input
            type="password"
            id="modal-api-key"
            placeholder="gsk_xxxxxxxxxxxxxxxxxxxxxxxx"
            value={key}
            onChange={(e) => { setKey(e.target.value); if (status === 'error') setStatus('idle'); }}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
            autoFocus
            disabled={status === 'validating' || status === 'success'}
          />
        </div>

        {/* Error */}
        {status === 'error' && (
          <div className="modal-error">{errorMsg}</div>
        )}

        {/* Success */}
        {status === 'success' && (
          <div className="modal-success">
            <span style={{ fontSize: 22 }}>✅</span> API key verified! Loading NoteAI…
          </div>
        )}

        {/* Button */}
        {status !== 'success' && (
          <button
            className="btn btn-primary modal-btn"
            onClick={handleSubmit}
            disabled={status === 'validating' || !key.trim()}
          >
            {status === 'validating' ? (
              <><span className="spinner" /> Validating…</>
            ) : (
              '🚀 Start NoteAI'
            )}
          </button>
        )}

        {/* Link */}
        <p className="modal-link">
          Don&apos;t have a key?{' '}
          <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer">
            Get your free Groq API key →
          </a>
        </p>
      </div>
    </div>
  );
}
