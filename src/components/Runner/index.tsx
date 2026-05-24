import sbLifecycle from './engine/lifecycle.js?raw';
import sbInput from './engine/input.js?raw';
import sbAssets from './engine/assets.js?raw';
import sbDrawing from './engine/drawing.js?raw';
import sbStage from './engine/stage.js?raw';
import sbSprites from './engine/sprites.js?raw';
import softBasicEngine from './softBasicEngine.js?raw';
import bootstrapper from './bootstrapper.html?raw';

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
            [sbLifecycle, sbInput, sbAssets, sbDrawing, sbStage, sbSprites, softBasicEngine].join('\n')
          )
          .replace('//${transpiled}', transpiled)
          .replace('//${projectId}', `let _sbProjectId = "${projectId}";`)}
      ></iframe>
    </div>
  );
};

export default Runner;
