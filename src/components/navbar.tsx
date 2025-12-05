"use client";

import {
  Bell,
  LogIn,
  Menu,
  Moon,
  Settings,
  Sun,
  User,
  Users,
  Layers,
  ChevronRight,
  Home,
  IdCard,
  Activity,
} from "lucide-react";
import { motion } from "framer-motion";
import { useTheme } from "../contexts/theme-context";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/authContext";
import { useNavigate } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import { getBatchMemberRequests } from "@/api/enrollmentActions.api";
import { toast } from "@/hooks/use-toast";
import AcceptBatchRequest from "./view/enrollment-actions/AcceptBatchRequest";

interface NavbarProps {
  onMenuClick: () => void;
}

type RequestItem = {
  batchMemberId: number;
  batchId: number;
  memberId: number;
  status: string;
  enrollmentId: number;
  createdAt: string;
  startDate: string | null;
  endDate: string | null;
  reason?: string | null;
  batchName?: string | null;
  memberName?: string | null;
};

interface SettingsGroup {
  category: string;
  icon: React.ElementType;
  href?: string;
  items?: {
    label: string;
    href: string;
    icon: React.ElementType;
  }[];
}

const settingsMenu: SettingsGroup[] = [
  {
    category: "Family Settings",
    icon: Home,
    items: [
      { label: "Family Types", href: "/setting/family-type", icon: Users },
      {
        label: "Team Categories",
        href: "/setting/team-category",
        icon: Layers,
      },
      { label: "Identity Types", href: "/setting/identity-type", icon: IdCard },
    ],
  },
  {
    category: "Common Lookups",
    icon: Settings,
    href: "/setting/common-lookups",
  },
  {
    category: "Activity Settings",
    icon: Activity,
    href: "/setting/activity",
  },
];

export default function Navbar({ onMenuClick }: NavbarProps) {
  const { theme, toggleTheme } = useTheme();
  const { logout, user, token } = useAuth();
  const navigate = useNavigate();
  const [userImage, setUserImage] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [requestLen, setRequestLen] = useState<number>(0);

  // NEW: sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const fetchUserImage = async () => {
    if (!user?.profileImage || !token) return;

    const response = await fetch(
      `${import.meta.env.VITE_APP_API_URL}/${user.profileImage}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (response.ok) {
      const blob = await response.blob();
      const imageUrl = URL.createObjectURL(blob);
      setUserImage(imageUrl);
    }
  };

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getBatchMemberRequests();
      setRequests(data.data || []);
      setRequestLen(data.data.length);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to fetch requests";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUserImage();
    fetchRequests();
  }, [user, token]);

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="fixed top-0 left-0 right-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border"
      >
        <div className="flex items-center justify-between px-4 h-16">
          {/* Left Section */}
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={onMenuClick}
              className="lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </Button>

            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center cursor-pointer space-x-2"
              onClick={() => {
                navigate("/");
              }}
            >
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-background font-bold text-sm">CM</span>
              </div>
              <span className="font-bold text-xl hidden sm:block">TSL</span>
            </motion.div>
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-2">
            {/* Notifications -> open sidebar */}
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={() => setSidebarOpen(true)} // OPEN SIDEBAR
            >
              <Bell className="h-5 w-5" />
              {requestLen != 0 && (
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full text-xs flex items-center justify-center text-white">
                  {requestLen}
                </span>
              )}
            </Button>

            {/* Settings (unchanged) */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Settings className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72 p-2">
                <DropdownMenuLabel className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Settings
                </DropdownMenuLabel>

                {settingsMenu.map((group, groupIndex) => {
                  const GroupIcon = group.icon;

                  return (
                    <div key={group.category}>
                      {groupIndex > 0 && (
                        <DropdownMenuSeparator className="my-2" />
                      )}

                      <DropdownMenuItem
                        key={group.href}
                        onClick={() =>
                          group.href ? navigate(group.href) : null
                        }
                        className="px-2 py-1.5 mb-1"
                      >
                        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                          <div className="p-1 rounded-md bg-blue-600/10">
                            <GroupIcon className="h-3.5 w-3.5 text-blue-600" />
                          </div>
                          <span>{group.category}</span>
                        </div>
                      </DropdownMenuItem>

                      {group.items && (
                        <div className="space-y-0.5 ml-2 pl-3 border-l-2 border-border/30">
                          {group.items.map((item) => {
                            const ItemIcon = item.icon;

                            return (
                              <DropdownMenuItem
                                key={item.href}
                                onClick={() => navigate(item.href)}
                                className="cursor-pointer rounded-md px-2 py-2 hover:bg-accent/70 transition-colors group"
                              >
                                <div className="flex items-center justify-between w-full">
                                  <div className="flex items-center gap-2.5">
                                    <ItemIcon className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                                    <span className="text-sm font-medium">
                                      {item.label}
                                    </span>
                                  </div>
                                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                              </DropdownMenuItem>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}

                <DropdownMenuSeparator className="my-2" />

                <DropdownMenuItem
                  onClick={() => navigate("/setting/family-type")}
                  className="cursor-pointer rounded-md px-2 py-2 hover:bg-accent/70 transition-colors"
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-sm font-medium text-blue-600">
                      View All Settings
                    </span>
                    <ChevronRight className="h-4 w-4 text-blue-600" />
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Theme Toggle */}
            <Button variant="ghost" size="icon" onClick={toggleTheme}>
              <motion.div
                initial={false}
                animate={{ rotate: theme === "dark" ? 180 : 0 }}
                transition={{ duration: 0.3 }}
              >
                {theme === "dark" ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
              </motion.div>
            </Button>

            {/* Login/Profile */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    {userImage ? (
                      <img
                        src={userImage}
                        alt={user?.username}
                        className="rounded-full h-5 w-5"
                      />
                    ) : (
                      <User className="h-5 w-5" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <div className="px-3 py-2 border-b border-border mb-1">
                    <span className="font-semibold text-sm">
                      {user?.username}
                    </span>
                  </div>
                  <DropdownMenuItem>Profile</DropdownMenuItem>
                  <DropdownMenuItem onClick={logout}>Logout</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => (window.location.href = "/login")}
              >
                <LogIn className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>
      </motion.nav>

      {/* Sidebar component rendered here */}
      {requests && sidebarOpen && (
        <AcceptBatchRequest
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          setRequestLen={setRequestLen}
          requestData={requests}
          onAccepted={() => {
            // optional: do extra work after accept (refresh UI)
            // e.g. toast or refetch something
          }}
        />
      )}
    </>
  );
}
