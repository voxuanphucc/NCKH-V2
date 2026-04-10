
import type { Person, PersonGraph } from './person';

// Re-export for convenience
export type { PersonGraph } from './person';

export interface Family {
  id: string;
  parent1: Person;
  parent2: Person | null;
  fromDate: string | null;
  toDate: string | null;
  children: Person[];
}

export interface FamilyGraph {
  id: string;
  parent1Id: string;
  parent2Id: string | null;
  childrenIds: string[];
}

export interface FamilyInfo {
  person: Person;
  parentFamily: Family | null;
  spouseFamilies: Family[];
}

export interface TreeGraph {
  persons: PersonGraph[];
  families: FamilyGraph[];
  meta: {
    totalPersons: number;
    totalGenerations: number;
    rootPersonId: string;
  };
}