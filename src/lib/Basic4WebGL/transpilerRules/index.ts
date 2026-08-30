import './autoload'; // pulls in every rule file
import symbolRules, { isMatchingType } from './symbolRules';
import nodeTypes from '../nodeTypes';
import terminationRules from './terminationRules';
import constantRules from './constantRules';

export default {
  nodeTypes,
  symbolRules,
  isMatchingType,
  terminationRules,
  constantRules,
};
