import React from 'react';
import Runner from '../Runner';

type PreviewProps = {
  transpiled: string;
  projectId: string;
};

const Preview: React.FC<PreviewProps> = ({ transpiled, projectId }) => (
  <Runner transpiled={transpiled} projectId={projectId} width="100%" height="100%" />
);

export default Preview;
