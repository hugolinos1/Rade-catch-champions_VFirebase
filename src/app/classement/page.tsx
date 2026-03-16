"use client"

import { Navigation } from '@/components/Navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Medal, Star, Fish, Crown, Loader2, User as UserIcon, TrendingUp } from 'lucide-react';
import { UserProfile, Catch, Contest } from '@/lib/types';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit, where } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import Image from 'next/image';

export default function ClassementPage() {
  const firestore = useFirestore();

  // 1. Récupération du concours actif pour le contexte
  const activeContestQuery = useMemoFirebase(() => 
    query(collection(firestore, 'competitions'), where('status', '==', 'active'), limit(1)), 
  [firestore]);

  // 2. Classement des utilisateurs par points
  const rankingsQuery = useMemoFirebase(() => 
    query(collection(firestore, 'users'), orderBy('totalPoints', 'desc'), limit(50)), 
  [firestore]);

  // 3. Recherche du Record "Big Fish" (plus grande taille)
  const bigFishQuery = useMemoFirebase(() => 
    query(collection(firestore, 'catches'), where('status', '==', 'approved'), orderBy('size', 'desc'), limit(1)), 
  [firestore]);

  const { data: contests } = useCollection<Contest>(activeContestQuery);
  const { data: rankings, isLoading: loadingRankings } = useCollection<UserProfile>(rankingsQuery);
  const { data: bigFishes, isLoading: loadingBigFish } = useCollection<Catch>(bigFishQuery);

  const activeContestName = contests?.[0]?.name || "Rade Catch Champions";
  const top3 = rankings?.slice(0, 3) || [];
  const restOfRankings = rankings?.slice(3) || [];
  const recordCatch = bigFishes?.[0];

  if (loadingRankings && !rankings) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navigation />
        <div className="flex flex-col items-center justify-center h-[calc(100vh-64px)] gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-slate-500 font-medium italic">Calcul des scores en cours...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24">
      <Navigation />
      
      <main className="container mx-auto px-4 py-12 max-w-6xl">
        {/* En-tête de la page */}
        <header className="mb-16 text-center space-y-4">
          <Badge variant="outline" className="bg-white border-primary/20 text-primary px-4 py-1 rounded-full font-bold uppercase tracking-widest text-[10px]">
            {activeContestName}
          </Badge>
          <h1 className="font-headline text-5xl md:text-7xl font-bold text-[#0A3D62] uppercase tracking-tighter">
            Tableau d'Honneur
          </h1>
          <p className="text-slate-500 max-w-xl mx-auto text-lg">
            Célébrons l'excellence et les records de la Rade de Brest.
          </p>
        </header>

        {/* SECTION PODIUM */}
        <section className="mb-32">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end max-w-5xl mx-auto px-4">
            {/* 2ème PLACE */}
            <div className="order-2 md:order-1">
              <Card className="border-none shadow-xl bg-[#D1E9F0] rounded-[2.5rem] overflow-hidden text-center h-[360px] flex flex-col justify-center transition-all hover:translate-y-[-8px]">
                <CardContent className="pt-8">
                  <div className="w-16 h-16 bg-white/50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-white">
                    <Medal className="h-10 w-10 text-slate-400" />
                  </div>
                  <h3 className="font-headline text-2xl font-bold text-[#1E4E6E] truncate px-4 mb-1">
                    {top3[1]?.name || "---"}
                  </h3>
                  <div className="mt-4">
                    <p className="text-6xl font-headline font-bold text-[#1E4E6E]">{top3[1]?.totalPoints || 0}</p>
                    <p className="text-[10px] font-bold text-[#1E4E6E]/60 uppercase tracking-widest">POINTS TOTAL</p>
                  </div>
                  <div className="mt-8 pt-6 border-t border-white/30">
                     <p className="text-[10px] font-bold text-[#1E4E6E]/70 uppercase tracking-widest">{top3[1]?.catchesCount || 0} CAPTURES VALIDÉES</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 1ère PLACE - CHAMPION */}
            <div className="order-1 md:order-2 scale-105 md:scale-110 z-10">
              <Card className="border-none shadow-2xl bg-[#FF8A50] rounded-[3.5rem] overflow-hidden text-center h-[480px] flex flex-col justify-center relative border-4 border-white/20">
                <div className="absolute top-8 right-8 opacity-10">
                  <Crown className="h-40 w-40 text-white" />
                </div>
                <CardContent className="pt-10 text-white relative z-10">
                  <div className="w-28 h-28 bg-white/30 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner border-4 border-white/20">
                    <Trophy className="h-14 w-14 text-yellow-300 drop-shadow-md" />
                  </div>
                  <h3 className="font-headline text-3xl font-bold truncate px-4 mb-2">
                    {top3[0]?.name || "---"}
                  </h3>
                  <div className="mt-4">
                    <p className="text-9xl font-headline font-bold leading-none">{top3[0]?.totalPoints || 0}</p>
                    <p className="text-xs font-bold opacity-70 uppercase tracking-widest mt-2">LE CHAMPION</p>
                  </div>
                  <div className="mt-14 pt-8 border-t border-white/20">
                     <p className="text-sm font-bold uppercase tracking-[0.2em]">{top3[0]?.catchesCount || 0} PRISES CERTIFIÉES</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 3ème PLACE */}
            <div className="order-3">
              <Card className="border-none shadow-xl bg-[#D1E9F0] rounded-[2.5rem] overflow-hidden text-center h-[320px] flex flex-col justify-center transition-all hover:translate-y-[-8px]">
                <CardContent className="pt-8">
                  <div className="w-14 h-14 bg-white/50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-white">
                    <Medal className="h-8 w-8 text-[#CD7F32]" />
                  </div>
                  <h3 className="font-headline text-2xl font-bold text-[#1E4E6E] truncate px-4 mb-1">
                    {top3[2]?.name || "---"}
                  </h3>
                  <div className="mt-4">
                    <p className="text-5xl font-headline font-bold text-[#1E4E6E]">{top3[2]?.totalPoints || 0}</p>
                    <p className="text-[10px] font-bold text-[#1E4E6E]/60 uppercase tracking-widest">POINTS TOTAL</p>
                  </div>
                  <div className="mt-6 pt-6 border-t border-white/30">
                     <p className="text-[10px] font-bold text-[#1E4E6E]/70 uppercase tracking-widest">{top3[2]?.catchesCount || 0} CAPTURES</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* SECTION RECORD BIG FISH */}
        <section className="mb-32 max-w-5xl mx-auto px-4">
          <Card className="bg-[#0F172A] text-white border-none rounded-[4rem] shadow-2xl overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-12 opacity-[0.03]">
              <Fish className="h-96 w-96 rotate-12" />
            </div>
            
            <CardContent className="p-12 md:p-20 relative z-10">
               <div className="flex items-center gap-6 mb-16">
                 <div className="p-4 bg-yellow-400 rounded-[1.5rem] shadow-lg shadow-yellow-400/30">
                   <Star className="h-10 w-10 text-[#0F172A] fill-[#0F172A]" />
                 </div>
                 <div>
                    <h2 className="font-headline text-4xl font-bold italic tracking-tighter uppercase leading-none">LE RECORD : BIG FISH</h2>
                    <p className="text-slate-500 text-sm mt-2 font-bold uppercase tracking-widest">La plus grande prise homologuée du concours</p>
                 </div>
               </div>

               <div className="grid md:grid-cols-12 gap-16 items-center">
                  <div className="md:col-span-5">
                     <div className="relative aspect-square rounded-[3.5rem] overflow-hidden border-8 border-slate-800 shadow-2xl bg-slate-800 group-hover:border-slate-700 transition-all duration-500">
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
                            <p className="text-[10px] font-bold uppercase tracking-[0.3em]">En attente du record</p>
                          </div>
                        )}
                        <div className="absolute bottom-6 left-6">
                           <Badge className="bg-yellow-400 text-[#0F172A] hover:bg-yellow-400 border-none font-bold py-1 px-4 text-xs">OFFICIEL</Badge>
                        </div>
                     </div>
                  </div>
                  
                  <div className="md:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6">
                     <div className="bg-white/5 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/10 hover:bg-white/10 transition-colors">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">CHAMPION</p>
                        <p className="text-3xl font-headline font-bold truncate text-white">{recordCatch?.anglerName || "---"}</p>
                     </div>
                     <div className="bg-white/5 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/10 hover:bg-white/10 transition-colors">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">ESPÈCE</p>
                        <p className="text-3xl font-headline font-bold text-primary truncate">{recordCatch?.fishName || "---"}</p>
                     </div>
                     <div className="bg-white/5 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/10 hover:bg-white/10 transition-colors">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">LONGUEUR</p>
                        <p className="text-6xl font-headline font-bold">{recordCatch?.size || 0} <span className="text-lg font-normal text-slate-500">CM</span></p>
                     </div>
                     <div className="bg-white/5 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/10 hover:bg-white/10 transition-colors">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">POINTS</p>
                        <p className="text-6xl font-headline font-bold text-yellow-400">{recordCatch?.points || 0} <span className="text-lg font-normal text-slate-500">PTS</span></p>
                     </div>
                  </div>
               </div>
            </CardContent>
          </Card>
        </section>

        {/* CLASSEMENT GÉNÉRAL */}
        <section className="max-w-5xl mx-auto px-4">
           <Card className="border-none shadow-xl rounded-[3rem] overflow-hidden bg-white">
              <CardHeader className="p-10 bg-slate-50 border-b border-slate-100 flex flex-row items-center justify-between space-y-0">
                 <div className="flex items-center gap-4">
                   <div className="p-3 bg-white rounded-2xl shadow-sm">
                     <TrendingUp className="h-6 w-6 text-slate-400" />
                   </div>
                   <h3 className="text-xs font-bold text-slate-600 uppercase tracking-[0.2em]">CLASSEMENT GÉNÉRAL COMPLET</h3>
                 </div>
                 <Badge variant="outline" className="text-slate-400 border-slate-200 bg-white font-bold py-1 px-4">{rankings?.length || 0} PARTICIPANTS</Badge>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-slate-50">
                   {rankings?.map((user, idx) => (
                     <div key={user.id} className="flex items-center justify-between p-10 hover:bg-slate-50/80 transition-all group">
                        <div className="flex items-center gap-10">
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
                              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">MEMBRE DE LA RADE</span>
                           </div>
                        </div>
                        
                        <div className="flex items-center gap-16">
                           <div className="text-right hidden sm:block">
                              <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mb-1">PRISES</p>
                              <p className="text-2xl font-headline font-bold text-slate-700">{user.catchesCount || 0}</p>
                           </div>
                           <div className="text-right min-w-[140px]">
                              <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mb-1">SCORE TOTAL</p>
                              <p className="text-5xl font-headline font-bold text-[#0A3D62]">{user.totalPoints || 0}</p>
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
        </section>
      </main>
    </div>
  );
}
