// Artists data - This file stores all artist information
// Add new artists here and they will persist across the application

export interface Artist {
  id: string;
  name: string;
  stageName: string;
  category: string;
  status: 'approved' | 'pending' | 'rejected';
  totalVideos: number;
  totalOrders: number;
  rating: number;
  avatar: string;
}

export const artists: Artist[] = [
  {
    id: 'art_001',
    name: 'Lola Yuldasheva',
    stageName: 'Lola',
    category: 'singer',
    status: 'approved',
    totalVideos: 2000,
    totalOrders: 4500,
    rating: 4.9,
    avatar: '/celebrities/lola_yuldasheva.jpg',
  },
  {
    id: 'art_002',
    name: 'Shahzoda',
    stageName: 'Shahzoda',
    category: 'singer',
    status: 'approved',
    totalVideos: 1800,
    totalOrders: 3500,
    rating: 4.8,
    avatar: '/celebrities/shahzoda.jpg',
  },
  {
    id: 'art_003',
    name: 'Sevara Nazarkhan',
    stageName: 'Sevara',
    category: 'singer',
    status: 'approved',
    totalVideos: 1500,
    totalOrders: 2800,
    rating: 4.7,
    avatar: '/celebrities/sevara_nazarkhan.jpg',
  },
  {
    id: 'art_004',
    name: 'Yulduz Usmonova',
    stageName: 'Yulduz',
    category: 'singer',
    status: 'approved',
    totalVideos: 2200,
    totalOrders: 5000,
    rating: 4.9,
    avatar: '/celebrities/yulduz_usmonova.jpg',
  },
];
