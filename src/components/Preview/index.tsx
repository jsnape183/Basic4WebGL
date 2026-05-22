import { useSelector } from 'react-redux';
import Runner from '../Runner';
import Console from './Console';
import { RootState } from '../../store';
import { useRunnerMessages } from '../../hooks/useRunnerMessages';

type PreviewProps = { transpiled: string; projectId: string; };

const Preview: React.FC<PreviewProps> = ({ transpiled, projectId }) => {
  const logs = useSelector((state: RootState) => state.session.logs);
  useRunnerMessages();

  return (
    <aside className="w-1/2 bg-gray-950 border-l border-gray-700 flex flex-col">
      <div className="flex-1 border-b border-gray-700">
        <Runner transpiled={transpiled} projectId={projectId} width="100%" height="100%" />
      </div>
      <Console logs={logs} />
    </aside>
  );
};

export default Preview;
