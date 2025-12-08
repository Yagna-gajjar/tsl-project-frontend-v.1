import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
	User,
	Mail,
	Lock,
	Shield,
	ArrowRight,
	AlertCircle,
	CheckCircle2,
	Eye,
	EyeOff,
	type LucideIcon
} from 'lucide-react';
import { signup } from '@/api/user.api';
import type { User as UserType } from '@/types/user';
import type { Response } from '@/types/response';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

type UserRole = 'staff' | 'admin' | 'superadmin';

interface SignupFormData {
	username: string;
	email: string;
	password: string;
	confirmPassword: string;
	role: UserRole;
}

interface FormErrors {
	username?: string;
	email?: string;
	password?: string;
	confirmPassword?: string;
	role?: string;
}

interface InputFieldProps {
	label: string;
	name: keyof SignupFormData;
	type?: string;
	icon: LucideIcon;
	value: string;
	onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
	error?: string;
	placeholder?: string;
}

const InputField: React.FC<InputFieldProps> = ({
	label,
	name,
	type = "text",
	icon: Icon,
	value,
	onChange,
	error,
	placeholder
}) => {
	const [showPassword, setShowPassword] = useState(false);

	const inputType = type === 'password' ? (showPassword ? 'text' : 'password') : type;

	return (
		<div className="space-y-1.5">
			<label htmlFor={name} className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
				{label}
			</label>
			<div className="relative group">
				<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
					<Icon size={18} />
				</div>

				<input
					id={name}
					type={inputType}
					name={name}
					value={value}
					onChange={onChange}
					placeholder={placeholder}
					className={`
            w-full pl-10 pr-10 py-2.5 text-sm rounded-xl border bg-white dark:bg-slate-900 
            text-slate-900 dark:text-slate-100 placeholder-slate-400 
            transition-all duration-200 outline-none shadow-sm
            ${error
							? 'border-red-500 focus:ring-2 focus:ring-red-500/20 focus:border-red-500'
							: 'border-slate-300 dark:border-slate-700 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 hover:border-slate-400'}
          `}
				/>

				{type === 'password' && (
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

			<AnimatePresence mode="wait">
				{error && (
					<motion.div
						initial={{ opacity: 0, y: -5, height: 0 }}
						animate={{ opacity: 1, y: 0, height: 'auto' }}
						exit={{ opacity: 0, y: -5, height: 0 }}
						className="flex items-center text-xs font-medium text-red-500 overflow-hidden pt-1"
					>
						<AlertCircle size={12} className="mr-1.5 flex-shrink-0" />
						{error}
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
};

const SignupForm = () => {
	const [formData, setFormData] = useState<SignupFormData>({
		username: '',
		email: '',
		password: '',
		confirmPassword: '',
		role: 'staff'
	});

	const navigate = useNavigate();
	const [errors, setErrors] = useState<FormErrors>({});
	const [isSubmitting, setIsSubmitting] = useState(false);

	const roles: UserRole[] = ['staff', 'admin', 'superadmin'];

	const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		const { name, value } = e.target;
		setFormData(prev => ({ ...prev, [name]: value }));

		if (errors[name as keyof FormErrors]) {
			setErrors(prev => ({ ...prev, [name]: '' }));
		}
	};

	const validateForm = (): FormErrors => {
		const newErrors: FormErrors = {};
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

		if (!formData.username.trim()) newErrors.username = "Required";
		else if (formData.username.length < 3) newErrors.username = "Min 3 chars";

		if (!formData.email) newErrors.email = "Required";
		else if (!emailRegex.test(formData.email)) newErrors.email = "Invalid email";

		if (!formData.password) newErrors.password = "Required";
		else if (formData.password.length < 6) newErrors.password = "Min 6 chars";

		if (formData.password !== formData.confirmPassword) {
			newErrors.confirmPassword = "No match";
		}

		return newErrors;
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsSubmitting(true);

		const validationErrors = validateForm();
		if (Object.keys(validationErrors).length > 0) {
			setErrors(validationErrors);
			setIsSubmitting(false);
			return;
		}


		const { confirmPassword, ...payload } = formData;
		const response: Response<UserType> = await signup(payload);

		if (!response.success) {
			toast({
				title: "Failed",
				description: "Invalid Credentials",
				variant: "destructive"
			})
		}
		else {
			navigate('/login');
		}
		console.log("🚀 Payload:", payload);
		setIsSubmitting(false);
	};

	return (
		<div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950 font-sans transition-colors duration-300">
			<motion.div
				initial={{ opacity: 0, y: 10 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.4 }}
				className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-black/50 overflow-hidden border border-slate-200 dark:border-slate-800"
			>
				{/* Compact Header */}
				<div className="bg-slate-50/50 dark:bg-slate-800/30 px-6 py-6 border-b border-slate-100 dark:border-slate-800 flex flex-col items-center">
					<div className="h-10 w-10 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center mb-3">
						<User size={20} />
					</div>
					<h2 className="text-xl font-bold text-slate-800 dark:text-white">Create Account</h2>
				</div>

				{/* Form Body */}
				<form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-5">
					<div className="space-y-4">
						<InputField
							label="Username"
							name="username"
							value={formData.username}
							onChange={handleChange}
							error={errors.username}
							icon={User}
							placeholder="johndoe"
						/>

						<InputField
							label="Email"
							name="email"
							type="email"
							value={formData.email}
							onChange={handleChange}
							error={errors.email}
							icon={Mail}
							placeholder="john@example.com"
						/>

						{/* Role Select */}
						<div className="space-y-1.5">
							<label htmlFor="role" className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
								Role
							</label>
							<div className="relative group">
								<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
									<Shield size={18} />
								</div>
								<select
									id="role"
									name="role"
									value={formData.role}
									onChange={handleChange}
									className="
                    w-full pl-10 pr-10 py-2.5 text-sm rounded-xl border bg-white dark:bg-slate-900 
                    text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-700
                    focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 hover:border-slate-400
                    appearance-none cursor-pointer transition-all shadow-sm
                  "
								>
									{roles.map(role => (
										<option key={role} value={role}>
											{role.charAt(0).toUpperCase() + role.slice(1)}
										</option>
									))}
								</select>
								<div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
									<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
									</svg>
								</div>
							</div>
						</div>

						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
							<InputField
								label="Password"
								name="password"
								type="password"
								value={formData.password}
								onChange={handleChange}
								error={errors.password}
								icon={Lock}
								placeholder="••••••"
							/>
							<InputField
								label="Confirm"
								name="confirmPassword"
								type="password"
								value={formData.confirmPassword}
								onChange={handleChange}
								error={errors.confirmPassword}
								icon={CheckCircle2}
								placeholder="••••••"
							/>
						</div>
					</div>

					<div className="pt-2">
						<motion.button
							whileHover={{ scale: 1.01 }}
							whileTap={{ scale: 0.98 }}
							type="submit"
							disabled={isSubmitting}
							className="
                w-full flex items-center justify-center py-3 rounded-xl
                bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm
                shadow-lg shadow-indigo-500/20 disabled:opacity-70 disabled:cursor-not-allowed
                transition-all duration-200
              "
						>
							{isSubmitting ? (
								<span className="flex items-center gap-2">
									<svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
										<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
										<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
									</svg>
									Processing
								</span>
							) : (
								<span className="flex items-center gap-2">
									Create Account <ArrowRight size={16} strokeWidth={2.5} />
								</span>
							)}
						</motion.button>
					</div>

					<p className="text-center text-xs text-slate-500 dark:text-slate-400">
						Already have an account?{' '}
						<a href="/login" className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
							Log in
						</a>
					</p>
				</form>
			</motion.div>
		</div>
	);
};

export default SignupForm;