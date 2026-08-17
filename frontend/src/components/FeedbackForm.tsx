import { useState, useEffect } from 'react';
import { ThumbsUp, ThumbsDown, Send, Check, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { feedbackService } from '../services/api';
import {
  POSITIVE_FEEDBACK_OPTIONS,
  NEGATIVE_FEEDBACK_OPTIONS,
  type FeedbackType,
} from '../types';

interface FeedbackFormProps {
  questionId: string;
  userId: string;
  answerId?: string;
}

export function FeedbackForm({ questionId, userId, answerId }: FeedbackFormProps) {
  const [feedbackType, setFeedbackType] = useState<FeedbackType | null>(null);
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [feedbackStatus, setFeedbackStatus] = useState<string | null>(null);
  const [feedbackReviewNote, setFeedbackReviewNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch existing feedback for this user
    const fetchExistingFeedback = async () => {
      try {
        const existing = await feedbackService.getUserFeedback(questionId, userId);
        if (existing) {
          setFeedbackType(existing.type);
          setSelectedOption(existing.predefinedOption);
          setComment(existing.comment);
          setFeedbackStatus(existing.status || null);
          setFeedbackReviewNote(existing.reviewNote || null);
          setSubmitted(true);
        }
      } catch {
        // No existing feedback, that's fine
      }
    };

    fetchExistingFeedback();
  }, [questionId, userId]);

  const handleTypeSelect = (type: FeedbackType) => {
    setFeedbackType(type);
    setSelectedOption('');
    setSubmitted(false);
  };

  const feedbackOptions =
    feedbackType === 'thumbs_up'
      ? POSITIVE_FEEDBACK_OPTIONS
      : feedbackType === 'thumbs_down'
      ? NEGATIVE_FEEDBACK_OPTIONS
      : [];

  const isValid =
    feedbackType !== null &&
    selectedOption !== '' &&
    comment.trim().length > 0;

  const handleSubmit = async () => {
    if (!isValid || !feedbackType) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await feedbackService.create({
        questionId,
        userId,
        answerId,
        type: feedbackType,
        predefinedOption: selectedOption,
        comment: comment.trim(),
      });
      setFeedbackStatus(response.status || null);
      setFeedbackReviewNote(response.reviewNote || null);
      setSubmitted(true);
    } catch {
      setError('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <Card className="shadow-sm border-border/50">
        <CardContent className="py-6">
          <div className="flex flex-col items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <Check className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="text-center">
              <p className="font-medium text-foreground">Thank you for your feedback!</p>
              <p className="text-sm text-muted-foreground mt-1">
                Your feedback helps us improve the quality of answers.
              </p>
            </div>
            <div className="w-full mt-4 bg-background border border-border/60 rounded-xl overflow-hidden shadow-sm">
              <div className="bg-muted/30 px-4 py-2.5 border-b border-border/50 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide ${feedbackType === 'thumbs_up' ? 'bg-green-100/80 text-green-700 border border-green-200 dark:bg-green-900/40 dark:text-green-400 dark:border-green-800' : 'bg-red-100/80 text-red-700 border border-red-200 dark:bg-red-900/40 dark:text-red-400 dark:border-red-800'}`}>
                    {feedbackType === 'thumbs_up' ? <ThumbsUp className="h-3 w-3" /> : <ThumbsDown className="h-3 w-3" />}
                    {feedbackType === 'thumbs_up' ? 'POSITIVE' : 'NEGATIVE'}
                  </div>
                </div>
                {feedbackStatus && (
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wider uppercase ${
                    feedbackStatus.toLowerCase() === 'accepted' || feedbackStatus.toLowerCase() === 'accept'
                      ? 'bg-blue-100/80 text-blue-700 border border-blue-200 dark:bg-blue-900/40 dark:text-blue-400 dark:border-blue-800'
                      : feedbackStatus.toLowerCase() === 'rejected' || feedbackStatus.toLowerCase() === 'reject'
                      ? 'bg-gray-100/80 text-gray-700 border border-gray-200 dark:bg-gray-800/60 dark:text-gray-400 dark:border-gray-700'
                      : 'bg-amber-100/80 text-amber-700 border border-amber-200 dark:bg-amber-900/40 dark:text-amber-400 dark:border-amber-800'
                  }`}>
                    {feedbackStatus}
                  </span>
                )}
              </div>
              
              <div className="p-4 flex flex-col gap-3 text-left">
                <div className="flex gap-2 text-sm">
                  <span className="font-semibold text-foreground min-w-[70px]">Reason:</span>
                  <span className="text-foreground/90">{selectedOption}</span>
                </div>
                
                <div className="flex gap-2 text-sm">
                  <span className="font-semibold text-foreground min-w-[70px]">Comment:</span>
                  <span className="text-foreground/90 leading-relaxed">{comment}</span>
                </div>

                {feedbackReviewNote && (
                  <div className="mt-1 bg-primary/5 border-l-[3px] border-primary rounded-r-lg p-2.5 text-sm flex gap-2">
                    <span className="font-semibold text-primary min-w-[70px] flex items-center gap-1.5">
                       <MessageCircle className="h-3.5 w-3.5" /> Note:
                    </span>
                    <span className="text-foreground/90 leading-relaxed">{feedbackReviewNote}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm border-border/50">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold">Rate this Answer</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-lg">
            {error}
          </div>
        )}

        {/* Thumbs Up/Down */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <p className="text-sm text-muted-foreground w-full sm:w-auto">Was this answer helpful?</p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleTypeSelect('thumbs_up')}
              className={`p-3 rounded-lg border transition-all ${
                feedbackType === 'thumbs_up'
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/30 text-green-600'
                  : 'border-border hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/30'
              }`}
              title="Thumbs up"
            >
              <ThumbsUp className="h-5 w-5" />
            </button>
            <button
              onClick={() => handleTypeSelect('thumbs_down')}
              className={`p-3 rounded-lg border transition-all ${
                feedbackType === 'thumbs_down'
                  ? 'border-red-500 bg-red-50 dark:bg-red-900/30 text-red-600'
                  : 'border-border hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-900/30'
              }`}
              title="Thumbs down"
            >
              <ThumbsDown className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Predefined Options */}
        {feedbackType && feedbackOptions.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Select a reason:</p>
            <div className="flex flex-wrap gap-2">
              {feedbackOptions.map((option) => (
                <button
                  key={option}
                  onClick={() => setSelectedOption(option)}
                  className={`px-3 py-1.5 text-sm rounded-full border transition-all ${
                    selectedOption === option
                      ? feedbackType === 'thumbs_up'
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                        : 'border-red-500 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                      : 'border-border hover:border-muted-foreground/50'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Comment */}
        {feedbackType && (
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">
              Add a comment <span className="text-destructive">*</span>
            </label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your thoughts about this answer..."
              className="min-h-[100px] resize-none"
            />
          </div>
        )}

        {/* Submit Button */}
        {feedbackType && (
          <Button
            onClick={handleSubmit}
            disabled={!isValid || isSubmitting}
            className="w-full gap-2"
          >
            {isSubmitting ? (
              'Submitting...'
            ) : (
              <>
                <Send className="h-4 w-4" />
                Submit Feedback
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}