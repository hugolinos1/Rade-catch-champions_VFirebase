
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
import { Search, MapPin, Ruler, Target, Edit, Plus, Trash2, Fish as FishIcon, Sparkles, Loader2, ClipboardList, ImageIcon, Upload } from 'lucide-react';
import Image from 'next/image';
import { useState, useRef } from 'react';
import { FishSpecies, BonusPointThreshold } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { generateFishDescription } from '@/ai/flows/generate-fish-description-flow';
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
  keyFeatures: '',
  fishingTips: '',
  eligibilityCriteria: '',
  rarity: 'Commun',
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
  
  const fishQuery = useMemoFirebase(() => collection(firestore, 'fish_species'), [firestore]);
  const { data: fishList, isLoading: isCollectionLoading } = useCollection<FishSpecies>(fishQuery);

  const isAdmin = !!user; 
  
  const [editingFish, setEditingFish] = useState<FishSpecies | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAILoading, setIsAILoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isParseDialogOpen, setIsParseDialogOpen] = useState(false);
  const [rawText, setRawText] = useState('');

  const filteredFish = (fishList || []).filter(fish => 
    fish.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    fish.scientificName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEditClick = (fish: FishSpecies) => {
    setEditingFish({ ...fish });
    setIsDialogOpen(true);
  };

  const handleCreateClick = () => {
    setEditingFish({ ...EMPTY_FISH });
    setIsDialogOpen(true);
  };

  const handleSaveFish = () => {
    if (!editingFish) return;
    
    const docId = editingFish.id || doc(collection(firestore, 'fish_species')).id;
    const finalFish = { ...editingFish, id: docId };
    
    const docRef = doc(firestore, 'fish_species', docId);
    setDocumentNonBlocking(docRef, finalFish, { merge: true });
    
    toast({
      title: editingFish.id ? "Fiche mise à jour" : "Nouvelle espèce créée",
      description: `${finalFish.name} a été enregistré dans le guide.`
    });
    
    setIsDialogOpen(false);
    setEditingFish(null);
  };

  const handleDeleteFish = (id: string, name: string) => {
    if (!confirm(`Supprimer ${name} ?`)) return;
    const docRef = doc(firestore, 'fish_species', id);
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
    
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('TIMEOUT')), 15000)
    );

    try {
      const storagePath = `species/${Date.now()}_${file.name}`;
      const storageRef = ref(storage, storagePath);
      
      const snapshot = await Promise.race([
        uploadBytes(storageRef, file),
        timeoutPromise
      ]) as any;

      const downloadURL = await getDownloadURL(snapshot.ref);

      setEditingFish(prev => prev ? {
        ...prev,
        imageUrl: downloadURL
      } : null);

      toast({
        title: "Photo ajoutée",
        description: "L'image a été chargée avec succès."
      });
    } catch (error: any) {
      console.error("Storage Error:", error);
      let message = "Une erreur est survenue lors du chargement.";
      
      if (error.message === 'TIMEOUT') {
        message = "Délai dépassé. Vérifiez les paramètres CORS de votre bucket ou votre connexion.";
      } else if (error.code === 'storage/unauthorized') {
        message = "Accès refusé. Vérifiez que vous êtes connecté.";
      } else if (error.code === 'storage/retry-limit-exceeded') {
        message = "Le chargement a échoué (limite d'essais atteinte).";
      }

      toast({
        variant: "destructive",
        title: "Échec du chargement",
        description: message
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAIGenerate = async () => {
    if (!editingFish?.name) {
      toast({
        variant: "destructive",
        title: "Nom requis",
        description: "Veuillez donner au moins un nom à l'espèce pour que l'IA puisse travailler."
      });
      return;
    }

    setIsAILoading(true);
    try {
      const result = await generateFishDescription({
        fishName: editingFish.name,
        scientificName: editingFish.scientificName,
        habitat: editingFish.habitat,
        diet: editingFish.diet,
        averageSize: editingFish.averageSize,
        keyFeatures: editingFish.keyFeatures,
        fishingTips: editingFish.fishingTips,
        existingDescription: editingFish.description
      });
      
      setEditingFish(prev => prev ? {
        ...prev,
        description: result.description
      } : null);

      toast({
        title: "IA Succès",
        description: "La description a été générée/enrichie avec succès."
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur IA",
        description: "Impossible de contacter l'assistant IA."
      });
    } finally {
      setIsAILoading(false);
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
      toast({ title: "Importation Réussie", description: `Les données de "${result.name}" ont été extraites.` });
    } catch (error) {
      toast({ variant: "destructive", title: "Erreur Import", description: "L'IA n'a pas pu analyser ce texte." });
    } finally {
      setIsAILoading(false);
    }
  };

  const addTechnique = () => {
    if (!editingFish) return;
    setEditingFish({
      ...editingFish,
      techniques: [...(editingFish.techniques || []), '']
    });
  };

  const removeTechnique = (index: number) => {
    if (!editingFish) return;
    const newTechs = [...(editingFish.techniques || [])];
    newTechs.splice(index, 1);
    setEditingFish({ ...editingFish, techniques: newTechs });
  };

  const updateTechnique = (index: number, value: string) => {
    if (!editingFish) return;
    const newTechs = [...(editingFish.techniques || [])];
    newTechs[index] = value;
    setEditingFish({ ...editingFish, techniques: newTechs });
  };

  const addSpot = () => {
    if (!editingFish) return;
    setEditingFish({
      ...editingFish,
      spots: [...(editingFish.spots || []), '']
    });
  };

  const removeSpot = (index: number) => {
    if (!editingFish) return;
    const newSpots = [...(editingFish.spots || [])];
    newSpots.splice(index, 1);
    setEditingFish({ ...editingFish, spots: newSpots });
  };

  const updateSpot = (index: number, value: string) => {
    if (!editingFish) return;
    const newSpots = [...(editingFish.spots || [])];
    newSpots[index] = value;
    setEditingFish({ ...editingFish, spots: newSpots });
  };

  const addPalier = () => {
    if (!editingFish) return;
    setEditingFish({
      ...editingFish,
      bonusPoints: [...(editingFish.bonusPoints || []), { threshold: 0, points: 0 }]
    });
  };

  const removePalier = (index: number) => {
    if (!editingFish) return;
    const newPaliers = [...(editingFish.bonusPoints || [])];
    newPaliers.splice(index, 1);
    setEditingFish({ ...editingFish, bonusPoints: newPaliers });
  };

  const updatePalier = (index: number, field: keyof BonusPointThreshold, value: number) => {
    if (!editingFish) return;
    const newPaliers = [...(editingFish.bonusPoints || [])];
    newPaliers[index] = { ...newPaliers[index], [field]: value };
    setEditingFish({ ...editingFish, bonusPoints: newPaliers });
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20 md:pb-0">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        <header className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="text-center md:text-left">
            <h1 className="font-headline text-4xl font-bold mb-4 text-slate-900">Guide des Poissons</h1>
            <p className="text-muted-foreground text-lg max-w-2xl">
              Fiches détaillées des espèces de la Rade de Brest pour optimiser vos points.
            </p>
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
                <Button variant="outline" onClick={() => setIsParseDialogOpen(true)} className="font-headline">
                  <ClipboardList className="h-4 w-4 mr-2" /> Import IA
                </Button>
                <Button onClick={handleCreateClick} className="font-headline font-bold">
                  <Plus className="h-4 w-4 mr-2" /> Ajouter
                </Button>
              </div>
            )}
          </div>
        </header>

        {isCollectionLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredFish.map((fish) => (
              <Card key={fish.id} className="relative overflow-hidden border-none shadow-sm hover:shadow-md transition-shadow bg-white rounded-2xl">
                {isAdmin && (
                  <div className="absolute top-4 left-4 z-10 flex gap-2">
                    <Button 
                      variant="secondary" 
                      size="icon" 
                      className="bg-white/80 backdrop-blur-sm border shadow-sm hover:bg-primary hover:text-white"
                      onClick={() => handleEditClick(fish)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="icon" 
                      className="bg-red-500/80 backdrop-blur-sm shadow-sm text-white hover:bg-red-600"
                      onClick={() => handleDeleteFish(fish.id, fish.name)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start">
                    <div className={cn(isAdmin && "pl-20")}>
                      <CardTitle className="font-headline text-2xl font-bold text-slate-900">{fish.name}</CardTitle>
                      <p className="text-sm italic text-slate-400 font-medium">{fish.scientificName}</p>
                    </div>
                    {fish.rarity && (
                      <Badge className={cn(
                        "rounded-full px-3 py-1 text-[10px] font-bold tracking-wider uppercase",
                        fish.rarity === 'Très rare' ? "bg-cyan-900 hover:bg-cyan-950 text-white" : 
                        fish.rarity === 'Rare' ? "bg-amber-500 hover:bg-amber-600 text-white" : 
                        "bg-slate-200 hover:bg-slate-300 text-slate-700"
                      )}>
                        {fish.rarity}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  <div className="relative h-44 w-full rounded-2xl overflow-hidden bg-slate-100">
                    <Image 
                      src={fish.imageUrl || 'https://picsum.photos/seed/fish/600/400'} 
                      alt={fish.name} 
                      fill 
                      className="object-cover"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Ruler className="h-4 w-4 text-orange-400" />
                        <span className="text-sm font-semibold">Maille: {fish.minSize} cm</span>
                      </div>
                      {fish.averageSize && (
                        <div className="flex items-center gap-2 text-slate-600">
                          <Target className="h-4 w-4 text-orange-400" />
                          <span className="text-sm font-semibold">Moy: {fish.averageSize}</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs font-bold text-slate-800 uppercase tracking-tight">Techniques:</p>
                      <div className="flex flex-col gap-1.5">
                        {fish.techniques?.map((tech, i) => (
                          <div key={i} className="bg-cyan-50 text-cyan-700 px-3 py-1.5 rounded-lg text-[11px] font-semibold border border-cyan-100/50">
                            {tech}
                          </div>
                        )) || <span className="text-xs text-muted-foreground italic">Libre</span>}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-slate-800 font-bold uppercase text-xs">
                      <MapPin className="h-4 w-4 text-orange-400" />
                      Spots:
                    </div>
                    <p className="text-xs text-slate-500 font-medium pl-6">
                      {fish.spots?.join(', ') || 'Non renseigné'}
                    </p>
                  </div>

                  {fish.bonusPoints && fish.bonusPoints.length > 0 && (
                    <div className="bg-cyan-50/50 rounded-2xl p-4 space-y-3 border border-cyan-100/30">
                      <p className="text-sm font-bold text-cyan-900 tracking-tight">Points Bonus:</p>
                      <div className="space-y-2">
                        {fish.bonusPoints.map((bonus, i) => (
                          <div key={i} className="flex justify-between items-center text-xs font-bold">
                            <span className="text-slate-500">+ {bonus.threshold} cm:</span>
                            <span className="text-orange-500">{bonus.points} pts</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={isParseDialogOpen} onOpenChange={setIsParseDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Importation par IA</DialogTitle>
              <DialogDescription>Collez n'importe quel texte contenant des informations sur un poisson (description, site web, etc.).</DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <span className="sr-only">Zone de saisie texte brut</span>
              <Textarea 
                placeholder="Ex: Le Bar Franc (Dicentrarchus labrax) est un poisson combatif. On le trouve souvent sur les côtes rocheuses... Maille à 42cm. Points: 10/cm." 
                className="min-h-[200px]"
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsParseDialogOpen(false)}>Annuler</Button>
              <Button onClick={handleAIParse} disabled={isAILoading || !rawText.trim()}>
                {isAILoading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Sparkles className="mr-2 h-4 w-4" />} Analyser & Créer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="flex flex-row items-center justify-between">
              <DialogTitle className="font-headline text-2xl">
                {editingFish?.id ? `Modifier ${editingFish.name}` : "Nouvelle espèce"}
              </DialogTitle>
              <Button 
                variant="outline" 
                size="sm" 
                className="mr-6 border-primary/20 hover:bg-primary/5 text-primary"
                onClick={handleAIGenerate}
                disabled={isAILoading}
              >
                {isAILoading ? (
                  "Enrichissement..."
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" /> IA Enrichir
                  </>
                )}
              </Button>
            </DialogHeader>
            
            {editingFish && (
              <div className="space-y-6 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nom Commun</Label>
                    <Input 
                      value={editingFish.name} 
                      onChange={e => setEditingFish({...editingFish, name: e.target.value})}
                      placeholder="Ex: Bar Franc"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Nom Scientifique</Label>
                    <Input 
                      value={editingFish.scientificName} 
                      onChange={e => setEditingFish({...editingFish, scientificName: e.target.value})}
                      placeholder="Ex: Dicentrarchus labrax"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Taille Légale (cm)</Label>
                    <Input 
                      type="number" 
                      value={editingFish.minSize} 
                      onChange={e => setEditingFish({...editingFish, minSize: parseInt(e.target.value) || 0})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Rareté</Label>
                    <Select 
                      value={editingFish.rarity} 
                      onValueChange={(val: any) => setEditingFish({...editingFish, rarity: val})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Commun">Commun</SelectItem>
                        <SelectItem value="Rare">Rare</SelectItem>
                        <SelectItem value="Très rare">Très rare</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2 space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-2">
                        <ImageIcon className="h-4 w-4" /> Illustration
                      </Label>
                      <div className="flex gap-2">
                        <Input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          ref={fileInputRef} 
                          onChange={handleImageUpload} 
                        />
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploading}
                        >
                          {isUploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                          Charger Photo
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] text-muted-foreground uppercase">Ou URL directe</Label>
                      <Input 
                        value={editingFish.imageUrl} 
                        onChange={e => setEditingFish({...editingFish, imageUrl: e.target.value})}
                        placeholder="https://example.com/image.jpg"
                      />
                    </div>
                    {editingFish.imageUrl && (
                      <div className="relative h-48 w-full rounded-xl overflow-hidden bg-slate-100 border-2 border-dashed border-slate-200 mt-2">
                         <Image src={editingFish.imageUrl} alt="Preview" fill className="object-contain" />
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Taille Moyenne</Label>
                    <Input 
                      value={editingFish.averageSize || ''} 
                      onChange={e => setEditingFish({...editingFish, averageSize: e.target.value})}
                      placeholder="Ex: 40-70 cm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Points par cm</Label>
                    <Input 
                      type="number" 
                      value={editingFish.pointsPerCm} 
                      onChange={e => setEditingFish({...editingFish, pointsPerCm: parseInt(e.target.value) || 0})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    Description 
                    <Badge variant="outline" className="text-[10px] font-normal opacity-70">Enrichissable via le bouton IA haut</Badge>
                  </Label>
                  <Textarea 
                    className="min-h-[120px] leading-relaxed"
                    value={editingFish.description} 
                    onChange={e => setEditingFish({...editingFish, description: e.target.value})}
                    placeholder="Détails sur l'espèce, sa biologie..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="font-bold">Techniques</Label>
                      <Button variant="outline" size="sm" onClick={addTechnique}>
                        <Plus className="h-3 w-3 mr-1" /> Ajouter
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {editingFish.techniques?.map((tech, idx) => (
                        <div key={idx} className="flex gap-2">
                          <Input value={tech} onChange={e => updateTechnique(idx, e.target.value)} />
                          <Button variant="ghost" size="icon" onClick={() => removeTechnique(idx)}>
                            <Trash2 className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="font-bold">Spots</Label>
                      <Button variant="outline" size="sm" onClick={addSpot}>
                        <Plus className="h-3 w-3 mr-1" /> Ajouter
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {editingFish.spots?.map((spot, idx) => (
                        <div key={idx} className="flex gap-2">
                          <Input value={spot} onChange={e => updateSpot(idx, e.target.value)} />
                          <Button variant="ghost" size="icon" onClick={() => removeSpot(idx)}>
                            <Trash2 className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-4 border-t pt-6">
                  <div className="flex items-center justify-between">
                    <Label className="font-bold">Système de Points Bonus</Label>
                    <Button variant="outline" size="sm" onClick={addPalier}>
                      <Plus className="h-3 w-3 mr-1" /> Palier
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {editingFish.bonusPoints?.map((palier, idx) => (
                      <div key={idx} className="flex gap-4 items-center">
                        <div className="flex-1 flex gap-2">
                          <Input 
                            type="number" 
                            placeholder="Seuil (cm)" 
                            value={palier.threshold} 
                            onChange={e => updatePalier(idx, 'threshold', parseInt(e.target.value) || 0)}
                          />
                          <Input 
                            type="number" 
                            placeholder="Points" 
                            value={palier.points} 
                            onChange={e => updatePalier(idx, 'points', parseInt(e.target.value) || 0)}
                          />
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => removePalier(idx)}>
                          <Trash2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Annuler</Button>
              <Button className="bg-[#0f3a53] hover:bg-[#0c2e42]" onClick={handleSaveFish}>
                {editingFish?.id ? "Sauvegarder" : "Créer l'espèce"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
