
"use client"

import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy, Medal, Star, Fish, Crown, TrendingUp, Loader2 } from 'lucide-react';
import { UserProfile, Catch } from '@/lib/types';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit, where } from 'firebase/firestore';

export default function ClassementPage() {
  const firestore = useFirestore();

  // Query for top users by points
  const topUsersQuery = useMemoFirebase(() => 
    query(collection(firestore, 'users'), orderBy('totalPoints', 'desc'), limit(10)), 
  [firestore]);

  // Query for the biggest approved catch (Record Big Fish)
  const bigFishQuery = useMemoFirebase(() => 
    query(collection(firestore, 'catches'), where('status', '==', 'approved'), orderBy('length', 'desc'), limit(1)), 
  [firestore]);

  const { data: rankings, isLoading: loadingRankings } = useCollection<UserProfile>(topUsersQuery);
  const { data: bigFishes, isLoading: loadingBigFish } = useCollection<Catch>(bigFishQuery);

  const top3 = rankings?.slice(0, 3) || [];
  const generalRanking = rankings?.slice(3) || [];
  const recordCatch = bigFishes?.[0];

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        <header className="mb-12 text-center">
          <h1 className="font-headline text-5xl font-bold text-primary mb-2">Tableau d'Honneur</h1>
          <p className="text-muted-foreground">Classement officiel de la Rade de Brest</p>
        </header>

        {loadingRankings ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>
        ) : (
          <>
            {/* Podium */}
            <div className="grid md:grid-cols-3 gap-6 items-end mb-16 max-w-5xl mx-auto">
              {/* Second Place */}
              {top3[1] && (
                <Card className="order-2 md:order-1 border-none shadow-lg bg-white/50 relative overflow-hidden h-[300px] flex flex-col justify-end">
                  <div className="absolute top-4 right-4 text-slate-400">
                     <Medal className="h-12 w-12" />
                  </div>
                  <CardContent className="p-6 text-center">
                    <Avatar className="h-20 w-20 mx-auto mb-4 border-4 border-slate-200">
                      <AvatarImage src={top3[1].avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${top3[1].name}`} />
                      <AvatarFallback>{top3[1].name.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <h3 className="font-headline text-xl font-bold">{top3[1].name}</h3>
                    <p className="text-primary font-bold text-lg">{top3[1].totalPoints.toLocaleString()} pts</p>
                    <Badge variant="secondary" className="mt-2">2ème Place</Badge>
                  </CardContent>
                </Card>
              )}

              {/* First Place */}
              {top3[0] && (
                <Card className="order-1 md:order-2 border-primary border-2 shadow-2xl bg-white relative overflow-hidden h-[380px] flex flex-col justify-end scale-105 z-10">
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 text-yellow-500 animate-bounce">
                     <Crown className="h-16 w-16" />
                  </div>
                  <CardContent className="p-8 text-center">
                    <Avatar className="h-28 w-28 mx-auto mb-4 border-4 border-yellow-400">
                      <AvatarImage src={top3[0].avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${top3[0].name}`} />
                      <AvatarFallback>{top3[0].name.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <h3 className="font-headline text-2xl font-bold">{top3[0].name}</h3>
                    <p className="text-primary font-bold text-2xl">{top3[0].totalPoints.toLocaleString()} pts</p>
                    <Badge className="bg-yellow-400 hover:bg-yellow-500 text-slate-900 mt-3 font-bold text-sm">Champion en Titre</Badge>
                  </CardContent>
                </Card>
              )}

              {/* Third Place */}
              {top3[2] && (
                <Card className="order-3 border-none shadow-lg bg-white/50 relative overflow-hidden h-[260px] flex flex-col justify-end">
                   <div className="absolute top-4 right-4 text-amber-700 opacity-60">
                     <Medal className="h-10 w-10" />
                  </div>
                  <CardContent className="p-6 text-center">
                    <Avatar className="h-16 w-16 mx-auto mb-4 border-4 border-amber-600/30">
                      <AvatarImage src={top3[2].avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${top3[2].name}`} />
                      <AvatarFallback>{top3[2].name.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <h3 className="font-headline text-lg font-bold">{top3[2].name}</h3>
                    <p className="text-primary font-bold">{top3[2].totalPoints.toLocaleString()} pts</p>
                    <Badge variant="outline" className="mt-2">3ème Place</Badge>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Record / Big Fish */}
            <div className="grid md:grid-cols-2 gap-8 mb-16">
              <Card className="bg-slate-900 text-white border-none overflow-hidden group min-h-[160px]">
                <div className="absolute inset-0 opacity-20 pointer-events-none bg-[url('https://picsum.photos/seed/water/800/400')] bg-cover"></div>
                <CardHeader>
                  <CardTitle className="font-headline flex items-center gap-2">
                    <Star className="h-6 w-6 text-yellow-400 fill-yellow-400" />
                    Record Big Fish
                  </CardTitle>
                  <CardDescription className="text-slate-400">La plus grosse prise enregistrée cette saison.</CardDescription>
                </CardHeader>
                <CardContent className="relative z-10">
                  {loadingBigFish ? <Loader2 className="animate-spin h-6 w-6" /> : recordCatch ? (
                    <div className="flex items-center gap-6">
                      <div className="bg-primary/20 p-4 rounded-full">
                        <Fish className="h-12 w-12 text-primary" />
                      </div>
                      <div>
                        <h4 className="text-3xl font-headline font-bold">{recordCatch.fishName} - {recordCatch.length}cm</h4>
                        <p className="text-slate-300">Capturé par <span className="text-white font-bold">{recordCatch.userName}</span></p>
                        <p className="text-xs text-slate-500 mt-1">Date: {new Date(recordCatch.timestamp).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-slate-400 italic">Aucun record pour le moment.</p>
                  )}
                </CardContent>
              </Card>

              <Card className="border-none shadow-md bg-accent/10">
                <CardHeader>
                  <CardTitle className="font-headline flex items-center gap-2 text-primary">
                    <TrendingUp className="h-6 w-6" />
                    Statistiques Saison
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-muted-foreground uppercase font-bold tracking-wider">Top Grimpeur</p>
                      <p className="text-2xl font-headline font-bold">{top3[0]?.name || "En attente"}</p>
                      <p className="text-sm text-green-600 font-bold">Mène la danse</p>
                    </div>
                    <Avatar className="h-16 w-16">
                       <AvatarImage src={top3[0]?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${top3[0]?.name}`} />
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
                    {generalRanking.map((user, idx) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-bold text-muted-foreground">#{idx + 4}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`} />
                            </Avatar>
                            <span className="font-medium">{user.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">{user.catchesCount || 0}</TableCell>
                        <TableCell className="text-right font-headline font-bold text-primary">{user.totalPoints.toLocaleString()} pts</TableCell>
                      </TableRow>
                    ))}
                    {generalRanking.length === 0 && rankings && rankings.length <= 3 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground italic">
                          Plus de pêcheurs à venir...
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}
