"use client"

import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  Plus, 
  Edit, 
  CheckCircle, 
  XCircle, 
  Database,
  Loader2
} from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection } from 'firebase/firestore';
import { setDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { FishSpecies, Catch, UserProfile, Contest } from '@/lib/types';

export default function AdminPage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [activeTab, setActiveTab] = useState('contests');
  const [isSeeding, setIsSeeding] = useState(false);

  const contestsQuery = useMemoFirebase(() => collection(firestore, 'competitions'), [firestore]);
  const catchesQuery = useMemoFirebase(() => collection(firestore, 'catches'), [firestore]);
  const usersQuery = useMemoFirebase(() => collection(firestore, 'users'), [firestore]);

  const { data: contests, isLoading: loadingContests } = useCollection<Contest>(contestsQuery);
  const { data: catches, isLoading: loadingCatches } = useCollection<Catch>(catchesQuery);
  const { data: users, isLoading: loadingUsers } = useCollection<UserProfile>(usersQuery);

  const handleSeedData = () => {
    setIsSeeding(true);
    
    // Exemple d'importation pour la Bonite
    const bonite: FishSpecies = {
      id: 'bonite',
      name: 'Bonite',
      scientificName: 'Sarda sarda',
      description: 'La bonite à dos rayé est un prédateur rapide et vorace de la Rade de Brest.',
      imageUrl: 'https://firebasestorage.googleapis.com/v0/b/rade-catch-champions.firebasestorage.app/o/species%2Fbonite.jpg?alt=media',
      minSize: 25,
      pointsPerCm: 10,
      rarity: 'Rare',
      habitat: 'Pélagique',
      diet: 'Petits poissons',
      averageSize: '30-50 cm',
      keyFeatures: 'Dos rayé',
      fishingTips: 'Chercher les chasses',
      eligibilityCriteria: 'Taille > 25cm',
      techniques: ['Lancer', 'Traîne'],
      spots: ['Rade Sud']
    };

    const docRef = doc(firestore, 'species', bonite.id);
    setDocumentNonBlocking(docRef, bonite, { merge: true });

    setTimeout(() => {
      setIsSeeding(false);
      toast({ title: "Données synchronisées", description: "La Bonite a été ajoutée." });
    }, 800);
  };

  const handleUpdateStatus = (catchId: string, status: 'approved' | 'rejected') => {
    const docRef = doc(firestore, 'catches', catchId);
    updateDocumentNonBlocking(docRef, { status });
    toast({ title: status === 'approved' ? "Prise validée" : "Prise refusée" });
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-headline text-4xl font-bold flex items-center gap-2">
              <Settings className="h-8 w-8 text-primary" />
              Administration
            </h1>
            <p className="text-muted-foreground mt-1">Gérez les concours et les espèces.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleSeedData} disabled={isSeeding}>
              <Database className="mr-2 h-4 w-4" /> {isSeeding ? "Sync..." : "Importer Bonite"}
            </Button>
          </div>
        </header>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white p-1 border shadow-sm">
            <TabsTrigger value="contests">Concours</TabsTrigger>
            <TabsTrigger value="catches">Prises</TabsTrigger>
            <TabsTrigger value="users">Utilisateurs</TabsTrigger>
          </TabsList>

          <TabsContent value="catches">
            <Card>
              <CardHeader>
                <CardTitle className="font-headline">Modération des Prises</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingCatches ? <Loader2 className="animate-spin mx-auto" /> : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Pêcheur</TableHead>
                        <TableHead>Espèce</TableHead>
                        <TableHead>Taille</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {catches?.map((c) => (
                        <TableRow key={c.id}>
                          <TableCell>{c.userName}</TableCell>
                          <TableCell>{c.fishName}</TableCell>
                          <TableCell>{c.length} cm</TableCell>
                          <TableCell>
                            <Badge variant={c.status === 'approved' ? 'default' : c.status === 'rejected' ? 'destructive' : 'secondary'}>
                              {c.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right space-x-2">
                            {c.status === 'pending' && (
                              <>
                                <Button variant="outline" size="sm" onClick={() => handleUpdateStatus(c.id, 'approved')}><CheckCircle className="h-4 w-4 text-green-500" /></Button>
                                <Button variant="outline" size="sm" onClick={() => handleUpdateStatus(c.id, 'rejected')}><XCircle className="h-4 w-4 text-destructive" /></Button>
                              </>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          {/* Les autres onglets restent similaires */}
        </Tabs>
      </main>
    </div>
  );
}
