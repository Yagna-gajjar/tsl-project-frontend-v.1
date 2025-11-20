import { motion } from 'framer-motion';
import {
	AlertTriangle,
	RefreshCw,
	Home,
	ArrowLeft
} from 'lucide-react';
import { useTheme } from '@/contexts/theme-context';

const ConstructionError = ({
	onRetry = () => window.location.reload(),
	onGoHome = () => window.location.href = '/',
	onGoBack = () => window.history.back(),
	errorMessage = "Oops! We hit a construction snag",
	showRetry = true,
	showGoHome = true,
	showGoBack = true
}) => {
	const { theme } = useTheme();

	const bounceAnimation = {
		scale: [1, 1.1, 1],
		transition: {
			duration: 2,
			repeat: Infinity,
			ease: "easeInOut"
		}
	};

	const slideInUp = {
		initial: { y: 100, opacity: 0 },
		animate: { y: 0, opacity: 1 },
		transition: { duration: 0.8, ease: "easeOut" }
	};

	const staggerContainer = {
		animate: {
			transition: {
				staggerChildren: 0.2
			}
		}
	};

	const fadeInScale = {
		initial: { scale: 0, opacity: 0 },
		animate: { scale: 1, opacity: 1 },
		transition: { duration: 0.6, ease: "easeOut" }
	};

	// Theme classes
	const themeClasses = {
		background: theme === 'dark'
			? 'bg-[#020817]'
			: 'bg-gradient-to-br from-white via-white to-white',
		card: theme === 'dark'
			? 'bg-gray-800 border border-gray-700'
			: 'bg-white',
		title: theme === 'dark'
			? 'text-gray-100'
			: 'text-gray-800',
		primaryText: theme === 'dark'
			? 'text-gray-200'
			: 'text-gray-600',
		secondaryText: theme === 'dark'
			? 'text-gray-400'
			: 'text-gray-500',
		iconBg: theme === 'dark'
			? 'bg-gradient-to-br from-orange-500 to-red-600'
			: 'bg-gradient-to-br from-orange-400 to-orange-600',
		primaryButton: theme === 'dark'
			? 'bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700'
			: 'bg-gradient-to-r from-orange-500 to-orange-600',
		secondaryButton: theme === 'dark'
			? 'bg-gray-700 text-gray-200 hover:bg-gray-600 border border-gray-600'
			: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
		accentButton: theme === 'dark'
			? 'bg-yellow-600 hover:bg-yellow-700'
			: 'bg-yellow-500 hover:bg-yellow-600',
		topBorder: theme === 'dark'
			? 'bg-gradient-to-r from-orange-500 via-red-500 to-orange-600'
			: 'bg-gradient-to-r from-orange-400 via-yellow-400 to-orange-500',
		bottomBorder: theme === 'dark'
			? 'bg-gradient-to-r from-transparent via-orange-500 to-transparent'
			: 'bg-gradient-to-r from-transparent via-orange-300 to-transparent',
		pulseRing: theme === 'dark'
			? 'bg-orange-500'
			: 'bg-orange-400'
	};

	return (
		<div className={`min-h-screen w-full ${themeClasses.background} flex items-center justify-center transition-colors duration-500 relative`}>

			{/* Theme Toggle Button */}
			{/* <motion.button
				onClick={toggleTheme}
				className={`absolute top-6 right-6 p-3 rounded-full ${themeClasses.secondaryButton} shadow-lg z-10`}
				whileHover={{ scale: 1.1 }}
				whileTap={{ scale: 0.9 }}
				initial={{ opacity: 0, y: -20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5, delay: 0.8 }}
			>
				{isDark ? (
					<Sun className="text-yellow-400" size={20} />
				) : (
					<Moon className={isDark ? 'text-gray-200' : 'text-gray-600'} size={20} />
				)}
			</motion.button> */}

			<motion.div
				className={`max-w-md w-full ${themeClasses.card} rounded-2xl shadow-2xl p-8 text-center relative overflow-hidden transition-colors duration-500`}
				initial={{ scale: 0.8, opacity: 0 }}
				animate={{ scale: 1, opacity: 1 }}
				transition={{ duration: 0.6, ease: "easeOut" }}
			>
				{/* Decorative top border */}
				<div className={`absolute top-0 left-0 right-0 h-2 ${themeClasses.topBorder}`}></div>

				{/* Warning Icon with Animation */}
				<motion.div
					className="flex justify-center mb-6"
					variants={fadeInScale}
					initial="initial"
					animate="animate"
				>
					<motion.div
						className="relative"
						animate={bounceAnimation}
					>
						<div className={`${themeClasses.iconBg} rounded-full p-4 shadow-lg`}>
							<AlertTriangle className="text-white" size={48} />
						</div>
						{/* Pulsing ring effect */}
						<motion.div
							className={`absolute inset-0 ${themeClasses.pulseRing} rounded-full opacity-30`}
							animate={{
								scale: [1, 1.3, 1],
								opacity: [0.3, 0, 0.3]
							}}
							transition={{
								duration: 2,
								repeat: Infinity,
								ease: "easeOut"
							}}
						/>
					</motion.div>
				</motion.div>

				{/* Content */}
				<motion.div
					variants={staggerContainer}
					initial="initial"
					animate="animate"
				>
					<motion.h1
						className={`text-3xl font-bold ${themeClasses.title} mb-4`}
						variants={slideInUp}
					>
						Under Construction
					</motion.h1>

					<motion.p
						className={`${themeClasses.primaryText} mb-2 text-lg font-medium`}
						variants={slideInUp}
					>
						{errorMessage}
					</motion.p>

					<motion.p
						className={`${themeClasses.secondaryText} mb-8 text-sm`}
						variants={slideInUp}
					>
						Our digital construction crew is working hard to fix this issue. Please try again or navigate back to safety.
					</motion.p>

					{/* Action Buttons */}
					<motion.div
						className="space-y-3"
						variants={slideInUp}
					>
						{showRetry && (
							<motion.button
								onClick={onRetry}
								className={`w-full ${themeClasses.primaryButton} text-white py-3 px-6 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 group`}
								whileHover={{ scale: 1.02, y: -2 }}
								whileTap={{ scale: 0.98 }}
							>
								<RefreshCw className="group-hover:rotate-180 transition-transform duration-500" size={20} />
								Try Again
							</motion.button>
						)}

						<div className="flex gap-3">
							{showGoBack && (
								<motion.button
									onClick={onGoBack}
									className={`flex-1 ${themeClasses.secondaryButton} py-3 px-4 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2 group`}
									whileHover={{ scale: 1.02, y: -1 }}
									whileTap={{ scale: 0.98 }}
								>
									<ArrowLeft className="group-hover:-translate-x-1 transition-transform duration-300" size={18} />
									Go Back
								</motion.button>
							)}

							{showGoHome && (
								<motion.button
									onClick={onGoHome}
									className={`flex-1 ${themeClasses.accentButton} text-white py-3 px-4 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2 group`}
									whileHover={{ scale: 1.02, y: -1 }}
									whileTap={{ scale: 0.98 }}
								>
									<Home className="group-hover:scale-110 transition-transform duration-300" size={18} />
									Home
								</motion.button>
							)}
						</div>
					</motion.div>
				</motion.div>

				{/* Bottom decoration */}
				<motion.div
					className={`absolute bottom-0 left-0 right-0 h-1 ${themeClasses.bottomBorder}`}
					initial={{ scaleX: 0 }}
					animate={{ scaleX: 1 }}
					transition={{ duration: 1, delay: 0.5 }}
				/>
			</motion.div>
		</div>
	);
};

export default ConstructionError;