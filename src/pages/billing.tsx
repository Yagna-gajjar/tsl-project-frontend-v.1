import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Search,
  Building2,
  CalendarDays,
  Mail,
  Phone,
  PieChart,
  Trophy,
  Dumbbell,
  Zap,
  Swords,
  Volleyball,
  type LucideIcon
} from "lucide-react";
import BillingPage from "@/components/view/billing/BillingPage";

const getAcademyTheme = (type: string) => {
  const normalizedType = type.toLowerCase();

  if (normalizedType.includes("football") || normalizedType.includes("soccer")) {
    return { color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-100 dark:bg-emerald-500/20", border: "group-hover:border-emerald-500/50", icon: Trophy };
  }
  if (normalizedType.includes("gym") || normalizedType.includes("fitness")) {
    return { color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-100 dark:bg-rose-500/20", border: "group-hover:border-rose-500/50", icon: Dumbbell };
  }
  if (normalizedType.includes("karate") || normalizedType.includes("martial")) {
    return { color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-100 dark:bg-orange-500/20", border: "group-hover:border-orange-500/50", icon: Swords };
  }
  if (normalizedType.includes("volleyball")) {
    return { color: "text-sky-600 dark:text-sky-400", bg: "bg-sky-100 dark:bg-sky-500/20", border: "group-hover:border-sky-500/50", icon: Volleyball };
  }
  if (normalizedType.includes("skating")) {
    return { color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-100 dark:bg-purple-500/20", border: "group-hover:border-purple-500/50", icon: Zap };
  }
  return { color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-100 dark:bg-blue-500/20", border: "group-hover:border-blue-500/50", icon: Building2 };
};

export default function Billing() {
  const [selectedAcademy, setSelectedAcademy] = useState<any | null>(null);
  const [academies] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading] = useState(true);

  const filteredAcademies = academies.filter(
    (academy) =>
      academy?.academyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      academy?.academyType!.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0B1120] text-gray-900 dark:text-gray-100 p-6 transition-colors duration-300">
      <div className="fixed top-0 left-0 w-full h-96 bg-gradient-to-b from-blue-100/50 to-transparent dark:from-blue-900/10 dark:to-transparent pointer-events-none" />

      <AnimatePresence mode="wait">
        {!selectedAcademy ? (
          <motion.div
            key="list-view"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, x: -20, filter: "blur(5px)" }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="relative space-y-8 max-w-7xl mx-auto"
          >
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-gray-200/60 dark:border-gray-800/60">
              <div className="space-y-2">
                <h1 className="text-4xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400">
                  Billing Overview
                </h1>
                <p className="text-gray-500 dark:text-gray-400 font-medium">
                  Manage finances for{" "}
                  <span className="text-blue-600 dark:text-blue-400 font-bold">
                    {academies.length}
                  </span>{" "}
                  registered academies.
                </p>
              </div>

              <div className="relative group w-full md:w-96">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400 transition-colors" />
                </div>
                <input
                  type="text"
                  placeholder="Search by name or sport..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-200 dark:border-gray-800 rounded-xl leading-5 bg-white dark:bg-gray-900/50 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 sm:text-sm shadow-sm transition-all"
                />
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <AcademyCardSkeleton key={i} />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence>
                  {filteredAcademies.map((academy, index) => (
                    <AcademyCard
                      key={academy.academyId}
                      academy={academy}
                      index={index}
                      onClick={() => setSelectedAcademy(academy)}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}

            {!loading && filteredAcademies.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-20 text-center"
              >
                <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
                  <Search className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  No results found
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  We couldn't find anything matching "{searchTerm}".
                </p>
              </motion.div>
            )}
          </motion.div>
        ) : (
          /* --- DETAIL VIEW --- */
          <motion.div
            key="detail-view"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="max-w-7xl mx-auto space-y-6 relative"
          >
            <button
              onClick={() => setSelectedAcademy(null)}
              className="group flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
            >
              <div className="p-2 rounded-full bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 group-hover:border-blue-500 dark:group-hover:border-blue-500 transition-all">
                <ArrowLeft className="h-4 w-4" />
              </div>
              <span>Back to Dashboard</span>
            </button>

            <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl shadow-blue-900/5 border border-gray-200 dark:border-gray-800 overflow-hidden">
              <BillingPage academy={selectedAcademy} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AcademyCard({
  academy,
  onClick,
  index,
}: {
  academy: any;
  onClick: () => void;
  index: number;
}) {
  const theme = getAcademyTheme(academy?.academyType ?? "unknown");
  const Icon = theme.icon;
  const isDiscontinued = false;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      whileHover={{ y: -8, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`
        group relative overflow-hidden cursor-pointer
        bg-white dark:bg-gray-900 
        rounded-2xl p-6 
        border border-gray-200 dark:border-gray-800 
        shadow-sm hover:shadow-2xl hover:shadow-blue-500/10 dark:hover:shadow-black/50
        transition-all duration-300
        ${theme.border}
      `}
    >
      <div
        className={`absolute top-0 left-0 right-0 h-1.5 ${theme.bg.replace(
          "/20",
          ""
        )}`}
      />

      <div
        className={`absolute -right-10 -top-10 w-32 h-32 rounded-full opacity-0 group-hover:opacity-20 transition-opacity duration-500 blur-2xl ${theme.bg.replace(
          "bg-",
          "bg-"
        )}`}
      />

      <div className="relative z-10 flex flex-col h-full">
        <div className="flex justify-between items-start mb-5">
          <div
            className={`p-3.5 rounded-2xl ${theme.bg} ${theme.color} shadow-inner`}
          >
            <Icon className="h-6 w-6" strokeWidth={2.5} />
          </div>

          <div className="flex flex-col items-end">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
              {academy.academyType}
            </span>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
            {academy.academyName}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <span
              className={`inline-block w-2 h-2 rounded-full ${
                isDiscontinued ? "bg-red-500" : "bg-green-500 animate-pulse"
              }`}
            ></span>
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              {isDiscontinued ? "Discontinued" : "Active Academy"}
            </span>
          </div>
        </div>

        <div className="space-y-3 mb-6 flex-grow">
          <InfoRow icon={Mail} text={academy.email as string} />
          <InfoRow icon={Phone} text={academy.contactNumber as string} />
          <InfoRow
            icon={CalendarDays}
            text={`Joined ${new Date(
              academy?.registrationDate!
            ).toLocaleDateString()}`}
          />
        </div>

        <div className="pt-4 border-t border-gray-100 dark:border-gray-800/60 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 px-3 py-1.5 rounded-lg">
            <PieChart className="h-3.5 w-3.5" />
            <span>Share: {academy.share_tanna ?? 0}%</span>
          </div>

          <div className="flex items-center gap-1 text-sm font-semibold text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-all transform translate-x-[-10px] group-hover:translate-x-0">
            Details <ArrowLeft className="h-4 w-4 rotate-180" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

const InfoRow = ({ icon: Icon, text }: { icon: LucideIcon, text: string }) => (
  <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400 group/row hover:text-gray-900 dark:hover:text-gray-200 transition-colors">
    <Icon className="h-4 w-4 text-gray-400 group-hover/row:text-blue-500 transition-colors" />
    <span className="truncate">{text}</span>
  </div>
);

function AcademyCardSkeleton() {
  return (
    <div className="h-[320px] bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 dark:via-gray-700/20 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />

      <div className="flex justify-between items-start mb-6">
        <div className="h-12 w-12 bg-gray-200 dark:bg-gray-800 rounded-2xl" />
        <div className="h-6 w-16 bg-gray-200 dark:bg-gray-800 rounded-full" />
      </div>

      <div className="h-6 w-3/4 bg-gray-200 dark:bg-gray-800 rounded-md mb-2" />
      <div className="h-4 w-1/4 bg-gray-200 dark:bg-gray-800 rounded-md mb-8" />

      <div className="space-y-3 mb-8">
        <div className="h-4 w-full bg-gray-200 dark:bg-gray-800 rounded-md" />
        <div className="h-4 w-full bg-gray-200 dark:bg-gray-800 rounded-md" />
        <div className="h-4 w-2/3 bg-gray-200 dark:bg-gray-800 rounded-md" />
      </div>

      <div className="h-8 w-24 bg-gray-200 dark:bg-gray-800 rounded-lg" />
    </div>
  )
}