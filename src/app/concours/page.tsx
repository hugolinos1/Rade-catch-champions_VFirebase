
"use client"

import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Send, History, Scale, Anchor, Loader2, Camera, MapPin, X } from 'lucide-react';
import Image from 'next/image';
import { useState, useRef } from 'react';
import { Catch, UserProfile, FishSpecies, Contest } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection, useMemoFirebase, useUser, useStorage } from '@/firebase';
import { collection, query, orderBy, limit, where } from 'firebase/firestore';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
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
  const usersQuery = useMemoFirebase(() => currentUser ? collection(firestore, 'users') : null, [firestore, currentUser]);
  const recentCatchesQuery = useMemoFirebase(() => 
    currentUser ? query(collection(firestore, 'catches'), orderBy('date', 'desc'), limit(10)) : null, 
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
    if (!selectedFisherman || !selectedFishId || !length || !activeContest) return;

    setIsSubmitting(true);
    
    try {
      let imageUrl = 'https://picsum.photos/seed/catch/400/300'; // Default

      // Upload image to Storage if selected
      if (selectedFile) {
        const storageRef = ref(storage, `catches/${Date.now()}_${selectedFile.name}`);
        const snapshot = await uploadBytes(storageRef, selectedFile);
        imageUrl = await getDownloadURL(snapshot.ref);
      }

      const fisher = allUsers?.find(u => u.id === selectedFisherman);
      const fish = species?.find(s => s.id === selectedFishId);
      const sizeNum = parseFloat(length);

      const newCatch: Omit<Catch, 'id'> = {
        anglerId: selectedFisherman,
        anglerName: fisher?.name || (selectedFisherman === currentUser?.uid ? 'Moi' : 'Anonyme'),
        competitionId: activeContest.id,
        fishId: selectedFishId,
        fishName: fish?.name || 'Inconnu',
        size: sizeNum,
        weight: parseFloat(weight) || 0,
        imageUrl: imageUrl,
        date: new Date().toISOString().split('T')[0], // YYYY-MM-DD as in screenshot
        points: (fish?.pointsPerCm || 10) * sizeNum,
        status: 'pending',
        location: location
      };

      const catchesCol = collection(firestore, 'catches');
      addDocumentNonBlocking(catchesCol, newCatch);

      toast({ title: "Capture envoyée !", description: "En attente de validation." });
      
      // Reset form
      setLength('');
      setWeight('');
      setLocation('');
      clearFile();
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Erreur", description: "Impossible d'envoyer la capture." });
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
                <CardDescription>Saisissez les détails et joignez une photo.</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Photo Section */}
                  <div className="space-y-4">
                    <Label className="text-slate-600 font-bold">Photo de la prise (Obligatoire)</Label>
                    {!previewUrl ? (
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-slate-200 rounded-2xl h-48 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors bg-slate-50/50"
                      >
                        <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center mb-2">
                          <Camera className="h-6 w-6 text-primary" />
                        </div>
                        <span className="text-sm font-medium text-slate-500">Prendre une photo ou choisir un fichier</span>
                        <span className="text-[10px] text-slate-400 mt-1">Format recommandé : JPG, PNG</span>
                      </div>
                    ) : (
                      <div className="relative rounded-2xl overflow-hidden h-64 shadow-md group">
                        <Image src={previewUrl} alt="Preview" fill className="object-cover" />
                        <button 
                          type="button"
                          onClick={clearFile}
                          className="absolute top-3 right-3 bg-black/50 hover:bg-black/70 text-white p-1.5 rounded-full backdrop-blur-sm transition-colors"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>
                    )}
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      onChange={handleFileChange} 
                      accept="image/*" 
                      capture="environment" // This triggers camera on mobile
                    />
                  </div>

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
                      <Label>Poids (kg) - Optionnel</Label>
                      <Input type="number" step="0.1" value={weight} onChange={e => setWeight(e.target.value)} />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label>Lieu de capture (Optionnel)</Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input className="pl-10" placeholder="Ex: Digue de la Marina" value={location} onChange={e => setLocation(e.target.value)} />
                      </div>
                    </div>
                  </div>

                  <Button type="submit" className="w-full font-headline font-bold h-12" disabled={isSubmitting || !currentUser || !previewUrl}>
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
                        <Image src={item.imageUrl || 'https://picsum.photos/seed/catch/400/300'} alt={item.fishName} fill className="object-cover" />
                      </div>
                      <div className="flex-1 p-4 flex flex-col justify-between">
                        <div>
                          <p className="font-bold text-xs truncate">{item.anglerName}</p>
                          <p className="text-primary font-headline font-bold">{item.fishName}</p>
                          <p className="text-[10px] text-muted-foreground">{item.size} cm • {item.points} pts</p>
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
