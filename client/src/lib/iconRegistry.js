import {
  LayoutDashboard,
  Calendar,
  Users,
  UserCheck,
  BookOpen,
  BarChart3,
  UserCircle,
  Settings,
  HelpCircle,
  LogOut,
  Bell,
  Menu,
  Search,
  ChevronRight,
  AlertTriangle,
  Check,
  Folder,
  FileText,
  ShieldAlert,
  Inbox,
  Plus,
  GraduationCap,
  TrendingUp,
  BrainCircuit,
  Compass,
  Database,
  Target,
  Clock,
  Sparkles,
  ListTodo,
  UserPlus,
  Award,
  AlertCircle,
  Activity,
  CheckCircle2,
  HeartHandshake,
  ShieldCheck,
  Mic,
  MessagesSquare,
} from "lucide-react";

/**
 * Icon Registry Map
 * Maps string icon identifiers to React icon components.
 * Keeps data files (like navigation.js) pure and UI-framework independent.
 */
const ICON_MAP = {
  LayoutDashboard,
  Calendar,
  Users,
  UserCheck,
  BookOpen,
  BarChart3,
  UserCircle,
  Settings,
  HelpCircle,
  LogOut,
  Bell,
  Menu,
  Search,
  ChevronRight,
  AlertTriangle,
  Check,
  Folder,
  FileText,
  ShieldAlert,
  Inbox,
  Plus,
  GraduationCap,
  TrendingUp,
  BrainCircuit,
  Compass,
  Database,
  Target,
  Clock,
  Sparkles,
  ListTodo,
  UserPlus,
  Award,
  AlertCircle,
  Activity,
  CheckCircle2,
  HeartHandshake,
  ShieldCheck,
  Mic,
  MessagesSquare,
};

/**
 * Resolves a string icon name to its corresponding icon component.
 * @param {string} iconName - String key from navigation config
 * @param {React.Component} fallback - Fallback icon component
 * @returns {React.Component}
 */
export function getIcon(iconName, fallback = Folder) {
  if (!iconName) return fallback;
  return ICON_MAP[iconName] || fallback;
}

export default ICON_MAP;
