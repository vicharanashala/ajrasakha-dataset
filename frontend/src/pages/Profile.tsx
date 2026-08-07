import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService, clearAuth } from '../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AuthPromptModal } from '@/components/AuthPromptModal';
import { User } from '../types';
import {
  User as UserIcon,
  Mail,
  MapPin,
  Lock,
  Loader2,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';

export function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [authDismissed, setAuthDismissed] = useState(false);

  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [state, setState] = useState('');
  const [email, setEmail] = useState('');

  // Password reset state
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [resetOtp, setResetOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetting, setResetting] = useState(false);

  // Get current user from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('ajrasakha_user');
    if (!storedUser) {
      // Show auth modal instead of redirecting to /signin (which doesn't exist)
      return;
    }
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const profile = await authService.getProfile();
      setUser(profile);
      setFirstName(profile.firstName || '');
      setLastName(profile.lastName || '');
      setState(profile.state || '');
      setEmail(profile.email || '');
    } catch {
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      await authService.updateProfile({
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        state: state || undefined,
      });

      setSuccess('Profile updated successfully');
      // Update localStorage
      const storedUser = localStorage.getItem('ajrasakha_user');
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        localStorage.setItem(
          'ajrasakha_user',
          JSON.stringify({ ...parsed, firstName, lastName, state, avatar: user?.avatar }),
        );
      }
    } catch {
      setError('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleRequestPasswordReset = async () => {
    if (!email) {
      setError('Email not found. Please refresh the page.');
      return;
    }
    try {
      setResetting(true);
      setError(null);
      await authService.requestPasswordReset(email);
      setOtpSent(true);
      setSuccess('OTP sent to your email');
    } catch {
      setError('Failed to send OTP');
    } finally {
      setResetting(false);
    }
  };

  const handleVerifyPasswordReset = async () => {
    if (!email) return;
    try {
      setResetting(true);
      setError(null);
      await authService.verifyPasswordReset({
        email: email,
        otp: resetOtp,
        newPassword,
      });
      setSuccess('Password reset successfully. Please sign in again.');
      setShowPasswordReset(false);
      setOtpSent(false);
      setResetOtp('');
      setNewPassword('');
      // Clear local storage and redirect to home
      clearAuth();
      navigate('/');
    } catch {
      setError('Failed to reset password. Please check your OTP.');
    } finally {
      setResetting(false);
    }
  };

  const handleCancelReset = () => {
    setShowPasswordReset(false);
    setOtpSent(false);
    setResetOtp('');
    setNewPassword('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="w-full px-4 sm:px-6 py-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">My Profile</h1>
          <Button
            variant="outline"
            onClick={() => navigate('/questions')}
            className="text-sm"
          >
            Back to Questions
          </Button>
        </div>

        {/* Alerts */}
        {error && (
          <Alert variant="destructive" className="border-destructive/50">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert className="border-green-500/50 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700">{success}</AlertDescription>
          </Alert>
        )}

        {/* Profile Card */}
        <Card className="shadow-sm border-border/50">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
              <div className="flex-shrink-0">
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt="Avatar"
                    className="h-16 w-16 rounded-full object-cover border-2 border-border"
                  />
                ) : (
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center border-2 border-border">
                    <UserIcon className="h-8 w-8 text-primary" />
                  </div>
                )}
              </div>
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <UserIcon className="h-5 w-5" />
                Personal Information
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Email (read-only) */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                Email
              </label>
              <Input value={email} disabled className="bg-muted/50" />
            </div>

            {/* First Name */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                First Name
              </label>
              <Input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Enter your first name"
              />
            </div>

            {/* Last Name */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Last Name
              </label>
              <Input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Enter your last name"
              />
            </div>

            {/* State */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                State
              </label>
              <Input
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="Enter your state"
              />
            </div>

            {/* Save Button */}
            <Button onClick={handleSaveProfile} disabled={saving} className="w-full">
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Password Reset Card — hidden for Google SSO users */}
        {user?.authProvider !== 'google' && (
          <Card className="shadow-sm border-border/50">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Change Password
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!showPasswordReset ? (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Reset your password by receiving an OTP on your registered email ({email})
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => setShowPasswordReset(true)}
                    className="w-full"
                  >
                    <Lock className="h-4 w-4 mr-2" />
                    Reset Password
                  </Button>
                </div>
              ) : !otpSent ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      OTP will be sent to
                    </label>
                    <Input value={email} disabled className="bg-muted/50" />
                  </div>
                  <Button
                    onClick={handleRequestPasswordReset}
                    disabled={resetting}
                    className="w-full"
                  >
                    {resetting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Sending OTP...
                      </>
                    ) : (
                      'Send OTP'
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={handleCancelReset}
                    className="w-full text-muted-foreground"
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Enter OTP
                    </label>
                    <Input
                      value={resetOtp}
                      onChange={(e) => setResetOtp(e.target.value)}
                      placeholder="Enter the OTP sent to your email"
                      maxLength={6}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      New Password
                    </label>
                    <Input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setOtpSent(false);
                        setResetOtp('');
                        setNewPassword('');
                      }}
                      disabled={resetting}
                    >
                      Back
                    </Button>
                    <Button
                      onClick={handleVerifyPasswordReset}
                      disabled={resetting || !resetOtp || !newPassword}
                      className="flex-1"
                    >
                      {resetting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Resetting...
                        </>
                      ) : (
                        'Reset Password'
                      )}
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    onClick={handleCancelReset}
                    className="w-full text-muted-foreground"
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <AuthPromptModal
        open={!user && !authDismissed}
        onOpenChange={(open) => { if (!open) setAuthDismissed(true); }}
        message="Sign in with Google to view and edit your profile."
      />
    </div>
  );
}