import React from 'react';
import sbLifecycle from './engine/lifecycle.js?raw';
import sbInput from './engine/input.js?raw';
import sbAssets from './engine/assets.js?raw';
import sbAudio from './engine/audio.js?raw';
import sbDrawing from './engine/drawing.js?raw';
import sbStage from './engine/stage.js?raw';
import sbSprites from './engine/sprites.js?raw';
import sbAnimatedSprites from './engine/animatedSprite.js?raw';
import sbTilemaps from './engine/tilemap.js?raw';
import sbCollision from './engine/collision.js?raw';
import softBasicEngine from './softBasicEngine.js?raw';
import bootstrapper from './bootstrapper.html?raw';

type RunnerProps = {
  width: string;
  height: string;
  transpiled: string;
  projectId: string;
  assets?: Array<{ name: string; src: string }>;
};

const Runner: React.FC<RunnerProps> = ({
  transpiled,
  projectId,
  width = '100%',
  height = '100%',
  assets,
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
            [sbLifecycle, sbInput, sbAssets, sbAudio, sbDrawing, sbStage, sbSprites, sbAnimatedSprites, sbTilemaps, sbCollision, softBasicEngine].join('\n')
          )
          .replace('//${transpiled}', transpiled)
          .replace('//${projectId}', `let _sbProjectId = "${projectId}";`)
          .replace('//${inlineAssets}', assets?.length
            ? `await _sb.preload(${JSON.stringify(assets)});`
            : '')}
      ></iframe>
    </div>
  );
};

export default Runner;
