
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

  // Queries
  const contestsQuery = useMemoFirebase(() => collection(firestore, 'competitions'), [firestore]);
  const catchesQuery = useMemoFirebase(() => collection(firestore, 'catches'), [firestore]);
  const usersQuery = useMemoFirebase(() => collection(firestore, 'users'), [firestore]);

  const { data: contests, isLoading: loadingContests } = useCollection<Contest>(contestsQuery);
  const { data: catches, isLoading: loadingCatches } = useCollection<Catch>(catchesQuery);
  const { data: users, isLoading: loadingUsers } = useCollection<UserProfile>(usersQuery);

  const handleSeedData = () => {
    setIsSeeding(true);
    
    const bonite: FishSpecies = {
      id: 'bonite',
      name: 'Bonite',
      scientificName: 'Sarda sarda',
      description: 'La bonite à dos rayé est un scombridé pélagique proche du thon. Prédateur rapide et vorace, elle chasse en surface et forme parfois des chasses spectaculaires.',
      imageUrl: 'https://firebasestorage.googleapis.com/v0/b/studio-1011029963-7eded.firebasestorage.app/o/species%2F1773647822161_Bonite.jpg?alt=media&token=0b513251-9601-45c3-8ffb-0fea6839349f',
      minSize: 25,
      maxSize: 91,
      averageSize: '30-50 cm',
      pointsPerCm: 10,
      rarity: 'Rare',
      techniques: ['Traîne', 'Lancer'],
      spots: ['Rade Sud', 'Large'],
      habitat: 'Pélagique',
      diet: 'Petits poissons',
      keyFeatures: 'Dos rayé',
      fishingTips: 'Chercher les chasses',
      eligibilityCriteria: 'Taille > 25cm'
    };

    const docRef = doc(firestore, 'fish_species', bonite.id);
    setDocumentNonBlocking(docRef, bonite, { merge: true });

    setTimeout(() => {
      setIsSeeding(false);
      toast({ title: "Données importées", description: "La fiche de la Bonite a été ajoutée." });
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
            <p className="text-muted-foreground mt-1">Gérez les concours, les utilisateurs et la modération.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="font-headline" onClick={handleSeedData} disabled={isSeeding}>
              <Database className="mr-2 h-4 w-4" /> {isSeeding ? "Import..." : "Importer Bonite"}
            </Button>
          </div>
        </header>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white p-1 border shadow-sm">
            <TabsTrigger value="contests">Concours</TabsTrigger>
            <TabsTrigger value="catches">Prises</TabsTrigger>
            <TabsTrigger value="users">Utilisateurs</TabsTrigger>
          </TabsList>

          <TabsContent value="contests">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="font-headline">Sessions de Pêche</CardTitle>
                </div>
                <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Nouveau</Button>
              </CardHeader>
              <CardContent>
                {loadingContests ? <Loader2 className="animate-spin mx-auto" /> : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Titre</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {contests?.map((c) => (
                        <TableRow key={c.id}>
                          <TableCell className="font-medium">{c.name}</TableCell>
                          <TableCell><Badge className={c.isActive ? "bg-green-500" : ""}>{c.isActive ? "Actif" : "Inactif"}</Badge></TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="icon"><Edit className="h-4 w-4" /></Button>
                          </TableCell>
                        </TableRow>
                      )) || <TableRow><TableCell colSpan={3} className="text-center italic">Aucun concours</TableCell></TableRow>}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="catches">
            <Card>
              <CardHeader>
                <CardTitle className="font-headline">Modération</CardTitle>
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
                                <Button variant="outline" size="sm" onClick={() => handleUpdateStatus(c.id, 'approved')}><CheckCircle className="h-4 w-4" /></Button>
                                <Button variant="outline" size="sm" onClick={() => handleUpdateStatus(c.id, 'rejected')} className="text-destructive"><XCircle className="h-4 w-4" /></Button>
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

          <TabsContent value="users">
            <Card>
              <CardHeader><CardTitle className="font-headline">Membres</CardTitle></CardHeader>
              <CardContent>
                {loadingUsers ? <Loader2 className="animate-spin mx-auto" /> : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nom</TableHead>
                        <TableHead>Points</TableHead>
                        <TableHead>Prises</TableHead>
                        <TableHead className="text-right">Rôle</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users?.map((u) => (
                        <TableRow key={u.id}>
                          <TableCell>{u.name}</TableCell>
                          <TableCell>{u.totalPoints || 0}</TableCell>
                          <TableCell>{u.catchesCount || 0}</TableCell>
                          <TableCell className="text-right"><Badge variant="outline">{u.role}</Badge></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
