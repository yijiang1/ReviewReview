import { useState } from 'react';
import {
  Settings, UserSearch, Lightbulb, Gamepad2,
  ArrowRight, AlertTriangle, KeyRound, User
} from 'lucide-react';

import { ApiKeyModal } from './components/ApiKeyModal.jsx';
import { PdfUploader } from './components/PdfUploader.jsx';
import { LoadingScreen } from './components/LoadingScreen.jsx';
import { Results } from './components/Results.jsx';
import { Card, Label } from './components/UI.jsx';
import {
  callAI, getApiKey, getSelectedProvider, getSelectedModel, PROVIDERS, MODELS, estimateRunCost,
} from './lib/api.js';
import { fetchAuthorProfile, fetchAuthorWorks, formatWorksForPrompt } from './lib/openalex.js';



// ── Analyze pipeline ──────────────────────────────────────
async function runAnalysis({ paperText, reviewerName, provider, model, apiKey, onStep, onStatus }) {
  onStep('extract');
  onStatus('Reading paper content…');
  await new Promise(r => setTimeout(r, 400)); // brief delay for UX

  onStep('publications');
  onStatus('Fetching reviewer publication record from OpenAlex…');
  const authorProfile = await fetchAuthorProfile(reviewerName);
  let worksText = "No publication record found on OpenAlex.";
  if (authorProfile && authorProfile.id) {
    const works = await fetchAuthorWorks(authorProfile.id, 10);
    worksText = formatWorksForPrompt(works);
  } else {
    await new Promise(r => setTimeout(r, 400));
  }

  onStep('research');
  onStatus(`Researching reviewer background via ${PROVIDERS[provider].label}…`);

  const research = await callAI({
    provider, apiKey, model,
    useSearch: true,
    maxTokens: 5000,
    systemPrompt: 'You are an expert academic genealogy investigator. Use web search multiple times — search each author separately, then the reviewer, then search for pairwise connections between reviewer and each author. Be thorough about advisor, postdoc, co-author, and institutional relationships.',
    userPrompt: `You are a thorough academic investigator evaluating reviewer suitability for a paper.

Paper content:
---
${paperText.slice(0, 4000)}
---

Candidate reviewer: ${reviewerName}

REVIEWER'S PUBLICATION RECORD (from OpenAlex):
---
${worksText}
---

Search the web carefully to build a complete academic profile for each person. For EACH paper author and for the reviewer, find:

EDUCATIONAL BACKGROUND
- PhD institution and year
- PhD advisor name
- Postdoctoral institution(s) and supervisor(s)
- Any other relevant academic positions

CAREER HISTORY
- Current institution and role
- Previous institutions and roles (with approximate years)
- Lab or research group affiliations

CONNECTIONS TO INVESTIGATE — search for each pair explicitly:
- Do the reviewer and any author share the same PhD advisor? (academic siblings)
- Was the reviewer ever a postdoc supervised by any author, or vice versa?
- Have the reviewer and any author co-authored papers together?
- Did the reviewer and any author work at the same institution at the same time?
- Are they in the same close research community, lab group, or grant?
- Does the reviewer cite the authors heavily or vice versa?

Search each person individually first, then search for direct pairwise connections. Use Google Scholar, faculty CVs, lab pages, and LinkedIn.

Summarize everything you find in clear detail.`,
  });

  onStep('authors');
  onStatus('Cross-referencing author backgrounds…');
  await new Promise(r => setTimeout(r, 300));

  onStep('connections');
  onStatus('Mapping academic connections…');
  await new Promise(r => setTimeout(r, 300));

  onStep('evaluate');
  onStatus('Generating structured evaluation…');

  const raw = await callAI({
    provider, apiKey, model,
    useSearch: false,
    maxTokens: 3000,
    systemPrompt: 'You are a strict academic journal editor. Evaluate reviewer suitability carefully and map relationship history precisely. Return ONLY valid JSON. No markdown, no extra text whatsoever.',
    userPrompt: `Based on the research below, evaluate whether ${reviewerName} should review this paper and map all connections found.

Research findings:
---
${research}
---

Paper excerpt:
---
${paperText.slice(0, 800)}
---

Return ONLY valid JSON with no markdown fences or extra text:
{
  "reviewer_name": "",
  "paper_title": "",
  "authors": [
    {
      "name": "",
      "institution": "",
      "phd_advisor": null,
      "postdoc_supervisor": null
    }
  ],
  "reviewer_profile": {
    "institution": "",
    "career_stage": "",
    "research_areas": [],
    "phd_institution": null,
    "phd_year": null,
    "phd_advisor": null,
    "postdoc_institutions": [
      { "institution": "", "supervisor": null }
    ],
    "career_history": [
      { "institution": "", "role": "", "years": "" }
    ]
  },
  "connections": [
    {
      "type": "Shared PhD advisor",
      "with_author": "Author name",
      "description": "Detailed explanation of the connection"
    }
  ],
  "conflict_of_interest": {
    "score": 0,
    "verdict": "No Conflict",
    "findings": [],
    "explanation": ""
  },
  "expertise": {
    "score": 0,
    "verdict": "Poor Match",
    "paper_topics": [],
    "reviewer_topics": [],
    "explanation": ""
  },
  "overall_recommendation": "Not Recommended",
  "overall_score": 0,
  "summary": ""
}

Connection types to use (pick the most accurate):
"Shared PhD advisor" | "Academic siblings" | "Postdoc relationship" | "Co-authored papers" | "Same institution overlap" | "Same research community" | "Heavy citation overlap" | "No significant connection"

If no connections found, use one entry: { "type": "No significant connection", "with_author": null, "description": "No direct academic relationship found between the reviewer and any paper author." }

Scoring rules:
- conflict_of_interest.score: 0 = no conflict, 10 = severe (shared advisor, direct mentorship, recent co-author)
- expertise.score: 0 = completely unrelated field, 10 = world-leading expert on this exact topic
- overall_score: 0 = worst reviewer choice, 10 = ideal
- If COI score >= 7, overall_score must be <= 3 and recommendation must be "Not Recommended"
- verdict for COI: exactly one of "No Conflict" | "Minor Concern" | "Major Conflict"
- verdict for expertise: exactly one of "Excellent Match" | "Good Match" | "Partial Match" | "Poor Match"
- overall_recommendation: exactly one of "Highly Recommended" | "Recommended" | "Conditionally Recommended" | "Not Recommended"`,
  });

  const raw2 = (typeof raw === 'string' ? raw : raw).replace(/```json|```/g, '').trim();
  return JSON.parse(raw2);
}

// ── Header ────────────────────────────────────────────────
function Header({ onOpenSettings }) {
  return (
    <header className="app-header">
      <div className="app-header-inner">
        <a href="/" className="logo">
          Review<span>Review</span>
        </a>
        <button
          id="settings-btn"
          className="btn btn-ghost"
          onClick={onOpenSettings}
          aria-label="Open API settings"
          style={{ borderRadius: 'var(--radius-md)', gap: 6, fontSize: 13 }}
        >
          <Settings size={16} />
          Settings
        </button>
      </div>
    </header>
  );
}

// ── Tabs ──────────────────────────────────────────────────
const TABS = [
  { id: 'evaluate', label: 'Evaluate Reviewer', Icon: UserSearch, available: true },
  { id: 'suggest',  label: 'Suggest Reviewers', Icon: Lightbulb, available: false },
  { id: 'game',     label: 'AI or Human?',       Icon: Gamepad2,  available: false },
];

function TabBar({ activeTab, onTabChange }) {
  return (
    <nav className="tab-bar" role="tablist" aria-label="App sections">
      {TABS.map(tab => (
        <button
          key={tab.id}
          id={`tab-${tab.id}`}
          role="tab"
          aria-selected={activeTab === tab.id}
          className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => tab.available && onTabChange(tab.id)}
          style={{ opacity: tab.available ? 1 : 0.55, cursor: tab.available ? 'pointer' : 'default' }}
          title={tab.available ? '' : 'Coming soon'}
        >
          <tab.Icon size={14} />
          {tab.label}
          {!tab.available && <span className="coming-soon">Soon</span>}
        </button>
      ))}
    </nav>
  );
}

// ── Evaluate tab ──────────────────────────────────────────
function EvaluateTab() {
  const [paperText, setPaperText] = useState('');
  const [reviewerName, setReviewerName] = useState('');
  const [phase, setPhase] = useState('idle'); // idle | loading | done | error
  const [currentStep, setCurrentStep] = useState('extract');
  const [statusMsg, setStatusMsg] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const provider = getSelectedProvider();
  const model    = getSelectedModel(provider);
  const apiKey   = getApiKey(provider);
  const hasKey   = !!(apiKey && PROVIDERS[provider]?.validate(apiKey));
  const costEst  = hasKey ? estimateRunCost(provider, model) : null;
  const canAnalyze =
    hasKey &&
    paperText.trim().length > 50 &&
    reviewerName.trim().length > 2 &&
    phase !== 'loading';

  const analyze = async () => {
    if (!canAnalyze) return;
    setPhase('loading');
    setError('');
    setResult(null);

    try {
      const parsed = await runAnalysis({
        paperText,
        reviewerName,
        provider,
        model,
        apiKey,
        onStep: setCurrentStep,
        onStatus: setStatusMsg,
      });
      setResult(parsed);
      setPhase('done');
    } catch (e) {
      console.error(e);
      setError(e.message || 'Something went wrong. Please check your API key and try again.');
      setPhase('error');
    }
  };

  const reset = () => {
    setPhase('idle');
    setResult(null);
    setPaperText('');
    setReviewerName('');
    setError('');
    setCurrentStep('extract');
  };

  return (
    <>
      {/* API key warning */}
      {!hasKey && phase === 'idle' && (
        <div className="api-warning" id="api-key-warning">
          <KeyRound size={15} style={{ flexShrink: 0 }} />
          <span>
            No API key set. Click <strong>Settings</strong> in the header to add your API key.
          </span>
        </div>
      )}

      {/* Input form */}
      {phase !== 'done' && (
        <Card style={{ marginBottom: '1rem' }} id="input-card">
          <div style={{ marginBottom: '1.25rem' }}>
            <Label>Paper (PDF or text)</Label>
            <PdfUploader
              paperText={paperText}
              setPaperText={setPaperText}
              disabled={phase === 'loading'}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <Label>Candidate reviewer name</Label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                <User size={15} style={{ color: 'var(--text-muted)' }} />
              </div>
              <input
                id="reviewer-name-input"
                type="text"
                value={reviewerName}
                onChange={e => setReviewerName(e.target.value)}
                placeholder="e.g. Yoshua Bengio"
                disabled={phase === 'loading'}
                onKeyDown={e => e.key === 'Enter' && analyze()}
                style={{ paddingLeft: 38 }}
              />
            </div>
            <p style={{ marginTop: 5, fontSize: 11, color: 'var(--text-muted)' }}>
              Full name helps the AI find the right researcher. Include affiliation if the name is common.
            </p>
          </div>

          <button
            id="analyze-btn"
            className="btn btn-primary"
            onClick={analyze}
            disabled={!canAnalyze}
            style={{ width: '100%', justifyContent: 'center', padding: '12px 20px', fontSize: 15 }}
          >
            Evaluate reviewer qualification
            <ArrowRight size={16} />
          </button>

          {hasKey && (
            <p style={{ marginTop: 8, textAlign: 'center', fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
                {PROVIDERS[provider].label} · {MODELS[provider]?.find(m => m.id === model)?.label}
              </span>
              {costEst && (
                <span style={{
                  background: 'var(--info-bg)', color: 'var(--info-fg)',
                  border: '1px solid rgba(99,179,237,0.2)',
                  borderRadius: '999px', padding: '1px 8px', fontSize: 11, fontWeight: 600,
                }}>
                  {costEst.formatted} / run
                </span>
              )}
              <button
                className="btn btn-ghost"
                onClick={() => document.getElementById('settings-btn')?.click()}
                style={{ fontSize: 11, padding: '0 3px', display: 'inline', height: 'auto', color: 'var(--accent-500)', fontFamily: 'var(--font-sans)' }}
              >change</button>
            </p>
          )}
        </Card>
      )}

      {/* Loading */}
      {phase === 'loading' && (
        <LoadingScreen currentStep={currentStep} statusMsg={statusMsg} />
      )}

      {/* Error */}
      {phase === 'error' && (
        <div style={{
          padding: '14px 18px', marginBottom: '1rem',
          background: 'var(--red-bg)', border: '1px solid var(--red-border)',
          borderRadius: 'var(--radius-md)', display: 'flex', gap: 12, alignItems: 'flex-start',
        }}>
          <AlertTriangle size={16} style={{ color: 'var(--red-fg)', flexShrink: 0, marginTop: 1 }} />
          <div>
            <p style={{ margin: '0 0 8px', fontSize: 13, color: 'var(--red-fg)', fontWeight: 600 }}>Analysis failed</p>
            <p style={{ margin: '0 0 12px', fontSize: 12, color: 'var(--red-fg)', lineHeight: 1.6 }}>{error}</p>
            <button className="btn btn-secondary" style={{ fontSize: 12, padding: '6px 14px' }} onClick={() => setPhase('idle')}>
              Try again
            </button>
          </div>
        </div>
      )}

      {/* Results */}
      {result && phase === 'done' && <Results result={result} onReset={reset} />}
    </>
  );
}

// ── Coming Soon placeholder ───────────────────────────────
function ComingSoon({ icon: Icon, title, description }) {
  return (
    <Card style={{ textAlign: 'center', padding: '3rem 2rem' }}>
      <div style={{
        width: 56, height: 56, borderRadius: 'var(--radius-lg)',
        background: 'var(--bg-glass)', border: '1px solid var(--border-subtle)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 1rem', color: 'var(--text-secondary)',
      }}>
        <Icon size={24} />
      </div>
      <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 600 }}>{title}</h3>
      <p style={{ margin: '0 0 1rem', fontSize: 14, color: 'var(--text-secondary)', maxWidth: 360, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.7 }}>
        {description}
      </p>
      <span className="badge badge-amber">Coming soon</span>
    </Card>
  );
}

// ── Root App ──────────────────────────────────────────────
export default function App() {
  const [activeTab, setActiveTab] = useState('evaluate');
  const [showSettings, setShowSettings] = useState(false);

  return (
    <>
      <Header onOpenSettings={() => setShowSettings(true)} />

      <main className="page-container">
        {/* Hero */}
        <div className="hero">
          <h1 className="hero-title">
            Who reviews <span>the reviewer?</span>
          </h1>
          <p className="hero-subtitle">
            AI-powered reviewer suitability analysis for scientific journals — check conflicts of interest,
            expertise match, and academic connections instantly.
          </p>
        </div>

        {/* Tab bar */}
        <TabBar activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Tab content */}
        {activeTab === 'evaluate' && <EvaluateTab />}

        {activeTab === 'suggest' && (
          <ComingSoon
            icon={Lightbulb}
            title="Reviewer Suggester"
            description="Provide a paper and the AI will survey the field to find and rank potential reviewers by expertise and low conflict of interest."
          />
        )}

        {activeTab === 'game' && (
          <ComingSoon
            icon={Gamepad2}
            title="AI or Human?"
            description="We show you a real review excerpt alongside an AI-generated one on a similar topic. Can you tell which is which?"
          />
        )}
      </main>

      {/* Settings modal */}
      {showSettings && <ApiKeyModal onClose={() => setShowSettings(false)} />}
    </>
  );
}
