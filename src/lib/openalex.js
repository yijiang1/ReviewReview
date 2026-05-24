// ── OpenAlex API Helper ──────────────────────────────────────────────────

/**
 * Search for an author by name on OpenAlex and return the most relevant profile.
 */
export async function fetchAuthorProfile(reviewerName) {
  try {
    const url = `https://api.openalex.org/authors?search=${encodeURIComponent(reviewerName)}`;
    // Using a generic polite mailto (OpenAlex recommends this for faster, more reliable API access)
    const res = await fetch(url, { headers: { 'User-Agent': 'mailto:hello@reviewreview.local' } });
    
    if (!res.ok) return null;
    const data = await res.json();
    
    if (data.results && data.results.length > 0) {
      // Return the top result
      return data.results[0];
    }
    return null;
  } catch (e) {
    console.error("OpenAlex author fetch failed:", e);
    return null;
  }
}

/**
 * Fetch the most recent publications for a given OpenAlex author ID.
 */
export async function fetchAuthorWorks(authorId, maxWorks = 10) {
  try {
    // OpenAlex IDs are often returned as full URLs (e.g., https://openalex.org/A123456)
    const idMatch = authorId.match(/A\d+/);
    if (!idMatch) return [];
    
    const id = idMatch[0];
    const url = `https://api.openalex.org/works?filter=author.id:${id}&sort=publication_year:desc&per-page=${maxWorks}`;
    const res = await fetch(url, { headers: { 'User-Agent': 'mailto:hello@reviewreview.local' } });
    
    if (!res.ok) return [];
    const data = await res.json();
    return data.results || [];
  } catch (e) {
    console.error("OpenAlex works fetch failed:", e);
    return [];
  }
}

/**
 * Format the raw OpenAlex works array into a clean markdown string for the LLM prompt.
 */
export function formatWorksForPrompt(works) {
  if (!works || works.length === 0) return "No publication records found on OpenAlex.";
  
  return works.map((w, i) => {
    const title = w.title || "Untitled";
    const year = w.publication_year || "Unknown Year";
    const citations = w.cited_by_count || 0;
    
    // Extract top 5 relevant concepts/keywords
    const concepts = (w.concepts || [])
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(c => c.display_name)
      .join(', ');
      
    // Reconstruct abstract from inverted index
    let abstract = "No abstract available.";
    if (w.abstract_inverted_index) {
      const words = [];
      for (const [word, positions] of Object.entries(w.abstract_inverted_index)) {
        for (const pos of positions) {
          words[pos] = word;
        }
      }
      abstract = words.join(' ').replace(/\s+/g, ' ').trim();
    }
    
    return `[Paper ${i+1}] ${title} (${year})
Citations: ${citations}
Keywords: ${concepts}
Abstract: ${abstract}`;
  }).join('\n\n---\n\n');
}

/**
 * Format the author's quantitative impact metrics into a string for the prompt.
 */
export function formatAuthorMetrics(authorProfile) {
  if (!authorProfile) return "Metrics unavailable.";
  
  const citations = authorProfile.cited_by_count || 0;
  const hIndex = authorProfile.summary_stats?.h_index || 0;
  const i10Index = authorProfile.summary_stats?.i10_index || 0;
  const papers = authorProfile.works_count || 0;
  
  return `h-index: ${hIndex} | Citations: ${citations.toLocaleString()} | i10-index: ${i10Index} | Papers: ${papers.toLocaleString()}`;
}
