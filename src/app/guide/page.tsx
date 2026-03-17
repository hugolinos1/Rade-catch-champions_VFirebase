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
  Sparkles, 
  Loader2, 
  Upload,
  Zap,
  X,
  Coins,
  Wand2
} from 'lucide-react';
import Image from 'next/image';
import { useState, useRef, useMemo } from 'react';
import { FishSpecies, BonusPointThreshold } from '@/lib/types';
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

  const fishList = useMemo(() => {
    if (!rawFishList) return [];
    
    // Tri alphabétique par nom avant le mapping
    const sorted = [...rawFishList].sort((a, b) => 
      a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' })
    );

    return sorted.map(fish => ({
      ...fish,
      imageUrl: fish.image || fish.imageUrl || '',
      minSize: fish.legalSize || fish.minSize || 0,
      pointsPerCm: fish.pointsPerCm ?? 10,
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
    const finalFishData = { 
      ...editingFish, 
      id: docId,
      legalSize: editingFish.minSize,
      image: editingFish.imageUrl,
      pointsPerCm: editingFish.pointsPerCm || 10,
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
      
      setEditingFish({ 
        ...EMPTY_FISH, 
        ...result, 
        id: editingFish?.id || '',
        imageUrl: editingFish?.imageUrl || ''
      });
      setIsParseDialogOpen(false);
      setIsDialogOpen(true);
      setRawText('');
      toast({
        title: "Recherche terminée",
        description: `La fiche de ${result.name} a été générée avec succès.`
      });
    } catch (error: any) {
      console.error("Erreur IA détaillée:", error);
      let errorMsg = "L'Assistant n'a pas pu traiter cette demande.";
      if (error.message?.includes('API key')) {
        errorMsg = "La clé API Google AI est manquante ou invalide.";
      } else if (error.message?.includes('response was received')) {
        errorMsg = "Le serveur a mis trop de temps à répondre. Réessayez avec un nom plus court.";
      }
      
      toast({ 
        variant: "destructive", 
        title: "Erreur IA", 
        description: errorMsg
      });
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

  const addTechnique = () => {
    if (!editingFish) return;
    setEditingFish({ ...editingFish, techniques: [...(editingFish.techniques || []), ""] });
  };
  const updateTechnique = (index: number, value: string) => {
    if (!editingFish) return;
    const newTechs = [...(editingFish.techniques || [])];
    newTechs[index] = value;
    setEditingFish({ ...editingFish, techniques: newTechs });
  };
  const removeTechnique = (index: number) => {
    if (!editingFish) return;
    setEditingFish({ ...editingFish, techniques: editingFish.techniques?.filter((_, i) => i !== index) });
  };

  const addSpot = () => {
    if (!editingFish) return;
    setEditingFish({ ...editingFish, spots: [...(editingFish.spots || []), ""] });
  };
  const updateSpot = (index: number, value: string) => {
    if (!editingFish) return;
    const newSpots = [...(editingFish.spots || [])];
    newSpots[index] = value;
    setEditingFish({ ...editingFish, spots: newSpots });
  };
  const removeSpot = (index: number) => {
    if (!editingFish) return;
    setEditingFish({ ...editingFish, spots: editingFish.spots?.filter((_, i) => i !== index) });
  };

  const addPalier = () => {
    if (!editingFish) return;
    setEditingFish({ ...editingFish, bonusPoints: [...(editingFish.bonusPoints || []), { threshold: 0, points: 0 }] });
  };
  const updatePalier = (index: number, field: keyof BonusPointThreshold, value: number) => {
    if (!editingFish) return;
    const newBonus = [...(editingFish.bonusPoints || [])];
    newBonus[index] = { ...newBonus[index], [field]: value };
    setEditingFish({ ...editingFish, bonusPoints: newBonus });
  };
  const removePalier = (index: number) => {
    if (!editingFish) return;
    setEditingFish({ ...editingFish, bonusPoints: editingFish.bonusPoints?.filter((_, i) => i !== index) });
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
                <Button variant="outline" onClick={() => setIsParseDialogOpen(true)} className="border-primary/20 hover:bg-primary/5">
                  <Wand2 className="h-4 w-4 mr-2 text-primary" /> Assistant IA
                </Button>
                <Button onClick={handleCreateClick} className="font-bold bg-[#1e4e6e] hover:bg-[#1e4e6e]/90">
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
                      <CardTitle className="text-lg font-bold text-[#1e4e6e]">Taille & Points</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-1 text-sm">
                      <p className="flex items-center gap-2"><Coins className="h-3 w-3 text-slate-400" /> <span className="font-bold">Coefficient:</span> {viewingFish.pointsPerCm} pts/cm</p>
                      <p className="flex items-center gap-2"><Ruler className="h-3 w-3 text-slate-400" /> <span className="font-bold">Maille légale:</span> {viewingFish.minSize} cm</p>
                      <p className="flex items-center gap-2"><Target className="h-3 w-3 text-slate-400" /> <span className="font-bold">Taille moyenne:</span> {viewingFish.averageSize || 'N/A'}</p>
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
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-slate-800">
                {editingFish?.id ? `Modifier ${editingFish.name}` : "Nouvelle espèce"}
              </DialogTitle>
            </DialogHeader>
            {editingFish && (
              <div className="space-y-6 py-4">
                <div className="grid grid-cols-2 gap-x-4 gap-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-slate-600 font-bold">Nom Commun</Label>
                    <Input className="bg-slate-50 border-slate-200" value={editingFish.name} onChange={e => setEditingFish({...editingFish, name: e.target.value})} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-slate-600 font-bold">Nom Scientifique</Label>
                    <Input className="bg-slate-50 border-slate-200" placeholder="Anguilla anguilla" value={editingFish.scientificName} onChange={e => setEditingFish({...editingFish, scientificName: e.target.value})} />
                  </div>
                  
                  <div className="space-y-1.5">
                    <Label className="text-slate-600 font-bold">Taille Légale (cm)</Label>
                    <Input className="bg-slate-50 border-slate-200" type="number" value={editingFish.minSize} onChange={e => setEditingFish({...editingFish, minSize: parseInt(e.target.value) || 0})} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-slate-600 font-bold">Points par cm</Label>
                    <Input className="bg-slate-50 border-slate-200" type="number" placeholder="Défaut: 10" value={editingFish.pointsPerCm} onChange={e => setEditingFish({...editingFish, pointsPerCm: parseInt(e.target.value) || 0})} />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-slate-600 font-bold">Taille Moyenne</Label>
                    <Input className="bg-slate-50 border-slate-200" value={editingFish.averageSize} onChange={e => setEditingFish({...editingFish, averageSize: e.target.value})} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-slate-600 font-bold">Rareté</Label>
                    <Select value={editingFish.rarity} onValueChange={(v: any) => setEditingFish({...editingFish, rarity: v})}>
                      <SelectTrigger className="bg-slate-50 border-slate-200"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Commun">Commun</SelectItem>
                        <SelectItem value="Rare">Rare</SelectItem>
                        <SelectItem value="Très rare">Très rare</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-slate-600 font-bold">Description</Label>
                  <Textarea className="bg-slate-50 border-slate-200 min-h-[100px]" value={editingFish.description} onChange={e => setEditingFish({...editingFish, description: e.target.value})} />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-slate-600 font-bold">Techniques</Label>
                      <Button variant="outline" size="sm" onClick={addTechnique} className="h-7 text-xs">
                        <Plus className="h-3 w-3 mr-1" /> Ajouter
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {editingFish.techniques?.map((tech, idx) => (
                        <div key={idx} className="flex gap-2">
                          <Input className="h-9" value={tech} onChange={(e) => updateTechnique(idx, e.target.value)} />
                          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => removeTechnique(idx)}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-slate-600 font-bold">Spots</Label>
                      <Button variant="outline" size="sm" onClick={addSpot} className="h-7 text-xs">
                        <Plus className="h-3 w-3 mr-1" /> Ajouter
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {editingFish.spots?.map((spot, idx) => (
                        <div key={idx} className="flex gap-2">
                          <Input className="h-9" value={spot} onChange={(e) => updateSpot(idx, e.target.value)} />
                          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => removeSpot(idx)}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-slate-600 font-bold">Points Bonus</Label>
                    <Button variant="outline" size="sm" onClick={addPalier} className="h-7 text-xs">
                      <Plus className="h-3 w-3 mr-1" /> Palier
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {editingFish.bonusPoints?.map((bp, idx) => (
                      <div key={idx} className="flex gap-3 items-center">
                        <Input className="h-9" type="number" placeholder="Seuil cm" value={bp.threshold} onChange={(e) => updatePalier(idx, 'threshold', parseInt(e.target.value) || 0)} />
                        <Input className="h-9" type="number" placeholder="Points" value={bp.points} onChange={(e) => updatePalier(idx, 'points', parseInt(e.target.value) || 0)} />
                        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => removePalier(idx)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 pt-4">
                  <Label className="text-slate-600 font-bold">Photo de l'espèce</Label>
                  <div className="flex items-center gap-3">
                    {editingFish.imageUrl && (
                      <div className="relative h-10 w-10 rounded border overflow-hidden shrink-0">
                        <Image src={editingFish.imageUrl} alt="preview" fill className="object-cover" />
                      </div>
                    )}
                    <div className="flex-1 flex gap-2">
                       <input type="file" className="hidden" ref={fileInputRef} onChange={handleImageUpload} />
                       <Button variant="outline" className="w-full text-slate-500 justify-start h-10" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                         {isUploading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Upload className="h-4 w-4 mr-2" />}
                         Choisir une photo
                       </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>Annuler</Button>
              <Button className="bg-[#1e4e6e] font-bold px-8" onClick={handleSaveFish}>Sauvegarder</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isParseDialogOpen} onOpenChange={setIsParseDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" /> Assistant de Recherche IA
              </DialogTitle>
              <DialogHeaderDescription>
                Saisissez le **nom du poisson** (ex: Bar commun). L'IA recherchera toutes les informations pour vous.
              </DialogHeaderDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div className="space-y-2">
                <Label>Nom du poisson</Label>
                <Input 
                  placeholder="Ex: Bar de ligne, Daurade royale..." 
                  value={rawText} 
                  onChange={(e) => setRawText(e.target.value)} 
                  onKeyDown={(e) => e.key === 'Enter' && rawText.trim() && handleAIParse()}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setIsParseDialogOpen(false)}>Annuler</Button>
              <Button 
                onClick={handleAIParse} 
                disabled={isAILoading || !rawText.trim()}
                className="bg-primary hover:bg-primary/90 font-bold"
              >
                {isAILoading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Wand2 className="mr-2 h-4 w-4" />} 
                Lancer la recherche
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
