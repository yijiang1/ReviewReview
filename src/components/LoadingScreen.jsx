import { CheckCircle, Loader2, Clock } from 'lucide-react';

const STEPS = [
  { id: 'extract',    label: 'Extracting paper content',       sub: 'Reading title, authors, and abstract' },
  { id: 'publications',label: 'Fetching publication record',   sub: 'Querying OpenAlex for recent papers' },
  { id: 'research',   label: 'Researching reviewer background', sub: 'Academic history, affiliations, publications' },
  { id: 'authors',    label: 'Investigating paper authors',     sub: 'PhD trees, career history, institutions' },
  { id: 'connections',label: 'Mapping academic connections',    sub: 'Checking co-authorship, mentorship, overlap' },
  { id: 'evaluate',   label: 'Generating evaluation',          sub: 'COI analysis, expertise scoring, recommendation' },
];

export function LoadingScreen({ currentStep, statusMsg }) {
  const currentIndex = STEPS.findIndex(s => s.id === currentStep);

  return (
    <div className="card animate-fade-up" style={{ marginBottom: '1rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1.5rem' }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          background: 'var(--info-bg)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Loader2 size={18} style={{ color: 'var(--accent-400)', animation: 'spin 1s linear infinite' }} />
        </div>
        <div>
          <p style={{ margin: 0, fontWeight: 600, fontSize: 14 }}>Analyzing reviewer suitability…</p>
          <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>
            {statusMsg || 'This may take 30–60 seconds'}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="progress-bar-track" style={{ marginBottom: '1.5rem' }}>
        <div
          className="progress-bar-fill"
          style={{ width: `${Math.max(5, (currentIndex / (STEPS.length - 1)) * 100)}%` }}
        />
      </div>

      {/* Steps */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {STEPS.map((step, i) => {
          const isDone    = i < currentIndex;
          const isActive  = i === currentIndex;
          const isPending = i > currentIndex;

          return (
            <div
              key={step.id}
              className={`loading-step ${isDone ? 'completed' : isActive ? 'active' : 'pending'}`}
            >
              {/* Icon */}
              <div className={`step-icon ${isDone ? 'done' : isActive ? 'spin' : 'pending'}`}>
                {isDone    && <CheckCircle size={13} />}
                {isActive  && <Loader2 size={13} style={{ animation: 'spin 0.8s linear infinite' }} />}
                {isPending && <Clock size={11} />}
              </div>

              {/* Text */}
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: isActive ? 600 : 400, color: isActive ? 'var(--text-primary)' : 'inherit' }}>
                  {step.label}
                </p>
                {isActive && (
                  <p style={{ margin: '1px 0 0', fontSize: 11, color: 'var(--text-muted)' }}>
                    {step.sub}
                  </p>
                )}
              </div>

              {/* Step number */}
              {isPending && (
                <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{i + 1}</span>
              )}
            </div>
          );
        })}
      </div>

      <p style={{ marginTop: '1.25rem', fontSize: 11, color: 'var(--text-muted)', textAlign: 'center' }}>
        Powered by AI Web Search + OpenAlex · Results may take up to a minute
      </p>
    </div>
  );
}
