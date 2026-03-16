
"use client"

import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Trophy, Medal, Star, Fish, Crown, TrendingUp } from 'lucide-react';
import { UserProfile } from '@/lib/types';

const TOP_3: UserProfile[] = [
  { id: '1', name: 'Thierry L.', role: 'user', totalPoints: 12450, catchesCount: 42 },
  { id: '2', name: 'Sophie M.', role: 'user', totalPoints: 10820, catchesCount: 38 },
  { id: '3', name: 'Lucas R.', role: 'user', totalPoints: 9400, catchesCount: 31 },
];

const GENERAL_RANKING: UserProfile[] = [
  { id: '4', name: 'Marc Dupont', role: 'user', totalPoints: 8900, catchesCount: 28 },
  { id: '5', name: 'Claire Petit', role: 'user', totalPoints: 7600, catchesCount: 25 },
  { id: '6', name: 'Nathalie Martin', role: 'user', totalPoints: 7200, catchesCount: 22 },
  { id: '7', name: 'Arnaud Leroy', role: 'user', totalPoints: 6800, catchesCount: 19 },
  { id: '8', name: 'Julie Bernard', role: 'user', totalPoints: 5400, catchesCount: 15 },
];

export default function ClassementPage() {
  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        <header className="mb-12 text-center">
          <h1 className="font-headline text-5xl font-bold text-primary mb-2">Tableau d'Honneur</h1>
          <p className="text-muted-foreground">Classement officiel de la Rade de Brest</p>
        </header>

        {/* Podium */}
        <div className="grid md:grid-cols-3 gap-6 items-end mb-16 max-w-5xl mx-auto">
          {/* Second Place */}
          <Card className="order-2 md:order-1 border-none shadow-lg bg-white/50 relative overflow-hidden h-[300px] flex flex-col justify-end">
            <div className="absolute top-4 right-4 text-slate-400">
               <Medal className="h-12 w-12" />
            </div>
            <CardContent className="p-6 text-center">
              <Avatar className="h-20 w-20 mx-auto mb-4 border-4 border-slate-200">
                <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=Sophie" />
                <AvatarFallback>SM</AvatarFallback>
              </Avatar>
              <h3 className="font-headline text-xl font-bold">{TOP_3[1].name}</h3>
              <p className="text-primary font-bold text-lg">{TOP_3[1].totalPoints} pts</p>
              <Badge variant="secondary" className="mt-2">2ème Place</Badge>
            </CardContent>
          </Card>

          {/* First Place */}
          <Card className="order-1 md:order-2 border-primary border-2 shadow-2xl bg-white relative overflow-hidden h-[380px] flex flex-col justify-end scale-105 z-10">
            <div className="absolute top-4 left-1/2 -translate-x-1/2 text-yellow-500 animate-bounce">
               <Crown className="h-16 w-16" />
            </div>
            <CardContent className="p-8 text-center">
              <Avatar className="h-28 w-28 mx-auto mb-4 border-4 border-yellow-400">
                <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=Thierry" />
                <AvatarFallback>TL</AvatarFallback>
              </Avatar>
              <h3 className="font-headline text-2xl font-bold">{TOP_3[0].name}</h3>
              <p className="text-primary font-bold text-2xl">{TOP_3[0].totalPoints} pts</p>
              <Badge className="bg-yellow-400 hover:bg-yellow-500 text-slate-900 mt-3 font-bold text-sm">Champion en Titre</Badge>
            </CardContent>
          </Card>

          {/* Third Place */}
          <Card className="order-3 border-none shadow-lg bg-white/50 relative overflow-hidden h-[260px] flex flex-col justify-end">
             <div className="absolute top-4 right-4 text-amber-700 opacity-60">
               <Medal className="h-10 w-10" />
            </div>
            <CardContent className="p-6 text-center">
              <Avatar className="h-16 w-16 mx-auto mb-4 border-4 border-amber-600/30">
                <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=Lucas" />
                <AvatarFallback>LR</AvatarFallback>
              </Avatar>
              <h3 className="font-headline text-lg font-bold">{TOP_3[2].name}</h3>
              <p className="text-primary font-bold">{TOP_3[2].totalPoints} pts</p>
              <Badge variant="outline" className="mt-2">3ème Place</Badge>
            </CardContent>
          </Card>
        </div>

        {/* Record / Big Fish */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <Card className="bg-slate-900 text-white border-none overflow-hidden group">
            <div className="absolute inset-0 opacity-20 pointer-events-none bg-[url('https://picsum.photos/seed/water/800/400')] bg-cover"></div>
            <CardHeader>
              <CardTitle className="font-headline flex items-center gap-2">
                <Star className="h-6 w-6 text-yellow-400 fill-yellow-400" />
                Record Big Fish
              </CardTitle>
              <CardDescription className="text-slate-400">La plus grosse prise enregistrée cette saison.</CardDescription>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="flex items-center gap-6">
                <div className="bg-primary/20 p-4 rounded-full">
                  <Fish className="h-12 w-12 text-primary" />
                </div>
                <div>
                  <h4 className="text-3xl font-headline font-bold">Bar Franc - 84cm</h4>
                  <p className="text-slate-300">Capturé par <span className="text-white font-bold">Arnaud Leroy</span></p>
                  <p className="text-xs text-slate-500 mt-1">Date: 14 Octobre 2024</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md bg-accent/10">
            <CardHeader>
              <CardTitle className="font-headline flex items-center gap-2 text-primary">
                <TrendingUp className="h-6 w-6" />
                Performance du Mois
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-muted-foreground uppercase font-bold tracking-wider">Top Grimpeur</p>
                  <p className="text-2xl font-headline font-bold">Marine B.</p>
                  <p className="text-sm text-green-600 font-bold">+12 places cette semaine</p>
                </div>
                <Avatar className="h-16 w-16">
                   <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=Marine" />
                </Avatar>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* General Ranking Table */}
        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-2xl">Classement Général</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Rang</TableHead>
                  <TableHead>Pêcheur</TableHead>
                  <TableHead className="text-center">Prises</TableHead>
                  <TableHead className="text-right">Score Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {GENERAL_RANKING.map((user, idx) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-bold text-muted-foreground">#{idx + 4}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`} />
                        </Avatar>
                        <span className="font-medium">{user.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">{user.catchesCount}</TableCell>
                    <TableCell className="text-right font-headline font-bold text-primary">{user.totalPoints.toLocaleString()} pts</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
