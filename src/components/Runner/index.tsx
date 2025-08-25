import softBasicGFX from "./softBasicGFX.js?raw";
import bootstrapper from "./bootstrapper.html?raw";

type RunnerProps = {
  width: string;
  height: string;
  transpiled: string;
};

const Runner: React.FC<RunnerProps> = ({
  transpiled,
  width = "100%",
  height = "100%",
}) => {
  return (
    <div style={{ width: width, height: height }}>
      <iframe
        style={{ width: width, height: height }}
        sandbox="allow-scripts allow-same-origin"
        title="Preview"
        srcDoc={bootstrapper
          .replace("//${softBasicGFX}", softBasicGFX)
          .replace("//${transpiled};", transpiled)}
      ></iframe>
    </div>
  );
};

export default Runner;
