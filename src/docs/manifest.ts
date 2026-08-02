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
      { slug: 'datatypes',         title: 'Data Types',          file: 'language-guide/datatypes.md' },
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
          { slug: 'input',           title: 'input',           file: 'api-reference/input.md' },
          { slug: 'drawing',         title: 'drawing',         file: 'api-reference/drawing.md' },
          { slug: 'stage',           title: 'stage (deprecated)', file: 'api-reference/stage.md' },
          { slug: 'world',           title: 'world',           file: 'api-reference/world.md' },
          { slug: 'hud',             title: 'hud',             file: 'api-reference/hud.md' },
          { slug: 'camera',          title: 'camera',          file: 'api-reference/camera.md' },
          { slug: 'pen',             title: 'pen',             file: 'api-reference/pen.md' },
          { slug: 'assetmanager',    title: 'assetmanager',    file: 'api-reference/assetmanager.md' },
          { slug: 'objecttransform', title: 'ObjectTransform', file: 'api-reference/objecttransform.md' },
          { slug: 'sprite',          title: 'sprite',          file: 'api-reference/sprite.md' },
          { slug: 'animatedsprite',  title: 'animatedsprite',  file: 'api-reference/animatedsprite.md' },
          { slug: 'text',            title: 'text',            file: 'api-reference/text.md' },
          { slug: 'tilemap',         title: 'tilemap',         file: 'api-reference/tilemap.md' },
          { slug: 'audio',           title: 'audio',           file: 'api-reference/audio.md' },
          { slug: 'collision',       title: 'collision',       file: 'api-reference/collision.md' },
          { slug: 'scene',           title: 'scene / scenemanager', file: 'api-reference/scene.md' },
        ],
      },
      {
        label: 'softCore',
        topics: [
          { slug: 'math',   title: 'math',   file: 'api-reference/math.md' },
          { slug: 'string', title: 'string', file: 'api-reference/string.md' },
          { slug: 'array',  title: 'array',  file: 'api-reference/array.md' },
          { slug: 'dict',   title: 'dict',   file: 'api-reference/dict.md' },
          { slug: 'file',   title: 'file',   file: 'api-reference/file.md' },
          { slug: 'save',   title: 'save',   file: 'api-reference/save.md' },
        ],
      },
    ],
  },
  {
    id: 'tutorials',
    label: 'Tutorials',
    topics: [],
    groups: [
      {
        label: 'Making your first game',
        topics: [
          { slug: 'tutorial-01-hello-world', title: '1. Hello World',        file: 'tutorials/01-hello-world.md' },
          { slug: 'tutorial-02-drawing',     title: '2. Drawing on Screen',  file: 'tutorials/02-drawing.md' },
          { slug: 'tutorial-03-sprite',      title: '3. Your First Sprite',  file: 'tutorials/03-sprite.md' },
          { slug: 'tutorial-04-motion',      title: '4. Making Things Move', file: 'tutorials/04-motion.md' },
          { slug: 'tutorial-05-keyboard',    title: '5. Keyboard Control',   file: 'tutorials/05-keyboard.md' },
          { slug: 'tutorial-06-bounds',      title: '6. Staying on Screen',  file: 'tutorials/06-bounds.md' },
          { slug: 'tutorial-07-score',       title: '7. Score and Text',      file: 'tutorials/07-score.md' },
          { slug: 'tutorial-08-functions',   title: '8. Functions',           file: 'tutorials/08-functions.md' },
          { slug: 'tutorial-09-enemies',     title: '9. Multiple Enemies',    file: 'tutorials/09-enemies.md' },
          { slug: 'tutorial-10-classes',     title: '10. How Classes Work',   file: 'tutorials/10-classes.md' },
          { slug: 'tutorial-11-dodge',       title: '11. Dodge!',             file: 'tutorials/11-dodge.md' },
          { slug: 'tutorial-12-sound',       title: '12. Sound Effects and Music', file: 'tutorials/12-sound.md' },
        ],
      },
      {
        label: 'Advanced concepts',
        topics: [
          { slug: 'tutorial-13-scenes',            title: '13. Scenes, World, and HUD', file: 'tutorials/13-scenes.md' },
          { slug: 'tutorial-14-camera',            title: '14. Camera and Scrolling',   file: 'tutorials/14-camera.md' },
          { slug: 'tutorial-15-animated-sprites',  title: '15. Animated Sprites',       file: 'tutorials/15-animated-sprites.md' },
        ],
      },
      {
        label: 'Demos',
        topics: [
          { slug: 'raycaster', title: 'Wolfenstein-Style Raycaster', file: 'demos/raycaster.md' },
        ],
      },
    ],
  },
  {
    id: 'release-notes',
    label: 'Release Notes',
    topics: [
      { slug: 'release-notes', title: 'Release Notes', file: 'release-notes.md' },
    ],
  },
  {
    id: 'roadmap',
    label: 'Roadmap',
    topics: [
      { slug: 'roadmap', title: 'Where we\'re heading', file: 'roadmap.md' },
    ],
  },
];
