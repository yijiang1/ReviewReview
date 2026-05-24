import { useState, useRef, useCallback } from 'react';
import { FileText, Upload, X, CheckCircle, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { Label } from './UI.jsx';

async function extractPdfText(file) {
  // Dynamic import so it doesn't block initial render
  const pdfjsLib = await import('pdfjs-dist');
  // Use the legacy build worker inline to avoid config complexity
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.mjs',
    import.meta.url
  ).toString();

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  let fullText = '';
  const maxPages = Math.min(pdf.numPages, 20); // Cap at 20 pages

  for (let i = 1; i <= maxPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items.map(item => item.str).join(' ');
    fullText += pageText + '\n\n';
  }

  if (pdf.numPages > 20) {
    fullText += `\n[Note: Only first 20 of ${pdf.numPages} pages extracted]`;
  }

  return fullText.trim();
}

export function PdfUploader({ paperText, setPaperText, disabled }) {
  const [fileName, setFileName] = useState('');
  const [extracting, setExtracting] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [mode, setMode] = useState('upload'); // 'upload' | 'paste'
  const fileInputRef = useRef(null);

  const processFile = useCallback(async (file) => {
    if (!file || file.type !== 'application/pdf') {
      setError('Please upload a PDF file.');
      return;
    }
    if (file.size > 30 * 1024 * 1024) {
      setError('File is too large (max 30 MB).');
      return;
    }

    setError('');
    setExtracting(true);
    setFileName(file.name);

    try {
      const text = await extractPdfText(file);
      if (text.length < 100) {
        setError('Could not extract text from this PDF. It may be scanned/image-based. Try pasting the text instead.');
        setFileName('');
        setPaperText('');
      } else {
        setPaperText(text);
      }
    } catch (err) {
      console.error('PDF extraction error:', err);
      setError('Failed to read the PDF. Try pasting the text manually.');
      setFileName('');
      setPaperText('');
    } finally {
      setExtracting(false);
    }
  }, [setPaperText]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = ''; // reset so same file can be re-selected
  };

  const handleClear = () => {
    setFileName('');
    setPaperText('');
    setError('');
    setShowPreview(false);
  };

  const hasPdf = !!fileName && !!paperText;

  return (
    <div>
      {/* Mode toggle */}
      <div style={{ display: 'flex', gap: 8, marginBottom: '0.75rem' }}>
        {['upload', 'paste'].map(m => (
          <button
            key={m}
            className={`btn ${mode === m ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: 12, padding: '6px 14px' }}
            onClick={() => {
              if (m === 'upload' && mode === 'upload') {
                // If already in upload mode, clicking the tab should open the file picker
                fileInputRef.current?.click();
              } else {
                setMode(m);
              }
            }}
            disabled={disabled}
          >
            {m === 'upload' ? <><Upload size={13} /> Upload PDF</> : <><FileText size={13} /> Paste text</>}
          </button>
        ))}
      </div>

      {mode === 'upload' ? (
        <>
          {/* Drop zone */}
          {!hasPdf && !extracting && (
            <div
              className={`upload-zone ${dragOver ? 'drag-over' : ''}`}
              onClick={() => !disabled && fileInputRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              role="button"
              tabIndex={disabled ? -1 : 0}
              onKeyDown={e => e.key === 'Enter' && fileInputRef.current?.click()}
              aria-label="Upload PDF"
            >
              <div className="upload-icon">
                <Upload size={22} />
              </div>
              <p style={{ margin: '0 0 4px', fontWeight: 600, fontSize: 14 }}>
                Drop your PDF here
              </p>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>
                or click to browse · Max 30 MB
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleFileChange}
                style={{ display: 'none' }}
                disabled={disabled}
              />
            </div>
          )}

          {/* Extracting state */}
          {extracting && (
            <div className="upload-zone" style={{ cursor: 'default' }}>
              <Loader2 size={28} style={{ color: 'var(--accent-400)', animation: 'spin 1s linear infinite', marginBottom: 12 }} />
              <p style={{ margin: 0, fontSize: 14, fontWeight: 500 }}>Extracting text from PDF…</p>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
                Reading {fileName}
              </p>
            </div>
          )}

          {/* Success state */}
          {hasPdf && !extracting && (
            <div className="upload-zone has-file" style={{ cursor: 'default', padding: '1.25rem 1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 42, height: 42, borderRadius: 'var(--radius-md)',
                  background: 'var(--green-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <CheckCircle size={20} style={{ color: 'var(--green-fg)' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                  <p style={{ margin: '0 0 2px', fontSize: 13, fontWeight: 600 }}>{fileName}</p>
                  <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)' }}>
                    {paperText.length.toLocaleString()} characters extracted
                  </p>
                </div>
                <button
                  className="btn btn-ghost"
                  onClick={handleClear}
                  style={{ padding: 6, flexShrink: 0 }}
                  aria-label="Remove file"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Preview toggle */}
              <button
                className="btn btn-ghost"
                onClick={() => setShowPreview(v => !v)}
                style={{ marginTop: 10, fontSize: 11, color: 'var(--text-muted)', width: '100%', justifyContent: 'center', gap: 5 }}
              >
                {showPreview ? <><ChevronUp size={13} /> Hide preview</> : <><ChevronDown size={13} /> Show text preview</>}
              </button>

              {showPreview && (
                <pre style={{
                  marginTop: 10, padding: '10px 14px',
                  background: 'rgba(0,0,0,0.3)', borderRadius: 'var(--radius-md)',
                  fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)',
                  whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                  maxHeight: 200, overflowY: 'auto', textAlign: 'left',
                }}>
                  {paperText.slice(0, 1000)}{paperText.length > 1000 ? '\n…' : ''}
                </pre>
              )}
            </div>
          )}
        </>
      ) : (
        /* Paste mode */
        <div>
          <Label>Paper abstract or full text</Label>
          <textarea
            value={paperText}
            onChange={e => setPaperText(e.target.value)}
            placeholder="Paste the paper's title, abstract, introduction, or full text here…"
            rows={10}
            disabled={disabled}
            style={{ width: '100%', boxSizing: 'border-box', fontSize: 13 }}
          />
          <p style={{ marginTop: 6, fontSize: 11, color: 'var(--text-muted)' }}>
            {paperText.length.toLocaleString()} characters · At least 50 required
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{
          display: 'flex', gap: 8, alignItems: 'flex-start', marginTop: 10,
          padding: '10px 14px', background: 'var(--red-bg)',
          border: '1px solid var(--red-border)', borderRadius: 'var(--radius-md)',
        }}>
          <p style={{ margin: 0, fontSize: 12, color: 'var(--red-fg)' }}>{error}</p>
        </div>
      )}
    </div>
  );
}
