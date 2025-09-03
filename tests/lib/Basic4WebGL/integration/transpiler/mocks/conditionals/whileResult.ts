import { cleanWhitespace } from '../../../../helpers';

export default cleanWhitespace(`class main{}
    while(1==2){_print("Hello world")
      };

      let _sbClasses = [{name: "main", symbol: main}];
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
