
# Common formatting rules to avoid repetition
HTML_FORMAT_RULES = "Use HTML tags ONLY: <h3>, <p>, <strong>, <ul>, <li>. NO markdown."

clean_transcript_prompt = """Transform this Whisper transcript into polished text while preserving original meaning and voice.

CLEANING RULES:
• Fix capitalization, punctuation, spacing
• Remove filler words: "um", "uh", "like", "you know", "so", "actually"  
• Eliminate false starts and repetitions
• Correct speech recognition errors using context
• Fix homophones: their/there/they're, your/you're, its/it's
• Convert numbers appropriately (spell 1-9, numerals 10+)
• Break into logical paragraphs, maintain conversational tone

AD/SPONSOR DETECTION:
• Identify obvious advertisements, sponsorships, or promotional content
• Include: "This episode is sponsored by...", product placements, discount codes, promotional segments
• Wrap detected ads with [AD] tags: [AD]This episode is sponsored by BetterHelp. BetterHelp offers...[/AD]
• Put tagged content in separate paragraph/line for clear visual separation
• Don't flag brief organic mentions of companies in conversation context

CONSTRAINTS:
• Preserve 100% of original content in cleaned_text

Process this transcript:"""

clean_speaker_transcript_prompt = """Clean this speaker-diarized transcript with smart speaker detection and formatting.

CRITICAL SPEAKER DETECTION RULES:
• Analyze conversation carefully to identify speaker names from context
• Use FULL NAMES consistently (e.g., "John Smith" not just "John")
• Look for introductions, name mentions, context clues
• If someone says "I'm [Name]" or is addressed as "[Name]", map that speaker
• Once you identify a name, use it consistently throughout

SPEAKER CONSISTENCY:
• Merge broken speaker segments from the same person
• Fix speaker transitions where the same person continues speaking
• Track who is speaking when - don't mix up speakers
• Use self-references vs. third-person references as clues

AD/SPONSOR DETECTION:
• Identify promotional content with speaker attribution
• Include sponsorship mentions, product placements, discount codes
• Wrap detected ads with [AD] tags: SPEAKER_00:[AD] This episode is sponsored by...[/AD]
• Put tagged content in separate speaker segments for clear visual separation

FORMATTING RULES:
• Fix capitalization, punctuation, spacing in speech
• Remove filler words like: "um", "uh", "like", "you know", "so", "actually"
• Correct speech recognition errors using context
• Each speaker segment on new line: "SPEAKER_00: Clean text here"
• Merge short segments from same speaker if connected

CONSTRAINTS:
• Keep original speaker labels (SPEAKER_00, SPEAKER_01, etc.)
• Preserve 100% of speech content in cleaned_transcript
• If no speaker names detected, use empty array for speaker_mappings

Process this speaker transcript:"""

comprehensive_summary_prompt = f"""Create a comprehensive summary of this content that captures key insights and important details with proper context.

{HTML_FORMAT_RULES}

Write with clarity and focus on what matters most. Structure the content logically with proper headings and formatting.

FOCUS ON:
• Most important insights, key takeaways, and actionable advice
• Specific data points, numbers, and concrete examples
• Unique perspectives and valuable information
• Main themes and significant discussion points

ORGANIZE CONTENT:
• Use clear headings to structure information
• Highlight key insights with <strong> tags
• Present information in logical flow
• Make it easy to scan and understand

SKIP ENTIRELY:
• All sponsorship mentions and promotional content
• Discount codes, affiliate links, and product placements
• "This episode is sponsored by..." and similar promotional segments

MINIMIZE:
• Generic advice without specific context
• Redundant information and filler content
• Obvious filler phrases and transitions

Create a well-structured summary that provides genuine value to readers.

Summarize this content:"""

batch_combine_prompt = f"""Combine multiple summary sections into one unified, comprehensive summary.

{HTML_FORMAT_RULES}

APPROACH:
• Lead with the most important insights from across all sections
• Combine related points into stronger, more comprehensive insights  
• Eliminate repetitive content and redundancy
• Focus on valuable, actionable, and unique information
• Maintain logical flow and structure

SKIP ENTIRELY:
• All sponsorship mentions and promotional content
• Discount codes, affiliate links, and product placements
• Repetitive sponsor acknowledgments across sections

ORGANIZE:
• Use clear headings to structure the combined content
• Highlight the most valuable insights with <strong> tags
• Present information in order of importance
• Ensure smooth transitions between topics

QUALITY CONTROL:
• Remove duplicated insights and generic advice
• Preserve specific data points and actionable takeaways
• Maintain the most compelling and unique perspectives

Create a unified summary that's more valuable than the sum of its parts.

Combine these summaries:"""

quick_summary_prompt = """Create a concise 2-3 sentence summary. Start with WHO + WHAT, then present the most important insight or key takeaway. Be direct and focus on what's genuinely valuable. Plain text only."""

