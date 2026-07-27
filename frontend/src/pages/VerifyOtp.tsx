import { useState, useRef, useEffect, type FormEvent } from 'react';
import { authService } from '../services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

interface VerifyOtpProps {
  email: string;
  onVerified: (user: { id: string; email: string }, token?: string) => void;
  onBack: () => void;
}


const OTP_LENGTH = 6;

export function VerifyOtp({ email, onVerified, onBack }: VerifyOtpProps) {
  const [otpDigits, setOtpDigits] = useState<string[]>(
    Array(OTP_LENGTH).fill(''),
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(
    `An OTP has been sent to ${email}. Check the backend console for the mock email.`,
  );
  const [resending, setResending] = useState(false);
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    const next = [...otpDigits];
    next[index] = value;
    setOtpDigits(next);
    if (value && index < OTP_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputsRef.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < OTP_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').trim();
    if (!/^\d{6}$/.test(pasted)) return;
    const next = pasted.split('');
    setOtpDigits(next);
    inputsRef.current[OTP_LENGTH - 1]?.focus();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const otp = otpDigits.join('');
    if (otp.length !== OTP_LENGTH) {
      setError('Please enter the full 6-digit OTP');
      return;
    }

    setLoading(true);
    try {
      const response = await authService.verifyOtp({ email, otp });
      if (response.user) {
        onVerified(
          { id: response.user.id, email: response.user.email },
          response.token
        );
      }
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || 'Failed to verify OTP.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError(null);
    setInfo(null);
    setResending(true);
    try {
      const response = await authService.resendOtp({ email });
      setInfo(response.message);
      setOtpDigits(Array(OTP_LENGTH).fill(''));
      inputsRef.current[0]?.focus();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || 'Failed to resend OTP.';
      setError(message);
    } finally {
      setResending(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Verify Your Email</CardTitle>
        <CardDescription>
          Enter the 6-digit code sent to{' '}
          <span className="font-medium text-foreground">{email}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {info && (
          <Alert variant="info">
            <AlertDescription>{info}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex justify-center gap-2 sm:gap-3">
            {otpDigits.map((digit, index) => (
              <Input
                key={index}
                ref={(el) => {
                  inputsRef.current[index] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                aria-label={`OTP digit ${index + 1}`}
                className={cn(
                  'h-12 w-10 text-center text-lg font-semibold sm:h-14 sm:w-12',
                )}
              />
            ))}
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Verifying...' : 'Verify Email'}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex-col items-center gap-2">
        <Button
          type="button"
          variant="link"
          onClick={handleResend}
          disabled={resending}
        >
          {resending ? 'Resending...' : "Didn't receive the code? Resend"}
        </Button>
        <Button type="button" variant="link" onClick={onBack}>
          ← Back to sign up
        </Button>
      </CardFooter>
    </Card>
  );
}