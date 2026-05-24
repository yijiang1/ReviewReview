import {
  GraduationCap, FlaskConical, Building2, Users, FileText,
  Share2, Quote, CheckCircle2, RotateCcw, MapPin,
  Award, BookOpen, AlertTriangle
} from 'lucide-react';
import { Badge, Chip, Label, Ring, Card, Divider } from './UI.jsx';

// ── Helpers ───────────────────────────────────────────────
function coiBadge(verdict) {
  if (verdict === 'No Conflict')   return 'green';
  if (verdict === 'Minor Concern') return 'amber';
  return 'red';
}
function expBadge(verdict) {
  if (verdict === 'Excellent Match' || verdict === 'Good Match') return 'green';
  if (verdict === 'Partial Match') return 'amber';
  return 'red';
}
function recBadge(rec) {
  if (rec === 'Highly Recommended' || rec === 'Recommended') return 'green';
  if (rec === 'Conditionally Recommended') return 'amber';
  return 'red';
}

const CONNECTION_META = {
  'Shared PhD advisor':       { Icon: GraduationCap, level: 'red' },
  'Academic siblings':        { Icon: Users,          level: 'red' },
  'Postdoc relationship':     { Icon: GraduationCap,  level: 'red' },
  'Co-authored papers':       { Icon: FileText,        level: 'amber' },
  'Same institution overlap': { Icon: Building2,       level: 'amber' },
  'Same research community':  { Icon: Share2,          level: 'amber' },
  'Heavy citation overlap':   { Icon: Quote,           level: 'amber' },
  'No significant connection':{ Icon: CheckCircle2,    level: 'green' },
};

// ── Timeline ──────────────────────────────────────────────
function ProfileTimeline({ profile }) {
  const entries = [];

  if (profile.phd_institution) {
    entries.push({
      period: profile.phd_year || 'PhD',
      place: profile.phd_institution,
      detail: profile.phd_advisor ? `Advisor: ${profile.phd_advisor}` : null,
      Icon: GraduationCap,
    });
  }
  (profile.postdoc_institutions || []).forEach(p => {
    entries.push({
      period: 'Postdoc',
      place: p.institution,
      detail: p.supervisor ? `Supervisor: ${p.supervisor}` : null,
      Icon: FlaskConical,
    });
  });
  (profile.career_history || []).forEach(e => {
    entries.push({
      period: e.years || '',
      place: e.institution,
      detail: e.role,
      Icon: Building2,
    });
  });

  if (!entries.length) return null;

  return (
    <div>
      <Label>Academic history</Label>
      <div className="timeline">
        {entries.map((e, i) => (
          <div key={i} className="timeline-item">
            <div className="timeline-dot">
              <e.Icon size={9} />
            </div>
            <p style={{ margin: '0 0 1px', fontSize: 13, fontWeight: 500 }}>{e.place}</p>
            {e.detail && <p style={{ margin: '0 0 1px', fontSize: 11, color: 'var(--text-secondary)' }}>{e.detail}</p>}
            {e.period && <p style={{ margin: 0, fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{e.period}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Connections ───────────────────────────────────────────
function ConnectionsList({ connections }) {
  if (!connections?.length) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {connections.map((c, i) => {
        const meta = CONNECTION_META[c.type] || { Icon: Share2, level: 'amber' };
        const { Icon, level } = meta;
        return (
          <div key={i} className={`connection-item ${level}`}>
            <Icon size={16} style={{
              color: level === 'red' ? 'var(--red-fg)' : level === 'amber' ? 'var(--amber-fg)' : 'var(--green-fg)',
              flexShrink: 0, marginTop: 1,
            }} />
            <div style={{ flex: 1 }}>
              <p style={{
                margin: '0 0 2px', fontSize: 12, fontWeight: 600,
                color: level === 'red' ? 'var(--red-fg)' : level === 'amber' ? 'var(--amber-fg)' : 'var(--green-fg)',
              }}>{c.type}</p>
              <p style={{ margin: 0, fontSize: 12, lineHeight: 1.6, color: 'var(--text-primary)' }}>{c.description}</p>
              {c.with_author && (
                <p style={{ margin: '3px 0 0', fontSize: 11, color: 'var(--text-muted)' }}>
                  With: {c.with_author}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Main Results ──────────────────────────────────────────
export function Results({ result, onReset }) {
  const coi      = result.conflict_of_interest || {};
  const exp      = result.expertise || {};
  const rv       = result.reviewer_profile || {};
  const authors  = result.authors || [];
  const connections = result.connections || [];
  const recColor = recBadge(result.overall_recommendation);

  return (
    <div className="animate-fade-up">

      {/* ── Header card ─── */}
      <Card accent className="results-header-bg" style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <Label>Reviewer evaluation</Label>
            <h2 style={{ margin: '4px 0 6px', fontSize: 22, letterSpacing: '-0.03em' }}>
              {result.reviewer_name}
            </h2>
            <p style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--text-secondary)' }}>
              {[rv.institution, rv.career_stage].filter(Boolean).join(' · ')}
            </p>
            <Badge text={result.overall_recommendation} color={recColor} />
            {result.paper_title && (
              <p style={{ margin: '12px 0 0', fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                <FileText size={12} style={{ flexShrink: 0, marginTop: 1 }} />
                <em>{result.paper_title}</em>
              </p>
            )}
          </div>
          <Ring value={result.overall_score ?? 0} label="Overall" />
        </div>
      </Card>

      {/* ── Score cards ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>

        {/* COI */}
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
            <div>
              <Label>Conflict of interest</Label>
              <Badge text={coi.verdict || 'Unknown'} color={coiBadge(coi.verdict)} />
            </div>
            <Ring value={coi.score ?? 0} label="COI level" />
          </div>
          <p style={{ margin: '0 0 10px', fontSize: 13, lineHeight: 1.75, color: 'var(--text-secondary)' }}>
            {coi.explanation}
          </p>
          {(coi.findings || []).map((f, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
              <AlertTriangle size={11} style={{ color: 'var(--amber-fg)', flexShrink: 0, marginTop: 3 }} />
              <span style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.55 }}>{f}</span>
            </div>
          ))}
        </Card>

        {/* Expertise */}
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
            <div>
              <Label>Expertise match</Label>
              <Badge text={exp.verdict || 'Unknown'} color={expBadge(exp.verdict)} />
            </div>
            <Ring value={exp.score ?? 0} label="Match score" />
          </div>
          <p style={{ margin: '0 0 12px', fontSize: 13, lineHeight: 1.75, color: 'var(--text-secondary)' }}>
            {exp.explanation}
          </p>
          {(exp.paper_topics || []).length > 0 && (
            <div style={{ marginBottom: 8 }}>
              <Label>Paper topics</Label>
              {exp.paper_topics.map((t, i) => <Chip key={i} text={t} />)}
            </div>
          )}
          {(exp.reviewer_topics || []).length > 0 && (
            <div>
              <Label>Reviewer's areas</Label>
              {exp.reviewer_topics.map((t, i) => <Chip key={i} text={t} variant="info" />)}
            </div>
          )}
        </Card>
      </div>

      {/* ── Reviewer background ─── */}
      {(rv.phd_institution || rv.postdoc_institutions?.length || rv.career_history?.length) && (
        <Card style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
            <div style={{ flex: 1 }}>
              <Label>Reviewer background</Label>
              <p style={{ margin: '2px 0 6px', fontSize: 15, fontWeight: 600 }}>{result.reviewer_name}</p>
              {rv.institution && (
                <p style={{ margin: '0 0 8px', fontSize: 13, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <MapPin size={12} /> {rv.institution}
                </p>
              )}
              {rv.research_areas?.length > 0 && (
                <div style={{ marginBottom: 4 }}>
                  {rv.research_areas.map((a, i) => <Chip key={i} text={a} />)}
                </div>
              )}
            </div>
            {rv.career_stage && (
              <div style={{ flexShrink: 0 }}>
                <Badge text={rv.career_stage} color="info" />
              </div>
            )}
          </div>
          <Divider />
          <ProfileTimeline profile={rv} />
        </Card>
      )}

      {/* ── Connections ─── */}
      {connections.length > 0 && (
        <Card style={{ marginBottom: '1rem' }}>
          <Label>Relationship history</Label>
          <p style={{ margin: '2px 0 12px', fontSize: 13, color: 'var(--text-secondary)' }}>
            Connections found between <strong style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{result.reviewer_name}</strong> and the paper's authors.
          </p>
          <ConnectionsList connections={connections} />
        </Card>
      )}

      {/* ── Paper authors ─── */}
      {authors.length > 0 && (
        <Card style={{ marginBottom: '1rem' }}>
          <Label>Paper authors</Label>
          <div className="author-grid" style={{ marginTop: 8 }}>
            {authors.map((a, i) => (
              <div key={i} className="author-card">
                <p style={{ margin: '0 0 3px', fontSize: 13, fontWeight: 600 }}>{a.name}</p>
                {a.institution && (
                  <p style={{ margin: '0 0 2px', fontSize: 11, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Building2 size={10} /> {a.institution}
                  </p>
                )}
                {a.phd_advisor && (
                  <p style={{ margin: '0 0 1px', fontSize: 11, color: 'var(--text-muted)' }}>
                    <GraduationCap size={10} style={{ marginRight: 3, verticalAlign: 'text-bottom' }} />
                    PhD: {a.phd_advisor}
                  </p>
                )}
                {a.postdoc_supervisor && (
                  <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)' }}>
                    <Award size={10} style={{ marginRight: 3, verticalAlign: 'text-bottom' }} />
                    Postdoc: {a.postdoc_supervisor}
                  </p>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ── Summary ─── */}
      {result.summary && (
        <Card style={{ marginBottom: '1.25rem', background: 'rgba(59,130,246,0.05)', borderColor: 'var(--border-accent)' }}>
          <Label>Summary</Label>
          <p style={{ margin: '6px 0 0', fontSize: 14, lineHeight: 1.8, color: 'var(--text-secondary)' }}>
            {result.summary}
          </p>
        </Card>
      )}

      {/* ── Reset button ─── */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <button className="btn btn-secondary" onClick={onReset} style={{ gap: 8 }}>
          <RotateCcw size={14} /> Evaluate another reviewer
        </button>
      </div>
    </div>
  );
}
