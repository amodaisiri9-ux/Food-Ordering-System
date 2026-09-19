import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { motion } from 'motion/react';
import { Star, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { useAuth } from '../context/AuthContext';
import { loadReviews, saveReviews, Review } from '../utils/reviewStorage';

export function ReviewPage() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [name, setName] = useState(user?.name || '');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    setReviews(loadReviews());
  }, []);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!name.trim() || !comment.trim()) {
      return;
    }

    const newReview: Review = {
      id: `review-${Date.now()}`,
      name: name.trim(),
      rating,
      comment: comment.trim(),
      date: new Date().toISOString().split('T')[0],
    };

    const nextReviews = [newReview, ...reviews].slice(0, 10);
    setReviews(nextReviews);
    saveReviews(nextReviews);
    setComment('');
    setSuccessMessage('Thank you! Your review has been saved and will appear on the homepage.');

    window.setTimeout(() => setSuccessMessage(''), 5000);
  };

  return (
    <div className="container mx-auto px-4 py-24">
      <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-12">
        <div>
          <div className="max-w-xl mb-10">
            <h1 className="text-5xl font-bold mb-4">Share Your Review</h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Tell us how your meal tasted. Your feedback helps us keep every delivery fresh, fast, and delicious.
            </p>
          </div>

          <Card className="border-none shadow-xl">
            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="review-name">Name</Label>
                    <Input
                      id="review-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="review-rating">Rating</Label>
                    <select
                      id="review-rating"
                      value={rating}
                      onChange={(e) => setRating(Number(e.target.value))}
                      className="h-12 w-full rounded-lg border bg-background px-3 text-sm outline-none transition-colors focus:border-primary"
                    >
                      {[5, 4, 3, 2, 1].map((value) => (
                        <option key={value} value={value}>
                          {value} Star{value > 1 ? 's' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="review-comment">Review</Label>
                  <Textarea
                    id="review-comment"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Write your experience here"
                    rows={6}
                    required
                  />
                </div>

                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <Button type="submit" className="rounded-full px-8 py-3">
                    Submit Review
                  </Button>
                  {successMessage && <p className="text-sm text-emerald-600">{successMessage}</p>}
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold">Latest Reviews</h2>
              <p className="text-muted-foreground">See what other customers are saying.</p>
            </div>
            <Link to="/">
              <Button variant="outline" className="rounded-full">
                Back Home
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="space-y-4">
            {reviews.length === 0 ? (
              <Card className="border-none shadow-sm p-6">
                <p className="text-muted-foreground">No reviews yet. Be the first to share your experience.</p>
              </Card>
            ) : (
              reviews.map((review) => (
                <Card key={review.id} className="border-none shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-semibold">{review.name}</p>
                        <p className="text-sm text-muted-foreground">{review.date}</p>
                      </div>
                      <div className="flex items-center gap-1 text-yellow-500">
                        {Array.from({ length: review.rating }).map((_, index) => (
                          <Star key={index} className="h-4 w-4 fill-current" />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm leading-relaxed text-muted-foreground">{review.comment}</p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
