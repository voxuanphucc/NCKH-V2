import { request } from '../config/axios';

export interface Album {
    id: string;
    treeId: string;
    name: string;
    description?: string;
    mediaFileSize: number;
}

export interface CreateAlbumRequest {
    name: string;
    description?: string;
}

export const albumService = {
    getAlbums: (treeId: string) =>
        request<Album[]>(`/trees/${treeId}/albums`),

    createAlbum: (treeId: string, data: CreateAlbumRequest) =>
        request<Album>(`/trees/${treeId}/albums`, {
            method: 'POST',
            body: JSON.stringify(data),
        }),

    updateAlbum: (treeId: string, albumId: string, data: CreateAlbumRequest) =>
        request<Album>(`/trees/${treeId}/albums/${albumId}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        }),

    deleteAlbum: (treeId: string, albumId: string) =>
        request<Album>(`/trees/${treeId}/albums/${albumId}`, {
            method: 'DELETE',
        }),
};