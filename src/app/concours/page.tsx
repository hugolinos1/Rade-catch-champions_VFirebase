
"use client"

import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Send, History, Scale, Anchor, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import { Catch, UserProfile, FishSpecies, Contest } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy, limit, where } from 'firebase/firestore';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';

export default function ConcoursPage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user: currentUser } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Firestore Collections
  const activeContestQuery = useMemoFirebase(() => 
    query(collection(firestore, 'competitions'), where('status', '==', 'active'), limit(1)), 
  [firestore]);

  const fishQuery = useMemoFirebase(() => collection(firestore, 'species'), [firestore]);
  const usersQuery = useMemoFirebase(() => currentUser ? collection(firestore, 'users') : null, [firestore, currentUser]);
  const recentCatchesQuery = useMemoFirebase(() => 
    currentUser ? query(collection(firestore, 'catches'), orderBy('timestamp', 'desc'), limit(10)) : null, 
  [firestore, currentUser]);

  const { data: activeContests } = useCollection<Contest>(activeContestQuery);
  const { data: species } = useCollection<FishSpecies>(fishQuery);
  const { data: allUsers } = useCollection<UserProfile>(usersQuery);
  const { data: recentCatches, isLoading: loadingCatches } = useCollection<Catch>(recentCatchesQuery);

  const activeContest = activeContests?.[0];

  // Form State
  const [selectedFisherman, setSelectedFisherman] = useState(currentUser?.uid || '');
  const [selectedFishId, setSelectedFishId] = useState('');
  const [length, setLength] = useState('');
  const [weight, setWeight] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFisherman || !selectedFishId || !length) return;

    setIsSubmitting(true);
    
    const fisher = allUsers?.find(u => u.id === selectedFisherman);
    const fish = species?.find(s => s.id === selectedFishId);

    const newCatch: Partial<Catch> = {
      userId: selectedFisherman,
      userName: fisher?.name || (selectedFisherman === currentUser?.uid ? 'Moi' : 'Anonyme'),
      fishId: selectedFishId,
      fishName: fish?.name || 'Inconnu',
      length: parseFloat(length),
      weight: parseFloat(weight) || 0,
      photoUrl: 'https://picsum.photos/seed/catch/400/300',
      timestamp: new Date().toISOString(),
      points: (fish?.pointsPerCm || 10) * parseFloat(length),
      status: 'pending'
    };

    const catchesCol = collection(firestore, 'catches');
    addDocumentNonBlocking(catchesCol, newCatch);

    setTimeout(() => {
      setIsSubmitting(false);
      setLength('');
      setWeight('');
      toast({ title: "Capture envoyée !", description: "En attente de validation." });
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <Badge variant="outline" className="mb-2 bg-primary/10 text-primary border-primary/20">
              <Anchor className="h-3 w-3 mr-1" /> {activeContest?.name || "Chargement..."}
            </Badge>
            <h1 className="font-headline text-4xl font-bold">{activeContest ? activeContest.name : "Concours Actif"}</h1>
          </div>
        </header>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Card className="shadow-lg border-none">
              <CardHeader className="bg-primary/5">
                <CardTitle className="font-headline flex items-center gap-2">
                  <Send className="h-5 w-5 text-primary" /> Nouvelle Capture
                </CardTitle>
                <CardDescription>Saisissez les détails pour vous ou un tiers.</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Pêcheur</Label>
                      <Select value={selectedFisherman} onValueChange={setSelectedFisherman}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choisir le pêcheur" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={currentUser?.uid || 'me'}>Moi-même</SelectItem>
                          {allUsers?.filter(u => u.id !== currentUser?.uid).map(u => (
                            <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Espèce</Label>
                      <Select value={selectedFishId} onValueChange={setSelectedFishId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choisir l'espèce" />
                        </SelectTrigger>
                        <SelectContent>
                          {species?.map(s => (
                            <SelectItem key={s.id} value={s.id}>{s.name} ({s.minSize}cm min)</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Longueur (cm)</Label>
                      <div className="relative">
                        <Scale className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input type="number" step="0.5" className="pl-10" value={length} onChange={e => setLength(e.target.value)} required />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Poids (kg)</Label>
                      <Input type="number" step="0.1" value={weight} onChange={e => setWeight(e.target.value)} />
                    </div>
                  </div>

                  <Button type="submit" className="w-full font-headline font-bold h-12" disabled={isSubmitting || !currentUser}>
                    {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : "Soumettre la capture"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <h2 className="font-headline text-2xl font-bold flex items-center gap-2">
                <History className="h-6 w-6 text-primary" /> Dernières Prises
              </h2>
              {loadingCatches ? (
                <div className="flex justify-center py-10"><Loader2 className="animate-spin h-8 w-8 text-slate-200" /></div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {recentCatches?.map((item) => (
                    <Card key={item.id} className="overflow-hidden border-none shadow flex h-32">
                      <div className="relative w-32 h-full">
                        <Image src={item.photoUrl || 'https://picsum.photos/seed/catch/400/300'} alt={item.fishName} fill className="object-cover" />
                      </div>
                      <div className="flex-1 p-4 flex flex-col justify-between">
                        <div>
                          <p className="font-bold text-xs truncate">{item.userName}</p>
                          <p className="text-primary font-headline font-bold">{item.fishName}</p>
                          <p className="text-[10px] text-muted-foreground">{item.length} cm • {item.points} pts</p>
                        </div>
                        <Badge variant={item.status === 'approved' ? 'default' : 'secondary'} className="w-fit text-[9px]">
                          {item.status}
                        </Badge>
                      </div>
                    </Card>
                  ))}
                  {recentCatches?.length === 0 && (
                    <p className="text-muted-foreground italic col-span-2 text-center py-8">Aucune capture récente.</p>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <Card className="border-none shadow">
              <CardHeader><CardTitle className="font-headline text-lg">Rappel des Points</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                {species?.slice(0, 10).map(s => (
                  <div key={s.id} className="flex justify-between border-b pb-1">
                    <span>{s.name}</span>
                    <span className="font-bold">{s.pointsPerCm} pts/cm</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
