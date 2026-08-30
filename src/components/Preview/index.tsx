import React from 'react';
import Runner from '../Runner';

type PreviewProps = {
  transpiled: string;
  projectId: string;
  assets?: Array<{ name: string; src: string }>;
};

const Preview = React.forwardRef<HTMLIFrameElement, PreviewProps>(({ transpiled, projectId, assets }, ref) => (
  <Runner ref={ref} transpiled={transpiled} projectId={projectId} width="100%" height="100%" assets={assets} />
));

Preview.displayName = 'Preview';

export default Preview;
