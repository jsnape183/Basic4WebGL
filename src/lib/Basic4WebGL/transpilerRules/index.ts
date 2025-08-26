import transpilerRules from "./transpilerRules";
import symbolRules, { isMatchingType } from "./symbolRules";
import nodeTypes from "../nodeTypes";
import terminationRules from "./terminationRules";

export default {
  nodeTypes,
  transpilerRules,
  symbolRules,
  isMatchingType,
  terminationRules,
};
