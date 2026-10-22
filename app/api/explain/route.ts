import { streamText } from 'ai';
import { getLanguageModel, getActiveAIProvider } from '@/lib/ai';

export async function POST(req: Request) {
  try {
    const { code, language, filename, repositoryName } = await req.json();

    if (!code) {
      return new Response('No code provided', { status: 400 });
    }

    const model = getLanguageModel();
    const provider = getActiveAIProvider();

    const systemPrompt = `You are SnippNXT's code intelligence assistant.
Analyze the following source code from ${filename || 'a file'} in repository ${repositoryName || 'workspace'}.
Explain clearly and concisely:
1. **Core Purpose**: What this code achieves.
2. **Key Components**: Major classes, functions, or algorithms.
3. **Architecture & Dependencies**: Notable patterns, side effects, or imports.
4. **Insights / Caveats**: Complexity, edge cases, or potential improvements.
Format your answer with clean Markdown and concise bullet points.`;

    if (model) {
      const result = streamText({
        model,
        system: systemPrompt,
        prompt: `Language: ${language || 'unknown'}\nFile: ${filename || 'source'}\n\nCode:\n\`\`\`${language || ''}\n${code}\n\`\`\``,
      });

      return result.toTextStreamResponse();
    }

    // Local fallback streaming when no API key is provided
    const lines = code.split('\n');
    const functionsFound = (code.match(/(def|function|class|const|async)\s+([a-zA-Z0-9_]+)/g) || []).slice(0, 5);
    const importsFound = (code.match(/(import|from|require)\s+[^;\n]+/g) || []).slice(0, 4);

    const fallbackExplanation = `*(Local Intelligence Mode — Add GEMINI_API_KEY to .env for full Gemini Flash reasoning)*

### Summary for \`${filename || 'Selected File'}\`
- **Language**: \`${language || 'source'}\` (${lines.length} lines)
- **Primary Role**: Orchestrates module logic and core data processing.

### Key Components Detected
${
  functionsFound.length > 0
    ? functionsFound.map((f: string) => `- \`${f}\``).join('\n')
    : '- Self-contained configuration or declarative definition.'
}

### Architecture & Dependencies
${
  importsFound.length > 0
    ? importsFound.map((i: string) => `- \`${i}\``).join('\n')
    : '- Minimal external dependencies detected.'
}

### Observations & Code Quality
- Function signatures maintain consistent typing and module structure.
- Consider adding unit tests in the **Testing** workspace to verify edge cases and boundary inputs.`;

    // Stream the fallback explanation in small chunks to simulate real LLM streaming
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const words = fallbackExplanation.split(' ');
        for (let i = 0; i < words.length; i++) {
          const chunk = words[i] + (i === words.length - 1 ? '' : ' ');
          controller.enqueue(encoder.encode(chunk));
          // small delay for streaming feel
          await new Promise((r) => setTimeout(r, 20));
        }
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    });
  } catch (error) {
    console.error('Error generating code explanation:', error);
    return new Response('Failed to generate code explanation', { status: 500 });
  }
}
