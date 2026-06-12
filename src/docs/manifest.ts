export interface DocTopic {
  slug: string;
  title: string;
  file: string;
}

export interface DocGroup {
  label: string;
  topics: DocTopic[];
}

export interface DocSection {
  id: string;
  label: string;
  /** Flat topic list. Ignored when `groups` is present; use getSectionTopics(). */
  topics: DocTopic[];
  groups?: DocGroup[];
}

export function getSectionTopics(section: DocSection): DocTopic[] {
  if (section.groups) {
    return section.groups.flatMap(g => g.topics);
  }
  return section.topics;
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
      { slug: 'dictionaries',      title: 'Dictionaries',        file: 'language-guide/dictionaries.md' },
      { slug: 'new-keyword',       title: 'The new Keyword',      file: 'language-guide/new-keyword.md' },
      { slug: 'packages',          title: 'Packages',            file: 'language-guide/packages.md' },
    ],
  },
  {
    id: 'api-reference',
    label: 'API Reference',
    topics: [],
    groups: [
      {
        label: 'softGfx',
        topics: [
          { slug: 'gfx',             title: 'gfx',             file: 'api-reference/gfx.md' },
          { slug: 'drawing',         title: 'drawing',         file: 'api-reference/drawing.md' },
          { slug: 'stage',           title: 'stage',           file: 'api-reference/stage.md' },
          { slug: 'pen',             title: 'pen',             file: 'api-reference/pen.md' },
          { slug: 'assetmanager',    title: 'assetmanager',    file: 'api-reference/assetmanager.md' },
          { slug: 'objecttransform', title: 'ObjectTransform', file: 'api-reference/objecttransform.md' },
          { slug: 'sprite',          title: 'sprite',          file: 'api-reference/sprite.md' },
          { slug: 'animatedsprite',  title: 'animatedsprite',  file: 'api-reference/animatedsprite.md' },
          { slug: 'text',            title: 'text',            file: 'api-reference/text.md' },
          { slug: 'tilemap',         title: 'tilemap',         file: 'api-reference/tilemap.md' },
        ],
      },
      {
        label: 'softCore',
        topics: [
          { slug: 'math',   title: 'math',   file: 'api-reference/math.md' },
          { slug: 'string', title: 'string', file: 'api-reference/string.md' },
          { slug: 'array',  title: 'array',  file: 'api-reference/array.md' },
          { slug: 'dict',   title: 'dict',   file: 'api-reference/dict.md' },
        ],
      },
    ],
  },
  {
    id: 'tutorials',
    label: 'Tutorials',
    topics: [
      { slug: 'tutorial-01-hello-world', title: '1. Hello World',       file: 'tutorials/01-hello-world.md' },
      { slug: 'tutorial-02-drawing',     title: '2. Drawing on Screen', file: 'tutorials/02-drawing.md' },
      { slug: 'tutorial-03-sprite',      title: '3. Your First Sprite', file: 'tutorials/03-sprite.md' },
    ],
  },
];
