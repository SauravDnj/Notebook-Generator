// app/api/generate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';

export async function POST(req: NextRequest) {
  try {
    const { topic, style, numPages, detailLevel = 'detailed', includeDiagrams = true, model = 'llama-3.3-70b-versatile', apiKey } = await req.json();

    if (!apiKey?.trim()) {
      return NextResponse.json({ error: 'Groq API key is required. Get your free key at console.groq.com/keys' }, { status: 400 });
    }

    if (!topic?.trim()) {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
    }

    // Create Groq client with user-provided key
    const groq = new Groq({ apiKey: apiKey.trim() });

    const stylePrompts: Record<string, string> = {
      formal: 'formal academic study notes with precise definitions, structured Q&A, and professional diagrams',
      student: 'casual student-style notes with simple explanations, practical examples, and helpful sketches',
      creative: 'creative and engaging notes with interesting facts, mnemonics, and colorful illustrations',
      interview: 'interview preparation Q&A with concise, memorable answers and architecture diagrams',
    };

    const styleDesc = stylePrompts[style] || stylePrompts.student;
    
    // Estimate items needed to fill requested pages
    // Higher multiplier = more items = more pages filled
    let multiplier = 4;
    if (detailLevel === 'level1') multiplier = 6;
    else if (detailLevel === 'level2') multiplier = 4;
    else if (detailLevel === 'level3') multiplier = 3;
    else if (detailLevel === 'level4') multiplier = 2;
    else if (detailLevel === 'level5') multiplier = 1.5;

    const estimatedItems = Math.max(4, Math.round(numPages * multiplier));

    let depthInstruction = '';
    if (detailLevel === 'level1') {
      depthInstruction = '- Give short, punchy summary points.\n- Use 1-3 simple bullet points per answer.\n- Keep text minimal and easy to scan.';
    } else if (detailLevel === 'level3') {
      depthInstruction = '- Give in-depth, comprehensive answers.\n- Use 4-8 detailed bullet points per answer.\n- Explain concepts thoroughly.';
    } else if (detailLevel === 'level4') {
      depthInstruction = '- Provide a MASTERCLASS level of detail.\n- Use 8-15 exhaustive bullet points per answer.\n- Cover edge cases, deep technical nuances, and advanced concepts.\n- Write as if creating the ultimate definitive guide on the topic.\n- DO NOT HOLD BACK. Write lengthy paragraphs for each point.';
    } else if (detailLevel === 'level5') {
      depthInstruction = '- Provide ACADEMIC RESEARCH PAPER level of detail.\n- Use 15-25 extremely lengthy, exhaustive bullet points per answer.\n- Cite theoretical frameworks, deep historical context, mathematical/technical proofs, and public research papers.\n- Write as if publishing in a top-tier peer-reviewed journal.\n- DO NOT HOLD BACK. Write as much text as possible. Over-explain everything.';
    } else {
      depthInstruction = '- Give clear, structured answers.\n- Use 2-5 bullet points per answer.\n- Provide a good balance of detail and readability.';
    }

    const diagramInstruction = includeDiagrams 
      ? `- INCLUDE DIAGRAMS: For at least 30% of the questions (especially architecture/flow questions), include a "mermaidCode" field. Write a valid Mermaid.js graph/flowchart (e.g., "graph TD; A-->B;") that visually explains the concept. Do NOT wrap it in markdown block quotes, just provide the raw mermaid string.\n- If a question does not need a diagram, omit the "mermaidCode" field entirely.`
      : `- DO NOT include any diagrams or images. Never use the "mermaidCode" field.`;

    const prompt = `Create comprehensive ${styleDesc} about: "${topic}"

Generate exactly ${estimatedItems} points/questions with answers.

Rules:
${depthInstruction}
${diagramInstruction}

Return ONLY valid JSON in this exact flat format, no markdown:
{
  "title": "Topic Title (catchy, 4-8 words)",
  "items": [
    {
      "question": "Question or Topic Heading here?",
      "answers": ["Point 1", "Point 2"],
      ${includeDiagrams ? '"mermaidCode": "graph TD; A-->B; B-->C;" // OPTIONAL valid mermaid syntax' : ''}
    }
  ]
}

DO NOT wrap the JSON in \`\`\` block. Just output raw JSON.`;

    const completion = await groq.chat.completions.create({
      model: model,
      messages: [
        {
          role: 'system',
          content: 'You are an expert educational content creator. Always return valid, parseable JSON only. No markdown formatting, no explanation, just raw JSON.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 8000,
    });

    const raw = completion.choices[0]?.message?.content ?? '';

    // Extract JSON (handle any preamble)
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
    }

    const data = JSON.parse(jsonMatch[0]);

    // We no longer structure it into 'pages' in the API. We return flat items.
    // The frontend's paginateContent will chunk it into exact pages.
    return NextResponse.json({ title: data.title, items: data.items });
  } catch (error: unknown) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const err = error as any;
    console.error('Generation error:', err);
    let msg = err.message || 'Failed to generate content';
    
    // Attempt to parse nested rate limit errors
    const errString = err.message || '';
    if (err.status === 429 || errString.includes('429') || errString.includes('Rate limit reached')) {
      msg = `Rate limit exceeded! You have reached your token limit for this specific model. Please select a different AI Model in the dropdown to continue.`;
    } else if (err?.error?.message) {
      msg = err.error.message;
    }
    
    return NextResponse.json(
      { error: msg },
      { status: err?.status || 500 }
    );
  }
}
