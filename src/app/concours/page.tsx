
"use client"

import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Camera, Send, History, Trophy, Fish, Scale } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import { Catch } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

const RECENT_CATCHES: Catch[] = [
  {
    id: '1',
    userId: 'u1',
    userName: 'Jean-Marc L.',
    fishId: '1',
    fishName: 'Bar Franc',
    length: 52,
    weight: 1.8,
    photoUrl: 'https://picsum.photos/seed/catch1/400/300',
    timestamp: 'Il y a 20 min',
    points: 520,
    status: 'approved'
  },
  {
    id: '2',
    userId: 'u2',
    userName: 'Marine B.',
    fishId: '2',
    fishName: 'Dorade Royale',
    length: 38,
    weight: 0.9,
    photoUrl: 'https://picsum.photos/seed/catch2/400/300',
    timestamp: 'Il y a 1 heure',
    points: 570,
    status: 'approved'
  }
];

export default function ConcoursPage() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      toast({
        title: "Capture envoyée !",
        description: "Votre capture est en attente de validation par l'admin.",
      });
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="font-headline text-4xl font-bold">Le Concours</h1>
          <p className="text-muted-foreground mt-2">Partagez vos exploits et gagnez des points.</p>
        </header>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Submission Form */}
          <div className="lg:col-span-2 space-y-8">
            <Card className="shadow-lg border-none">
              <CardHeader className="bg-primary/5">
                <CardTitle className="font-headline flex items-center gap-2">
                  <Send className="h-5 w-5 text-primary" />
                  Nouvelle Capture
                </CardTitle>
                <CardDescription>Remplissez les détails de votre prise pour calculer vos points.</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="fish">Espèce de poisson</Label>
                      <Select required>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionnez l'espèce" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bar">Bar Franc</SelectItem>
                          <SelectItem value="dorade">Dorade Royale</SelectItem>
                          <SelectItem value="lieu">Lieu Jaune</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="length">Longueur (cm)</Label>
                      <div className="relative">
                        <Scale className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input id="length" type="number" step="0.5" placeholder="Ex: 42.5" className="pl-10" required />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="weight">Poids (kg) - Optionnel</Label>
                      <Input id="weight" type="number" step="0.1" placeholder="Ex: 1.2" />
                    </div>

                    <div className="space-y-2">
                      <Label>Photo de la prise</Label>
                      <div className="border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center gap-3 bg-accent/5 hover:bg-accent/10 transition-colors cursor-pointer">
                        <Camera className="h-8 w-8 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Cliquez pour ajouter une photo</span>
                      </div>
                    </div>
                  </div>

                  <Button type="submit" className="w-full font-headline font-bold" disabled={isSubmitting}>
                    {isSubmitting ? "Envoi en cours..." : "Soumettre ma capture"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Recent Activity Feed */}
            <div className="space-y-4">
              <h2 className="font-headline text-2xl font-bold flex items-center gap-2">
                <History className="h-6 w-6 text-primary" />
                Dernières Prises
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {RECENT_CATCHES.map((item) => (
                  <Card key={item.id} className="overflow-hidden border-none shadow flex flex-col sm:flex-row h-full">
                    <div className="relative w-full sm:w-32 h-32">
                      <Image 
                        src={item.photoUrl} 
                        alt={item.fishName} 
                        fill 
                        className="object-cover"
                        data-ai-hint="fish catch photo"
                      />
                    </div>
                    <div className="flex-1 p-4 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start">
                          <h3 className="font-bold text-sm">{item.userName}</h3>
                          <span className="text-[10px] text-muted-foreground">{item.timestamp}</span>
                        </div>
                        <p className="text-primary font-headline font-bold">{item.fishName}</p>
                        <p className="text-xs text-muted-foreground">{item.length} cm • {item.weight} kg</p>
                      </div>
                      <div className="mt-2 flex items-center gap-1 text-accent-foreground font-bold">
                        <Trophy className="h-3 w-3 text-accent" />
                        <span className="text-sm">{item.points} pts</span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar / Stats */}
          <div className="space-y-6">
            <Card className="bg-primary text-white border-none shadow-xl">
              <CardHeader>
                <CardTitle className="font-headline text-lg">Vos Statistiques</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-white/10">
                  <span className="text-sm opacity-80">Points Totaux</span>
                  <span className="font-headline font-bold text-2xl">1,420</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-white/10">
                  <span className="text-sm opacity-80">Prises Validées</span>
                  <span className="font-bold">8</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm opacity-80">Rang</span>
                  <span className="font-bold">#14</span>
                </div>
                <Button variant="secondary" className="w-full mt-4 font-headline" asChild>
                  <a href="/classement">Voir le classement global</a>
                </Button>
              </CardContent>
            </Card>

            <Card className="border-none shadow">
              <CardHeader>
                <CardTitle className="font-headline text-lg flex items-center gap-2">
                  <Fish className="h-5 w-5 text-primary" />
                  Rappel des Points
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span>Bar Franc</span>
                  <span className="font-bold">10 pts / cm</span>
                </div>
                <div className="flex justify-between">
                  <span>Dorade Royale</span>
                  <span className="font-bold">15 pts / cm</span>
                </div>
                <div className="flex justify-between">
                  <span>Lieu Jaune</span>
                  <span className="font-bold">8 pts / cm</span>
                </div>
                <p className="text-xs text-muted-foreground pt-2 italic">
                  * Seuls les poissons respectant la taille minimale sont comptabilisés.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
