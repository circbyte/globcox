export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  phoneNumber: string;
  isVerified: boolean;
  interests: string[];
  earnings: number;
  savings: number;
  streak: number;
  lastActive: any;
}

export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  location: string;
  category: string;
  photoURL?: string;
  sellerId: string;
  sellerName: string;
  createdAt: any;
  isSold: boolean;
  isDigital: boolean;
  lat?: number;
  lng?: number;
}

export interface Chat {
  id: string;
  participants: string[];
  lastMessage: string;
  updatedAt: any;
  productId: string;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  text: string;
  voiceURL?: string;
  createdAt: any;
}

export interface Review {
  id: string;
  reviewerId: string;
  revieweeId: string;
  rating: number;
  comment: string;
  productId: string;
  createdAt: any;
}

export const CATEGORIES = [
  'Maize', 'Tomatoes', 'Goats', 'Fertilizer', 'Labour', 'Vegetables', 'Livestock', 'Tools', 'Digital (eBooks)', 'Other'
];

export const DISTRICTS = [
  'Lilongwe', 'Blantyre', 'Mzuzu', 'Zomba', 'Mangochi', 'Dedza', 'Kasungu', 'Salima', 'Nkhotakota'
];
