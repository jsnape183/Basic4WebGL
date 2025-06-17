import { useSelector } from "react-redux";
import Runner from "../Runner";
import Console from "./Console";
import { RootState } from "../../store";

type PreviewProps = {
  transpiled: string;
};

const Preview: React.FC<PreviewProps> = ({ transpiled }) => {
  const logs = useSelector((state: RootState) => state.ui.logs);

  return (
    <aside className="w-1/2 bg-gray-950 border-l border-gray-700 flex flex-col">
      {/* Preview iframe */}
      <div className="flex-1 border-b border-gray-700">
        <Runner transpiled={transpiled} width="100%" height="100%" />
      </div>

      <Console logs={logs} />
    </aside>
  );
};

export default Preview;
