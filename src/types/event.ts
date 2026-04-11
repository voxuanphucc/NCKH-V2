import type { Person } from './person';
import type { Address } from './address';

export interface EventParticipant {
  id: string;
  person: Person;
  eventType: string;
  eventTypeDescription: string;
  address: Address | null;
  name: string;
}

export interface TreeEvent {
  id: string;
  name: string;
  description: string;
  startedAt: string;
  endedAt?: string;
  status: number;
  createdBy: string;
  participants: EventParticipant[];
}

export interface CreateEventRequest {
  event: {
    name: string;
    description: string;
    startedAt: string;
    endedAt?: string;
  };
  treeEvent: {
    addressId?: string;
    name: string;
  };
}

export interface AddPersonToEventRequest {
  personId: string;
  eventTypeId: string;
  addressId?: string;
  name: string;
}