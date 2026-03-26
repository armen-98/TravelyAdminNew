import {
  LayoutDashboard,
  Users,
  MapPin,
  Tag,
  Bell,
  FileImage,
  BookOpen,
  FolderOpen,
  MessageSquare,
  Mail,
} from "lucide-react";

export type NavItem = {
  title: string;
  href: string;
  icon: React.ElementType;
  roles: string[];
};

export const navItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
    roles: ["super-admin", "admin", "moderator"],
  },
  {
    title: "Users",
    href: "/users",
    icon: Users,
    roles: ["super-admin", "admin"],
  },
  {
    title: "Places",
    href: "/places",
    icon: MapPin,
    roles: ["super-admin", "admin", "moderator"],
  },
  {
    title: "Reviews",
    href: "/reviews",
    icon: MessageSquare,
    roles: ["super-admin", "admin", "moderator"],
  },
  {
    title: "Contact Us",
    href: "/contact",
    icon: Mail,
    roles: ["super-admin", "admin"],
  },
  {
    title: "Categories",
    href: "/categories",
    icon: FolderOpen,
    roles: ["super-admin", "admin"],
  },
  {
    title: "Blog",
    href: "/blog",
    icon: BookOpen,
    roles: ["super-admin", "admin", "moderator"],
  },
  {
    title: "Tags",
    href: "/tags",
    icon: Tag,
    roles: ["super-admin", "admin"],
  },
  {
    title: "Notifications",
    href: "/notifications",
    icon: Bell,
    roles: ["super-admin", "admin"],
  },
  {
    title: "Files",
    href: "/files",
    icon: FileImage,
    roles: ["super-admin", "admin"],
  },
];
