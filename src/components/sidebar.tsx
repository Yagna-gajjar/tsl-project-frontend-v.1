"use client";

import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  BarChart3,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  User,
  User2,
  ChevronDown,
  LandPlot,
  Building2,
  MapPinned,
  Users,
  Award,
  BookA,
  Layers,
  Book,
  IndianRupee,
  Crown,
  Share2,
  Package,
  CircleSlash,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SubMenuItem {
  label: string;
  href: string;
  icon?: React.ElementType;
}

interface NavigationItem {
  name: string;
  href?: string;
  icon: React.ElementType;
  submenu?: SubMenuItem[] | null;
}

interface SidebarProps {
  onClose?: () => void;
}

const navigationItems: NavigationItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  {
    name: "Enrollment Dashboard",
    href: "/enrollment-dashboard",
    icon: Book,
  },
  {
    name: "Account",
    icon: User2,
    submenu: [
      { label: "Accounts", href: "/account/accounts", icon: User },
      { label: "Accounts Member", href: "/account/account-member", icon: User },
    ],
  },
  { name: "Authority", href: "/authority", icon: CircleSlash },
  {
    name: "Courses",
    icon: BookA,
    submenu: [
      { label: "Courses", href: "/course/courses", icon: BookA },
      { label: "Course Share", href: "/course/course-share", icon: Share2 },
      { label: "Course Rate", href: "/course/course-rate", icon: IndianRupee },
      {
        label: "Course Packages",
        href: "/course/course-package",
        icon: Package,
      },
    ],
  },
  {
    name: "Batch",
    href: "/batch",
    icon: Layers,
    submenu: [
      { label: "Batches", href: "/batch/batches", icon: User },
      {
        label: "Batch Connection",
        href: "/batch/batch-connection",
        icon: User,
      },
    ],
  },
  {
    name: "Enrollment",
    href: "/enrollment",
    icon: BookA,
  },
  {
    name: "Discount",
    href: "/discount",
    icon: CreditCard,
  },
  {
    name: "Member",
    icon: User,
    href: "/member",
  },
  {
    name: "infrastructure & Configurations",
    href: "/infrastructure-configurations",
    icon: Building2,
    submenu: [
      {
        label: "Facility",
        icon: MapPinned,
        href: "/infrastructure-configurations/facility",
      },
      {
        label: "Facility Allotment",
        icon: MapPinned,
        href: "/infrastructure-configurations/facility-allotment",
      },
      {
        label: "Area",
        icon: LandPlot,
        href: "/infrastructure-configurations/area",
      },
    ],
  },
  { name: "Billing", href: "/billing", icon: IndianRupee },
  {
    name: "Staff Management",
    href: "/staff-management",
    icon: Users,
    submenu: [
      // { label: "Coach", href: "/staff-management/coach", icon: Users },
      {
        label: "Coach Assignment",
        href: "/staff-management/coach-assignment",
        icon: Users,
      },
      { label: "Skills", href: "/staff-management/coach-skills", icon: Award },
      {
        label: "Staff Attendance",
        href: "/staff-management/attendance",
        icon: User,
      },
    ],
  },
  { name: "payment", href: "/payment", icon: BarChart3 },
  { name: "Debit Note", href: "/debit-note", icon: CreditCard },
  {
    name: "Membership",
    icon: Crown,
    submenu: [
      { label: "Membership Master", href: "/membership-master" },
      { label: "Membership Reg", href: "/membership-registration" },
      { label: "Membership Link", href: "/membership-link" },
    ],
  },
];

export default function Sidebar({ onClose }: SidebarProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({
    Family: true,
  });
  const location = useLocation();

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  const toggleSection = (name: string) => {
    setExpandedSections((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const handleSectionClick = (item: NavigationItem) => {
    if (item.submenu && isExpanded) {
      toggleSection(item.name);
    }
  };

  return (
    <motion.div
      initial={{ x: -300 }}
      animate={{ x: 0 }}
      transition={{ type: "spring", damping: 30, stiffness: 300 }}
      className={cn(
        "bg-card border-r mt-1 border-border h-screen transition-all duration-300 ease-in-out relative flex flex-col",
        isExpanded ? "w-64" : "w-16"
      )}
    >
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleExpanded}
        className="absolute -right-3 bg-red-800 top-12 z-50 h-6 w-6 rounded-full border border-border bg-background shadow-md hidden lg:flex items-center justify-center"
      >
        {isExpanded ? (
          <ChevronLeft className="h-3 w-3" />
        ) : (
          <ChevronRight className="h-3 w-3" />
        )}
      </Button>

      <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 no-scrollbar">
        <AnimatePresence mode="wait">
          {isExpanded ? (
            <motion.h2
              key="expanded"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="text-lg font-semibold text-foreground mt-12 mb-6"
            ></motion.h2>
          ) : (
            <motion.div
              key="collapsed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="h-6 mb-6"
            />
          )}
        </AnimatePresence>

        <nav className="space-y-2 pb-10">
          {navigationItems.map((item) => {
            const hasSubmenu =
              Array.isArray(item.submenu) && item.submenu.length > 0;
            const isSectionExpanded = expandedSections[item.name];

            const Icon = item.icon;
            if (item.href && !hasSubmenu) {
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
                      "w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors duration-200",
                      location.pathname === item.href
                        ? "bg-blue-600 text-background"
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
                          transition={{ duration: 0.18 }}
                          className="font-medium whitespace-nowrap overflow-hidden"
                        >
                          {item.name}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </Link>
                </motion.div>
              );
            }

            return (
              <div key={item.name} className="space-y-1">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleSectionClick(item)}
                  className={cn(
                    "w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors duration-200",
                    location.pathname.startsWith(item.href + "/")
                      ? "bg-blue-600 text-background"
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
                        transition={{ duration: 0.18 }}
                        className="font-medium whitespace-nowrap overflow-hidden"
                      >
                        {item.name}
                      </motion.span>
                    )}
                  </AnimatePresence>

                  <AnimatePresence>
                    {isExpanded && hasSubmenu && (
                      <motion.div
                        initial={{ opacity: 0, rotate: -90 }}
                        animate={{
                          opacity: 1,
                          rotate: isSectionExpanded ? 0 : -90,
                        }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.18 }}
                        className="ml-auto"
                      >
                        <ChevronDown
                          className={`h-4 w-4 ${location.pathname.startsWith(item.href + "/")
                              ? "text-background"
                              : "text-muted-foreground"
                            }`}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.button>

                <AnimatePresence>
                  {isSectionExpanded && hasSubmenu && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.18 }}
                      className={cn(
                        "space-y-1",
                        isExpanded
                          ? "ml-3 pl-6 border-l-2 border-border/30"
                          : "ml-0"
                      )}
                    >
                      {item.submenu!.map((sub) => {
                        const SubIcon = sub.icon ?? Icon;
                        return (
                          <motion.div
                            key={sub.href}
                            whileHover={{
                              x: isExpanded ? 2 : 0,
                              scale: !isExpanded ? 1.05 : 1,
                            }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <Link
                              to={sub.href}
                              onClick={onClose}
                              className={cn(
                                "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group",
                                location.pathname === sub.href
                                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                                  : "text-muted-foreground hover:text-foreground hover:bg-accent",
                                !isExpanded && "justify-center"
                              )}
                            >
                              <SubIcon
                                className={cn(
                                  "h-4 w-4 flex-shrink-0",
                                  location.pathname === sub.href && "scale-110"
                                )}
                              />
                              <AnimatePresence>
                                {isExpanded && (
                                  <motion.span
                                    initial={{ opacity: 0, width: 0 }}
                                    animate={{ opacity: 1, width: "auto" }}
                                    exit={{ opacity: 0, width: 0 }}
                                    transition={{ duration: 0.18 }}
                                    className="text-sm font-medium whitespace-nowrap overflow-hidden"
                                  >
                                    {sub.label}
                                  </motion.span>
                                )}
                              </AnimatePresence>
                              {location.pathname === sub.href && isExpanded && (
                                <motion.div
                                  layoutId="activeIndicator"
                                  className="ml-auto w-1.5 h-1.5 rounded-full bg-white"
                                  transition={{
                                    type: "spring",
                                    stiffness: 300,
                                    damping: 30,
                                  }}
                                />
                              )}
                            </Link>
                          </motion.div>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </nav>
      </div>
    </motion.div>
  );
}