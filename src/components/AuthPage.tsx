import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { getApiUrl, apiFetch } from '../lib/api';
import { 
  Eye, 
  EyeOff, 
  Mail, 
  Lock, 
  User, 
  UserPlus, 
  Sparkles, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowRight,
  ShieldAlert,
  ArrowLeft
} from 'lucide-react';

interface AuthPageProps {
  onLoginSuccess: (user: { id?: string; email: string; firstName?: string; lastName?: string }) => void;
  triggerToast: (msg: string) => void;
}

interface SavedUser {
  email: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  isMailOnly: boolean;
}

export default function AuthPage({ onLoginSuccess, triggerToast }: AuthPageProps) {
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  
  // Always use standard registration (First Name, Last Name, Mail ID, Password)
  const signUpType = 'standard';

  // Input states
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Password visibility states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Error state
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Dynamic validation spinner state
  const [isValidating, setIsValidating] = useState(false);

  // Forgot password flow states
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotStep, setForgotStep] = useState<1 | 2>(1);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const handleForgotStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmed = forgotEmail.trim().toLowerCase();
    if (!trimmed) {
      setErrorMessage('Please enter your mail ID.');
      return;
    }

    setIsValidating(true);
    try {
      const res = await apiFetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        const users = data.users || [];
        const matchedUser = users.find((u: any) => u.email === trimmed);

        if (!matchedUser) {
          setErrorMessage('No account found with this mail ID. Please sign up or check spelling.');
          setIsValidating(false);
          return;
        }

        if (matchedUser.isMailOnly) {
          setErrorMessage('This account is registered via quick Mail ID-only mode. No password is required! You can directly sign in by typing your Mail ID on the main login screen.');
          setIsValidating(false);
          return;
        }
      }
      setForgotStep(2);
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err) {
      // Fallback if users lookup fails, just allow proceeding
      setForgotStep(2);
      setNewPassword('');
      setConfirmNewPassword('');
    } finally {
      setIsValidating(false);
    }
  };

  const handleForgotStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!newPassword) {
      setErrorMessage('New password is required.');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    const trimmed = forgotEmail.trim().toLowerCase();
    setIsValidating(true);

    try {
      const response = await apiFetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed, password: newPassword }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Reset password failed');
      }

      triggerToast('Password updated successfully! Please login with your new security passcode.');
      
      // Auto populate mail field
      setEmail(forgotEmail);
      setPassword('');
      
      // Clear and return
      setShowForgotPassword(false);
      setForgotStep(1);
      setNewPassword('');
      setConfirmNewPassword('');
      setActiveTab('login');
    } catch (err: any) {
      setErrorMessage(err.message || 'Reset password failed. Please try again.');
    } finally {
      setIsValidating(false);
    }
  };

  // Load existing accounts or initialize empty (users must create their own account)
  const getSavedUsers = (): SavedUser[] => {
    const saved = localStorage.getItem('nexus_registered_users');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  };

  // Synchronize users with server on component mount
  React.useEffect(() => {
    apiFetch('/api/users')
      .then(res => {
        if (!res.ok) throw new Error("Server response not ok");
        return res.json();
      })
      .then(data => {
        if (data && Array.isArray(data.users)) {
          localStorage.setItem('nexus_registered_users', JSON.stringify(data.users));
        }
      })
      .catch(err => {
        console.warn("[Registry Sync] Offline or server auth sync bypassed:", err);
      });
  }, []);

  const mergeUsers = (local: SavedUser[], server: SavedUser[]): SavedUser[] => {
    const map = new Map<string, SavedUser>();
    local.forEach(u => map.set(u.email.toLowerCase(), u));
    server.forEach(u => {
      const email = u.email.toLowerCase();
      const existing = map.get(email);
      if (!existing || (!existing.password && u.password)) {
        map.set(email, u);
      }
    });
    return Array.from(map.values());
  };

  const pushUsersToServer = (users: SavedUser[]) => {
    apiFetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ users })
    }).catch(err => {
      console.warn("[Registry Push] Deferred user list upload:", err);
    });
  };

  const saveUserList = (users: SavedUser[]) => {
    try {
      localStorage.setItem('nexus_registered_users', JSON.stringify(users));
      pushUsersToServer(users);
    } catch (e) {
      console.error("Failed to save registered users list:", e);
    }
  };

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setErrorMessage('Please enter a valid mail ID address.');
      return;
    }

    if (!firstName.trim()) {
      setErrorMessage('First Name is required.');
      return;
    }
    if (!password) {
      setErrorMessage('Password is required.');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setIsValidating(true);
    try {
      console.log(`[Supabase Auth] Registering user ${trimmedEmail}...`);
      const { data, error } = await supabase.auth.signUp({
        email: trimmedEmail,
        password: password,
        options: {
          data: {
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            full_name: `${firstName.trim()} ${lastName.trim()}`.trim()
          }
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      const user = data.user;
      if (user) {
        // Create matching row in `profiles` table
        const shareSlug = `${firstName.trim()}-${lastName.trim()}`.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || `user-${user.id.slice(0, 8)}`;
        
        await supabase.from('profiles').upsert({
          user_id: user.id,
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          name: `${firstName.trim()} ${lastName.trim()}`.trim(),
          email: trimmedEmail,
          headline: 'Verified Professional',
          share_slug: shareSlug,
          public_profile: false
        }, { onConflict: 'user_id' });

        triggerToast(`Account created successfully for ${trimmedEmail}!`);
        
        onLoginSuccess({
          id: user.id,
          email: trimmedEmail,
          firstName: firstName.trim(),
          lastName: lastName.trim()
        });
      } else {
        triggerToast('Registration submitted! Please check your email to verify your account if required.');
      }
    } catch (err: any) {
      console.error('[Supabase Signup Failure]', err);
      setErrorMessage(err.message || 'Failed to create account. Please try again.');
    } finally {
      setIsValidating(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      setErrorMessage('Please enter your mail ID.');
      return;
    }

    if (!password) {
      setErrorMessage('Password is required.');
      return;
    }

    setIsValidating(true);
    try {
      console.log(`[Supabase Auth] Authenticating ${trimmedEmail}...`);
      const { data, error } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password: password
      });

      if (error) {
        throw new Error(error.message);
      }

      const user = data.user;
      if (!user) throw new Error('Authentication succeeded but no user session returned.');

      // Fetch user profile from Supabase
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      const userFirstName = profile?.first_name || user.user_metadata?.first_name || trimmedEmail.split('@')[0];
      const userLastName = profile?.last_name || user.user_metadata?.last_name || '';

      triggerToast(`Signed in successfully as ${userFirstName}!`);
      onLoginSuccess({
        id: user.id,
        email: user.email || trimmedEmail,
        firstName: userFirstName,
        lastName: userLastName,
      });
    } catch (err: any) {
      console.error('[Supabase Login Failure]', err);
      setErrorMessage(err.message || 'Incorrect credentials or user not found. Please try again.');
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07080b] flex items-center justify-center p-4 selection:bg-emerald-500/20" id="auth-panel-container">
      {/* Background radial elements */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-900/10 via-slate-950/20 to-[#07080b] pointer-events-none z-0"></div>
      
      <div className="w-full max-w-[480px] bg-[#0d0e12] border border-slate-900 rounded-[28px] p-6 sm:p-8 relative shadow-2xl z-10 animate-fade-in flex flex-col justify-between">
        
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center bg-emerald-500/10 text-emerald-400 p-3 rounded-2xl border border-emerald-500/20 mb-3.5">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">MyDocVault</h1>
          <p className="text-xs text-gray-450 mt-1 font-mono tracking-wider font-semibold uppercase">Personal Document Vault & Career Hub</p>
        </div>

        {/* Tab Selection */}
        {!showForgotPassword && (
          <div className="bg-[#121318] p-1 rounded-xl flex border border-slate-850 mb-6">
            <button
              onClick={() => {
                setActiveTab('login');
                setErrorMessage(null);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'login' 
                  ? 'bg-slate-900 text-emerald-400 shadow-md border border-slate-800/80' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setActiveTab('signup');
                setErrorMessage(null);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'signup' 
                  ? 'bg-slate-900 text-emerald-400 shadow-md border border-slate-800/80' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Register / Sign Up
            </button>
          </div>
        )}

        {/* Error Dialog Banner */}
        {errorMessage && (
          <div className="mb-5 bg-rose-500/10 border border-rose-500/20 text-rose-450 p-3.5 rounded-xl text-xs flex items-start gap-2.5 animate-slide-up">
            <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <span className="leading-relaxed font-semibold">{errorMessage}</span>
          </div>
        )}

        {showForgotPassword ? (
          <div className="space-y-4">
            <div className="mb-2 text-center">
              <h2 className="text-sm font-bold text-emerald-400 flex items-center justify-center gap-1.5 font-mono uppercase tracking-wider">
                <Lock className="w-4 h-4" />
                <span>Reset Security Passcode</span>
              </h2>
              <p className="text-[11px] text-gray-400 mt-1">
                {forgotStep === 1 
                  ? "Enter your registered mail ID to update your account password." 
                  : "Account verified! Set your new security passcode below."
                }
              </p>
            </div>

            {forgotStep === 1 ? (
              <form onSubmit={handleForgotStep1Submit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-mono text-gray-400 block">Registered Mail ID</label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      placeholder="e.g. name@domain.com"
                      value={forgotEmail}
                      onChange={e => setForgotEmail(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-850 hover:border-slate-800 rounded-xl pl-10 pr-4 py-3 text-white text-sm outline-none focus:border-emerald-500 transition-all font-sans"
                    />
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotPassword(false);
                      setErrorMessage(null);
                    }}
                    className="flex-1 bg-slate-900 border border-slate-880 hover:bg-slate-850 text-gray-300 font-bold py-2.5 px-4 rounded-xl transition text-xs flex items-center justify-center gap-1.5 focus:outline-none"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back</span>
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-emerald-500 hover:bg-emerald-600 font-bold py-2.5 px-4 rounded-xl text-slate-950 transition shadow-lg shadow-emerald-500/10 flex items-center justify-center gap-1.5 focus:outline-none text-xs"
                  >
                    <span>Check Account</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleForgotStep2Submit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-mono text-gray-400 block">New Passcode</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Minimum 6 characters"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-850 hover:border-slate-800 rounded-xl pl-10 pr-10 py-3 text-white text-sm outline-none focus:border-emerald-500 transition-all font-sans"
                    />
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 hover:text-emerald-400 text-gray-500 select-none p-1 transition"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-mono text-gray-400 block">Confirm New Passcode</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      placeholder="Re-enter passcode"
                      value={confirmNewPassword}
                      onChange={e => setConfirmNewPassword(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-850 hover:border-slate-800 rounded-xl pl-10 pr-10 py-3 text-white text-sm outline-none focus:border-emerald-500 transition-all font-sans"
                    />
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 hover:text-emerald-400 text-gray-500 select-none p-1 transition"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setForgotStep(1);
                      setErrorMessage(null);
                    }}
                    className="flex-1 bg-slate-900 border border-slate-880 hover:bg-slate-850 text-gray-300 font-bold py-2.5 px-4 rounded-xl transition text-xs flex items-center justify-center gap-1.5 focus:outline-none"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back</span>
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-emerald-500 hover:bg-emerald-600 font-bold py-2.5 px-4 rounded-xl text-slate-950 transition shadow-lg shadow-emerald-500/10 flex items-center justify-center gap-1.5 focus:outline-none text-xs"
                  >
                    <span>Save Pass</span>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            )}
          </div>
        ) : (
          <>
            {/* Sign In Flow */}
            {activeTab === 'login' && (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                
                {/* Email Field always shown */}
                <div className="space-y-1">
                  <label className="text-[11px] font-mono text-gray-400 block">Mail ID</label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      placeholder="e.g. name@domain.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-850 hover:border-slate-800 rounded-xl pl-10 pr-4 py-3 text-white text-sm outline-none focus:border-emerald-500 transition-all font-sans"
                    />
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  </div>
                </div>

                {/* Password Field shown */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-[11px] font-mono text-gray-400 block">Password</label>
                    <button
                      type="button"
                      onClick={() => {
                        setShowForgotPassword(true);
                        setForgotStep(1);
                        setForgotEmail(email);
                        setErrorMessage(null);
                      }}
                      className="text-[10px] text-emerald-400 hover:text-emerald-300 font-mono font-semibold transition"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter security passcode"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-850 hover:border-slate-800 rounded-xl pl-10 pr-10 py-3 text-white text-sm outline-none focus:border-emerald-500 transition-all font-sans"
                    />
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    
                    {/* Eye Icon Button */}
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 hover:text-emerald-400 text-gray-500 select-none p-1 transition"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isValidating}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-800 disabled:text-gray-500 disabled:cursor-not-allowed font-bold py-3 px-4 rounded-xl text-slate-950 transition active:scale-[0.99] shadow-lg shadow-emerald-500/10 flex items-center justify-center gap-1.5 focus:outline-none text-xs"
                >
                  {isValidating ? (
                    <>
                      <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
                      <span>Verifying Identity...</span>
                    </>
                  ) : (
                    <>
                      <span>Verify and Sign In</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Sign Up / Registration Flow */}
            {activeTab === 'signup' && (
              <form onSubmit={handleSignUpSubmit} className="space-y-4">

                {/* Show full details only in standard registration mode */}
                {signUpType === 'standard' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[11px] font-mono text-gray-400 block">First Name</label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          placeholder="e.g. Murthy"
                          value={firstName}
                          onChange={e => setFirstName(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-850 hover:border-slate-800 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-emerald-500 transition-all font-sans"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-mono text-gray-400 block">Last Name</label>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="e.g. AM"
                          value={lastName}
                          onChange={e => setLastName(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-850 hover:border-slate-800 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-emerald-500 transition-all font-sans"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Email Mail ID Address */}
                <div className="space-y-1">
                  <label className="text-[11px] font-mono text-gray-400 block">Mail ID</label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      placeholder="e.g. name@domain.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-850 hover:border-slate-800 rounded-xl pl-10 pr-4 py-3 text-white text-sm outline-none focus:border-emerald-500 transition-all font-sans"
                    />
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  </div>
                </div>

                {/* Password input panels (displayed for standard account creation only) */}
                {signUpType === 'standard' && (
                  <div className="space-y-4">
                    {/* Password field */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-mono text-gray-400 block">Create Password</label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          placeholder="Minimum 6 characters"
                          value={password}
                          onChange={e => setPassword(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-850 hover:border-slate-800 rounded-xl pl-10 pr-10 py-3 text-white text-sm outline-none focus:border-emerald-500 transition-all font-sans"
                        />
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        
                        {/* Eye toggle button */}
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 hover:text-emerald-400 text-gray-500 select-none p-1 transition"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Confirm Password field */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-mono text-gray-400 block">Confirm Password</label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          required
                          placeholder="Re-enter verification password"
                          value={confirmPassword}
                          onChange={e => setConfirmPassword(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-850 hover:border-slate-800 rounded-xl pl-10 pr-10 py-3 text-white text-sm outline-none focus:border-emerald-500 transition-all font-sans"
                        />
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        
                        {/* Eye toggle button */}
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 hover:text-emerald-400 text-gray-500 select-none p-1 transition"
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Create Account Trigger button */}
                <button
                  type="submit"
                  className="w-full bg-emerald-500 hover:bg-emerald-600 font-bold py-3 px-4 rounded-xl text-slate-950 transition active:scale-[0.99] shadow-lg shadow-emerald-500/10 flex items-center justify-center gap-1.5 focus:outline-none text-xs"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Create Account</span>
                </button>
              </form>
            )}
          </>
        )}

        {/* Footer info lock indicator */}
        <div className="mt-6 pt-4 border-t border-slate-900 flex items-center justify-center gap-2 text-[10px] text-gray-500 select-none">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>AES-256 Client-Side Local Verification</span>
        </div>

      </div>
    </div>
  );
}
