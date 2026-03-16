"use client"

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Fish, Trophy, CirclePlus, Settings, Home, LogIn, User, LogOut } from 'lucide-react';
import { useUser, useAuth } from '@/firebase';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const navItems = [
  { href: '/', label: 'Accueil', icon: Home },
  { href: '/guide', label: 'Guide', icon: Fish },
  { href: '/concours', label: 'Concours', icon: CirclePlus },
  { href: '/classement', label: 'Classement', icon: Trophy },
  { href: '/admin', label: 'Admin', icon: Settings },
];

export function Navigation() {
  const pathname = usePathname();
  const { user, isUserLoading } = useUser();
  const auth = useAuth();

  const handleLogout = () => {
    auth.signOut();
  };

  const isAnonymous = user?.isAnonymous;

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <div className="bg-primary p-2 rounded-lg">
              <Fish className="h-6 w-6 text-white" />
            </div>
            <span className="font-headline text-xl font-bold tracking-tight text-primary">RADE CATCH</span>
          </Link>
        </div>
        
        <div className="hidden md:flex items-center gap-6">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary",
                pathname === item.href ? "text-primary" : "text-muted-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}

          <div className="ml-4 border-l pl-6">
            {!user || isAnonymous ? (
              <Button asChild variant="default" size="sm" className="font-bold">
                <Link href="/auth">
                  <LogIn className="h-4 w-4 mr-2" /> Connexion
                </Link>
              </Button>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.displayName}`} />
                      <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.displayName || "Pêcheur"}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Déconnexion</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        <div className="md:hidden flex fixed bottom-0 left-0 w-full bg-background border-t p-2 justify-around items-center">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 text-[10px] transition-colors hover:text-primary",
                pathname === item.href ? "text-primary" : "text-muted-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          ))}
          <Link
            href="/auth"
            className={cn(
              "flex flex-col items-center gap-1 text-[10px] transition-colors hover:text-primary",
              pathname === '/auth' ? "text-primary" : "text-muted-foreground"
            )}
          >
            <User className="h-5 w-5" />
            Compte
          </Link>
        </div>
      </div>
    </nav>
  );
}