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
  
  const fishQuery = useMemoFirebase(() => collection(firestore, 'species'), [firestore]);
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
    
    const docId = editingFish.id || doc(collection(firestore, 'species')).id;
    const finalFish = { ...editingFish, id: docId };
    
    const docRef = doc(firestore, 'species', docId);
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
      toast({
        variant: "destructive",
        title: "Échec du chargement",
        description: "Vérifiez la configuration CORS de votre bucket Google Cloud."
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
        description: "Veuillez donner au moins un nom à l'espèce."
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
        description: "La description a été enrichie."
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
      toast({ title: "Importation Réussie", description: `Données de "${result.name}" extraites.` });
    } catch (error) {
      toast({ variant: "destructive", title: "Erreur Import", description: "L'IA n'a pas pu analyser ce texte." });
    } finally {
      setIsAILoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20 md:pb-0">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        <header className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="text-center md:text-left">
            <h1 className="font-headline text-4xl font-bold mb-4 text-slate-900">Guide des Poissons</h1>
            <p className="text-muted-foreground text-lg max-w-2xl">
              Fiches détaillées des espèces de la Rade de Brest.
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
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={isParseDialogOpen} onOpenChange={setIsParseDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Importation par IA</DialogTitle>
              <DialogDescription>
                Collez n'importe quel texte contenant des informations sur un poisson.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Textarea 
                placeholder="Description du poisson..." 
                className="min-h-[200px]"
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsParseDialogOpen(false)}>Annuler</Button>
              <Button onClick={handleAIParse} disabled={isAILoading || !rawText.trim()}>
                {isAILoading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Sparkles className="mr-2 h-4 w-4" />} Analyser
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingFish?.id ? `Modifier ${editingFish.name}` : "Nouvelle espèce"}
              </DialogTitle>
              <DialogDescription>
                Configurez les caractéristiques de l'espèce. Utilisez le bouton IA pour générer du contenu automatiquement.
              </DialogDescription>
            </DialogHeader>
            
            {editingFish && (
              <div className="space-y-6 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nom Commun</Label>
                    <Input 
                      value={editingFish.name} 
                      onChange={e => setEditingFish({...editingFish, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Nom Scientifique</Label>
                    <Input 
                      value={editingFish.scientificName} 
                      onChange={e => setEditingFish({...editingFish, scientificName: e.target.value})}
                    />
                  </div>
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
                  <Input 
                    value={editingFish.imageUrl} 
                    onChange={e => setEditingFish({...editingFish, imageUrl: e.target.value})}
                    placeholder="URL de l'image"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea 
                    className="min-h-[120px]"
                    value={editingFish.description} 
                    onChange={e => setEditingFish({...editingFish, description: e.target.value})}
                  />
                  <Button variant="secondary" size="sm" onClick={handleAIGenerate} disabled={isAILoading}>
                    <Sparkles className="h-4 w-4 mr-2" /> IA Enrichir
                  </Button>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Annuler</Button>
              <Button onClick={handleSaveFish}>Enregistrer</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
