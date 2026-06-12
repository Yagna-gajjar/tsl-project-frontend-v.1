import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/authContext';
import { useToast } from '@/hooks/use-toast';
import {
  User,
  Lock,
  ArrowRight,
  Eye,
  EyeOff,
  LayoutDashboard,
  Database,
  CheckCircle2,
  type LucideIcon
} from 'lucide-react';
import { login as userLogin, getDatabases, type LoginResponseData } from "@/api/user.api";

interface LoginFormData {
  username: string;
  password: string;
}

interface InputFieldProps {
  label: string;
  name: keyof LoginFormData;
  type?: string;
  icon: LucideIcon;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
}

const InputField: React.FC<InputFieldProps> = ({
  label,
  name,
  type = "text",
  icon: Icon,
  value,
  onChange,
  placeholder,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const inputType = type === "password" ? (showPassword ? "text" : "password") : type;

  return (
    <div className="space-y-1.5">
      <label htmlFor={name} className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
        {label}
      </label>
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400 transition-colors">
          <Icon size={18} />
        </div>
        <input
          id={name}
          name={name}
          type={inputType}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required
          className="w-full pl-10 pr-10 py-2.5 text-sm rounded-xl border bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 border-slate-300 dark:border-slate-700 focus:outline-none focus:border-blue-600 dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-600/10 dark:focus:ring-blue-500/10 hover:border-slate-400 transition-all duration-200 shadow-sm"
        />
        {type === "password" && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer transition-colors outline-none"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
    </div>
  );
};

export default function LoginForm() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<LoginFormData>({
    username: '',
    password: ''
  });
  const [showDbModal, setShowDbModal] = useState(false);
  const [tempAuth, setTempAuth] = useState<{ user: any; token: string } | null>(null);
  const [databases, setDatabases] = useState<string[]>([]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDbSelect = (dbName: string) => {
    if (!tempAuth) return;

    // Save locally as requested
    localStorage.setItem("selected_db_name", dbName);

    // Finalize login
    login(tempAuth.user, tempAuth.token);

    toast({
      title: "Workspace Set",
      description: `Connected to ${dbName}`,
      variant: "success",
    });

    navigate("/dashboard");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const apiPayload = {
        usernameOrEmail: formData.username,
        password: formData.password
      };

      const response = await userLogin(apiPayload);
      if (response.success) {
        const { user, token }: LoginResponseData = response;

        if (user.role !== 'staff') {
          const dbResponse = await getDatabases(token);
          if (dbResponse.success && Array.isArray(dbResponse.data) && dbResponse.data.length > 0) {
            setDatabases(dbResponse.data);
            setTempAuth({ user, token });
            setShowDbModal(true);
            setIsLoading(false);
          } else {
            // Could not load the database list: log in on the default database
            localStorage.removeItem("selected_db_name");
            login(user, token);
            toast({
              title: "Database list unavailable",
              description: "Logged in using the default database.",
              variant: "destructive",
            });
            navigate("/dashboard");
          }
        } else {
          // staff: always pinned to the default tsl-project database
          localStorage.setItem("selected_db_name", "tsl-project");
          login(user, token);
          toast({
            title: "Success",
            description: "Welcome back! Login successful.",
            variant: "success",
          });
          navigate("/dashboard");
        }
      } else {
        toast({
          title: "Access Denied",
          description: response.message || "Invalid Credentials",
          variant: "destructive",
        });
        setIsLoading(false);
      }
    } catch (error) {
      toast({
        title: "Network Error",
        description: "Could not connect to the server.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#020817] transition-colors duration-300 flex items-center justify-center p-4 font-sans relative">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl shadow-blue-900/10 dark:shadow-black/50 overflow-hidden border border-slate-200 dark:border-slate-800 flex"
      >
        {/* Left Side: Form */}
        <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
          <div className="mb-8 text-center">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="h-12 w-12 bg-blue-100 dark:bg-blue-600/20 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-4"
            >
              <User size={24} strokeWidth={2.5} />
            </motion.div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Welcome Back
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">
              Enter your credentials to access your sports account.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <InputField
              label="Username / Email"
              name="username"
              icon={User}
              value={formData.username}
              onChange={handleInputChange}
              placeholder="johndoe"
            />

            <div>
              <InputField
                label="Password"
                name="password"
                type="password"
                icon={Lock}
                value={formData.password}
                onChange={handleInputChange}
                placeholder="••••••••"
              />
              <div className="flex justify-end mt-2">
                <a href="#" className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline">
                  Forgot password?
                </a>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm tracking-wide shadow-lg shadow-blue-600/20 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-200"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Verifying...</span>
                </div>
              ) : (
                <>Sign In <ArrowRight size={18} className="ml-2" /></>
              )}
            </motion.button>
          </form>

          <div className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
            Don't have an account?{" "}
            <a href="/signup" className="font-bold text-blue-600 dark:text-blue-400 hover:underline">
              Sign up
            </a>
          </div>
        </div>

        <div className="hidden md:block w-1/2 relative bg-slate-100 dark:bg-slate-800">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-purple-600/20 dark:from-blue-500/10 dark:to-purple-900/20 backdrop-blur-sm" />
          <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center z-10">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="mb-6 bg-gradient-to-br from-blue-500 to-indigo-600 p-4 rounded-3xl shadow-2xl shadow-blue-500/30"
            >
              <LayoutDashboard size={48} className="text-white" />
            </motion.div>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-3">
              Manage Your Sports Academy
            </h3>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              Experience the power of modern management. Streamline operations,
              enrollments, and academy seamlessly.
            </p>
          </div>
          <div
            className="absolute inset-0 opacity-10 dark:opacity-5 pointer-events-none"
            style={{ backgroundImage: "radial-gradient(circle at 2px 2px, gray 1px, transparent 0)", backgroundSize: "24px 24px" }}
          />
        </div>
      </motion.div>

      <AnimatePresence>
        {showDbModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
              onClick={() => setShowDbModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 shadow-2xl border border-slate-200 dark:border-slate-800"
            >
              <div className="text-center mb-6">
                <div className="h-14 w-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-600/30">
                  <Database size={28} />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Select Database</h2>
                <p className="text-slate-500 text-sm mt-1">All operations in this session will run on the selected database.</p>
              </div>

              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {databases.map((db) => (
                  <button
                    key={db}
                    onClick={() => handleDbSelect(db)}
                    className="w-full flex items-center justify-between p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg group-hover:bg-blue-100 dark:group-hover:bg-blue-900/40 text-slate-500 group-hover:text-blue-600 transition-colors">
                        <Database size={18} />
                      </div>
                      <span className="font-semibold text-slate-700 dark:text-slate-200">{db}</span>
                    </div>
                    <CheckCircle2 size={18} className="text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}