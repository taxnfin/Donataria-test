import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../App";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  LayoutDashboard,
  Users,
  Gift,
  FileText,
  Calendar,
  ClipboardList,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight
} from "lucide-react";

const DashboardLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Donantes", href: "/donantes", icon: Users },
    { name: "Donativos", href: "/donativos", icon: Gift },
    { name: "CFDIs", href: "/cfdis", icon: FileText, accent: true },
    { name: "Calendario Fiscal", href: "/calendario", icon: Calendar },
    { name: "Transparencia", href: "/transparencia", icon: ClipboardList },
  ];

  const isActive = (href) => location.pathname === href;

  return (
    <div className="min-h-screen bg-[#F7F6F3]">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 z-50 h-full w-64 bg-gray-900 transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-800">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg text-white" style={{ fontFamily: 'Chivo, sans-serif' }}>
              DonatariaSAT
            </span>
          </Link>
          <button 
            className="lg:hidden text-gray-400 hover:text-white"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  active 
                    ? item.accent 
                      ? "bg-violet-600 text-white" 
                      : "bg-emerald-600 text-white"
                    : "text-gray-400 hover:bg-gray-800 hover:text-white"
                }`}
                data-testid={`nav-${item.name.toLowerCase().replace(' ', '-')}`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.name}</span>
                {active && <ChevronRight className="w-4 h-4 ml-auto" />}
              </Link>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-800">
          <Link
            to="/configuracion"
            onClick={() => setSidebarOpen(false)}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              isActive("/configuracion")
                ? "bg-emerald-600 text-white"
                : "text-gray-400 hover:bg-gray-800 hover:text-white"
            }`}
            data-testid="nav-configuracion"
          >
            <Settings className="w-5 h-5" />
            <span className="font-medium">Configuración</span>
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-100 h-16">
          <div className="flex items-center justify-between h-full px-4 lg:px-8">
            <button
              className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              onClick={() => setSidebarOpen(true)}
              data-testid="mobile-menu-btn"
            >
              <Menu className="w-6 h-6" />
            </button>

            <div className="hidden lg:block">
              <h2 className="text-lg font-semibold text-gray-900" style={{ fontFamily: 'Chivo, sans-serif' }}>
                {navigation.find(n => isActive(n.href))?.name || "DonatariaSAT"}
              </h2>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-3 h-auto py-2" data-testid="user-menu-btn">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={user?.picture} />
                    <AvatarFallback className="bg-emerald-100 text-emerald-700">
                      {user?.name?.charAt(0)?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:block text-sm font-medium text-gray-700">
                    {user?.name}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div>
                    <p className="font-medium">{user?.name}</p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/configuracion" className="flex items-center gap-2 cursor-pointer">
                    <Settings className="w-4 h-4" />
                    Configuración
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={handleLogout}
                  className="text-red-600 focus:text-red-600 cursor-pointer"
                  data-testid="logout-btn"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Cerrar Sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
