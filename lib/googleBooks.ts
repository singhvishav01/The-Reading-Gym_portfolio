export interface GoogleBook {
  id: string;
  title: string;
  author: string;
  cover: string;
  description: string;
}

export async function searchBooks(query: string, maxResults = 20): Promise<GoogleBook[]> {
  if (!query.trim()) return [];

  const params = new URLSearchParams({
    q: query,
    limit: String(maxResults),
  });

  try {
    const res = await fetch(`https://openlibrary.org/search.json?${params.toString()}`);
    if (!res.ok) return [];

    const data = await res.json();
    if (!data.docs) return [];

    return data.docs.map((item: any): GoogleBook => {
      const id = item.key ? item.key.replace('/works/', '') : '';
      const cover = item.cover_i ? `https://covers.openlibrary.org/b/id/${item.cover_i}-L.jpg` : '';
      return {
        id,
        title: item.title ?? 'Unknown Title',
        author: item.author_name?.[0] ?? 'Unknown Author',
        cover,
        description: 'Tap to view details...', // Full description fetched on getBook
      };
    }).filter((b: GoogleBook) => b.id !== '');
  } catch (error) {
    console.warn('Open Library search error:', error);
    return [];
  }
}

export async function getBook(bookId: string): Promise<GoogleBook | null> {
  try {
    const res = await fetch(`https://openlibrary.org/works/${bookId}.json`);
    if (!res.ok) return null;
    
    const item = await res.json();
    
    let description = '';
    if (typeof item.description === 'string') description = item.description;
    else if (item.description?.value) description = item.description.value;

    const cover = item.covers?.[0] ? `https://covers.openlibrary.org/b/id/${item.covers[0]}-L.jpg` : '';

    return {
      id: bookId,
      title: item.title ?? 'Unknown Title',
      author: 'Author details inside', 
      cover,
      description: description || 'No description available for this book.',
    };
  } catch (error) {
    return null;
  }
}
