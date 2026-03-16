"use client"

import { Navigation } from '@/components/Navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Medal, Star, Fish, Crown, Loader2, User as UserIcon, Scale, Target } from 'lucide-react';
import { UserProfile, Catch, Contest } from '@/lib/types';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit, where } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import Image from 'next/image';

export default function ClassementPage() {
  const firestore = useFirestore();

  // Query for the active contest
  const activeContestQuery = useMemoFirebase(() => 
    query(collection(firestore, 'competitions'), where('status', '==', 'active'), limit(1)), 
  [firestore]);

  // Query for top users by points
  const topUsersQuery = useMemoFirebase(() => 
    query(collection(firestore, 'users'), orderBy('totalPoints', 'desc'), limit(50)), 
  [firestore]);

  // Query for the record catch (Big Fish)
  const bigFishQuery = useMemoFirebase(() => 
    query(collection(firestore, 'catches'), where('status', '==', 'approved'), orderBy('size', 'desc'), limit(1)), 
  [firestore]);

  const { data: contests } = useCollection<Contest>(activeContestQuery);
  const { data: rankings, isLoading: loadingRankings } = useCollection<UserProfile>(topUsersQuery);
  const { data: bigFishes, isLoading: loadingBigFish } = useCollection<Catch>(bigFishQuery);

  const activeContestName = contests?.[0]?.name || "Concours en cours";
  const top3 = rankings?.slice(0, 3) || [];
  const recordCatch = bigFishes?.[0];

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-20">
      <Navigation />
      
      <main className="container mx-auto px-4 py-12 max-w-6xl">
        {/* Page Header */}
        <header className="mb-12 text-center">
          <h1 className="font-headline text-4xl md:text-5xl font-bold text-[#0a3d62] mb-4">
            Tableau d'Honneur {activeContestName}
          </h1>
          <Badge variant="secondary" className="bg-slate-200/50 text-slate-500 font-medium px-4 py-1 rounded-full border-none">
            Championnat Rade de Brest
          </Badge>
        </header>

        {loadingRankings ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>
        ) : (
          <div className="space-y-16">
            
            {/* 1. PODIUM SECTION */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end max-w-5xl mx-auto">
              {/* 2nd Place */}
              <div className="order-2 md:order-1">
                <Card className="border-none shadow-sm bg-[#d1e9f0] rounded-3xl overflow-hidden text-center h-[300px] flex flex-col justify-center transition-transform hover:scale-105">
                  <CardContent className="pt-8">
                    <div className="w-12 h-12 bg-white/40 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Medal className="h-6 w-6 text-slate-400" />
                    </div>
                    <h3 className="font-headline text-2xl font-bold text-[#1e4e6e] truncate px-4">
                      {top3[1]?.name || "En attente..."}
                    </h3>
                    <div className="mt-2">
                      <p className="text-5xl font-headline font-bold text-[#1e4e6e]">{top3[1]?.totalPoints || 0}</p>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">POINTS</p>
                    </div>
                    <div className="mt-6 pt-6 border-t border-white/20">
                       <p className="text-xs text-slate-500">{top3[1]?.catchesCount || 0} captures</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* 1st Place */}
              <div className="order-1 md:order-2 scale-110 z-10">
                <Card className="border-none shadow-2xl bg-[#ff8a50] rounded-3xl overflow-hidden text-center h-[380px] flex flex-col justify-center relative">
                  <div className="absolute top-4 right-4 opacity-20">
                    <Crown className="h-20 w-20 text-white" />
                  </div>
                  <CardContent className="pt-10 text-white">
                    <div className="w-20 h-20 bg-white/30 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                      <Trophy className="h-10 w-10 text-yellow-300" />
                    </div>
                    <h3 className="font-headline text-3xl font-bold truncate px-4">{top3[0]?.name || "Champion"}</h3>
                    <div className="mt-4">
                      <p className="text-7xl font-headline font-bold">{top3[0]?.totalPoints || 0}</p>
                      <p className="text-xs font-bold opacity-80 uppercase tracking-widest">POINTS</p>
                    </div>
                    <div className="mt-8 pt-8 border-t border-white/20 flex flex-col items-center">
                       <p className="text-sm font-medium">{top3[0]?.catchesCount || 0} captures au compteur</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* 3rd Place */}
              <div className="order-3">
                <Card className="border-none shadow-sm bg-[#d1e9f0] rounded-3xl overflow-hidden text-center h-[280px] flex flex-col justify-center transition-transform hover:scale-105">
                  <CardContent className="pt-8">
                    <div className="w-12 h-12 bg-white/40 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Medal className="h-6 w-6 text-orange-400" />
                    </div>
                    <h3 className="font-headline text-2xl font-bold text-[#1e4e6e] truncate px-4">
                      {top3[2]?.name || "En attente..."}
                    </h3>
                    <div className="mt-2">
                      <p className="text-4xl font-headline font-bold text-[#1e4e6e]">{top3[2]?.totalPoints || 0}</p>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">POINTS</p>
                    </div>
                    <div className="mt-6 pt-6 border-t border-white/20">
                       <p className="text-xs text-slate-500">{top3[2]?.catchesCount || 0} captures</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* 2. BIG FISH RECORD SECTION */}
            <div className="max-w-5xl mx-auto">
              <Card className="bg-[#0f172a] text-white border-none rounded-[2.5rem] shadow-2xl overflow-hidden">
                <CardContent className="p-8 md:p-14 relative">
                   <div className="flex items-center gap-3 mb-10">
                     <Star className="h-8 w-8 text-yellow-400 fill-yellow-400" />
                     <h2 className="font-headline text-3xl font-bold italic tracking-widest uppercase">RECORD : BIG FISH</h2>
                   </div>

                   <div className="grid md:grid-cols-12 gap-10 items-center">
                      <div className="md:col-span-5">
                         <div className="relative aspect-square rounded-[2rem] overflow-hidden border-8 border-slate-800 shadow-2xl bg-slate-800 flex items-center justify-center">
                            {recordCatch?.imageUrl ? (
                              <Image 
                                src={recordCatch.imageUrl} 
                                alt="Big Fish Record" 
                                fill 
                                className="object-cover"
                              />
                            ) : (
                              <Fish className="h-20 w-20 text-slate-700" />
                            )}
                         </div>
                      </div>
                      
                      <div className="md:col-span-7 grid grid-cols-2 gap-6">
                         <div className="bg-[#1e293b] p-8 rounded-3xl border border-slate-700/50">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">PÊCHEUR</p>
                            <p className="text-2xl font-headline font-bold truncate">{recordCatch?.anglerName || "À venir..."}</p>
                         </div>
                         <div className="bg-[#1e293b] p-8 rounded-3xl border border-slate-700/50">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">ESPÈCE</p>
                            <p className="text-2xl font-headline font-bold text-primary truncate">{recordCatch?.fishName || "---"}</p>
                         </div>
                         <div className="bg-[#1e293b] p-8 rounded-3xl border border-slate-700/50">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">GRANDEUR</p>
                            <p className="text-4xl font-headline font-bold">{recordCatch?.size || 0} <span className="text-sm font-normal text-slate-400">cm</span></p>
                         </div>
                         <div className="bg-[#1e293b] p-8 rounded-3xl border border-slate-700/50">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">SCORE</p>
                            <p className="text-4xl font-headline font-bold text-yellow-400">{recordCatch?.points || 0} <span className="text-sm font-normal text-slate-400">pts</span></p>
                         </div>
                      </div>
                   </div>

                   {/* Background Decor */}
                   <div className="absolute top-10 right-10 opacity-[0.03] pointer-events-none">
                     <Fish className="h-64 w-64 rotate-12" />
                   </div>
                </CardContent>
              </Card>
            </div>

            {/* 3. GENERAL RANKING TABLE */}
            <div className="max-w-5xl mx-auto">
               <Card className="border border-slate-100 shadow-lg rounded-3xl overflow-hidden bg-white">
                  <CardContent className="p-0">
                    <div className="bg-slate-50 border-b border-slate-100 p-6 flex items-center justify-between">
                       <div className="flex items-center gap-3">
                         <Trophy className="h-5 w-5 text-slate-400" />
                         <h3 className="text-md font-bold text-slate-600 uppercase tracking-widest">Classement Général</h3>
                       </div>
                       <Badge variant="outline" className="text-slate-400">{rankings?.length || 0} participants</Badge>
                    </div>
                    
                    <div className="divide-y divide-slate-50">
                       {rankings?.map((user, idx) => (
                         <div key={user.id} className="flex items-center justify-between p-6 hover:bg-slate-50/50 transition-colors">
                            <div className="flex items-center gap-8">
                               <div className={cn(
                                 "w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shadow-sm",
                                 idx === 0 ? "bg-yellow-400 text-white" : 
                                 idx === 1 ? "bg-slate-300 text-slate-600" : 
                                 idx === 2 ? "bg-orange-300 text-white" : 
                                 "bg-slate-100 text-slate-400"
                               )}>
                                 {idx + 1}
                               </div>
                               <div className="flex flex-col">
                                  <span className="font-bold text-slate-800 text-xl">{user.name}</span>
                                  <span className="text-xs text-slate-400 italic font-medium">Membre Rade Catch Champions</span>
                               </div>
                            </div>
                            
                            <div className="flex items-center gap-16">
                               <div className="text-right hidden sm:block">
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">CAPTURES</p>
                                  <p className="text-xl font-headline font-bold text-slate-700">{user.catchesCount || 0}</p>
                               </div>
                               <div className="text-right min-w-[140px]">
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">TOTAL POINTS</p>
                                  <p className="text-3xl font-headline font-bold text-[#0a3d62]">{user.totalPoints || 0}</p>
                               </div>
                            </div>
                         </div>
                       ))}
                       {(!rankings || rankings.length === 0) && (
                         <div className="py-24 text-center">
                            <UserIcon className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                            <p className="text-slate-300 italic">Aucun pêcheur classé pour le moment.</p>
                         </div>
                       )}
                    </div>
                  </CardContent>
               </Card>
            </div>

          </div>
        )}
      </main>
    </div>
  );
}