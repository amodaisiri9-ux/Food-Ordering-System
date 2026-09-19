export interface Review {
  id: string;
  name: string;
  rating: number;
  comment: string;
  date: string;
}

const STORAGE_KEY = 'foodhub_reviews';

const defaultReviews: Review[] = [
  {
    id: 'review-1',
    name: 'Mali',
    rating: 5,
    comment: 'Excellent food and fast delivery. I loved the spicy kottu and friendly service!',
    date: '2026-05-20',
  },
  {
    id: 'review-2',
    name: 'Nadeesha',
    rating: 5,
    comment: 'The chicken biryani was full of flavor and arrived hot. Highly recommend Food Hub.',
    date: '2026-05-22',
  },
  {
    id: 'review-3',
    name: 'Saman',
    rating: 4,
    comment: 'Great menu and easy ordering. Will order again for family dinner.',
    date: '2026-05-24',
  },
];

export function loadReviews(): Review[] {
  if (typeof window === 'undefined') {
    return defaultReviews;
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return defaultReviews;
    }

    const parsed = JSON.parse(stored) as Review[];
    if (!Array.isArray(parsed)) {
      return defaultReviews;
    }

    return parsed;
  } catch (error) {
    return defaultReviews;
  }
}

export function saveReviews(reviews: Review[]) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(reviews));
}
