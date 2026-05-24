import Symbols from '@CompilerLib/symbols';

export default (table: Symbols): string => {
  let classes = '';
  classes = table
    .getAll('Module')
    .map((s) => `{name: "${s.name}", symbol: ${s.name}}`)
    .join(`,`);
  classes = `
    let _sbClasses = [${classes}];
    _sb._sbClasses = _sbClasses;

    const _sb_globalOnEnter = async () => {
      await _sb.preloadFromLocalStorage(_sbProjectId);
      _sbClasses.forEach((c) => {
        if (c.symbol.onenter) {
          c.symbol.onenter();
        }
      });
    };
  `;

  return classes;
};
