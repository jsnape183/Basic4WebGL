export interface DocTopic {
  slug: string;
  title: string;
  file: string;
}

export interface DocSection {
  id: string;
  label: string;
  topics: DocTopic[];
}

export const docsManifest: DocSection[] = [
  {
    id: 'language-guide',
    label: 'Language Guide',
    topics: [
      { slug: 'modules',           title: 'Modules',             file: 'language-guide/modules.md' },
      { slug: 'classes',           title: 'Classes',             file: 'language-guide/classes.md' },
      { slug: 'self',              title: 'self.',               file: 'language-guide/self.md' },
      { slug: 'variable-scoping',  title: 'Variable Scoping',    file: 'language-guide/variable-scoping.md' },
      { slug: 'functions',         title: 'Functions',           file: 'language-guide/functions.md' },
      { slug: 'lifecycle',         title: 'Lifecycle Functions', file: 'language-guide/lifecycle.md' },
      { slug: 'constructors',      title: 'Constructors',        file: 'language-guide/constructors.md' },
      { slug: 'inheritance',       title: 'Inheritance',         file: 'language-guide/inheritance.md' },
      { slug: 'multi-file',        title: 'Multi-file Projects', file: 'language-guide/multi-file.md' },
      { slug: 'class-composition', title: 'Class Composition',   file: 'language-guide/class-composition.md' },
      { slug: 'control-flow',      title: 'Control Flow',        file: 'language-guide/control-flow.md' },
      { slug: 'operators',         title: 'Operators',           file: 'language-guide/operators.md' },
      { slug: 'arrays',            title: 'Arrays',              file: 'language-guide/arrays.md' },
      { slug: 'packages',          title: 'Packages',            file: 'language-guide/packages.md' },
    ],
  },
  {
    id: 'api-reference',
    label: 'API Reference',
    topics: [],
  },
  {
    id: 'tutorials',
    label: 'Tutorials',
    topics: [],
  },
];
