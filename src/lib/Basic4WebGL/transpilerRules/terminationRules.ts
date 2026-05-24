import Symbols from '@CompilerLib/symbols';

export default (table: Symbols): string => {
  const classes = table
    .getAll('Module')
    .map((s) => `{name: "${s.name}", symbol: ${s.name}}`)
    .join(',');

  return `
    _sb._sbClasses = [${classes}];
  `;
};
