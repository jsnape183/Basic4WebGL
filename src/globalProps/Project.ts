export type ProjectFileProps = {
  name: string;
  source: string;
};

export type ProjectProps = {
  lib: ProjectFileProps[];
  files: ProjectFileProps;
};
