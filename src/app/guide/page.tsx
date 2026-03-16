
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
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Search, MapPin, Ruler, Target, Edit, Plus, Trash2, X } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import { FishSpecies, BonusPointThreshold } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const MOCK_FISH: FishSpecies[] = [
  {
    id: '1',
    name: 'Anguille',
    scientificName: 'Anguilla anguilla',
    rarity: 'Très rare',
    pointsPerCm: 12,
    minSize: 37,
    maxSize: 150,
    averageSize: '40-80 cm',
    description: "L'anguille européenne est un poisson migrateur catadrome qui naît en mer des Sargasses et grandit en eau douce. Espèce en danger critique, sa pêche est strictement réglementée. Elle possède une capacité unique à respirer hors de l'eau.",
    imageUrl: 'https://picsum.photos/seed/eel/600/400',
    habitat: 'Estuaires, rivières, zones vaseuses',
    diet: 'Petits crustacés, vers, poissons',
    techniques: ['Pêche de nuit', 'Pêche au posé', 'Vers de terre'],
    spots: ['Estuaires', 'Aulne', 'Elorn', "Aber Wrac'h"],
    bonusPoints: [
      { threshold: 40, points: 15 },
      { threshold: 60, points: 25 },
      { threshold: 80, points: 40 }
    ],
    keyFeatures: 'Corps allongé, peau visqueuse',
    fishingTips: 'Utilisez des vers de terreau ou de petits poissons morts.',
    eligibilityCriteria: 'Minimum 37cm'
  },
  {
    id: '2',
    name: 'Bar Franc',
    scientificName: 'Dicentrarchus labrax',
    rarity: 'Commun',
    pointsPerCm: 10,
    minSize: 42,
    maxSize: 100,
    averageSize: '40-70 cm',
    description: 'Le Bar Franc est le poisson roi de la Rade. Puissant et combatif.',
    imageUrl: 'https://picsum.photos/seed/bass/600/400',
    habitat: 'Zones rocheuses, courants forts',
    diet: 'Petits poissons, crustacés',
    techniques: ['Leurre de surface', 'Poisson nageur'],
    spots: ['Pointe du Diable', 'Le Caro'],
    bonusPoints: [
      { threshold: 50, points: 10 },
      { threshold: 70, points: 30 },
      { threshold: 90, points: 60 }
    ],
    keyFeatures: 'Dos gris bleuté, opercule avec épine',
    fishingTips: 'Pêchez dans l\'écume près des rochers.',
    eligibilityCriteria: 'Minimum 42cm'
  },
  {
    id: '3',
    name: 'Dorade Royale',
    scientificName: 'Sparus aurata',
    rarity: 'Rare',
    pointsPerCm: 15,
    minSize: 30,
    maxSize: 70,
    averageSize: '30-50 cm',
    description: 'Reconnaissable à son bandeau doré entre les yeux.',
    imageUrl: 'https://picsum.photos/seed/bream/600/400',
    habitat: 'Fonds sableux, herbiers',
    diet: 'Mollusques, vers',
    techniques: ['Bibi', 'Vers marins'],
    spots: ['Anse du Poulmic', 'Plougastel'],
    bonusPoints: [
      { threshold: 40, points: 20 },
      { threshold: 50, points: 40 },
      { threshold: 60, points: 80 }
    ],
    keyFeatures: 'Bandeau doré, tache noire operculaire',
    fishingTips: 'Appâts frais essentiels, poisson très méfiant.',
    eligibilityCriteria: 'Minimum 30cm'
  }
];

export default function GuidePage() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [fishList, setFishList] = useState<FishSpecies[]>(MOCK_FISH);
  const [isAdmin] = useState(true); // Mock admin status
  
  // State for the edit form
  const [editingFish, setEditingFish] = useState<FishSpecies | null>(null);

  const filteredFish = fishList.filter(fish => 
    fish.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    fish.scientificName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSaveFish = () => {
    if (!editingFish) return;
    
    setFishList(prev => prev.map(f => f.id === editingFish.id ? editingFish : f));
    setEditingFish(null);
    toast({
      title: "Fiche mise à jour",
      description: `Les modifications pour ${editingFish.name} ont été enregistrées.`
    });
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
        <header className="mb-12 text-center md:text-left">
          <h1 className="font-headline text-4xl font-bold mb-4 text-slate-900">Guide des Poissons</h1>
          <p className="text-muted-foreground text-lg mb-8 max-w-2xl">
            Fiches détaillées des espèces de la Rade de Brest pour optimiser vos points.
          </p>
          
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Rechercher un poisson..." 
              className="pl-10 bg-white border-slate-200"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </header>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredFish.map((fish) => (
            <Card key={fish.id} className="relative overflow-hidden border-none shadow-sm hover:shadow-md transition-shadow bg-white rounded-2xl">
              {isAdmin && (
                <Dialog open={editingFish?.id === fish.id} onOpenChange={(open) => !open && setEditingFish(null)}>
                  <DialogTrigger asChild>
                    <Button 
                      variant="secondary" 
                      size="icon" 
                      className="absolute top-4 left-4 z-10 bg-white/80 backdrop-blur-sm border shadow-sm hover:bg-primary hover:text-white"
                      onClick={() => setEditingFish(fish)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="font-headline text-2xl">Modifier {fish.name}</DialogTitle>
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
                          <div className="space-y-2">
                            <Label>Taille Moyenne (ex: 15-30cm)</Label>
                            <Input 
                              value={editingFish.averageSize} 
                              onChange={e => setEditingFish({...editingFish, averageSize: e.target.value})}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Taille Max (cm)</Label>
                            <Input 
                              type="number" 
                              value={editingFish.maxSize || ''} 
                              onChange={e => setEditingFish({...editingFish, maxSize: parseInt(e.target.value) || 0})}
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Description</Label>
                          <Textarea 
                            className="min-h-[100px]"
                            value={editingFish.description} 
                            onChange={e => setEditingFish({...editingFish, description: e.target.value})}
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
                              <Label className="font-bold">Spots (Crozon / Rade)</Label>
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
                            <Label className="font-bold">Système de Points</Label>
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

                        <div className="space-y-4 border-t pt-6">
                          <Label className="font-bold">Photo de l'espèce</Label>
                          <div className="flex items-center gap-4">
                            <div className="h-16 w-16 rounded border overflow-hidden relative">
                              <Image src={editingFish.imageUrl} alt="preview" fill className="object-cover" />
                            </div>
                            <Input type="file" className="flex-1 cursor-pointer" />
                          </div>
                        </div>
                      </div>
                    )}

                    <DialogFooter className="gap-2 sm:gap-0">
                      <Button variant="outline" onClick={() => setEditingFish(null)}>Annuler</Button>
                      <Button className="bg-[#0f3a53] hover:bg-[#0c2e42]" onClick={handleSaveFish}>Sauvegarder</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}

              <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                  <div className={cn(isAdmin && "pl-12")}>
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
                    src={fish.imageUrl} 
                    alt={fish.name} 
                    fill 
                    className="object-cover"
                    data-ai-hint="fish photo"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Ruler className="h-4 w-4 text-orange-400" />
                      <span className="text-sm font-semibold">Maille: {fish.minSize} cm</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                      <Target className="h-4 w-4 text-orange-400" />
                      <span className="text-sm font-semibold">Moy: {fish.averageSize}</span>
                    </div>
                    {fish.maxSize && (
                      <div className="text-xs text-slate-400 pl-6 font-medium">
                        Max: {fish.maxSize} cm
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
                      ))}
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
      </main>
    </div>
  );
}
