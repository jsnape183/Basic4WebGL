// transpilerRules/autoload.ts
export {}; // ensure this stays a module

const modules = import.meta.glob(
  [
    './definitions/**/*.ts', // recursive: picks up subfolders too
    '!./index.ts', // exclude the barrel if needed
    '!./autoload.ts', // exclude this file
  ],
  { eager: true }
);

//console.log('[autoload] imported:', Object.keys(modules));

// Optional: if you have an index.ts in this folder and don’t want to import it:
delete (modules as Record<string, unknown>)['./index.ts'];
