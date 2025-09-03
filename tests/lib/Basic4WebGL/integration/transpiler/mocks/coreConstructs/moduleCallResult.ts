import { cleanWhitespace } from '../../../../helpers';

export default cleanWhitespace(`class talk{}
    talk.sayhello = () => {
        _print("Hello, World!")

      ;};
class main{}
    main.onenter = () => {
        talk.sayhello();

      ;};;

      let _sbClasses = [{name: "talk", symbol: talk},{name: "main", symbol: main}];
      _SoftBasicGfx.createInstance(_sbClasses);

      const _sb_globalOnEnter = async () => {
        await _SoftAssetManager.preloadFromLocalStorage(_sbProjectId);
        _SoftBasicGfx.getInstance().getApp().ticker.add((delta) => _SoftBasicGfx.getInstance()._update(delta));        
        _sbClasses.forEach((c) => {
          if(c.symbol.onentry){
             c.symbol.onentry();
          }
        });
      };`);
