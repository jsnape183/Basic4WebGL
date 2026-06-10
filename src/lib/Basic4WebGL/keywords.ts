export const SOFTBASIC_KEYWORDS = [
  // Declarations
  'dim', 'class', 'as',
  'constructor', 'endconstructor', 'endclass',
  // Functions
  'function', 'return', 'endfunction',
  // Control flow
  'if', 'endif',
  'while', 'endwhile',
  'for', 'next', 'to', 'in',
  'do', 'until',
  // Boolean operators
  'and', 'or', 'not',
  // Literals
  'true', 'false',
  // Built-in statements
  'print', 'call',
  // Object-oriented
  'self', 'extends', 'super',
] as const;

export const SOFTBASIC_LIFECYCLE_EVENTS = [
  'onenter',
  'onupdate',
  'onkeydown',
  'onkeyup',
  'onpointerdown',
  'onpointermove',
] as const;
