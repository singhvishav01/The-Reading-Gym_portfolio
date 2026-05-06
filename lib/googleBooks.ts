export interface GoogleBook {
  id: string;
  title: string;
  author: string;
  cover: string;
  description: string;
  publishYear?: string;
  subjects?: string[];
  olRating?: number;    // Open Library community rating (0–5)
  olRatingCount?: number;
}

const MOCK_BOOKS: GoogleBook[] = [
  {
    id: 'mock_atomic',
    title: 'Atomic Habits',
    author: 'James Clear',
    cover: 'https://books.google.com/books/publisher/content/images/frontcover/fFCjDQAAQBAJ?fife=w400-h600&source=gbs_api',
    description: 'No matter your goals, Atomic Habits offers a proven framework for improving—every day.',
    publishYear: '2018',
    subjects: ['Self-help', 'Productivity', 'Psychology'],
  },
  {
    id: 'mock_dune',
    title: 'Dune',
    author: 'Frank Herbert',
    cover: 'https://books.google.com/books/content?id=B1hSG45JCX4C&printsec=frontcover&img=1&zoom=2&edge=curl&source=gbs_api',
    description: 'Set on the desert planet Arrakis, Dune is the story of the boy Paul Atreides and the House that betrays his family.',
    publishYear: '1965',
    subjects: ['Science Fiction', 'Epic', 'Classic'],
  },
  {
    id: 'mock_project_hail_mary',
    title: 'Project Hail Mary',
    author: 'Andy Weir',
    cover: 'https://books.google.com/books/content?id=7m__DwAAQBAJ&printsec=frontcover&img=1&zoom=2&edge=curl&source=gbs_api',
    description: 'A lone astronaut must save the earth from disaster in this incredible new thriller from the author of The Martian.',
    publishYear: '2021',
    subjects: ['Science Fiction', 'Thriller', 'Space'],
  },
];

export async function searchBooks(query: string, maxResults = 20): Promise<GoogleBook[]> {
  if (!query.trim()) return [];

  const params = new URLSearchParams({ q: query, limit: String(maxResults) });

  try {
    const res = await fetch(`https://openlibrary.org/search.json?${params.toString()}`);
    if (!res.ok) return [];

    const data = await res.json();
    if (!data.docs) return [];

    return data.docs
      .map((item: any): GoogleBook => {
        const id = item.key ? item.key.replace('/works/', '') : '';
        const cover = item.cover_i
          ? `https://covers.openlibrary.org/b/id/${item.cover_i}-L.jpg`
          : '';
        return {
          id,
          title: item.title ?? 'Unknown Title',
          author: item.author_name?.[0] ?? 'Unknown Author',
          cover,
          description: 'Tap to view details.',
          publishYear: item.first_publish_year ? String(item.first_publish_year) : undefined,
          subjects: item.subject?.slice(0, 5),
        };
      })
      .filter((b: GoogleBook) => b.id !== '');
  } catch (error) {
    console.warn('Open Library search error:', error);
    return [];
  }
}

export async function getBook(bookId: string): Promise<GoogleBook | null> {
  if (bookId.startsWith('mock_')) {
    return MOCK_BOOKS.find((b) => b.id === bookId) ?? null;
  }

  try {
    const [worksRes, ratingsRes] = await Promise.all([
      fetch(`https://openlibrary.org/works/${bookId}.json`),
      fetch(`https://openlibrary.org/works/${bookId}/ratings.json`),
    ]);

    if (!worksRes.ok) return null;
    const item = await worksRes.json();

    let description = '';
    if (typeof item.description === 'string') description = item.description;
    else if (item.description?.value) description = item.description.value;

    const cover = item.covers?.[0]
      ? `https://covers.openlibrary.org/b/id/${item.covers[0]}-L.jpg`
      : '';

    // Author names come from /authors/{id}.json, but we can get them from
    // the search index. Use the inline author_name if present.
    const author =
      item.authors?.[0]?.author?.key
        ? await fetchAuthorName(item.authors[0].author.key)
        : 'Unknown Author';

    // Ratings
    let olRating: number | undefined;
    let olRatingCount: number | undefined;
    if (ratingsRes.ok) {
      const rData = await ratingsRes.json();
      if (rData.summary?.average) {
        olRating = Math.round(rData.summary.average * 10) / 10;
        olRatingCount = rData.summary.count ?? 0;
      }
    }

    // Publish year
    let publishYear: string | undefined;
    if (item.first_publish_date) {
      // e.g. "January 1, 1965" or "1965"
      const match = String(item.first_publish_date).match(/\d{4}/);
      if (match) publishYear = match[0];
    }

    // Subjects (first 6)
    const subjects: string[] | undefined = item.subjects?.slice(0, 6);

    return {
      id: bookId,
      title: item.title ?? 'Unknown Title',
      author,
      cover,
      description: description || 'No description available.',
      publishYear,
      subjects,
      olRating,
      olRatingCount,
    };
  } catch (error) {
    console.warn('getBook error:', error);
    return null;
  }
}

async function fetchAuthorName(authorKey: string): Promise<string> {
  try {
    const res = await fetch(`https://openlibrary.org${authorKey}.json`);
    if (!res.ok) return 'Unknown Author';
    const data = await res.json();
    return data.name ?? 'Unknown Author';
  } catch {
    return 'Unknown Author';
  }
}
