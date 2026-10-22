// Lightweight syntax highlighter with regex tokenizer

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function highlightLine(line: string, lang: string): string {
  const normLang = (lang || '').toLowerCase();
  let result = escapeHtml(line);

  if (normLang === 'python' || normLang === 'py') {
    const keywords = [
      'import', 'from', 'async', 'def', 'class', 'return', 'await',
      'if', 'elif', 'else', 'for', 'while', 'in', 'not', 'and', 'or',
      'self', 'True', 'False', 'None', 'raise', 'with', 'yield', 'as',
      'try', 'except', 'finally', 'pass', 'break', 'continue', 'lambda'
    ];
    // String literals
    result = result.replace(/(&quot;[^&]*?&quot;|&#039;[^&]*?&#039;|&quot;&quot;&quot;[\s\S]*?&quot;&quot;&quot;|&#039;&#039;&#039;[\s\S]*?&#039;&#039;&#039;)/g, '<span style="color:#86EFAC">$1</span>');
    // Comments
    result = result.replace(/(#[^<]*)$/, '<span style="color:#6B7280;font-style:italic">$1</span>');
    // Decorators
    result = result.replace(/(@\w+)/g, '<span style="color:#F9A8D4">$1</span>');
    // Keywords
    keywords.forEach(kw => {
      result = result.replace(new RegExp(`\\b(${kw})\\b`, 'g'), '<span style="color:#C084FC">$1</span>');
    });
    // Function & Class names
    result = result.replace(/(<span[^>]*>def<\/span>) (\w+)/g, '$1 <span style="color:#60A5FA">$2</span>');
    result = result.replace(/(<span[^>]*>class<\/span>) (\w+)/g, '$1 <span style="color:#FBBF24">$2</span>');
    return result;
  }

  if (['javascript', 'js', 'typescript', 'ts', 'jsx', 'tsx'].includes(normLang)) {
    const keywords = [
      'const', 'let', 'var', 'function', 'return', 'async', 'await',
      'if', 'else', 'for', 'while', 'switch', 'case', 'break', 'continue',
      'try', 'catch', 'finally', 'throw', 'new', 'typeof', 'instanceof',
      'import', 'export', 'default', 'from', 'as', 'class', 'extends',
      'interface', 'type', 'enum', 'public', 'private', 'protected', 'readonly',
      'true', 'false', 'null', 'undefined', 'void', 'this', 'super'
    ];
    // Comments (single line)
    result = result.replace(/(\/\/[^<]*)$/, '<span style="color:#6B7280;font-style:italic">$1</span>');
    // Strings
    result = result.replace(/(&quot;[^&]*?&quot;|&#039;[^&]*?&#039;|`[^`]*?`)/g, '<span style="color:#86EFAC">$1</span>');
    // Keywords
    keywords.forEach(kw => {
      result = result.replace(new RegExp(`\\b(${kw})\\b`, 'g'), '<span style="color:#C084FC">$1</span>');
    });
    // Numbers
    result = result.replace(/\b(\d+)\b/g, '<span style="color:#F59E0B">$1</span>');
    // Functions
    result = result.replace(/(\b\w+)(?=\s*\()/g, '<span style="color:#60A5FA">$1</span>');
    return result;
  }

  if (normLang === 'sql') {
    const keywords = [
      'SELECT', 'FROM', 'WHERE', 'INSERT', 'INTO', 'UPDATE', 'DELETE',
      'JOIN', 'LEFT', 'RIGHT', 'INNER', 'OUTER', 'ON', 'GROUP', 'BY',
      'ORDER', 'HAVING', 'LIMIT', 'OFFSET', 'CREATE', 'TABLE', 'ALTER',
      'DROP', 'INDEX', 'PRIMARY', 'KEY', 'FOREIGN', 'REFERENCES', 'AND', 'OR',
      'NOT', 'NULL', 'IS', 'AS', 'COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'VALUES'
    ];
    // Comments
    result = result.replace(/(--[^<]*)$/, '<span style="color:#6B7280;font-style:italic">$1</span>');
    // Strings
    result = result.replace(/(&#039;[^&]*?&#039;)/g, '<span style="color:#86EFAC">$1</span>');
    // Keywords (case-insensitive for SQL)
    keywords.forEach(kw => {
      result = result.replace(new RegExp(`\\b(${kw})\\b`, 'gi'), '<span style="color:#C084FC">$1</span>');
    });
    return result;
  }

  // Generic fallback: numbers and strings
  result = result.replace(/(&quot;[^&]*?&quot;|&#039;[^&]*?&#039;)/g, '<span style="color:#86EFAC">$1</span>');
  return result;
}
