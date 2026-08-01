// src/monacoHelpers/scopeScanner.ts

/**
 * Textually walks the live buffer up to (line, col) tracking `function`/
 * `endfunction` and `constructor`/`endconstructor` nesting. Deliberately does
 * NOT track `if`/`for`/`while`/`do` — block-level scoping is out of scope
 * (see `docs/roadmap.md`'s parking lot); a `dim` inside a block is visible to
 * the whole enclosing function, matching the compiler's own scope handling.
 *
 * Independent of the compiler/symbol snapshot on purpose: it reads the buffer
 * as currently typed, so it stays correct even while the buffer doesn't
 * compile (unlike the snapshot, which only advances on a clean compile).
 */
export function scanEnclosingScope(text: string, cursorLine: number, cursorCol: number): string[] {
  const stack: string[] = [];
  const lines = text.split('\n');

  for (let i = 0; i < cursorLine; i++) {
    const line = i === cursorLine - 1 ? lines[i].slice(0, cursorCol - 1) : lines[i];

    const fn = /^\s*function\s+(\w+)\s*\(/i.exec(line);
    if (fn) {
      stack.push(fn[1].toLowerCase());
      continue;
    }
    if (/^\s*endfunction\b/i.test(line)) {
      if (stack.at(-1) !== 'constructor') stack.pop();
      continue;
    }
    if (/^\s*constructor\s*\(/i.test(line)) {
      stack.push('constructor');
      continue;
    }
    if (/^\s*endconstructor\b/i.test(line)) {
      if (stack.at(-1) === 'constructor') stack.pop();
      continue;
    }
  }
  return stack; // innermost last; [] at file top level
}
