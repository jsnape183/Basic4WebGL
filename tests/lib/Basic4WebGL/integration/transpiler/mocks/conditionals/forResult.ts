import { cleanWhitespace } from 'tests/lib/Basic4WebGL/helpers';

export default cleanWhitespace(`class main{}
    for(main.x = 0; main.x <= 9; main.x++){_print("Hello world")
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
