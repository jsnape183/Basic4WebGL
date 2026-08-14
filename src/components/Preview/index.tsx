import React from 'react';
import Runner from '../Runner';

type PreviewProps = {
  transpiled: string;
  projectId: string;
};

const Preview = React.forwardRef<HTMLIFrameElement, PreviewProps>(({ transpiled, projectId }, ref) => (
  <Runner ref={ref} transpiled={transpiled} projectId={projectId} width="100%" height="100%" />
));

Preview.displayName = 'Preview';

export default Preview;
