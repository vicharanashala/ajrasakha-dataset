import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { questionService, answerService } from '../services/api';
import type { Question, IAnswer, User } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FeedbackForm } from '@/components/FeedbackForm';
import { AlertCircle, Loader2, ArrowLeft, ExternalLink, FileText } from 'lucide-react';

export function QuestionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [question, setQuestion] = useState<Question | null>(null);
  const [answer, setAnswer] = useState<IAnswer | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('ajrasakha_user');
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const [questionData, answerData] = await Promise.all([
          questionService.getById(id),
          answerService.getByQuestionId(id),
        ]);
        
        setQuestion(questionData);
        setAnswer(answerData);
      } catch {
        setError('Failed to fetch question details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getSourceIcon = (sourceType?: string) => {
    switch (sourceType) {
      case 'web':
        return <ExternalLink className="h-4 w-4" />;
      case 'document':
      case 'image':
        return <FileText className="h-4 w-4" />;
      default:
        return <ExternalLink className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="w-full px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading question details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <Alert variant="destructive" className="border-destructive/50">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-destructive-foreground">
              {error}
            </AlertDescription>
          </Alert>
          <div className="mt-4">
            <Button variant="outline" onClick={() => navigate('/questions')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Questions
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="w-full px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <Alert variant="destructive" className="border-destructive/50">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-destructive-foreground">
              Question not found.
            </AlertDescription>
          </Alert>
          <div className="mt-4">
            <Button variant="outline" onClick={() => navigate('/questions')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Questions
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-6 py-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Back Button */}
        <Button variant="ghost" onClick={() => navigate('/questions')} className="pl-0">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Questions
        </Button>

        {/* Question Card */}
        <Card className="shadow-sm border-border/50">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <CardTitle className="text-xl font-semibold">Question</CardTitle>
                <p className="text-xs text-muted-foreground">
                  ID: {question.id}
                </p>
              </div>
              <span className="px-2 py-1 text-xs font-medium rounded-full bg-muted text-muted-foreground">
                {question.status}
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-lg text-foreground">{question.question}</p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-border">
              {question.details?.state && (
                <div>
                  <p className="text-xs text-muted-foreground">State</p>
                  <p className="text-sm font-medium">{question.details.state}</p>
                </div>
              )}
              {question.details?.district && (
                <div>
                  <p className="text-xs text-muted-foreground">District</p>
                  <p className="text-sm font-medium">{question.details.district}</p>
                </div>
              )}
              {question.details?.crop && (
                <div>
                  <p className="text-xs text-muted-foreground">Crop</p>
                  <p className="text-sm font-medium">{question.details.crop}</p>
                </div>
              )}
              {question.details?.season && (
                <div>
                  <p className="text-xs text-muted-foreground">Season</p>
                  <p className="text-sm font-medium">{question.details.season}</p>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-4 pt-4 border-t border-border text-sm text-muted-foreground">
              <p>Source: {question.source}</p>
              <p>Priority: {question.priority}</p>
              <p>Created: {formatDate(question.createdAt)}</p>
              {question.closedAt && <p>Closed: {formatDate(question.closedAt)}</p>}
            </div>
          </CardContent>
        </Card>

        {/* Answer Card */}
        {answer && (
          <Card className="shadow-sm border-border/50">
            <CardHeader>
              <CardTitle className="text-xl font-semibold">Final Answer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="prose prose-sm max-w-none">
                <p className="text-foreground whitespace-pre-wrap">{answer.answer}</p>
              </div>

              {/* Sources */}
              {answer.sources && answer.sources.length > 0 && (
                <div className="pt-4 border-t border-border">
                  <h4 className="text-sm font-medium mb-3">Sources</h4>
                  <div className="space-y-2">
                    {answer.sources.map((source, index) => (
                      <a
                        key={index}
                        href={source.source}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors group"
                      >
                        {getSourceIcon(source.sourceType)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {source.sourceName || source.source}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {source.source}
                          </p>
                          {source.page && (
                            <p className="text-xs text-muted-foreground">
                              Page: {source.page}
                            </p>
                          )}
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Answer Metadata */}
              <div className="flex flex-wrap gap-4 pt-4 border-t border-border text-sm text-muted-foreground">
                <p>Answer Iteration: {answer.answerIteration}</p>
                <p>Approval Count: {answer.approvalCount}</p>
                {answer.remarks && <p>Remarks: {answer.remarks}</p>}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Feedback Form */}
        {currentUser && answer && (
          <FeedbackForm
            questionId={question.id}
            userId={currentUser.id}
            answerId={answer.id}
          />
        )}

        {/* No Answer Found */}
        {!answer && (
          <Card className="shadow-sm border-border/50">
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">No final answer found for this question.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}