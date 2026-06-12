import { useState } from "react";
import { motion } from "framer-motion";
import {
	User as UserIcon,
	Mail,
	Lock,
	Eye,
	EyeOff,
	KeyRound,
	ShieldCheck,
	Loader2,
} from "lucide-react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/authContext";
import { changePassword } from "@/api/user.api";
import { useToast } from "@/hooks/use-toast";

interface PasswordForm {
	currentPassword: string;
	newPassword: string;
	confirmPassword: string;
}

const EMPTY_FORM: PasswordForm = {
	currentPassword: "",
	newPassword: "",
	confirmPassword: "",
};

export default function ProfilePage() {
	const { user } = useAuth();
	const { toast } = useToast();

	const [form, setForm] = useState<PasswordForm>(EMPTY_FORM);
	const [isSaving, setIsSaving] = useState(false);
	const [visible, setVisible] = useState({
		currentPassword: false,
		newPassword: false,
		confirmPassword: false,
	});

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setForm((prev) => ({ ...prev, [name]: value }));
	};

	const toggleVisible = (field: keyof PasswordForm) => {
		setVisible((prev) => ({ ...prev, [field]: !prev[field] }));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		const { currentPassword, newPassword, confirmPassword } = form;

		if (!currentPassword || !newPassword || !confirmPassword) {
			toast({
				title: "Missing fields",
				description: "Please fill in all the password fields.",
				variant: "destructive",
			});
			return;
		}

		if (newPassword.length < 6) {
			toast({
				title: "Weak password",
				description: "New password must be at least 6 characters long.",
				variant: "destructive",
			});
			return;
		}

		if (newPassword !== confirmPassword) {
			toast({
				title: "Passwords do not match",
				description: "New password and confirm password must be the same.",
				variant: "destructive",
			});
			return;
		}

		if (currentPassword === newPassword) {
			toast({
				title: "Choose a new password",
				description: "New password must be different from the current one.",
				variant: "destructive",
			});
			return;
		}

		setIsSaving(true);
		try {
			const res = await changePassword({
				currentPassword,
				newPassword,
				confirmPassword,
			});

			if (res.success) {
				toast({
					title: "Password updated",
					description: "Your password has been changed successfully.",
					variant: "success",
				});
				setForm(EMPTY_FORM);
			} else {
				toast({
					title: "Could not update password",
					description: res.message || "Something went wrong.",
					variant: "destructive",
				});
			}
		} catch (error) {
			toast({
				title: "Network error",
				description: "Could not connect to the server. Please try again.",
				variant: "destructive",
			});
		} finally {
			setIsSaving(false);
		}
	};

	const passwordFields: {
		name: keyof PasswordForm;
		label: string;
		placeholder: string;
	}[] = [
		{
			name: "currentPassword",
			label: "Current Password",
			placeholder: "Enter your current password",
		},
		{
			name: "newPassword",
			label: "New Password",
			placeholder: "Enter a new password",
		},
		{
			name: "confirmPassword",
			label: "Confirm New Password",
			placeholder: "Re-enter the new password",
		},
	];

	return (
		<motion.div
			initial={{ opacity: 0, y: 12 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.25 }}
			className="mx-auto max-w-6xl space-y-6"
		>
			{/* Header */}
			<div>
				<h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
					<UserIcon className="w-8 h-8 text-primary" />
					My Profile
				</h1>
				<p className="text-muted-foreground mt-2">
					View your account details and manage your password.
				</p>
			</div>

			{/* Account details */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2 text-xl">
						<ShieldCheck className="w-5 h-5 text-primary" />
						Account Information
					</CardTitle>
					<CardDescription>
						Your username and email are managed by an administrator and cannot
						be changed here.
					</CardDescription>
				</CardHeader>
				<CardContent className="grid gap-5 sm:grid-cols-2">
					<div className="space-y-2">
						<Label htmlFor="username">Username</Label>
						<div className="relative">
							<UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
							<Input
								id="username"
								value={user?.username ?? ""}
								readOnly
								disabled
								className="pl-9 cursor-not-allowed"
							/>
						</div>
					</div>

					<div className="space-y-2">
						<Label htmlFor="email">Email</Label>
						<div className="relative">
							<Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
							<Input
								id="email"
								value={user?.email ?? ""}
								readOnly
								disabled
								className="pl-9 cursor-not-allowed"
							/>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Change password */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2 text-xl">
						<KeyRound className="w-5 h-5 text-primary" />
						Change Password
					</CardTitle>
					<CardDescription>
						Use a strong password that you don't use elsewhere.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleSubmit} className="space-y-5">
						{passwordFields.map((field) => (
							<div key={field.name} className="space-y-2">
								<Label htmlFor={field.name}>{field.label}</Label>
								<div className="relative">
									<Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
									<Input
										id={field.name}
										name={field.name}
										type={visible[field.name] ? "text" : "password"}
										value={form[field.name]}
										onChange={handleChange}
										placeholder={field.placeholder}
										autoComplete={
											field.name === "currentPassword"
												? "current-password"
												: "new-password"
										}
										className="pl-9 pr-10"
									/>
									<button
										type="button"
										onClick={() => toggleVisible(field.name)}
										tabIndex={-1}
										className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
										aria-label={
											visible[field.name] ? "Hide password" : "Show password"
										}
									>
										{visible[field.name] ? (
											<EyeOff className="h-4 w-4" />
										) : (
											<Eye className="h-4 w-4" />
										)}
									</button>
								</div>
							</div>
						))}

						<div className="flex justify-end gap-3 pt-2">
							<Button
								type="button"
								variant="outline"
								onClick={() => setForm(EMPTY_FORM)}
								disabled={isSaving}
							>
								Reset
							</Button>
							<Button type="submit" disabled={isSaving}>
								{isSaving ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										Updating...
									</>
								) : (
									"Update Password"
								)}
							</Button>
						</div>
					</form>
				</CardContent>
			</Card>
		</motion.div>
	);
}
