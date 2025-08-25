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
  console.log(import.meta.env.BASE_URL);
  return (
    <div style={{ width: width, height: height }}>
      <iframe
        style={{ width: width, height: height }}
        sandbox="allow-scripts"
        title="Preview"
        srcDoc={`<html>
      <head>
        <!-- Make all relative URLs resolve from the app base -->
        <base href="${import.meta.env.BASE_URL}">
      </head>
      <body>
      <script type="text/javascrip">
      const createArrayDim = (sizes, depth) => {
        if (depth === sizes.length - 1)
          return Array.apply(null, new Array(sizes[depth])).map(() => false);
    
        return Array.apply(null, new Array(sizes[depth])).map(() =>
          Array.apply(null, createArrayDim(sizes, depth + 1))
        );
      };
      const createArray = (sizes) => {
        return createArrayDim(sizes, 0);
      };
      </script>
      <script src="https://unpkg.com/pixi.js@6.x/dist/browser/pixi.min.js"></script>
      <script type="text/javascript">
      ${softBasicGFX}
      </script>
      <script type="text/javascript">

      ${transpiled};
      main.entry();
      </script>
      </div>

      </body>
      </html>`}
      ></iframe>
    </div>
  );
};

export default Runner;
