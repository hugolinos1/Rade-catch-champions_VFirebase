
"use client"

import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  Users, 
  Fish, 
  FileText, 
  Plus, 
  Trash2, 
  Edit, 
  CheckCircle, 
  XCircle, 
  RefreshCcw,
  Key,
  Database
} from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useFirestore } from '@/firebase';
import { doc, collection } from 'firebase/firestore';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { FishSpecies } from '@/lib/types';

export default function AdminPage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [activeTab, setActiveTab] = useState('contests');
  const [isSeeding, setIsSeeding] = useState(false);

  const handleSeedData = () => {
    setIsSeeding(true);
    
    // Données de la Bonite basées sur l'image fournie
    const bonite: FishSpecies = {
      id: 'bonite',
      name: 'Bonite',
      scientificName: 'Sarda sarda',
      description: 'La bonite à dos rayé est un scombridé pélagique proche du thon. Prédateur rapide et vorace, elle chasse en surface et forme parfois des chasses spectaculaires. Sa chair ferme et savoureuse en fait un poisson très recherché.',
      imageUrl: 'https://firebasestorage.googleapis.com/v0/b/rade-catch-champions.firebasestorage.app/o/species%2F1773647822161_Bonite.jpg?alt=media&token=0b513251-9601-45c3-8ffb-0fea6839349f',
      minSize: 25,
      maxSize: 91,
      averageSize: '30-50 cm',
      pointsPerCm: 10, // Valeur par défaut
      rarity: 'Rare',
      techniques: ['Traîne', 'Lancer', 'Jigging', 'Pêche au vif'],
      spots: ['Large de la Chaussée', 'Plateau de Rochebonne', 'Ouessant'],
      bonusPoints: [
        { threshold: 35, points: 12 },
        { threshold: 50, points: 20 },
        { threshold: 70, points: 35 }
      ],
      habitat: 'Pélagique',
      diet: 'Petits poissons, céphalopodes',
      keyFeatures: 'Dos rayé, prédateur rapide',
      fishingTips: 'Chercher les chasses en surface',
      eligibilityCriteria: 'Taille légale > 25cm'
    };

    const docRef = doc(firestore, 'fish_species', bonite.id);
    setDocumentNonBlocking(docRef, bonite, { merge: true });

    setTimeout(() => {
      setIsSeeding(false);
      toast({
        title: "Données importées",
        description: "La fiche de la Bonite a été ajoutée au guide."
      });
    }, 1000);
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
            <p className="text-muted-foreground mt-1">Gérez les concours, les utilisateurs et le guide des poissons.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="font-headline" onClick={handleSeedData} disabled={isSeeding}>
              <Database className="mr-2 h-4 w-4" /> {isSeeding ? "Import..." : "Importer Exemples"}
            </Button>
            <Button variant="outline" className="font-headline" onClick={() => toast({ title: "Rafraîchissement", description: "Données synchronisées." })}>
              <RefreshCcw className="mr-2 h-4 w-4" /> Actualiser
            </Button>
          </div>
        </header>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white p-1 border shadow-sm w-full md:w-auto overflow-x-auto justify-start">
            <TabsTrigger value="contests" className="data-[state=active]:bg-primary data-[state=active]:text-white">
              <FileText className="h-4 w-4 mr-2" /> Concours
            </TabsTrigger>
            <TabsTrigger value="catches" className="data-[state=active]:bg-primary data-[state=active]:text-white">
              <Fish className="h-4 w-4 mr-2" /> Prises
            </TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:bg-primary data-[state=active]:text-white">
              <Users className="h-4 w-4 mr-2" /> Utilisateurs
            </TabsTrigger>
          </TabsList>

          {/* Contests Management */}
          <TabsContent value="contests">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="font-headline">Gestion des Concours</CardTitle>
                  <CardDescription>Configurez et activez les sessions de pêche.</CardDescription>
                </div>
                <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Nouveau</Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Titre</TableHead>
                      <TableHead>Début</TableHead>
                      <TableHead>Fin</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">Saison d'Automne 2024</TableCell>
                      <TableCell>01/09/2024</TableCell>
                      <TableCell>30/11/2024</TableCell>
                      <TableCell><Badge className="bg-green-500">Actif</Badge></TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="ghost" size="icon"><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Catches Moderation */}
          <TabsContent value="catches">
            <Card>
              <CardHeader>
                <CardTitle className="font-headline">Modération des Prises</CardTitle>
                <CardDescription>Validez ou rejetez les captures soumises par les utilisateurs.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Utilisateur</TableHead>
                      <TableHead>Espèce</TableHead>
                      <TableHead>Taille</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>Jean-Marc L.</TableCell>
                      <TableCell>Bar Franc</TableCell>
                      <TableCell>52 cm</TableCell>
                      <TableCell>Aujourd'hui</TableCell>
                      <TableCell><Badge variant="secondary">En attente</Badge></TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="outline" size="sm" className="text-green-600"><CheckCircle className="h-4 w-4 mr-1" /> Valider</Button>
                        <Button variant="outline" size="sm" className="text-destructive"><XCircle className="h-4 w-4 mr-1" /> Refuser</Button>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* User Management */}
          <TabsContent value="users">
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="font-headline">Utilisateurs</CardTitle>
                  <CardDescription>Liste des membres inscrits.</CardDescription>
                </CardHeader>
                <CardContent>
                   <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nom</TableHead>
                        <TableHead>Rôle</TableHead>
                        <TableHead>Points</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell>Thierry L.</TableCell>
                        <TableCell><Badge variant="outline">Admin</Badge></TableCell>
                        <TableCell>12,450</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon"><Edit className="h-4 w-4" /></Button>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <Card className="bg-primary/5 border-primary/20">
                <CardHeader>
                  <CardTitle className="font-headline flex items-center gap-2">
                    <Key className="h-5 w-5 text-primary" />
                    Invitations
                  </CardTitle>
                  <CardDescription>Générez des codes pour les nouveaux membres.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-white p-4 rounded-lg border text-center font-mono text-xl font-bold tracking-widest text-primary">
                    RADE-2024-X9
                  </div>
                  <Button className="w-full font-headline">Générer un Code</Button>
                  <div className="pt-4 space-y-2">
                    <p className="text-xs font-bold uppercase text-muted-foreground">Derniers codes</p>
                    <div className="text-xs flex justify-between items-center py-1 border-b">
                      <span>CHAMP-8821</span>
                      <Badge variant="outline" className="text-[10px]">Utilisé</Badge>
                    </div>
                    <div className="text-xs flex justify-between items-center py-1">
                      <span>CATCH-4491</span>
                      <Badge variant="secondary" className="text-[10px]">Libre</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
