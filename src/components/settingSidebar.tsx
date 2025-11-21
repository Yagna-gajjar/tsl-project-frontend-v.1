import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Users,
  Layers,
  IdCard,
  ArrowLeftFromLineIcon,
} from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

interface navigationItems {
  icon: React.ElementType;
  name: string;
  href?: string;
  submenu?: { label: string; href: string }[];
}

const navigationItems = [
  { name: "Family Type", href: "/setting/family-type", icon: Users },
  { name: "Team Category", href: "/setting/team-category", icon: Layers },
  { name: "Identity Type", href: "/setting/identity-type", icon: IdCard },
];

export default function SettingSidebar({ onClose }: { onClose?: () => void }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const location = useLocation();

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <motion.div
      initial={{ x: -300 }}
      animate={{ x: 0 }}
      transition={{ type: "spring", damping: 30, stiffness: 300 }}
      className={cn(
        "bg-card border-r mt-1 border-border h-screen transition-all duration-300 ease-in-out relative",
        isExpanded ? "w-64" : "w-16"
      )}
    >
      {/* Toggle Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleExpanded}
        className="absolute -right-3 bg-red-800 top-12 z-50 h-6 w-6 rounded-full border border-border bg-background shadow-md hidden lg:flex"
      >
        {isExpanded ? (
          <ChevronLeft className="h-3 w-3" />
        ) : (
          <ChevronRight className="h-3 w-3" />
        )}
      </Button>

      <div className="p-4">
        <Link to={"/dashboard"}>
          <AnimatePresence mode="wait">
            {isExpanded ? (
              <motion.h2
                key="expanded"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="text-lg flex items-center gap-2 px-4 py-2 bg-blue-200 w-fit rounded-xl font-semibold text-foreground mb-6"
              >
                <ArrowLeftFromLineIcon className="h-5 w-5 flex-shrink-0" /> Back
              </motion.h2>
            ) : (
              <motion.div
                key="collapsed"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="h-6 mb-6"
              >
                <ArrowLeftFromLineIcon className="h-8 w-8 flex-shrink-0 bg-blue-200 px-2 py-1 rounded-xl" />{" "}
              </motion.div>
            )}
          </AnimatePresence>
        </Link>

        <nav className="space-y-2">
          {navigationItems.map((item) => {
            const isActive = location.pathname.indexOf(item.href) != -1;
            const Icon = item.icon;

            return (
              <motion.div
                key={item.name}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Link
                  to={item.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors duration-200",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent",
                    !isExpanded && "justify-center"
                  )}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: "auto" }}
                        exit={{ opacity: 0, width: 0 }}
                        transition={{ duration: 0.2 }}
                        className="font-medium whitespace-nowrap overflow-hidden"
                      >
                        {item.name}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Link>
              </motion.div>
            );
          })}
        </nav>
      </div>
    </motion.div>
  );
}
