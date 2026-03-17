
"use client"

import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Send, History, Scale, Anchor, Loader2, Camera, MapPin, X, User as UserIcon, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';
import { useState, useRef, useMemo } from 'react';
import { Catch, UserProfile, FishSpecies, Contest } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection, useMemoFirebase, useUser, useStorage } from '@/firebase';
import { collection, query, orderBy, limit, where, doc, increment } from 'firebase/firestore';
import { addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export default function ConcoursPage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const storage = useStorage();
  const { user: currentUser } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // File Upload State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Firestore Collections
  const activeContestQuery = useMemoFirebase(() => 
    query(collection(firestore, 'competitions'), where('status', '==', 'active'), limit(1)), 
  [firestore]);

  const fishQuery = useMemoFirebase(() => collection(firestore, 'species'), [firestore]);
  const usersQuery = useMemoFirebase(() => collection(firestore, 'users'), [firestore]);
  const recentCatchesQuery = useMemoFirebase(() => 
    query(collection(firestore, 'catches'), orderBy('date', 'desc'), limit(5)), 
  [firestore]);

  const { data: activeContests } = useCollection<Contest>(activeContestQuery);
  const { data: rawSpecies } = useCollection<FishSpecies>(fishQuery);
  const { data: allUsers } = useCollection<UserProfile>(usersQuery);
  const { data: recentCatches, isLoading: loadingCatches } = useCollection<Catch>(recentCatchesQuery);

  const activeContest = activeContests?.[0];

  // Alphabetical sort for species
  const species = useMemo(() => {
    if (!rawSpecies) return [];
    return [...rawSpecies].sort((a, b) => a.name.localeCompare(b.name));
  }, [rawSpecies]);

  // Form State
  const [selectedFisherman, setSelectedFisherman] = useState(currentUser?.uid || '');
  const [selectedFishId, setSelectedFishId] = useState('');
  const [length, setLength] = useState('');
  const [weight, setWeight] = useState('');
  const [location, setLocation] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFisherman || !selectedFishId || !length || !activeContest) {
      toast({ variant: "destructive", title: "Champs manquants", description: "Veuillez remplir tous les champs obligatoires." });
      return;
    }

    setIsSubmitting(true);
    
    try {
      let imageUrl = '';

      if (selectedFile) {
        const storageRef = ref(storage, `catches/${Date.now()}_${selectedFile.name}`);
        const snapshot = await uploadBytes(storageRef, selectedFile);
        imageUrl = await getDownloadURL(snapshot.ref);
      } else {
        throw new Error("Une photo est obligatoire pour valider la prise.");
      }

      const fisher = allUsers?.find(u => u.id === selectedFisherman);
      const fish = species?.find(s => s.id === selectedFishId);
      const sizeNum = parseFloat(length);
      
      const pointsPerCm = fish?.pointsPerCm ?? 10;
      const pointsCalculated = pointsPerCm * sizeNum;

      const newCatch: Omit<Catch, 'id'> = {
        anglerId: selectedFisherman,
        anglerName: fisher?.name || 'Inconnu',
        competitionId: activeContest.id,
        fishId: selectedFishId,
        fishName: fish?.name || 'Inconnu',
        size: sizeNum,
        weight: parseFloat(weight) || 0,
        imageUrl: imageUrl,
        date: new Date().toISOString(),
        points: pointsCalculated,
        status: 'approved',
        location: location
      };

      const catchesCol = collection(firestore, 'catches');
      addDocumentNonBlocking(catchesCol, newCatch);

      const userRef = doc(firestore, 'users', selectedFisherman);
      updateDocumentNonBlocking(userRef, {
        totalPoints: increment(pointsCalculated),
        catchesCount: increment(1)
      });

      toast({ title: "Capture enregistrée !", description: "Votre prise a été validée et vos points ajoutés." });
      
      setLength('');
      setWeight('');
      setLocation('');
      clearFile();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erreur", description: error.message || "Impossible d'envoyer la capture." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <Badge variant="outline" className="mb-2 bg-primary/10 text-primary border-primary/20">
              <Anchor className="h-3 w-3 mr-1" /> {activeContest?.name || "Concours en cours"}
            </Badge>
            <h1 className="font-headline text-4xl font-bold">{activeContest ? activeContest.name : "Rade Catch Champions"}</h1>
          </div>
        </header>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Card className="shadow-lg border-none overflow-hidden">
              <CardHeader className="bg-primary/5">
                <CardTitle className="font-headline flex items-center gap-2">
                  <Send className="h-5 w-5 text-primary" /> Nouvelle Capture
                </CardTitle>
                <CardDescription>Saisissez les détails et prenez une photo ou choisissez-la dans votre galerie.</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-4">
                    <Label className="text-slate-600 font-bold">Photo de la prise (Obligatoire)</Label>
                    {!previewUrl ? (
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-slate-200 rounded-2xl h-56 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors bg-slate-50/50"
                      >
                        <div className="flex gap-4 mb-3">
                          <div className="w-14 h-14 bg-white rounded-full shadow-sm flex items-center justify-center">
                            <Camera className="h-7 w-7 text-primary" />
                          </div>
                          <div className="w-14 h-14 bg-white rounded-full shadow-sm flex items-center justify-center">
                            <ImageIcon className="h-7 w-7 text-primary" />
                          </div>
                        </div>
                        <span className="text-sm font-bold text-slate-700 text-center px-4">Prendre une photo ou choisir dans la galerie</span>
                        <span className="text-xs text-slate-400 mt-1">Cliquez pour capturer ou parcourir vos fichiers</span>
                      </div>
                    ) : (
                      <div className="relative rounded-2xl overflow-hidden h-72 shadow-md group">
                        <Image src={previewUrl} alt="Preview" fill className="object-cover" />
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                           <Button type="button" variant="destructive" size="sm" onClick={clearFile} className="gap-2">
                             <X className="h-4 w-4" /> Changer la photo
                           </Button>
                        </div>
                      </div>
                    )}
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      onChange={handleFileChange} 
                      accept="image/*" 
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Pêcheur</Label>
                      <Select value={selectedFisherman} onValueChange={setSelectedFisherman}>
                        <SelectTrigger className="bg-slate-50 border-slate-200">
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
                        <SelectTrigger className="bg-slate-50 border-slate-200">
                          <SelectValue placeholder="Choisir l'espèce" />
                        </SelectTrigger>
                        <SelectContent>
                          {species.map(s => (
                            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Longueur (cm)</Label>
                      <div className="relative">
                        <Scale className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input type="number" step="0.5" className="pl-10 bg-slate-50 border-slate-200" value={length} onChange={e => setLength(e.target.value)} required placeholder="Ex: 45" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Poids (kg) - Optionnel</Label>
                      <Input type="number" step="0.1" className="bg-slate-50 border-slate-200" value={weight} onChange={e => setWeight(e.target.value)} placeholder="Ex: 1.2" />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label>Lieu de capture (Optionnel)</Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input className="pl-10 bg-slate-50 border-slate-200" placeholder="Ex: Digue de la Marina" value={location} onChange={e => setLocation(e.target.value)} />
                      </div>
                    </div>
                  </div>

                  <Button type="submit" className="w-full font-headline font-bold h-14 text-lg" disabled={isSubmitting || !previewUrl}>
                    {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : <Send className="mr-2 h-5 w-5" />}
                    {isSubmitting ? "Enregistrement..." : "Soumettre la capture"}
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
                    <Card key={item.id} className="overflow-hidden border-none shadow-sm flex h-32 bg-white group hover:shadow-md transition-shadow">
                      <div className="relative w-32 h-full shrink-0">
                        <Image src={item.imageUrl || 'https://picsum.photos/seed/catch/400/300'} alt={item.fishName} fill className="object-cover" />
                      </div>
                      <div className="flex-1 p-4 flex flex-col justify-between overflow-hidden">
                        <div>
                          <div className="flex items-center gap-1 mb-1">
                            <UserIcon className="h-3 w-3 text-slate-400" />
                            <span className="text-[10px] font-bold text-slate-500 uppercase truncate">
                              {item.anglerName}
                            </span>
                          </div>
                          <p className="text-primary font-headline font-bold truncate leading-tight">{item.fishName}</p>
                          <p className="text-[11px] text-muted-foreground">{item.size} cm • {item.points} pts</p>
                        </div>
                        <div className="flex justify-between items-center">
                          <Badge variant={item.status === 'approved' ? 'default' : item.status === 'rejected' ? 'destructive' : 'secondary'} className="text-[9px] uppercase h-4 px-1">
                            {item.status === 'approved' ? 'Validé' : item.status === 'rejected' ? 'Refusé' : 'Attente'}
                          </Badge>
                          <span className="text-[10px] text-slate-400">{new Date(item.date).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </Card>
                  ))}
                  {(!recentCatches || recentCatches.length === 0) && (
                    <p className="text-muted-foreground italic col-span-2 text-center py-8 bg-white rounded-xl border-dashed border-2">
                      Aucune capture enregistrée pour le moment.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
             <Card className="border-none shadow bg-primary text-white">
              <CardHeader>
                <CardTitle className="font-headline text-lg flex items-center gap-2">
                  <Anchor className="h-5 w-5" /> Règlement Rapide
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs space-y-3 opacity-90">
                <p>1. La photo doit être prise sur un mètre gradué officiel.</p>
                <p>2. Le poisson doit être vivant lors de la photo.</p>
                <p>3. Les points sont calculés selon l'espèce (Taille x Coefficient).</p>
                <p>4. La validation par l'admin peut modifier le statut a posteriori.</p>
              </CardContent>
            </Card>

            <Card className="border-none shadow bg-white">
              <CardHeader>
                <CardTitle className="font-headline text-lg">Coefficients Points</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {species.length > 0 ? species.map(s => (
                  <div key={s.id} className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="font-medium text-slate-700">{s.name}</span>
                    <span className="font-bold text-primary">{s.pointsPerCm || 10} pts/cm</span>
                  </div>
                )) : (
                  <div className="flex justify-center py-4">
                    <Loader2 className="animate-spin h-5 w-5 text-slate-200" />
                  </div>
                )}
                {species.length === 0 && !loadingCatches && (
                  <p className="text-xs text-slate-400 italic">Aucune donnée disponible.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
