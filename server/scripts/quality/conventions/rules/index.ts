import { RuleDefinition } from '../types';
import { archRules } from './arch.rules';
import { presRules } from './pres.rules';
import { errRules } from './err.rules';
import { infraRules } from './infra.rules';
import { namingRules } from './naming.rules';

export const ALL_RULES: RuleDefinition[] = [
  ...archRules,
  ...presRules,
  ...errRules,
  ...infraRules,
  ...namingRules,
];

export {
  archRules,
  presRules,
  errRules,
  infraRules,
  namingRules,
};
