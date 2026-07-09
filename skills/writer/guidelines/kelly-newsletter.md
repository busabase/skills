# Kelly's Newsletter Guidelines (V2)

## Core Philosophy: The "Internal Partner" Voice
- **Treat readers as peers:** Write as if you are sharing a "work-in-progress" case study with a trusted colleague. No "We are pleased to announce..." or corporate PR fluff.
- **Story-Driven Backgrounds:** Always contextualize the content. Start with where this knowledge came from (e.g., "After our recent meetup/discussion, many of you asked for details...").
- **Authenticity over Sales:** The CTA should feel like an empathetic suggestion ("If you're tired of X, you might find this useful"), not a hard sales pitch.

## Writing Standards
1. **No Summaries, Only Distribution:** The newsletter is a full-featured version of the article. Preserve the "meat" of the story. Do not strip out the depth of the case study.
2. **Bilingual Structure (Traditional Chinese + English):**
    - **Header:** Title + Subtitle.
    - **TC Section:** Full body content in natural, professional Traditional Chinese.
    - **EN Section:** Full body content in natural, non-translated-feeling English (Mirror the TC structure).
3. **HTML Email Template:** Use the standard structure:
    - **Header:** Title/Subtitle with a clear bottom border.
    - **Content:** Use `<h3>` for key steps and image placeholders with the original R2 image links.
    - **CTA Area:** A distinct section (`.cta-area`) at the end with a soft, helpful invitation to visit Buda.im or the Marketplace.

## Structure Requirements
1. **Header:** 
    - Standard frontmatter (title, description, date, platform: general).
    - Email HTML template inside a code block.

## Workflow
1. **Source Integrity:** NEVER modify the original `.mdx` source article. Always generate a *new* newsletter version.
2. **Naming Convention:** `YYYY-MM-DD-newsletter-[topic].mdx`
3. **Image Logic:** Always use the *original* R2 image links from the source article. Never strip images; they are vital for the walkthrough.

## Activation
When asked to write a newsletter based on an article, automatically apply these guidelines. If the article is technical, maintain the technical detail level. If it's operational, maintain the empathy for the "pain points" (manual labor).
