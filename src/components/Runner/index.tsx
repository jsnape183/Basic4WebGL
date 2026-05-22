import softBasicGFX from './softBasicGFX.js?raw';
import softAssetManager from './softAssetManager.js?raw';
import softSpriteManager from './softSpriteManager.js?raw';
import bootstrapper from './bootstrapper.html?raw';
import pixiInit from './pixiInit.js?raw';

type RunnerProps = {
  width: string;
  height: string;
  transpiled: string;
  projectId: string;
};

const Runner: React.FC<RunnerProps> = ({
  transpiled,
  projectId,
  width = '100%',
  height = '100%',
}) => {
  return (
    <div style={{ width: width, height: height }}>
      <iframe
        style={{ width: width, height: height }}
        sandbox="allow-scripts allow-same-origin"
        title="Preview"
        srcDoc={bootstrapper
          .replace(
            '//${softBasicGFX}',
            `${softBasicGFX}
          ${softAssetManager}
          ${softSpriteManager}`
          )
          .replace('//${transpiled}', transpiled)
          .replace('//${projectId}', `let _sbProjectId = "${projectId}";`)
          .replace('//${pixiInit}', pixiInit)}
      ></iframe>
    </div>
  );
};

export default Runner;
