import './autoload'; // pulls in every rule file
import symbolRules, { isMatchingType } from './symbolRules';
import nodeTypes from '../nodeTypes';
import terminationRules from './terminationRules';

console.log('in transpiler rule');

export default {
  nodeTypes,
  symbolRules,
  isMatchingType,
  terminationRules,
};
