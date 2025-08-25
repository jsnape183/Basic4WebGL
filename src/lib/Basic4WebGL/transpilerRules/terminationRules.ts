import Symbols from "../../symbols";

export default (table: Symbols): string => {
  let classes = "";
  classes = table
    .getAll("Module")
    .map((s) => `{name: "${s.name}", symbol: ${s.name}}`)
    .join(`,`);
  classes = `let _sbClasses = [${classes}];
      _sb = new _softBasicGfx(_sbClasses);
      _sb.getApp().ticker.add((delta) => _sb._update(delta));
      _sbClasses.forEach((c) => {
        if(c.symbol.onentry){
          c.symbol.onentry();
        }
      })
    `;

  return classes;
};
