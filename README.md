# ReviewReview

**AI-powered reviewer suitability analysis for scientific journals.**

## The Mission

Scientific peer review is the foundation of academic integrity. It ensures that published research is rigorously evaluated, fact-checked, and challenged by unbiased experts before it enters the global scientific record. 

However, the peer review system is currently under immense strain. Journal editors are overwhelmed with submissions, and finding suitable reviewers who are both deeply knowledgeable about the specific topic and completely free of conflicts of interest (COI) is a massive, time-consuming challenge. 

Too often, subtle conflicts of interest slip through the cracks—hidden co-authorships, past advisor-advisee relationships, or undocumented institutional overlap. Furthermore, reviewers are sometimes selected based on reputation rather than their recent, concrete publication history in the paper's specific sub-field.

**ReviewReview** was built to bring unprecedented transparency and efficiency to this process. 

By combining the reasoning capabilities of large language models with real-time web search and open bibliometric data (via OpenAlex), ReviewReview acts as an expert academic genealogy investigator. 

In seconds, it can:
1. **Verify True Expertise:** By pulling a reviewer's exact, recent publication record directly from OpenAlex and mapping their abstract concepts against the submitted paper.
2. **Uncover Hidden Conflicts:** By mapping the academic tree—checking for shared PhD advisors, postdoc supervisors, co-authorships, and institutional overlap between the reviewer and every author on the paper.
3. **Ensure Integrity:** By providing a clear, structured score and recommendation to the journal editor, empowering them to make confident, unbiased decisions.

Our goal is to protect the integrity of the scientific process by ensuring that every paper is reviewed by the right person, for the right reasons.

---

## How to use locally

ReviewReview is designed as a secure, local-first application. All API keys are stored securely in your browser and never sent to a central server.

1. Clone the repository
2. Install dependencies: `npm install`
3. Run the application: `npm run dev`
4. Open the local link in your browser.
5. In the settings panel, securely enter an API key for Anthropic, OpenAI, or Google Gemini.
6. Upload a paper PDF and enter a candidate reviewer's name to begin the evaluation.
