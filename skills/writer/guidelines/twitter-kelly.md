# Twitter / X Article Writing Guidelines

These guidelines apply when adapting content (like LinkedIn posts or WeChat articles) into Twitter Threads or X Articles. 

## 1. Core Philosophy: The X-Factor
- **Debunking & Confrontational (The Hook):** Twitter thrives on strong, slightly confrontational or contrarian opinions. Don't start with a generic summary. Start by attacking a common myth, a pain point, or a frustrating status quo.
- **Founder-Led Narrative:** Shift from "Institutional/We" to "Founder/I". Twitter is about personal IP and raw thoughts, not polished corporate PR.
- **Vulnerability over Perfection:** Share failures, rejections, or things that "pissed you off." It makes the automation/AI solution look earned rather than like a sales pitch.

## 2. Structural Adaptation (From Corporate to X)
- **Short, Punchy Paragraphs:** No walls of text. Max 2-3 sentences per paragraph.
- **Labeling Pain Points:** Use bold, punchy subheadings or tags (e.g., *1. The 3-Hour "Inbox Hell"*).
- **The "Before & After" Framing:** When explaining an AI Agent or automation, clearly contrast the painful human baseline with the automated AI result.
- **Philosophical / Visionary Closing:** Don't end with a generic "how-to". End with a philosophical mic-drop about the future of work, human potential, or the death of old workflows (e.g., "Stop hiring code monkeys. Start hiring AI Commanders.").

## 3. Tone & Vocabulary (Stripping the Corporate Jargon)
- **NO HR/Corporate Speak:** Remove words like "alignment," "synergy," "resource allocation," or "administrative workflows."
- **YES Visceral Language:** Use visceral metaphors: "Human Assembly Line," "Jira Ticket Mover," "Data Entry Clerks," "Excel Spreadsheet Slave."
- **Caution (PR Risk):** Be edgy but respectful. Do not insult the *workers* (e.g., avoid "Code Monkeys" if it targets your audience). Instead, attack the *system* or *management style* ("Stop treating developers like human compilers").

## 4. Format Types
When the user asks for Twitter content, determine if they want a **Thread** or an **X Article**:
- **Twitter Thread:** 5-8 connected tweets. Tweet 1 is the hook. Tweet 2-4 is the meat (pain + solution). Tweet 5 is the vision. Tweet 6 is the CTA.
- **X Article (Long-form):** A cohesive, narrative-driven blog post natively readable on X. Use `platform: twitter` in the MDX frontmatter. Keep the flow fast, use markdown headers (`###`), and embed images directly in the flow to break up the text.

## 5. Frontmatter & Naming Requirements
- **File Naming:** `YYYY-MM-DD-twitter-[topic].mdx` or `YYYY-MM-DD-x-article-[topic].mdx`. 
- **Platform:** MUST be exactly `twitter`. Do NOT use `x-article` or `x` in the `platform:` field (it will break the build).
- **Title:** Ensure the title is punchy and opinionated, not a boring summary.