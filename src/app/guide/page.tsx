
"use client"

import { Navigation } from '@/components/Navigation';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { 
  Search, 
  MapPin, 
  Ruler, 
  Target, 
  Edit, 
  Plus, 
  Trash2, 
  Fish as FishIcon, 
  Sparkles, 
  Loader2, 
  ClipboardList, 
  ImageIcon, 
  Upload,
  Zap,
  X,
  Trophy
} from 'lucide-react';
import Image from 'next/image';
import { useState, useRef, useMemo } from 'react';
import { FishSpecies } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { parseFishData } from '@/ai/flows/parse-fish-data-flow';
import { useCollection, useFirestore, useMemoFirebase, useUser, useStorage, setDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const EMPTY_FISH: FishSpecies = {
  id: '',
  name: '',
  scientificName: '',
  pointsPerCm: 10,
  minSize: 0,
  description: '',
  imageUrl: '',
  habitat: '',
  diet: '',
  averageSize: '',
  keyFeatures: '',
  fishingTips: '',
  eligibilityCriteria: '',
  techniques: [],
  spots: [],
  bonusPoints: []
};

export default function GuidePage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const storage = useStorage();
  const { user } = useUser();
  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const fishQuery = useMemoFirebase(() => collection(firestore, 'species'), [firestore]);
  const { data: rawFishList, isLoading: isCollectionLoading } = useCollection<FishSpecies>(fishQuery);

  // Normalisation des données pour gérer les différents schémas Firestore
  const fishList = useMemo(() => {
    if (!rawFishList) return [];
    return rawFishList.map(fish => ({
      ...fish,
      // On mappe les champs Firestore vers notre type local FishSpecies
      imageUrl: fish.image || fish.imageUrl || '',
      minSize: fish.legalSize || fish.minSize || 0,
      bonusPoints: (fish.pointsSystem || fish.bonusPoints || []).map(p => ({
        threshold: p.minSize || p.threshold || 0,
        points: p.points || 0
      })),
      rarity: fish.rarity === 'very-rare' ? 'Très rare' : (fish.rarity === 'rare' ? 'Rare' : (fish.rarity || 'Commun'))
    }));
  }, [rawFishList]);

  const isAdmin = !!user;
  
  const [editingFish, setEditingFish] = useState<FishSpecies | null>(null);
  const [viewingFish, setViewingFish] = useState<FishSpecies | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isAILoading, setIsAILoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isParseDialogOpen, setIsParseDialogOpen] = useState(false);
  const [rawText, setRawText] = useState('');

  const filteredFish = fishList.filter(fish => 
    fish.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    fish.scientificName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEditClick = (e: React.MouseEvent, fish: FishSpecies) => {
    e.stopPropagation();
    setEditingFish({ ...fish });
    setIsDialogOpen(true);
  };

  const handleViewDetails = (fish: FishSpecies) => {
    setViewingFish(fish);
    setIsDetailsOpen(true);
  };

  const handleCreateClick = () => {
    setEditingFish({ ...EMPTY_FISH });
    setIsDialogOpen(true);
  };

  const handleSaveFish = () => {
    if (!editingFish) return;
    
    const docId = editingFish.id || doc(collection(firestore, 'species')).id;
    // On sauvegarde en respectant le schéma attendu par la base (legalSize, image, pointsSystem)
    const finalFishData = { 
      ...editingFish, 
      id: docId,
      legalSize: editingFish.minSize,
      image: editingFish.imageUrl,
      pointsSystem: editingFish.bonusPoints?.map(p => ({
        minSize: p.threshold,
        points: p.points
      }))
    };
    
    const docRef = doc(firestore, 'species', docId);
    setDocumentNonBlocking(docRef, finalFishData, { merge: true });
    
    toast({
      title: editingFish.id ? "Fiche mise à jour" : "Nouvelle espèce créée",
      description: `${finalFishData.name} a été enregistré.`
    });
    
    setIsDialogOpen(false);
    setEditingFish(null);
  };

  const handleDeleteFish = (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    if (!confirm(`Supprimer ${name} ?`)) return;
    const docRef = doc(firestore, 'species', id);
    deleteDocumentNonBlocking(docRef);
    toast({
      title: "Espèce supprimée",
      description: `${name} a été retiré du guide.`
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingFish) return;

    setIsUploading(true);
    try {
      const storagePath = `species/${Date.now()}_${file.name}`;
      const storageRef = ref(storage, storagePath);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      setEditingFish(prev => prev ? { ...prev, imageUrl: downloadURL } : null);
      toast({ title: "Photo ajoutée", description: "L'image a été chargée avec succès." });
    } catch (error) {
      toast({ variant: "destructive", title: "Erreur", description: "Échec du chargement de l'image." });
    } finally {
      setIsUploading(false);
    }
  };

  const handleAIParse = async () => {
    if (!rawText.trim()) return;
    setIsAILoading(true);
    try {
      const result = await parseFishData(rawText);
      setEditingFish({ ...EMPTY_FISH, ...result, id: editingFish?.id || '' });
      setIsParseDialogOpen(false);
      setIsDialogOpen(true);
      setRawText('');
    } catch (error) {
      toast({ variant: "destructive", title: "Erreur IA", description: "Analyse impossible." });
    } finally {
      setIsAILoading(false);
    }
  };

  const getRarityBadgeColor = (rarity: string | undefined) => {
    switch (rarity) {
      case 'Très rare': return 'bg-[#1e4e6e] text-white hover:bg-[#1e4e6e]';
      case 'Rare': return 'bg-orange-500 text-white hover:bg-orange-500';
      default: return 'bg-slate-400 text-white hover:bg-slate-400';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20 md:pb-0">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        <header className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="font-headline text-4xl font-bold mb-2 text-slate-900">Guide des Poissons</h1>
            <p className="text-muted-foreground text-lg">Découvrez les espèces de la Rade de Brest.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Rechercher..." 
                className="pl-10 bg-white border-slate-200"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            {isAdmin && (
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsParseDialogOpen(true)}>
                  <ClipboardList className="h-4 w-4 mr-2" /> Import IA
                </Button>
                <Button onClick={handleCreateClick} className="font-bold">
                  <Plus className="h-4 w-4 mr-2" /> Ajouter
                </Button>
              </div>
            )}
          </div>
        </header>

        {isCollectionLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredFish.map((fish) => (
              <Card 
                key={fish.id} 
                className="group relative overflow-hidden border-none shadow-sm hover:shadow-xl transition-all bg-white rounded-2xl cursor-pointer"
                onClick={() => handleViewDetails(fish)}
              >
                <div className="relative h-48 w-full overflow-hidden">
                  <Image 
                    src={fish.imageUrl || 'https://picsum.photos/seed/fish/600/400'} 
                    alt={fish.name} 
                    fill 
                    className="object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute top-3 right-3">
                    <Badge className={cn("text-[10px] font-bold px-2 py-0.5", getRarityBadgeColor(fish.rarity))}>
                      {fish.rarity}
                    </Badge>
                  </div>
                </div>
                
                <CardContent className="p-5">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-headline text-xl font-bold text-slate-900">{fish.name}</h3>
                      <p className="text-sm italic text-slate-400">{fish.scientificName}</p>
                    </div>
                    {isAdmin && (
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="secondary" size="icon" className="h-8 w-8" onClick={(e) => handleEditClick(e, fish)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="destructive" size="icon" className="h-8 w-8" onClick={(e) => handleDeleteFish(e, fish.id, fish.name)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col gap-2 mt-4">
                    <div className="flex items-center gap-2 text-slate-600 bg-slate-50 p-2 rounded-lg">
                      <Ruler className="h-4 w-4 text-orange-400" />
                      <span className="text-sm font-semibold">Maille: {fish.minSize} cm</span>
                    </div>

                    {/* Affichage des points Bonus sur la vignette */}
                    {fish.bonusPoints && fish.bonusPoints.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {fish.bonusPoints.slice(0, 2).map((bp, idx) => (
                          <Badge key={idx} variant="outline" className="text-[9px] border-primary/20 text-primary bg-primary/5 flex items-center gap-1">
                            <Target className="h-2 w-2" />
                            +{bp.points} pts ({bp.threshold}cm)
                          </Badge>
                        ))}
                        {fish.bonusPoints.length > 2 && (
                          <span className="text-[9px] text-muted-foreground self-center ml-1">...</span>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* DIALOG DETAILS */}
        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 border-none bg-slate-50">
            <DialogHeader className="p-6 bg-white border-b">
              <div className="flex justify-between items-start">
                <div>
                  <DialogTitle className="font-headline text-4xl font-bold text-[#1e4e6e]">{viewingFish?.name}</DialogTitle>
                  <p className="text-lg italic text-slate-400 mt-1">{viewingFish?.scientificName}</p>
                </div>
                <Badge className={cn("text-xs font-bold px-3 py-1", getRarityBadgeColor(viewingFish?.rarity))}>
                  {viewingFish?.rarity}
                </Badge>
              </div>
              <DialogDescription>
                Fiche descriptive complète pour l'espèce {viewingFish?.name}, incluant la maille, les techniques et les bonus.
              </DialogDescription>
            </DialogHeader>
            
            {viewingFish && (
              <div className="p-8">
                <div className="relative h-[300px] w-full rounded-2xl overflow-hidden shadow-inner mb-8 bg-slate-100">
                  <Image src={viewingFish.imageUrl || 'https://picsum.photos/seed/fish/800/400'} alt={viewingFish.name} fill className="object-cover" />
                </div>

                <div className="grid md:grid-cols-3 gap-6 mb-8">
                  <Card className="border-none bg-white shadow-sm rounded-xl">
                    <CardHeader className="pb-2 flex flex-row items-center gap-2">
                      <Ruler className="h-5 w-5 text-orange-400" />
                      <CardTitle className="text-lg font-bold text-[#1e4e6e]">Taille</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-1 text-sm">
                      <p><span className="font-bold">Maille légale:</span> {viewingFish.minSize} cm</p>
                      <p><span className="font-bold">Taille moyenne:</span> {viewingFish.averageSize || 'N/A'}</p>
                      <p><span className="font-bold">Taille maximale:</span> {viewingFish.maxSize || 'N/A'} cm</p>
                    </CardContent>
                  </Card>

                  <Card className="border-none bg-[#e8f4f9] shadow-sm rounded-xl">
                    <CardHeader className="pb-2 flex flex-row items-center gap-2">
                      <Zap className="h-5 w-5 text-orange-400" />
                      <CardTitle className="text-lg font-bold text-[#1e4e6e]">Techniques</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {viewingFish.techniques?.map((t, idx) => (
                          <Badge key={idx} variant="secondary" className="bg-[#b7e2f0] text-[#1e4e6e] hover:bg-[#b7e2f0]">{t}</Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-none bg-white shadow-sm rounded-xl">
                    <CardHeader className="pb-2 flex flex-row items-center gap-2">
                      <MapPin className="h-5 w-5 text-orange-400" />
                      <CardTitle className="text-lg font-bold text-[#1e4e6e]">Spots</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-1 text-sm">
                        {viewingFish.spots?.map((s, idx) => (
                          <li key={idx} className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                            {s}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>

                <div className="bg-[#1e4e6e] rounded-2xl p-6 mb-8 text-white">
                  <h3 className="font-headline text-xl font-bold flex items-center gap-2 mb-6">
                    <Target className="h-6 w-6" /> Points Bonus
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {viewingFish.bonusPoints?.map((bp, idx) => (
                      <div key={idx} className="bg-white/10 rounded-xl p-4 text-center border border-white/20">
                        <p className="text-3xl font-bold">{bp.points}</p>
                        <p className="text-sm opacity-80">+ {bp.threshold} cm</p>
                      </div>
                    ))}
                    {(!viewingFish.bonusPoints || viewingFish.bonusPoints.length === 0) && (
                      <p className="col-span-3 text-center opacity-60 italic py-4">Aucun palier de bonus configuré.</p>
                    )}
                  </div>
                </div>

                <Card className="border border-slate-200 rounded-xl">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-bold text-[#1e4e6e]">Description</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-600 leading-relaxed">{viewingFish.description}</p>
                  </CardContent>
                </Card>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* DIALOG EDIT */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingFish?.id ? "Modifier l'espèce" : "Nouvelle espèce"}</DialogTitle>
              <DialogDescription>
                Formulaire permettant de mettre à jour les informations de l'espèce sélectionnée.
              </DialogDescription>
            </DialogHeader>
            {editingFish && (
              <div className="space-y-6 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nom</Label>
                    <Input value={editingFish.name} onChange={e => setEditingFish({...editingFish, name: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Nom Scientifique</Label>
                    <Input value={editingFish.scientificName} onChange={e => setEditingFish({...editingFish, scientificName: e.target.value})} />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Maille (cm)</Label>
                    <Input type="number" value={editingFish.minSize} onChange={e => setEditingFish({...editingFish, minSize: parseInt(e.target.value) || 0})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Taille Max (cm)</Label>
                    <Input type="number" value={editingFish.maxSize} onChange={e => setEditingFish({...editingFish, maxSize: parseInt(e.target.value) || 0})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Rareté</Label>
                    <Select value={editingFish.rarity} onValueChange={(v: any) => setEditingFish({...editingFish, rarity: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Commun">Commun</SelectItem>
                        <SelectItem value="Rare">Rare</SelectItem>
                        <SelectItem value="Très rare">Très rare</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Techniques (séparées par des virgules)</Label>
                  <Input 
                    value={editingFish.techniques?.join(', ')} 
                    onChange={e => setEditingFish({...editingFish, techniques: e.target.value.split(',').map(s => s.trim()).filter(s => s)})} 
                  />
                </div>

                <div className="space-y-2">
                  <Label>Spots (séparés par des virgules)</Label>
                  <Input 
                    value={editingFish.spots?.join(', ')} 
                    onChange={e => setEditingFish({...editingFish, spots: e.target.value.split(',').map(s => s.trim()).filter(s => s)})} 
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2"><ImageIcon className="h-4 w-4" /> Photo</Label>
                    <div className="flex gap-2">
                      <Input type="file" className="hidden" ref={fileInputRef} onChange={handleImageUpload} />
                      <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                        {isUploading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Upload className="mr-2 h-4 w-4" />} Upload
                      </Button>
                    </div>
                  </div>
                  <Input value={editingFish.imageUrl} onChange={e => setEditingFish({...editingFish, imageUrl: e.target.value})} placeholder="URL de l'image" />
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea className="min-h-[150px]" value={editingFish.description} onChange={e => setEditingFish({...editingFish, description: e.target.value})} />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Annuler</Button>
              <Button onClick={handleSaveFish}>Enregistrer</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* IA IMPORT DIALOG */}
        <Dialog open={isParseDialogOpen} onOpenChange={setIsParseDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Importation par IA</DialogTitle>
              <DialogDescription>
                Collez un texte descriptif pour extraire automatiquement les données de l'espèce.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Textarea placeholder="Ex: L'anguille mesure entre 40 et 80cm..." className="min-h-[200px]" value={rawText} onChange={(e) => setRawText(e.target.value)} />
            </div>
            <DialogFooter>
              <Button onClick={handleAIParse} disabled={isAILoading}>
                {isAILoading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Sparkles className="mr-2 h-4 w-4" />} Analyser
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
