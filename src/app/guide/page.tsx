
"use client"

import { Navigation } from '@/components/Navigation';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Info, Scale, Waves } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import { FishSpecies } from '@/lib/types';

const MOCK_FISH: FishSpecies[] = [
  {
    id: '1',
    name: 'Bar Franc',
    scientificName: 'Dicentrarchus labrax',
    pointsPerCm: 10,
    minSize: 42,
    description: 'Le Bar Franc est le poisson roi de la Rade. Puissant et combatif, il demande une technique affûtée.',
    imageUrl: 'https://picsum.photos/seed/bass/600/400',
    habitat: 'Zones rocheuses, courants forts',
    diet: 'Petits poissons, crustacés',
    averageSize: '40-70cm',
    keyFeatures: 'Corps argenté, dos sombre, opercule avec épine',
    fishingTips: 'Leurre de surface au lever du soleil',
    eligibilityCriteria: 'Minimum 42cm pour être comptabilisé'
  },
  {
    id: '2',
    name: 'Dorade Royale',
    scientificName: 'Sparus aurata',
    pointsPerCm: 15,
    minSize: 30,
    description: 'Reconnaissable à son bandeau doré entre les yeux, c\'est un poisson noble et méfiant.',
    imageUrl: 'https://picsum.photos/seed/bream/600/400',
    habitat: 'Fonds sableux et herbiers',
    diet: 'Mollusques, vers',
    averageSize: '30-50cm',
    keyFeatures: 'Bandeau doré, tache noire sur l\'opercule',
    fishingTips: 'Appâts naturels (vers, bibi)',
    eligibilityCriteria: 'Minimum 30cm'
  },
  {
    id: '3',
    name: 'Lieu Jaune',
    scientificName: 'Pollachius pollachius',
    pointsPerCm: 8,
    minSize: 35,
    description: 'Poisson vorace vivant souvent près des structures et des épaves.',
    imageUrl: 'https://picsum.photos/seed/pollock/600/400',
    habitat: 'Profondeurs, épaves, tombants',
    diet: 'Lançons, sprats',
    averageSize: '35-60cm',
    keyFeatures: 'Ligne latérale sombre, mâchoire inférieure saillante',
    fishingTips: 'Jigging ou leurre souple en profondeur',
    eligibilityCriteria: 'Minimum 35cm'
  }
];

export default function GuidePage() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredFish = MOCK_FISH.filter(fish => 
    fish.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    fish.scientificName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        <header className="mb-12 text-center md:text-left">
          <h1 className="font-headline text-4xl font-bold mb-4">Guide des Poissons</h1>
          <p className="text-muted-foreground text-lg mb-8 max-w-2xl">
            Découvrez toutes les espèces éligibles au concours Rade Catch Champions. Apprenez-en plus sur leur habitat et optimisez vos points.
          </p>
          
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Rechercher un poisson..." 
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </header>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredFish.map((fish) => (
            <Card key={fish.id} className="overflow-hidden group border-none shadow-md hover:shadow-xl transition-all duration-300">
              <div className="relative h-48 w-full">
                <Image 
                  src={fish.imageUrl} 
                  alt={fish.name} 
                  fill 
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  data-ai-hint="fish species photo"
                />
                <div className="absolute top-2 right-2 flex flex-col gap-2">
                  <Badge variant="secondary" className="bg-white/90 backdrop-blur shadow-sm font-headline">
                    {fish.pointsPerCm} pts/cm
                  </Badge>
                  <Badge variant="outline" className="bg-primary/90 text-white border-none shadow-sm font-headline">
                    Min {fish.minSize} cm
                  </Badge>
                </div>
              </div>
              
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="font-headline text-2xl mb-1">{fish.name}</CardTitle>
                    <p className="text-sm italic text-muted-foreground">{fish.scientificName}</p>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <p className="text-sm line-clamp-3 text-muted-foreground font-body leading-relaxed">
                  {fish.description}
                </p>
                
                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div className="flex items-center gap-2 text-xs">
                    <Waves className="h-4 w-4 text-primary" />
                    <span className="font-medium">{fish.habitat}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <Scale className="h-4 w-4 text-primary" />
                    <span className="font-medium">{fish.averageSize}</span>
                  </div>
                </div>
              </CardContent>
              
              <CardFooter className="bg-accent/5 p-4 flex justify-between items-center">
                 <div className="flex items-center gap-1 text-primary text-xs font-bold uppercase tracking-wider">
                   <Info className="h-3 w-3" />
                   Astuces : {fish.fishingTips}
                 </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
