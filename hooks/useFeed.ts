import { useEffect } from 'react';
import { useFeedStore } from '../stores/feedStore';

export function useFeed() {
  const { fetchFeed, events, loading, refreshing } = useFeedStore();

  useEffect(() => {
    fetchFeed();
  }, []);

  return { events, loading, refreshing, refresh: fetchFeed };
}
