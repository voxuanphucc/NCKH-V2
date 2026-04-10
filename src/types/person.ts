import type { Gender } from './common';

export interface Person {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  gender: Gender;
  avatarUrl: string;
  dateOfBirth: string;
  dateOfDeath: string | null;
  citizenIdentificationNumber: string;
  createdAt: string;
  updatedAt: string;
}

export interface PersonGraph {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  gender: Gender;
  avatarUrl: string;
  dateOfBirth: string;
  dateOfDeath: string | null;
  generation: number;
}

export interface CreatePersonRequest {
  firstName: string;
  lastName: string;
  gender: Gender;
  dateOfBirth?: string;
  dateOfDeath?: string;
  citizenIdentificationNumber?: string;
  avatarUrl?: string;
}

export interface CreateSpouseRequest extends CreatePersonRequest {
  fromDate?: string;
  toDate?: string;
}

export interface CreateParentRequest extends CreatePersonRequest {
  fromDate?: string;
  toDate?: string;
}