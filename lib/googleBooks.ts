export interface GoogleBook {
  id: string;
  title: string;
  author: string;
  cover: string;
  description: string;
}

const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_BOOKS_API_KEY;
const BASE_URL = 'https://www.googleapis.com/books/v1/volumes';

const MOCK_BOOKS: GoogleBook[] = [
  {
    id: 'mock_atomic',
    title: 'Atomic Habits',
    author: 'James Clear',
    cover: 'https://books.google.com/books/publisher/content/images/frontcover/fFCjDQAAQBAJ?fife=w400-h600&source=gbs_api',
    description: 'No matter your goals, Atomic Habits offers a proven framework for improving--every day.',
  },
  {
    id: 'mock_dune',
    title: 'Dune',
    author: 'Frank Herbert',
    cover: 'https://books.google.com/books/content?id=B1hSG45JCX4C&printsec=frontcover&img=1&zoom=2&edge=curl&source=gbs_api',
    description: 'Set on the desert planet Arrakis, Dune is the story of the boy Paul Atreides...',
  },
  {
    id: 'mock_project_hail_mary',
    title: 'Project Hail Mary',
    author: 'Andy Weir',
    cover: 'https://books.google.com/books/content?id=7m__DwAAQBAJ&printsec=frontcover&img=1&zoom=2&edge=curl&source=gbs_api',
    description: 'A lone astronaut must save the earth from disaster in this incredible new thriller.',
  }
];

export async function searchBooks(query: string, maxResults = 20): Promise<GoogleBook[]> {
  if (!query.trim()) return [];

  const params = new URLSearchParams({
    q: query,
    maxResults: String(maxResults),
    printType: 'books',
    langRestrict: 'en',
    ...(API_KEY ? { key: API_KEY } : {}),
  });

  const res = await fetch(`${BASE_URL}?${params.toString()}`);
  
  if (res.status === 429) {
    console.warn('Google Books Rate Limited. Serving mock data.');
    return MOCK_BOOKS.filter(b => b.title.toLowerCase().includes(query.toLowerCase()) || query.toLowerCase().includes('a'));
  }
  
  if (!res.ok) throw new Error(`Google Books API error: ${res.status}`);

  const data = await res.json();
  if (!data.items) return [];

  return data.items.map((item: any): GoogleBook => ({
    id: item.id,
    title: item.volumeInfo?.title ?? 'Unknown Title',
    author: item.volumeInfo?.authors?.[0] ?? 'Unknown Author',
    cover: getBestCover(item),
    description: item.volumeInfo?.description ?? '',
  }));
}

export async function getBook(bookId: string): Promise<GoogleBook | null> {
  const params = new URLSearchParams({
    ...(API_KEY ? { key: API_KEY } : {}),
  });
  const res = await fetch(`${BASE_URL}/${bookId}?${params.toString()}`);
  
  if (res.status === 429 || !res.ok) {
    const mock = MOCK_BOOKS.find(b => b.id === bookId);
    if (mock) return mock;
    return null;
  }

  const item = await res.json();

  return {
    id: item.id,
    title: item.volumeInfo?.title ?? 'Unknown Title',
    author: item.volumeInfo?.authors?.[0] ?? 'Unknown Author',
    cover: getBestCover(item),
    description: item.volumeInfo?.description ?? '',
  };
}

function getBestCover(item: any): string {
  const imageLinks = item.volumeInfo?.imageLinks;
  if (!imageLinks) return '';
  const url =
    imageLinks.extraLarge ||
    imageLinks.large ||
    imageLinks.medium ||
    imageLinks.thumbnail ||
    imageLinks.smallThumbnail ||
    '';
  // Force HTTPS and higher res
  return url.replace('http://', 'https://').replace('&zoom=1', '&zoom=2');
}
