"use client"

import { Navigation } from '@/components/Navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Medal, Star, Fish, Crown, Loader2, User as UserIcon } from 'lucide-react';
import { UserProfile, Catch, Contest } from '@/lib/types';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit, where } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import Image from 'next/image';

export default function ClassementPage() {
  const firestore = useFirestore();

  // 1. Query for the active contest
  const activeContestQuery = useMemoFirebase(() => 
    query(collection(firestore, 'competitions'), where('status', '==', 'active'), limit(1)), 
  [firestore]);

  // 2. Query for top users by points
  const topUsersQuery = useMemoFirebase(() => 
    query(collection(firestore, 'users'), orderBy('totalPoints', 'desc'), limit(50)), 
  [firestore]);

  // 3. Query for the record catch (Big Fish)
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
        <header className="mb-16 text-center">
          <h1 className="font-headline text-5xl md:text-6xl font-bold text-[#0a3d62] mb-4 uppercase tracking-tight">
            Tableau d'Honneur
          </h1>
          <div className="flex items-center justify-center gap-4">
            <div className="h-px w-16 bg-slate-300" />
            <Badge variant="secondary" className="bg-slate-200/50 text-slate-500 font-bold px-6 py-1.5 rounded-full border-none uppercase text-xs tracking-[0.2em]">
              {activeContestName}
            </Badge>
            <div className="h-px w-16 bg-slate-300" />
          </div>
        </header>

        {loadingRankings ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className="animate-spin h-10 w-10 text-primary" />
            <p className="text-slate-400 font-medium">Récupération des champions...</p>
          </div>
        ) : (
          <div className="space-y-24">
            
            {/* 1. PODIUM SECTION */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end max-w-5xl mx-auto px-4">
              {/* 2nd Place */}
              <div className="order-2 md:order-1">
                <Card className="border-none shadow-xl bg-[#d1e9f0] rounded-[2.5rem] overflow-hidden text-center h-[340px] flex flex-col justify-center transition-all hover:translate-y-[-8px]">
                  <CardContent className="pt-8">
                    <div className="w-16 h-16 bg-white/50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                      <Medal className="h-10 w-10 text-slate-400" />
                    </div>
                    <h3 className="font-headline text-2xl font-bold text-[#1e4e6e] truncate px-4 mb-2">
                      {top3[1]?.name || "---"}
                    </h3>
                    <div className="mt-2">
                      <p className="text-6xl font-headline font-bold text-[#1e4e6e]">{top3[1]?.totalPoints || 0}</p>
                      <p className="text-[10px] font-bold text-[#1e4e6e]/60 uppercase tracking-widest">POINTS TOTAL</p>
                    </div>
                    <div className="mt-8 pt-6 border-t border-white/30">
                       <p className="text-xs font-bold text-[#1e4e6e]/70">{top3[1]?.catchesCount || 0} CAPTURES VALIDÉES</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* 1st Place - GOLD */}
              <div className="order-1 md:order-2 scale-105 md:scale-110 z-10">
                <Card className="border-none shadow-2xl bg-[#ff8a50] rounded-[3rem] overflow-hidden text-center h-[450px] flex flex-col justify-center relative border-4 border-white/20">
                  <div className="absolute top-6 right-6 opacity-10">
                    <Crown className="h-32 w-32 text-white" />
                  </div>
                  <CardContent className="pt-10 text-white">
                    <div className="w-28 h-28 bg-white/30 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner border-4 border-white/20">
                      <Trophy className="h-14 w-14 text-yellow-300 drop-shadow-md" />
                    </div>
                    <h3 className="font-headline text-3xl font-bold truncate px-4 mb-3">
                      {top3[0]?.name || "Le Champion"}
                    </h3>
                    <div className="mt-4">
                      <p className="text-9xl font-headline font-bold leading-none">{top3[0]?.totalPoints || 0}</p>
                      <p className="text-xs font-bold opacity-70 uppercase tracking-widest mt-2">SCORE TOTAL</p>
                    </div>
                    <div className="mt-12 pt-8 border-t border-white/20">
                       <p className="text-sm font-bold uppercase tracking-widest">{top3[0]?.catchesCount || 0} PRISES CERTIFIÉES</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* 3rd Place */}
              <div className="order-3">
                <Card className="border-none shadow-xl bg-[#d1e9f0] rounded-[2.5rem] overflow-hidden text-center h-[300px] flex flex-col justify-center transition-all hover:translate-y-[-8px]">
                  <CardContent className="pt-8">
                    <div className="w-16 h-16 bg-white/50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                      <Medal className="h-10 w-10 text-[#cd7f32]" />
                    </div>
                    <h3 className="font-headline text-2xl font-bold text-[#1e4e6e] truncate px-4 mb-2">
                      {top3[2]?.name || "---"}
                    </h3>
                    <div className="mt-2">
                      <p className="text-5xl font-headline font-bold text-[#1e4e6e]">{top3[2]?.totalPoints || 0}</p>
                      <p className="text-[10px] font-bold text-[#1e4e6e]/60 uppercase tracking-widest">POINTS TOTAL</p>
                    </div>
                    <div className="mt-6 pt-6 border-t border-white/30">
                       <p className="text-xs font-bold text-[#1e4e6e]/70">{top3[2]?.catchesCount || 0} CAPTURES</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* 2. BIG FISH RECORD SECTION */}
            <div className="max-w-5xl mx-auto px-4">
              <Card className="bg-[#0f172a] text-white border-none rounded-[3.5rem] shadow-2xl overflow-hidden relative group">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                  <Fish className="h-80 w-80 rotate-12" />
                </div>
                
                <CardContent className="p-12 md:p-20 relative z-10">
                   <div className="flex items-center gap-6 mb-16">
                     <div className="p-4 bg-yellow-400 rounded-[1.5rem] shadow-lg shadow-yellow-400/30">
                       <Star className="h-10 w-10 text-[#0f172a] fill-[#0f172a]" />
                     </div>
                     <h2 className="font-headline text-4xl font-bold italic tracking-tighter uppercase">LE RECORD : BIG FISH</h2>
                   </div>

                   <div className="grid md:grid-cols-12 gap-16 items-center">
                      <div className="md:col-span-5">
                         <div className="relative aspect-square rounded-[3rem] overflow-hidden border-8 border-slate-800 shadow-2xl bg-slate-800 group-hover:border-slate-700 transition-all duration-500">
                            {recordCatch?.imageUrl ? (
                              <Image 
                                src={recordCatch.imageUrl} 
                                alt="Record Capture" 
                                fill 
                                className="object-cover transition-transform group-hover:scale-110 duration-1000"
                              />
                            ) : (
                              <div className="flex flex-col items-center justify-center h-full gap-4 text-slate-700">
                                <Fish className="h-32 w-32" />
                                <p className="text-xs font-bold uppercase tracking-[0.3em]">En attente du record</p>
                              </div>
                            )}
                         </div>
                      </div>
                      
                      <div className="md:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-8">
                         <div className="bg-white/5 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/10 hover:bg-white/10 transition-colors">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">CHAMPION</p>
                            <p className="text-3xl font-headline font-bold truncate text-white">{recordCatch?.anglerName || "---"}</p>
                         </div>
                         <div className="bg-white/5 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/10 hover:bg-white/10 transition-colors">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">ESPÈCE</p>
                            <p className="text-3xl font-headline font-bold text-primary truncate">{recordCatch?.fishName || "---"}</p>
                         </div>
                         <div className="bg-white/5 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/10 hover:bg-white/10 transition-colors">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">LONGUEUR</p>
                            <p className="text-6xl font-headline font-bold">{recordCatch?.size || 0} <span className="text-lg font-normal text-slate-400">CM</span></p>
                         </div>
                         <div className="bg-white/5 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/10 hover:bg-white/10 transition-colors">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">POINTS</p>
                            <p className="text-6xl font-headline font-bold text-yellow-400">{recordCatch?.points || 0} <span className="text-lg font-normal text-slate-400">PTS</span></p>
                         </div>
                      </div>
                   </div>
                </CardContent>
              </Card>
            </div>

            {/* 3. GENERAL RANKING TABLE */}
            <div className="max-w-5xl mx-auto px-4">
               <Card className="border-none shadow-xl rounded-[3rem] overflow-hidden bg-white">
                  <CardContent className="p-0">
                    <div className="bg-slate-50 border-b border-slate-100 p-10 flex items-center justify-between">
                       <div className="flex items-center gap-4">
                         <div className="p-3 bg-white rounded-2xl shadow-sm">
                           <Trophy className="h-6 w-6 text-slate-400" />
                         </div>
                         <h3 className="text-sm font-bold text-slate-600 uppercase tracking-[0.2em]">CLASSEMENT GÉNÉRAL COMPLET</h3>
                       </div>
                       <Badge variant="outline" className="text-slate-400 border-slate-200 bg-white font-bold py-1 px-4">{rankings?.length || 0} PARTICIPANTS</Badge>
                    </div>
                    
                    <div className="divide-y divide-slate-50">
                       {rankings?.map((user, idx) => (
                         <div key={user.id} className="flex items-center justify-between p-10 hover:bg-slate-50/80 transition-all group">
                            <div className="flex items-center gap-12">
                               <div className={cn(
                                 "w-14 h-14 rounded-[1.25rem] flex items-center justify-center font-bold text-xl transition-all group-hover:rotate-6",
                                 idx === 0 ? "bg-yellow-400 text-white shadow-lg shadow-yellow-400/30" : 
                                 idx === 1 ? "bg-slate-200 text-slate-600" : 
                                 idx === 2 ? "bg-orange-200 text-white" : 
                                 "bg-slate-100 text-slate-400"
                               )}>
                                 {idx + 1}
                               </div>
                               <div className="flex flex-col">
                                  <span className="font-bold text-slate-800 text-2xl group-hover:text-primary transition-colors">{user.name}</span>
                                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">MEMBRE CERTIFIÉ</span>
                               </div>
                            </div>
                            
                            <div className="flex items-center gap-20">
                               <div className="text-right hidden sm:block">
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">PRISES</p>
                                  <p className="text-2xl font-headline font-bold text-slate-700">{user.catchesCount || 0}</p>
                               </div>
                               <div className="text-right min-w-[160px]">
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">SCORE TOTAL</p>
                                  <p className="text-5xl font-headline font-bold text-[#0a3d62]">{user.totalPoints || 0}</p>
                               </div>
                            </div>
                         </div>
                       ))}
                       {(!rankings || rankings.length === 0) && (
                         <div className="py-40 text-center">
                            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                              <UserIcon className="h-12 w-12 text-slate-200" />
                            </div>
                            <p className="text-slate-400 font-medium italic">Aucun compétiteur n'a encore enregistré de prise.</p>
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
