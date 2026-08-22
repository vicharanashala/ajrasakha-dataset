import { useEffect, useState } from 'react';
import { Pagination } from '@/components/atoms/pagination';
import { useNavigate } from 'react-router-dom';
import { feedbackService } from '../services/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AuthPromptModal } from '@/components/AuthPromptModal';
import { IFeedback } from '../types';

interface PaginatedFeedbacks {
  data: IFeedback[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
import {
  ThumbsUp,
  ThumbsDown,
  Loader2,
  MessageCircle,
  ArrowLeft,
  ExternalLink,
} from 'lucide-react';

const USER_STORAGE_KEY = "ajrasakha_user";

export function MyFeedbacks() {
  const navigate = useNavigate();
  const [feedbacks, setFeedbacks] = useState<IFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pagination, setPagination] = useState<PaginatedFeedbacks | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const storedUser = localStorage.getItem(USER_STORAGE_KEY);
    if (!storedUser) {
      setShowAuthModal(true);
      setLoading(false);
      return;
    }
    const parsedUser = JSON.parse(storedUser);
    fetchUserFeedbacks(parsedUser.id);
  }, []);

  const fetchUserFeedbacks = async (userId: string, page = 1) => {
    try {
      setLoading(true);
      const result = await feedbackService.getUserFeedbacks(userId, page, 10);
      setFeedbacks(result.data);
      setPagination(result);
      setCurrentPage(page);
    } catch {
      console.error('Failed to load feedbacks');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    const storedUser = localStorage.getItem(USER_STORAGE_KEY);
    if (!storedUser) return;
    const parsedUser = JSON.parse(storedUser);
    fetchUserFeedbacks(parsedUser.id, page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {feedbacks.length === 0 && !loading ? (
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
                {pagination ? `${pagination.total} feedback${pagination.total !== 1 ? 's' : ''} provided` : ''}
              </p>
            </div>
            <div className="grid gap-4">
              {feedbacks.map((feedback) => (
                <Card
                  key={feedback.id}
                  className="overflow-hidden shadow-sm border-border/60 hover:shadow-md transition-all duration-200"
                >
                  <div className="bg-muted/30 px-4 py-2.5 border-b border-border/50 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                          <div
                         className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide ${
                          feedback.type === 'thumbs_up'
                            ? 'bg-green-100/80 text-green-700 border border-green-200 dark:bg-green-900/40 dark:text-green-400 dark:border-green-800'
                            : 'bg-red-100/80 text-red-700 border border-red-200 dark:bg-red-900/40 dark:text-red-400 dark:border-red-800'
                        }`}
                      >
                        {feedback.type === 'thumbs_up' ? (
                          <ThumbsUp className="h-3 w-3" />
                        ) : (
                          <ThumbsDown className="h-3 w-3" />
                        )}
                        {feedback.type === 'thumbs_up' ? 'POSITIVE' : 'NEGATIVE'}
                      </div>
                      
                      {feedback.status && (
                        <div
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wider uppercase ${
                            feedback.status.toLowerCase() === 'accepted' || feedback.status.toLowerCase() === 'accept'
                              ? 'bg-blue-100/80 text-blue-700 border border-blue-200 dark:bg-blue-900/40 dark:text-blue-400 dark:border-blue-800'
                              : feedback.status.toLowerCase() === 'rejected' || feedback.status.toLowerCase() === 'reject'
                              ? 'bg-gray-100/80 text-gray-700 border border-gray-200 dark:bg-gray-800/60 dark:text-gray-400 dark:border-gray-700'
                              : 'bg-amber-100/80 text-amber-700 border border-amber-200 dark:bg-amber-900/40 dark:text-amber-400 dark:border-amber-800'
                          }`}
                        >
                          {feedback.status}
                        </div>
                       )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] font-medium text-muted-foreground">
                          {formatDate(feedback.createdAt)}
                        </span>
                        {feedback.questionId && (
                          <Button
                            variant="ghost"
                          size="sm"
                            onClick={() => navigate(`/questions/${feedback.questionId}`)}
                            className="h-6 text-[11px] font-medium px-2 py-0"
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            View Question
                          </Button>
                        )}
                      </div>
                    </div>

                  <CardContent className="p-4 flex flex-col gap-3">
                    <div className="flex gap-2 text-sm">
                      <span className="font-semibold text-foreground min-w-[70px]">Reason:</span>
                      <span className="text-foreground/90">{feedback.predefinedOption}</span>
                    </div>

                    {feedback.comment && (
                      <div className="flex gap-2 text-sm">
                        <span className="font-semibold text-foreground min-w-[70px]">Comment:</span>
                        <span className="text-foreground/90 leading-relaxed">
                          {feedback.comment}
                        </span>
                      </div>
                    )}

                    {feedback.reviewNote && (
                      <div className="mt-1 bg-primary/5 border-l-[3px] border-primary rounded-r-lg p-2.5 text-sm flex gap-2">
                        <span className="font-semibold text-primary min-w-[70px] flex items-center gap-1.5">
                           <MessageCircle className="h-3.5 w-3.5" /> Note:
                        </span>
                        <span className="text-foreground/90 leading-relaxed">
                          {feedback.reviewNote}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-end">
                <Pagination
                  currentPage={currentPage}
                  totalPages={pagination.totalPages}
                  onPageChange={handlePageChange}
                />
              </div>
            )}
          </div>
        )}
      </div>

      <AuthPromptModal
        open={showAuthModal}
        onOpenChange={setShowAuthModal}
        message="Sign in with Google to view your submitted feedback."
      />
    </div>
  );
}