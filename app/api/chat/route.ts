import { streamText } from 'ai';
import { getLanguageModel, getActiveAIProvider } from '@/lib/ai';

export async function POST(req: Request) {
  try {
    const { messages, repositoryId } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response('Messages array is required', { status: 400 });
    }

    const model = getLanguageModel();
    const provider = getActiveAIProvider();

    const systemPrompt = `You are SnippNXT's Senior AI Architect & Code Intelligence Assistant.
You specialize in:
1. Explaining complex repositories, algorithms, and data structures.
2. Debugging performance bottlenecks, circular dependencies, and token limits.
3. Suggesting clean, reusable code snippets for students and engineers.
4. Writing production-grade code with clear Markdown and syntax-highlighted code blocks.
Whenever you provide code, specify the language in the markdown code fence (e.g. \`\`\`python or \`\`\`typescript).`;

    if (model) {
      // Convert messages to standard core messages format
      const formattedMessages = messages.map((m: any) => ({
        role: m.role as 'user' | 'assistant' | 'system',
        content: m.content as string,
      }));

      const result = streamText({
        model,
        system: systemPrompt,
        messages: formattedMessages,
      });

      return result.toTextStreamResponse();
    }

    // Dynamic fallback when no API key is provided
    const lastMessage = messages[messages.length - 1]?.content || '';
    const qLower = lastMessage.toLowerCase();

    let fallbackResponse = '';

    if (qLower.includes('bug') || qLower.includes('error') || qLower.includes('fail') || qLower.includes('token')) {
      fallbackResponse = `*(Local Intelligence Mode — Add GEMINI_API_KEY to .env for real-time Gemini Flash reasoning)*

I analyzed your query regarding token budget and retrieval execution:

### Diagnostic Analysis
In \`SmartRetriever._fit_to_budget()\`, token estimation calculates length using whitespace heuristics:
\`\`\`python
# Observed heuristic
estimated_tokens = int(len(text.split()) * 1.3)
\`\`\`
This heuristic deviates significantly when analyzing dense syntax, resulting in token overflow against the target budget.

### Recommended Fix
Apply a dynamic safety threshold:
\`\`\`python
SAFETY_FACTOR = 0.92

def _fit_to_budget(self, candidates, max_budget):
    budget_limit = int(max_budget * SAFETY_FACTOR)
    selected = []
    current_tokens = 0
    for c in candidates:
        tokens = self.estimate_tokens(c.get("content", ""))
        if current_tokens + tokens > budget_limit:
            break
        selected.append(c)
        current_tokens += tokens
    return selected
\`\`\`
This prevents budget overruns and ensures deterministic test suites.`;
    } else if (qLower.includes('repositoryanalyzer') || qLower.includes('analyzer')) {
      fallbackResponse = `*(Local Intelligence Mode — Add GEMINI_API_KEY to .env for real-time Gemini Flash reasoning)*

### \`RepositoryAnalyzer\` Architecture
\`RepositoryAnalyzer\` (located in \`src/core/analyzer.py\`) acts as the central coordinator for codebase telemetry:

1. **Configuration Stage**: Ingests repository AST settings and token allocations.
2. **Indexing & Embeddings**: Generates vectorized semantic embeddings for repository files and cached symbols.
3. **Smart Retrieval**: Queries candidate code chunks matching natural language questions.
4. **Insight Detection**: Flags dependency cycles and architectural complexity.

\`\`\`python
class RepositoryAnalyzer:
    def __init__(self, config: AnalysisConfig):
        self.config = config
        self.retriever = SmartRetriever(max_tokens=config.max_context_tokens)
        self._index_cache = {}
\`\`\``;
    } else {
      fallbackResponse = `*(Local Intelligence Mode — Add GEMINI_API_KEY to .env for real-time Gemini Flash reasoning)*

Thank you for your question about **"${lastMessage.slice(0, 60)}..."**!

### Architectural Overview
SnippNXT provides:
- **Repository-Level Code Intelligence**: Live AST inspection, dependency graphs, and test workspace verification.
- **Student Code Snippet Organizer**: Categorized snippets, tags, and coursework folders.
- **Hybrid Semantic Search**: Combines BM25 token matching with vector cosine embeddings.

\`\`\`typescript
// Example snippet integration
import { getSnippets } from '@/app/actions/snippets';

const snippets = await getSnippets({
  tag: 'algorithms',
  favorite: true
});
\`\`\`

Feel free to ask about specific functions, bug tracing, or snippet creation!`;
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const words = fallbackResponse.split(' ');
        for (let i = 0; i < words.length; i++) {
          const chunk = words[i] + (i === words.length - 1 ? '' : ' ');
          controller.enqueue(encoder.encode(chunk));
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
    console.error('Chat API error:', error);
    return new Response('Failed to generate chat response', { status: 500 });
  }
}
