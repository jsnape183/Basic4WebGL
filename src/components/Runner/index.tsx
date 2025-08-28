import softBasicGFX from './softBasicGFX.js?raw';
import bootstrapper from './bootstrapper.html?raw';
import pixiInit from './pixiInit.js?raw';
import assetManager from './assetManager.js?raw';

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
  console.log(transpiled);
  return (
    <div style={{ width: width, height: height }}>
      <iframe
        style={{ width: width, height: height }}
        sandbox="allow-scripts allow-same-origin"
        title="Preview"
        srcDoc={bootstrapper
          .replace('//${assetManager}', assetManager)
          .replace('//${softBasicGFX}', softBasicGFX)
          .replace('//${transpiled}', transpiled)
          .replace('//${projectId}', `let _sbProjectId = "${projectId}";`)
          .replace('//${pixiInit}', pixiInit)}
      ></iframe>
    </div>
  );
};

export default Runner;
