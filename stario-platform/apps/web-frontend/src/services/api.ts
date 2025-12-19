/**
 * API Service for Stario Platform
 */

// @ts-ignore - Vite environment variable
const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000';

// Mock data for when backend is unavailable - using real celebrity photos
const MOCK_ARTISTS: Artist[] = [
  { id: '1', name: 'Шахзода', description: 'Популярная узбекская певица', image: '/celebrities/shahzoda.jpg', category: 'Pop', gender: 'female', price: 500000, followers: '2.5M', is_verified: true, is_popular: true, status: 'active', email: null, phone: null, created_at: '', updated_at: '' },
  { id: '2', name: 'Юлдуз Усмонова', description: 'Легенда узбекской эстрады', image: '/celebrities/yulduz_usmonova.jpg', category: 'Traditional', gender: 'female', price: 800000, followers: '3.2M', is_verified: true, is_popular: true, status: 'active', email: null, phone: null, created_at: '', updated_at: '' },
  { id: '3', name: 'Шохруххон', description: 'Звезда узбекской поп-музыки', image: '/celebrities/shohruhxon.jpg', category: 'Pop', gender: 'male', price: 600000, followers: '2.1M', is_verified: true, is_popular: true, status: 'active', email: null, phone: null, created_at: '', updated_at: '' },
  { id: '4', name: 'Озода Нурсаидова', description: 'Талантливая певица нового поколения', image: '/celebrities/ozoda_nursaidova.jpg', category: 'Pop', gender: 'female', price: 400000, followers: '1.5M', is_verified: true, is_popular: true, status: 'active', email: null, phone: null, created_at: '', updated_at: '' },
  { id: '5', name: 'Севара Назархан', description: 'Всемирно известная певица', image: '/celebrities/sevara_nazarkhan.jpg', category: 'Traditional', gender: 'female', price: 750000, followers: '2.8M', is_verified: true, is_popular: true, status: 'active', email: null, phone: null, created_at: '', updated_at: '' },
  { id: '6', name: 'Райхон', description: 'Популярная узбекская певица', image: '/celebrities/rayhon.jpg', category: 'Pop', gender: 'female', price: 550000, followers: '1.9M', is_verified: true, is_popular: true, status: 'active', email: null, phone: null, created_at: '', updated_at: '' },
  { id: '7', name: 'Лола Юлдашева', description: 'Звезда узбекского шоу-бизнеса', image: '/celebrities/lola_yuldasheva.jpg', category: 'Pop', gender: 'female', price: 520000, followers: '1.7M', is_verified: true, is_popular: true, status: 'active', email: null, phone: null, created_at: '', updated_at: '' },
];

// Set to true to use mock data immediately (when backend is not running)
let USE_MOCK_DATA = false;

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  // If we already know backend is down, use mock immediately
  if (USE_MOCK_DATA) {
    return getMockResponse<T>(endpoint);
  }

  const url = `${API_BASE_URL}${endpoint}`;

  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3s timeout

    const response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'An error occurred' }));
      throw new Error(error.detail || `HTTP error! status: ${response.status}`);
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return null as T;
    }

    return response.json();
  } catch (error) {
    console.error('API error:', error);
    throw error;
  }
}

function getMockResponse<T>(endpoint: string): T {
  // Parse endpoint to return appropriate mock data
  if (endpoint.startsWith('/artists')) {
    // Handle /artists/stats
    if (endpoint === '/artists/stats') {
      const stats: ArtistStats = {
        total: MOCK_ARTISTS.length,
        active: MOCK_ARTISTS.length,
        pending: 0,
        suspended: 0,
        verified: MOCK_ARTISTS.filter(a => a.is_verified).length,
        popular: MOCK_ARTISTS.filter(a => a.is_popular).length,
      };
      return stats as T;
    }

    // Handle /artists/:id
    const idMatch = endpoint.match(/\/artists\/([^/?]+)/);
    if (idMatch && idMatch[1] !== 'stats') {
      const artist = MOCK_ARTISTS.find(a => a.id === idMatch[1]);
      if (artist) return artist as T;
    }

    // Handle /artists or /artists?...
    if (endpoint === '/artists' || endpoint.startsWith('/artists?')) {
      let filteredArtists = [...MOCK_ARTISTS];

      // Parse query params for filtering
      const urlParams = new URLSearchParams(endpoint.split('?')[1] || '');
      const isPopular = urlParams.get('is_popular');
      const category = urlParams.get('category');
      const search = urlParams.get('search');

      if (isPopular === 'true') {
        filteredArtists = filteredArtists.filter(a => a.is_popular);
      }
      if (category) {
        filteredArtists = filteredArtists.filter(a => a.category.toLowerCase() === category.toLowerCase());
      }
      if (search) {
        filteredArtists = filteredArtists.filter(a =>
          a.name.toLowerCase().includes(search.toLowerCase())
        );
      }

      const response: ArtistListResponse = {
        items: filteredArtists,
        total: filteredArtists.length,
        page: 1,
        page_size: 10,
        total_pages: 1,
      };
      return response as T;
    }
  }

  throw new Error('Mock data not available for this endpoint');
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

export interface ArtistStats {
  total: number;
  active: number;
  pending: number;
  suspended: number;
  verified: number;
  popular: number;
}

export interface ArtistCreate {
  name: string;
  description?: string;
  image?: string;
  category?: string;
  gender?: string;
  price?: number;
  followers?: string;
  is_verified?: boolean;
  is_popular?: boolean;
  status?: string;
  email?: string;
  phone?: string;
}

export interface ArtistUpdate {
  name?: string;
  description?: string;
  image?: string;
  category?: string;
  gender?: string;
  price?: number;
  followers?: string;
  is_verified?: boolean;
  is_popular?: boolean;
  status?: string;
  email?: string;
  phone?: string;
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
  /**
   * Get artist statistics
   */
  getStats: async (): Promise<ArtistStats> => {
    return fetchApi<ArtistStats>('/artists/stats');
  },

  /**
   * Get all artists with optional filtering
   */
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

  /**
   * Get artist by ID
   */
  getById: async (id: string): Promise<Artist> => {
    return fetchApi<Artist>(`/artists/${id}`);
  },

  /**
   * Create a new artist
   */
  create: async (data: ArtistCreate): Promise<Artist> => {
    return fetchApi<Artist>('/artists', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Update an existing artist
   */
  update: async (id: string, data: ArtistUpdate): Promise<Artist> => {
    return fetchApi<Artist>(`/artists/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * Delete an artist
   */
  delete: async (id: string): Promise<void> => {
    return fetchApi<void>(`/artists/${id}`, {
      method: 'DELETE',
    });
  },

  /**
   * Toggle artist verification status
   */
  toggleVerification: async (id: string, isVerified: boolean): Promise<Artist> => {
    return fetchApi<Artist>(`/artists/${id}/verify?is_verified=${isVerified}`, {
      method: 'PATCH',
    });
  },

  /**
   * Toggle artist popular status
   */
  togglePopular: async (id: string, isPopular: boolean): Promise<Artist> => {
    return fetchApi<Artist>(`/artists/${id}/popular?is_popular=${isPopular}`, {
      method: 'PATCH',
    });
  },

  /**
   * Update artist status
   */
  updateStatus: async (id: string, status: string): Promise<Artist> => {
    return fetchApi<Artist>(`/artists/${id}/status?new_status=${status}`, {
      method: 'PATCH',
    });
  },

  /**
   * Seed initial artists data
   */
  seed: async (): Promise<{ message: string; created: number }> => {
    return fetchApi<{ message: string; created: number }>('/artists/seed', {
      method: 'POST',
    });
  },
};

// Face Similarity Types
export interface FaceCompareResult {
  artist_id: string;
  similarity_score: number;
}

export interface FaceCompareResponse {
  results: FaceCompareResult[];
  best_match_artist_id: string;
  best_match_score: number;
  processing_time_ms: number;
}

export interface FaceSingleCompareResponse {
  similarity_score: number;
  matching_features: string[];
  face_detected: boolean;
  processing_time_ms: number;
}

// Face Similarity API
export const faceApi = {
  /**
   * Compare user's face with multiple celebrities
   */
  compareBatch: async (userImageBase64: string, celebrityIds: string[]): Promise<FaceCompareResponse> => {
    // Upload image first and get URL
    const formData = new FormData();

    // Convert base64 to blob
    const base64Data = userImageBase64.split(',')[1];
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'image/jpeg' });

    formData.append('file', blob, 'user_photo.jpg');
    formData.append('celebrity_ids', JSON.stringify(celebrityIds));

    const response = await fetch(`${API_BASE_URL}/face/compare/batch`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Face comparison failed');
    }

    return response.json();
  },

  /**
   * Compare user's face with a single celebrity
   */
  compareSingle: async (userImageUrl: string, artistImageUrl: string, artistId: string): Promise<FaceSingleCompareResponse> => {
    return fetchApi<FaceSingleCompareResponse>('/face/compare', {
      method: 'POST',
      body: JSON.stringify({
        user_image_url: userImageUrl,
        artist_image_url: artistImageUrl,
        artist_id: artistId,
      }),
    });
  },
};

export default {
  artists: artistsApi,
  face: faceApi,
};
