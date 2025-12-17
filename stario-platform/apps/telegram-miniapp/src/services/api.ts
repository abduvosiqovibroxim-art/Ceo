/**
 * API Service for Stario Platform - Telegram Mini App
 */

// @ts-ignore - Vite environment variable
const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000';

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
  };

  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'An error occurred' }));
    throw new Error(error.detail || `HTTP error! status: ${response.status}`);
  }

  if (response.status === 204) {
    return null as T;
  }

  return response.json();
}

// Artist Types
export interface Artist {
  id: string;
  name: string;
  description: string | null;
  image: string | null;
  category: string;
  gender: string;
  price: number;
  followers: string;
  is_verified: boolean;
  is_popular: boolean;
  status: string;
  email: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
}

export interface ArtistListResponse {
  items: Artist[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface ArtistFilters {
  category?: string;
  status?: string;
  gender?: string;
  search?: string;
  is_verified?: boolean;
  is_popular?: boolean;
  page?: number;
  page_size?: number;
}

// Artist API Functions
export const artistsApi = {
  getAll: async (filters: ArtistFilters = {}): Promise<ArtistListResponse> => {
    const params = new URLSearchParams();

    if (filters.category) params.append('category', filters.category);
    if (filters.status) params.append('status', filters.status);
    if (filters.gender) params.append('gender', filters.gender);
    if (filters.search) params.append('search', filters.search);
    if (filters.is_verified !== undefined) params.append('is_verified', String(filters.is_verified));
    if (filters.is_popular !== undefined) params.append('is_popular', String(filters.is_popular));
    if (filters.page) params.append('page', String(filters.page));
    if (filters.page_size) params.append('page_size', String(filters.page_size));

    const queryString = params.toString();
    return fetchApi<ArtistListResponse>(`/artists${queryString ? `?${queryString}` : ''}`);
  },

  getById: async (id: string): Promise<Artist> => {
    return fetchApi<Artist>(`/artists/${id}`);
  },
};

export default {
  artists: artistsApi,
};
