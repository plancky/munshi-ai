# Gemini Prompts - Optimized for Efficiency and Direct Communication

# Common formatting rules to avoid repetition
HTML_FORMAT_RULES = "Use HTML tags ONLY: <h3>, <p>, <strong>, <ul>, <li>. NO markdown."
DIRECT_TONE = "Be direct and concise. Focus on substance over style. Cut through noise and get to what matters."

clean_transcript_prompt = """Transform this Whisper transcript into polished text while preserving original meaning and voice.

RULES:
• Fix capitalization, punctuation, spacing
• Remove filler words: "um", "uh", "like", "you know", "so", "actually"  
• Eliminate false starts and repetitions
• Correct speech recognition errors using context
• Fix homophones: their/there/they're, your/you're, its/it's
• Convert numbers appropriately (spell 1-9, numerals 10+)
• Break into logical paragraphs, maintain conversational tone

AD/SPONSOR HANDLING:
• Flag any obvious advertisements, sponsorships, or promotional content with [AD] tags (opening and closing tags are required)
• Include: "This episode is sponsored by...", product placements, discount codes, promotional segments
• Keep the content but mark it clearly for transparency

CONSTRAINTS:
• Preserve 100% of original content - NO truncation
• Mark uncertain corrections as [uncertain: suggested_text]
• Return ONLY cleaned transcript, no explanations
• Preserve timestamps if present

Process this transcript:"""

clean_speaker_transcript_prompt = """Clean this speaker-diarized transcript with smart speaker detection and formatting.

CRITICAL SPEAKER DETECTION RULES:
• Analyze the conversation carefully to identify ALL speaker names from context
• If you detect ANY speaker identity, add them as: SPEAKER_MAPPINGS: SPEAKER_00=FullName, SPEAKER_01=FullName
• Use FULL NAMES consistently throughout (e.g., "John Smith" not just "John")
• Put ALL mappings on first line, then cleaned transcript below
• Be confident about speaker identity - look for introductions, name mentions, context clues
• If someone says "I'm [Name]" or is addressed as "[Name]" multiple times, map that speaker

CONSISTENCY ENFORCEMENT:
• Once you identify ANY speaker name, use it consistently throughout the ENTIRE transcript
• If you detect a full name even ONCE, use that full name for ALL instances of that speaker
• Look for patterns: if "Harry" appears early and "Harry Stebbings" appears later, use "Harry Stebbings" for ALL instances
• Merge any broken speaker segments from the same person
• Fix speaker transitions where the same person continues speaking

SPEAKER ATTRIBUTION RULES:
• Carefully track who is speaking when - don't mix up speakers
• If a name is mentioned in conversation, determine if it's the current speaker or someone else
• Look for self-references ("I", "my", "me") vs. third-person references
• Pay attention to conversation flow and context

AD/SPONSOR HANDLING:
• Flag any obvious advertisements, sponsorships, or promotional content with [AD] tags
• Include: "This episode is sponsored by...", product placements, discount codes, promotional segments
• Keep the content but mark it clearly for transparency
• Don't flag brief mentions of company names in organic conversation

FORMATTING RULES:
• Fix capitalization, punctuation, spacing in speech
• Remove filler words: "um", "uh", "like", "you know", "so", "actually"
• Correct speech recognition errors using context
• Each speaker segment on new line: "SPEAKER_00: Clean text here"
• Merge short segments from same speaker if they're clearly connected

CONSTRAINTS:
• Keep original speaker labels (SPEAKER_00, SPEAKER_01, etc.) in the transcript
• Preserve 100% of speech content - NO truncation
• Mark uncertain corrections as [uncertain: suggested_text]
• Ensure consistent speaker naming throughout

Process this speaker transcript:"""

comprehensive_summary_prompt = f"""Create a punchy, attention-grabbing summary of this content. {DIRECT_TONE}

{HTML_FORMAT_RULES}

Write with energy and conviction. Make every sentence count. Structure it however works best for this specific content - you decide the approach.

FOCUS ON:
• Most compelling insights, contrarian takes, and surprising revelations
• Specific numbers, data points, and actionable advice that actually matter
• What makes this content different from the usual noise
• Bold claims and strong opinions that grab attention

IGNORE/DOWNPLAY:
• Obvious sponsor mentions and promotional content
• Generic advice everyone already knows
• Lengthy background explanations
• Corporate buzzwords and empty phrases

Write like someone who cuts through BS and gets to what actually matters. Be bold, be direct, make it impossible to ignore.

Use <strong> for the most powerful insights.

Summarize this content:"""

batch_combine_prompt = f"""Merge multiple summary sections into one unified summary. {DIRECT_TONE}

{HTML_FORMAT_RULES}

APPROACH:
• Lead with most important insights from any section
• Combine related points into stronger insights  
• Eliminate repetitive and obvious content
• Focus on useful, surprising, or contrarian points

REMOVE: Repeated insights, generic advice, filler
HIGHLIGHT: Contradictory viewpoints, specific numbers, actionable takeaways

Use <strong> for best insights.

Combine these summaries:"""

quick_summary_prompt = """Create a concise 2-3 sentence summary. Start with WHO + WHAT, then present the most important insight or key takeaway. Be direct and focus on what's genuinely valuable. Plain text only."""

