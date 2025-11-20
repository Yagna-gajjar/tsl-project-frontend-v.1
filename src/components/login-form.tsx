import { useState, useEffect } from 'react';
import { Apple, Chrome } from 'lucide-react';
import { useAuth } from '@/contexts/authContext';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';

export default function LoginForm() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 'client'
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsDark(false);
  }, []);

  const handleInputChange = (e: any) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async () => {
    setIsLoading(true);

    try {
      const fetchUrl = `${import.meta.env.VITE_APP_API_URL}/api/auth/login`;
      const response = await fetch(fetchUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        login(data?.user, data?.token);
        toast({
          title: "Success",
          description: "Login successfully.",
          variant: "success",
        })
        navigate("/dashboard");
      } else {
        toast({
          title: "Error",
          description: "Invalid Credentials",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Network error:', error);
      alert('Network error occurred. Check console for details.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={isDark ? 'dark' : ''}>
      <div className="min-h-screen bg-white dark:bg-[#020817] transition-colors duration-300">
        <div className="flex min-h-screen items-center justify-center p-4">
          <div className="w-full max-w-4xl">
            {/* Main Card */}
            <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 shadow-lg">
              <div className="grid md:grid-cols-2">
                {/* Form Section */}
                <div className="p-6 md:p-8">
                  <div className="flex flex-col gap-6">
                    {/* Header */}
                    <div className="flex flex-col items-center text-center">
                      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Welcome back
                      </h1>
                      <p className="text-gray-600 dark:text-gray-400">
                        Login to your xyz account
                      </p>
                    </div>

                    {/* Role Selection */}
                    <div className="grid gap-2">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Select Role
                      </label>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="role"
                            value="owner"
                            checked={formData.role === 'owner'}
                            onChange={handleInputChange}
                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">Owner</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="role"
                            value="client"
                            checked={formData.role === 'client'}
                            onChange={handleInputChange}
                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">Client</span>
                        </label>
                      </div>
                    </div>

                    {/* Username Field */}
                    <div className="grid gap-2">
                      <label
                        htmlFor="username"
                        className="text-sm font-medium text-gray-700 dark:text-gray-300"
                      >
                        Username
                      </label>
                      <input
                        id="username"
                        name="username"
                        type="text"
                        placeholder="username"
                        required
                        value={formData.username}
                        onChange={handleInputChange}
                        className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20"
                      />
                    </div>

                    {/* Password Field */}
                    <div className="grid gap-2">
                      <div className="flex items-center">
                        <label
                          htmlFor="password"
                          className="text-sm font-medium text-gray-700 dark:text-gray-300"
                        >
                          Password
                        </label>
                        <a
                          href="#"
                          className="ml-auto text-sm text-blue-600 dark:text-blue-400 hover:underline"
                          tabIndex={-1}
                        >
                          Forgot your password?
                        </a>
                      </div>
                      <input
                        id="password"
                        name="password"
                        type="password"
                        placeholder='********'
                        required
                        value={formData.password}
                        onChange={handleInputChange}
                        className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20"
                      />
                    </div>

                    {/* Login Button */}
                    <button
                      type="submit"
                      onClick={handleSubmit}
                      disabled={isLoading}
                      className="w-full rounded-md bg-blue-600 dark:bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:focus:ring-blue-400/50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? 'Logging in...' : 'Login'}
                    </button>

                    {/* Divider */}
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-gray-300 dark:border-gray-600" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-white dark:bg-gray-800 px-2 text-gray-500 dark:text-gray-400">
                          Or continue with
                        </span>
                      </div>
                    </div>

                    {/* Social Login Buttons */}
                    <div className="grid grid-cols-3 gap-4">
                      <button
                        type="button"
                        className="flex w-full items-center justify-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:focus:ring-blue-400/50 transition-colors duration-200"
                      >
                        <Apple className="h-5 w-5" />
                        <span className="sr-only">Login with Apple</span>
                      </button>
                      <button
                        type="button"
                        className="flex w-full items-center justify-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:focus:ring-blue-400/50 transition-colors duration-200"
                      >
                        <Chrome className="h-5 w-5" />
                        <span className="sr-only">Login with Google</span>
                      </button>
                      <button
                        type="button"
                        className="flex w-full items-center justify-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:focus:ring-blue-400/50 transition-colors duration-200"
                      >
                        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                        </svg>
                        <span className="sr-only">Login with Meta</span>
                      </button>
                    </div>

                    {/* Sign Up Link */}
                    <div className="text-center text-sm text-gray-600 dark:text-gray-400">
                      Don't have an account?{" "}
                      <a href="#" className="text-blue-600 dark:text-blue-400 hover:underline">
                        Sign up
                      </a>
                    </div>
                  </div>
                </div>

                {/* Image Section */}
                <div className="relative hidden bg-gray-100 dark:bg-gray-700 md:block">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-600/20 dark:from-blue-400/10 dark:to-purple-500/10" />
                  <div className="flex h-full items-center justify-center p-8">
                    <div className="text-center">
                      <div className="mx-auto mb-4 h-24 w-24 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 dark:from-blue-400 dark:to-purple-500 flex items-center justify-center">
                        <svg className="h-12 w-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                        Lightning Fast
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300">
                        Experience the power of modern authentication with seamless security.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Terms */}
            <div className="mt-6 text-center text-xs text-gray-500 dark:text-gray-400">
              By clicking continue, you agree to our{" "}
              <a href="#" className="text-blue-600 dark:text-blue-400 hover:underline">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="#" className="text-blue-600 dark:text-blue-400 hover:underline">
                Privacy Policy
              </a>
              .
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}