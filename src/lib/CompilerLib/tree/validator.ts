import { Tree } from '.';
import IValidatable from './IValidatable';

const validateTree = (node: Tree) => {
  if ('validate' in node && typeof node.validate === 'function') {
    (node as IValidatable).validate();
  }
  node.children.forEach((child) => {
    validateTree(child);
  });
};

export default validateTree;
