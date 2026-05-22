import Symbols from '@CompilerLib/symbols';

export default (table: Symbols): string => {
  let classes = '';
  classes = table
    .getAll('Module')
    .map((s) => `{name: "${s.name}", symbol: ${s.name}}`)
    .join(`,`);
  classes = `
      let _sbClasses = [${classes}];
      _SoftBasicGfx.createInstance(_sbClasses);
      
      const _sb_globalOnEnter = async () => {
        await _SoftAssetManager.preloadFromLocalStorage(_sbProjectId);
        _SoftBasicGfx.getInstance().getApp().ticker.add((delta) => _SoftBasicGfx.getInstance()._update(delta));
        _sbClasses.forEach((c) => {
          if(c.symbol.onenter){
             c.symbol.onenter();
          }
        });
      };
    `;

  return classes;
};
