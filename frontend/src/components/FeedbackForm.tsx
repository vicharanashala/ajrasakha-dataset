import { useState, useEffect } from 'react';
import { ThumbsUp, ThumbsDown, Send, Check } from 'lucide-react';
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
      await feedbackService.create({
        questionId,
        userId,
        answerId,
        type: feedbackType,
        predefinedOption: selectedOption,
        comment: comment.trim(),
      });
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
            <div className="mt-2 p-3 bg-muted/50 rounded-lg text-sm">
              <p className="text-muted-foreground">
                <span className="font-medium text-foreground">
                  {feedbackType === 'thumbs_up' ? '👍 Positive' : '👎 Negative'}
                </span>
                {' - '}
                {selectedOption}
              </p>
              <p className="mt-2 text-foreground">{comment}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSubmitted(false)}
            >
              Edit Feedback
            </Button>
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