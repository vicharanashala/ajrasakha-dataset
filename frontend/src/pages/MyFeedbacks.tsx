import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { feedbackService } from '../services/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { IFeedback } from '../types';
import {
  ThumbsUp,
  ThumbsDown,
  Loader2,
  MessageCircle,
  ArrowLeft,
  ExternalLink,
} from 'lucide-react';

export function MyFeedbacks() {
  const navigate = useNavigate();
  const [feedbacks, setFeedbacks] = useState<IFeedback[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('ajrasakha_user');
    if (!storedUser) {
      navigate('/signin');
      return;
    }
    const parsedUser = JSON.parse(storedUser);
    fetchUserFeedbacks(parsedUser.id);
  }, [navigate]);

  const fetchUserFeedbacks = async (userId: string) => {
    try {
      setLoading(true);
      const userFeedbacks = await feedbackService.getUserFeedbacks(userId);
      setFeedbacks(userFeedbacks);
    } catch {
      console.error('Failed to load feedbacks');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="bg-card border-b border-border px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/questions')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">My Feedbacks</h1>
              <p className="text-sm text-muted-foreground">
                View all the feedback you have provided
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate('/questions')}
            className="gap-2"
          >
            Browse Questions
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {feedbacks.length === 0 ? (
          <Card className="shadow-sm border-border/50">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <MessageCircle className="h-16 w-16 text-muted-foreground/50 mb-4" />
              <h2 className="text-xl font-semibold text-foreground mb-2">
                No Feedbacks Yet
              </h2>
              <p className="text-muted-foreground text-center max-w-md mb-6">
                You haven't provided any feedback on questions yet. Browse questions
                and share your feedback to help improve the quality of answers.
              </p>
              <Button onClick={() => navigate('/questions')}>
                <MessageCircle className="h-4 w-4 mr-2" />
                Browse Questions
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {feedbacks.length} feedback{feedbacks.length !== 1 ? 's' : ''} provided
              </p>
            </div>
            <div className="grid gap-4">
              {feedbacks.map((feedback) => (
                <Card
                  key={feedback.id}
                  className="shadow-sm border-border/50 hover:border-border transition-colors"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
                              feedback.type === 'thumbs_up'
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                            }`}
                          >
                            {feedback.type === 'thumbs_up' ? (
                              <ThumbsUp className="h-4 w-4" />
                            ) : (
                              <ThumbsDown className="h-4 w-4" />
                            )}
                            {feedback.type === 'thumbs_up' ? 'Positive' : 'Negative'}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(feedback.createdAt)}
                          </span>
                        </div>
                        <div className="bg-muted/50 rounded-lg p-3 mb-3">
                          <p className="text-sm font-medium text-foreground mb-1">
                            Feedback Type:
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {feedback.predefinedOption}
                          </p>
                        </div>
                        {feedback.comment && (
                          <div className="bg-muted/50 rounded-lg p-3">
                            <p className="text-sm font-medium text-foreground mb-1">
                              Comment:
                            </p>
                            <p className="text-sm text-muted-foreground italic">
                              "{feedback.comment}"
                            </p>
                          </div>
                        )}
                        {feedback.questionId && (
                          <Button
                            variant="link"
                            onClick={() => navigate(`/questions/${feedback.questionId}`)}
                            className="p-0 h-auto mt-3 text-primary"
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            View Question
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}