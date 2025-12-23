import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { z } from 'zod';
import { toast } from 'sonner';
import { validateInvitation, redeemInvitation, TeamInvitation } from '@/hooks/useTeamInvitations';
import { Loader2, UserPlus } from 'lucide-react';

const emailSchema = z.string().email('Please enter a valid email address');
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');
const nameSchema = z.string().trim().min(2, 'Name must be at least 2 characters').max(100, 'Name must be less than 100 characters');

const LynxLogo = () => (
  <svg viewBox="0 0 40 40" className="w-7 h-7" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M20 4L36 20L20 36L4 20L20 4Z"
      className="fill-primary-foreground"
    />
    <path
      d="M20 10L30 20L20 30L10 20L20 10Z"
      className="fill-primary"
    />
  </svg>
);

const Auth = () => {
  const [searchParams] = useSearchParams();
  const inviteToken = searchParams.get('invite');
  
  const [isSignUp, setIsSignUp] = useState(!!inviteToken);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; name?: string }>({});
  const [invitation, setInvitation] = useState<TeamInvitation | null>(null);
  const [validatingInvite, setValidatingInvite] = useState(!!inviteToken);
  
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();

  // Validate invitation token on mount
  useEffect(() => {
    const checkInvitation = async () => {
      if (inviteToken) {
        setValidatingInvite(true);
        const inv = await validateInvitation(inviteToken);
        if (inv && !inv.used_at && new Date(inv.expires_at) > new Date()) {
          setInvitation(inv);
          if (inv.email) {
            setEmail(inv.email);
          }
        } else {
          toast.error('This invitation link is invalid or has expired.');
        }
        setValidatingInvite(false);
      }
    };
    checkInvitation();
  }, [inviteToken]);

  useEffect(() => {
    if (user) {
      // If user just signed up with an invite, redeem it
      if (inviteToken && invitation) {
        redeemInvitation(inviteToken, user.id).then((success) => {
          if (success) {
            toast.success(`Welcome! You've been assigned the ${invitation.role} role.`);
          }
          navigate('/', { replace: true });
        });
      } else {
        navigate('/', { replace: true });
      }
    }
  }, [user, navigate, inviteToken, invitation]);

  const validateForm = (): boolean => {
    const newErrors: { email?: string; password?: string; name?: string } = {};
    
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      newErrors.email = emailResult.error.errors[0].message;
    }
    
    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) {
      newErrors.password = passwordResult.error.errors[0].message;
    }
    
    if (isSignUp) {
      const nameResult = nameSchema.safeParse(fullName);
      if (!nameResult.success) {
        newErrors.name = nameResult.error.errors[0].message;
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      if (isSignUp) {
        const { error } = await signUp(email, password, fullName);
        if (error) {
          if (error.message.includes('already registered')) {
            toast.error('This email is already registered. Please sign in instead.');
          } else {
            toast.error(error.message);
          }
        } else {
          toast.success('Account created successfully! You are now signed in.');
        }
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes('Invalid login')) {
            toast.error('Invalid email or password. Please try again.');
          } else {
            toast.error(error.message);
          }
        } else {
          toast.success('Welcome back!');
        }
      }
    } catch (err) {
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (validatingInvite) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Validating invitation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Invitation Banner */}
        {invitation && (
          <div className="mb-6 p-4 bg-primary/10 border border-primary/20 rounded-xl flex items-center gap-3">
            <UserPlus className="w-5 h-5 text-primary flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">You've been invited to join the team!</p>
              <p className="text-xs text-muted-foreground">Role: <span className="capitalize font-medium">{invitation.role.replace('_', ' ')}</span></p>
            </div>
          </div>
        )}

        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
              <LynxLogo />
            </div>
            <div className="text-left">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                LYNX MEDIA
              </h1>
              <p className="text-xs text-muted-foreground tracking-widest font-medium">BD TRACKER PRO</p>
            </div>
          </div>
          <p className="text-muted-foreground">
            {invitation ? 'Complete your registration' : isSignUp ? 'Create your team account' : 'Sign in to your team account'}
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    setErrors((prev) => ({ ...prev, name: undefined }));
                  }}
                  className={`w-full px-4 py-3 bg-input border rounded-lg input-focus ${
                    errors.name ? 'border-destructive' : 'border-border'
                  }`}
                  placeholder="Enter your full name"
                />
                {errors.name && (
                  <p className="text-sm text-destructive mt-1">{errors.name}</p>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErrors((prev) => ({ ...prev, email: undefined }));
                }}
                className={`w-full px-4 py-3 bg-input border rounded-lg input-focus ${
                  errors.email ? 'border-destructive' : 'border-border'
                }`}
                placeholder="you@company.com"
              />
              {errors.email && (
                <p className="text-sm text-destructive mt-1">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrors((prev) => ({ ...prev, password: undefined }));
                }}
                className={`w-full px-4 py-3 bg-input border rounded-lg input-focus ${
                  errors.password ? 'border-destructive' : 'border-border'
                }`}
                placeholder="••••••••"
              />
              {errors.password && (
                <p className="text-sm text-destructive mt-1">{errors.password}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:opacity-90 transition-all disabled:opacity-50"
            >
              {loading ? 'Please wait...' : isSignUp ? 'Create Account' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setErrors({});
              }}
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              {isSignUp
                ? 'Already have an account? Sign in'
                : "Don't have an account? Sign up"}
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
};

export default Auth;
