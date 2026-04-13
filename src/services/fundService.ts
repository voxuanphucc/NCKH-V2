import { request } from '../config/axios';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface FundResponse {
    id: string;
    name: string;
    treeId: string;
    treeName: string;
    treeEventId: string;
    treeEventName: string;
    treeEventCreatedAt: string;
    eventId: string;
    eventName: string;
    eventDescription: string;
    eventStartedAt: string;
    eventEndedAt: string;
    eventStatus: number;
}

export interface EventResponse {
    id: string;
    name: string;
    description: string;
    startedAt: string;
    endedAt: string;
    status: number;
    createdBy: string;
    participants: PersonInEvent[];
}

export interface PersonInEvent {
    id: string;
    person: {
        id: string;
        fullName: string;
        firstName: string;
        lastName: string;
        avatarUrl?: string;
    };
    eventType: string;
    eventTypeDescription: string;
    address?: { fullAddress?: string };
    name: string;
}

export interface Tree {
    id: string;
    name: string;
}

// ─── Service ──────────────────────────────────────────────────────────────────
export const fundPageService = {

    // Lấy danh sách gia phả
    getTrees: () =>
        request<Tree[]>('/trees'),

    // Lấy danh sách quỹ theo tree
    getFunds: (treeId: string) =>
        request<FundResponse[]>(`/fund?treeId=${treeId}`),

    // Tạo quỹ mới từ event
    createFund: (treeId: string, eventId: string) =>
        request<FundResponse>(`/fund?treeId=${treeId}&eventId=${eventId}`, {
            method: 'POST',
        }),

    // Xóa quỹ
    deleteFund: (treeId: string, fundId: string) =>
        request<string>(`/fund?fundId=${fundId}&treeId=${treeId}`, {
            method: 'DELETE',
        }),

    // Lấy danh sách sự kiện theo tree
    getEvents: (treeId: string) =>
        request<EventResponse[]>(`/trees/${treeId}/events`),

    // Lấy chi tiết sự kiện
    getEvent: (treeId: string, eventId: string) =>
        request<EventResponse>(`/trees/${treeId}/events/${eventId}`),

    getTransactions: () =>
        request<any>('/sepay/transactions'),
};