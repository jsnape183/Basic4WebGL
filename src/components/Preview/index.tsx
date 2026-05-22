import { useSelector } from 'react-redux';
import Runner from '../Runner';
import Console from './Console';
import { RootState } from '../../store';

type PreviewProps = { transpiled: string; projectId: string; };

const Preview: React.FC<PreviewProps> = ({ transpiled, projectId }) => {
  const logs = useSelector((state: RootState) => state.session.logs);

  return (
    <>
      <div className="flex-1 border-b border-gray-700">
        <Runner transpiled={transpiled} projectId={projectId} width="100%" height="100%" />
      </div>
      <Console logs={logs} />
    </>
  );
};

export default Preview;
