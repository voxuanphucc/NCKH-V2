import type { TreeRole, MemberStatus } from './common';
import type { Person } from './person';

export interface Tree {
  id: string;
  name: string;
  description: string;
  myRole: TreeRole;
  totalMembers: number;
  totalPersons: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTreeRequest {
  name: string;
  description: string;
}

export interface TreeMember {
  id: string;
  userId: string;
  userName: string;
  fullName: string;
  avatarUrl: string;
  role: TreeRole;
  status: MemberStatus;
  joinedAt: string;
}

export interface TreeGraph {
  persons: Person[];
  families?: any[];
  meta?: any;
}

export interface RelationshipPersonNode {
  id: string;
  fullName: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  gender: number; // 1=MALE, 2=FEMALE
  relation: string | null;
}

export interface RelationshipData {
  fromPerson: RelationshipPersonNode;
  toPerson: RelationshipPersonNode;
  relationshipFromA: string;
  relationshipFromB: string;
  generationDiff: number;
  path: RelationshipPersonNode[];
}