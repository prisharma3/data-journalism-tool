'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { APP_NAME } from '@/lib/constants';
import { useAuthStore } from '@/stores/authStore';

// TEST USER CREDENTIALS - Remove this section in production
const TEST_USER = {
  email: 'test.user@example.com',
  password: 'testuser1234!',
  firstName: 'Test',
  lastName: 'User'
};

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [useTestUser, setUseTestUser] = useState(false); // TEST USER STATE
  const router = useRouter();
  const { login } = useAuthStore();

  // TEST USER HANDLER - Remove this function in production
  const handleTestUserToggle = (checked: boolean) => {
    setUseTestUser(checked);
    if (checked) {
      setEmail(TEST_USER.email);
      setPassword(TEST_USER.password);
    } else {
      setEmail('');
      setPassword('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Use test user credentials if checkbox is checked
    const loginEmail = useTestUser ? TEST_USER.email : email;
    const loginPassword = useTestUser ? TEST_USER.password : password;

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: loginEmail, 
          password: loginPassword 
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Transform the API response to match the User interface
        const user = {
          id: data.user.id,
          email: data.user.email,
          firstName: data.user.first_name,
          lastName: data.user.last_name,
          createdAt: data.user.created_at,
          updatedAt: data.user.updated_at,
        };
        
        // Use the authStore login method
        login(user, data.token);
        
        // Redirect to dashboard
        router.push('/dashboard');
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (error) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">{APP_NAME}</CardTitle>
          <CardDescription>Sign in to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="text-red-600 text-sm text-center bg-red-50 p-2 rounded">
                {error}
              </div>
            )}

            {/* TEST USER CHECKBOX - Remove this section in production */}
            <div className="flex items-center space-x-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <input
                type="checkbox"
                id="testUser"
                checked={useTestUser}
                onChange={(e) => handleTestUserToggle(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="testUser" className="flex items-center text-sm text-blue-700 cursor-pointer">
                <User className="w-4 h-4 mr-1" />
                Use Test User (Development Only)
              </label>
            </div>
            
            <div>
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required={!useTestUser}
                disabled={useTestUser}
                className={useTestUser ? 'bg-gray-100' : ''}
              />
            </div>
            
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required={!useTestUser}
                disabled={useTestUser}
                className={useTestUser ? 'bg-gray-100 pr-10' : 'pr-10'}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                disabled={useTestUser}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading || (!useTestUser && (!email || !password))}
            >
              {isLoading ? 'Signing in...' : useTestUser ? 'Sign in as Test User' : 'Sign in'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link href="/register" className="text-blue-600 hover:text-blue-500">
                Sign up
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}