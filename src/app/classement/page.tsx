"use client"

import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Trophy, 
  Medal, 
  Star, 
  Fish, 
  Crown, 
  Loader2, 
  TrendingUp,
  Scale
} from 'lucide-react';
import { UserProfile, Catch, Contest } from '@/lib/types';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit, where } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import Image from 'next/image';

export default function ClassementPage() {
  const firestore = useFirestore();

  const usersQuery = useMemoFirebase(() => 
    query(collection(firestore, 'users'), orderBy('totalPoints', 'desc'), limit(100)), 
  [firestore]);

  const catchesQuery = useMemoFirebase(() => 
    query(collection(firestore, 'catches'), orderBy('size', 'desc'), limit(1)), 
  [firestore]);

  const contestQuery = useMemoFirebase(() => 
    query(collection(firestore, 'competitions'), where('status', '==', 'active'), limit(1)), 
  [firestore]);

  const { data: users, isLoading: loadingUsers } = useCollection<UserProfile>(usersQuery);
  const { data: recordCatches, isLoading: loadingRecord } = useCollection<Catch>(catchesQuery);
  const { data: contests } = useCollection<Contest>(contestQuery);

  const top3 = users?.slice(0, 3) || [];
  const bigFish = recordCatches?.[0];
  const contestName = contests?.[0]?.name || "Rade Catch Champions";

  if (loadingUsers && !users) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navigation />
        <div className="flex flex-col items-center justify-center h-[calc(100vh-64px)] gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-slate-500 font-medium italic">Préparation du Tableau d'Honneur...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8 md:py-12 max-w-6xl">
        {/* HEADER PRESTIGE */}
        <header className="mb-12 md:mb-20 text-center space-y-3 md:space-y-4">
          <Badge variant="outline" className="bg-white border-primary/20 text-primary px-3 md:px-4 py-1 rounded-full font-bold uppercase tracking-[0.2em] text-[9px] md:text-[10px]">
            {contestName}
          </Badge>
          <h1 className="font-headline text-4xl md:text-8xl font-bold text-[#0A3D62] uppercase tracking-tighter leading-none px-2">
            Tableau d'Honneur
          </h1>
          <p className="text-slate-500 max-w-2xl mx-auto text-sm md:text-xl font-medium px-4">
            L'élite de la pêche en Rade de Brest s'affiche ici.
          </p>
        </header>

        {/* SECTION PODIUM 1-2-3 */}
        <section className="mb-20 md:mb-32 relative">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 items-end max-w-5xl mx-auto px-2 md:px-4">
            
            {/* 2ème PLACE */}
            <div className="order-2 md:order-1">
              <Card className="border-none shadow-xl bg-[#E2E8F0] rounded-[2rem] md:rounded-[3rem] overflow-hidden text-center h-[280px] md:h-[380px] flex flex-col justify-center transition-transform hover:scale-[1.02]">
                <CardContent className="pt-6 md:pt-8 space-y-2 md:space-y-4">
                  <div className="w-12 h-12 md:w-16 md:h-16 bg-white/50 rounded-full flex items-center justify-center mx-auto mb-1 md:mb-2 shadow-sm">
                    <Medal className="h-6 w-6 md:h-10 md:w-10 text-slate-400" />
                  </div>
                  <h3 className="font-headline text-lg md:text-2xl font-bold text-[#1E4E6E] truncate px-4">
                    {top3[1]?.name || "---"}
                  </h3>
                  <div>
                    <p className="text-4xl md:text-6xl font-headline font-bold text-[#1E4E6E]">{top3[1]?.totalPoints || 0}</p>
                    <p className="text-[8px] md:text-[10px] font-bold text-[#1E4E6E]/50 uppercase tracking-widest mt-1">POINTS TOTAL</p>
                  </div>
                  <div className="pt-4 md:pt-6 border-t border-[#1E4E6E]/10">
                    <p className="text-[8px] md:text-[10px] font-bold text-[#1E4E6E]/60 uppercase tracking-widest">{top3[1]?.catchesCount || 0} PRISES</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 1ère PLACE */}
            <div className="order-1 md:order-2 md:scale-110 z-10">
              <Card className="border-none shadow-2xl bg-[#FF8A50] rounded-[2.5rem] md:rounded-[4rem] overflow-hidden text-center h-[340px] md:h-[480px] flex flex-col justify-center relative border-4 border-white/20">
                <div className="absolute top-4 right-4 md:top-8 md:right-8 opacity-10">
                  <Crown className="h-24 w-24 md:h-40 md:w-40 text-white" />
                </div>
                <CardContent className="pt-6 md:pt-10 text-white relative z-10 space-y-4 md:space-y-6">
                  <div className="w-16 h-16 md:w-24 md:h-24 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-1 md:mb-2 shadow-inner border-2 border-white/20">
                    <Trophy className="h-8 w-8 md:h-12 md:w-12 text-yellow-300 drop-shadow-md" />
                  </div>
                  <h3 className="font-headline text-xl md:text-3xl font-bold truncate px-4">
                    {top3[0]?.name || "---"}
                  </h3>
                  <div>
                    <p className="text-6xl md:text-9xl font-headline font-bold leading-none">{top3[0]?.totalPoints || 0}</p>
                    <p className="text-[10px] md:text-xs font-bold opacity-70 uppercase tracking-[0.3em] mt-2 md:mt-3">CHAMPION DE LA RADE</p>
                  </div>
                  <div className="pt-4 md:pt-8 border-t border-white/10">
                    <p className="text-xs md:text-sm font-bold uppercase tracking-widest">{top3[0]?.catchesCount || 0} CAPTURES</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 3ème PLACE */}
            <div className="order-3">
              <Card className="border-none shadow-xl bg-[#E2E8F0] rounded-[1.5rem] md:rounded-[2.5rem] overflow-hidden text-center h-[240px] md:h-[340px] flex flex-col justify-center transition-transform hover:scale-[1.02]">
                <CardContent className="pt-4 md:pt-8 space-y-2 md:space-y-4">
                  <div className="w-10 h-10 md:w-14 md:h-14 bg-white/50 rounded-full flex items-center justify-center mx-auto mb-1 md:mb-2 shadow-sm">
                    <Medal className="h-5 w-5 md:h-8 md:w-8 text-[#CD7F32]" />
                  </div>
                  <h3 className="font-headline text-lg md:text-2xl font-bold text-[#1E4E6E] truncate px-4">
                    {top3[2]?.name || "---"}
                  </h3>
                  <div>
                    <p className="text-3xl md:text-5xl font-headline font-bold text-[#1E4E6E]">{top3[2]?.totalPoints || 0}</p>
                    <p className="text-[8px] md:text-[10px] font-bold text-[#1E4E6E]/50 uppercase tracking-widest mt-1">POINTS TOTAL</p>
                  </div>
                  <div className="pt-4 md:pt-6 border-t border-[#1E4E6E]/10">
                    <p className="text-[8px] md:text-[10px] font-bold text-[#1E4E6E]/60 uppercase tracking-widest">{top3[2]?.catchesCount || 0} PRISES</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* SECTION RECORD BIG FISH */}
        <section className="mb-20 md:mb-32 max-w-5xl mx-auto px-2 md:px-4">
          <Card className="bg-[#0F172A] text-white border-none rounded-[2rem] md:rounded-[4rem] shadow-2xl overflow-hidden relative">
            <div className="absolute top-0 right-0 p-6 md:p-12 opacity-[0.03] pointer-events-none">
              <Fish className="h-48 w-48 md:h-96 md:w-96 rotate-12" />
            </div>
            
            <CardContent className="p-6 md:p-20 relative z-10">
               <div className="flex items-center gap-4 md:gap-6 mb-8 md:mb-16">
                 <div className="p-3 md:p-4 bg-yellow-400 rounded-2xl md:rounded-3xl shadow-lg shadow-yellow-400/20">
                   <Star className="h-6 w-6 md:h-10 md:w-10 text-[#0F172A] fill-[#0F172A]" />
                 </div>
                 <div>
                    <h2 className="font-headline text-xl md:text-4xl font-bold italic uppercase leading-tight tracking-tighter">LE RECORD : BIG FISH</h2>
                    <p className="text-slate-500 text-[8px] md:text-sm font-bold uppercase tracking-widest mt-1">La prise historique du concours</p>
                 </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-center">
                  <div className="relative aspect-[4/3] rounded-[1.5rem] md:rounded-[3rem] overflow-hidden border-4 md:border-8 border-slate-800 shadow-2xl bg-slate-900">
                    {bigFish?.imageUrl ? (
                      <Image 
                        src={bigFish.imageUrl} 
                        alt="Record Catch" 
                        fill 
                        className="object-cover"
                      />
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-slate-700">
                        <Fish className="h-12 w-12 md:h-20 md:w-20 mb-4" />
                        <p className="text-[8px] md:text-[10px] font-bold uppercase tracking-[0.4em]">En attente d'un record</p>
                      </div>
                    )}
                    <div className="absolute bottom-4 left-4 md:bottom-6 md:left-6">
                       <Badge className="bg-yellow-400 text-[#0F172A] hover:bg-yellow-400 border-none font-bold py-0.5 px-2 md:px-4 text-[9px] md:text-xs">OFFICIEL</Badge>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4 md:gap-6">
                     <div className="bg-white/5 backdrop-blur-xl p-4 md:p-8 rounded-[1.5rem] md:rounded-[2rem] border border-white/10">
                        <p className="text-[8px] md:text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 md:mb-4">ESPÈCE & CHAMPION</p>
                        <div className="flex justify-between items-baseline gap-2">
                          <p className="text-xl md:text-3xl font-headline font-bold text-primary truncate">{bigFish?.fishName || "---"}</p>
                          <p className="text-sm md:text-xl font-headline text-white/80 truncate">{bigFish?.anglerName || "---"}</p>
                        </div>
                     </div>

                     <div className="grid grid-cols-2 gap-4 md:gap-6">
                        <div className="bg-white/5 backdrop-blur-xl p-4 md:p-8 rounded-[1.5rem] md:rounded-[2rem] border border-white/10 text-center md:text-left">
                           <p className="text-[8px] md:text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 md:mb-4">LONGUEUR</p>
                           <p className="text-3xl md:text-6xl font-headline font-bold">{bigFish?.size || 0} <span className="text-xs md:text-lg font-normal text-slate-500">CM</span></p>
                        </div>
                        <div className="bg-white/5 backdrop-blur-xl p-4 md:p-8 rounded-[1.5rem] md:rounded-[2rem] border border-white/10 text-center md:text-left">
                           <p className="text-[8px] md:text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 md:mb-4">SCORE</p>
                           <p className="text-3xl md:text-6xl font-headline font-bold text-yellow-400">{bigFish?.points || 0} <span className="text-xs md:text-lg font-normal text-slate-500">PTS</span></p>
                        </div>
                     </div>
                  </div>
               </div>
            </CardContent>
          </Card>
        </section>

        {/* CLASSEMENT COMPLET */}
        <section className="max-w-5xl mx-auto px-2 md:px-4">
           <Card className="border-none shadow-xl rounded-[1.5rem] md:rounded-[3rem] overflow-hidden bg-white">
              <CardHeader className="p-6 md:p-10 bg-slate-50 border-b border-slate-100 flex flex-row items-center justify-between space-y-0">
                 <div className="flex items-center gap-3 md:gap-4">
                   <div className="p-2 md:p-3 bg-white rounded-xl md:rounded-2xl shadow-sm">
                     <TrendingUp className="h-4 w-4 md:h-6 md:w-6 text-slate-400" />
                   </div>
                   <div>
                     <CardTitle className="text-[9px] md:text-xs font-bold text-slate-600 uppercase tracking-[0.2em]">Classement Général</CardTitle>
                     <CardDescription className="text-[8px] md:text-[10px] font-bold uppercase mt-1">Performances de la Rade</CardDescription>
                   </div>
                 </div>
                 <Badge variant="outline" className="text-slate-400 border-slate-200 font-bold px-2 md:px-4 text-[9px] md:text-xs">{users?.length || 0} MEMBRES</Badge>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-slate-50">
                   {users?.map((user, idx) => (
                     <div key={user.id} className="flex items-center justify-between p-4 md:p-10 hover:bg-slate-50/50 transition-colors group">
                        <div className="flex items-center gap-4 md:gap-10">
                           <div className={cn(
                             "w-8 h-8 md:w-14 md:h-14 rounded-lg md:rounded-2xl flex items-center justify-center font-bold text-sm md:text-xl",
                             idx === 0 ? "bg-yellow-400 text-white shadow-lg shadow-yellow-400/20" : 
                             idx === 1 ? "bg-slate-200 text-slate-600" : 
                             idx === 2 ? "bg-orange-200 text-white" : 
                             "bg-slate-100 text-slate-400"
                           )}>
                             {idx + 1}
                           </div>
                           <div className="flex flex-col">
                              <span className="font-bold text-slate-800 text-sm md:text-2xl truncate max-w-[120px] md:max-w-none">{user.name}</span>
                              <span className="text-[8px] md:text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5 md:mt-1">PÊCHEUR CERTIFIÉ</span>
                           </div>
                        </div>
                        
                        <div className="flex items-center gap-4 md:gap-16">
                           <div className="text-right hidden sm:block">
                              <p className="text-[8px] md:text-[10px] font-bold text-slate-300 uppercase tracking-widest mb-1">PRISES</p>
                              <p className="text-sm md:text-2xl font-headline font-bold text-slate-700">{user.catchesCount || 0}</p>
                           </div>
                           <div className="text-right min-w-[60px] md:min-w-[120px]">
                              <p className="text-[8px] md:text-[10px] font-bold text-slate-300 uppercase tracking-widest mb-1">SCORE</p>
                              <p className="text-xl md:text-5xl font-headline font-bold text-[#0A3D62]">{user.totalPoints || 0}</p>
                           </div>
                        </div>
                     </div>
                   ))}
                </div>
              </CardContent>
           </Card>
        </section>
      </main>
    </div>
  );
}