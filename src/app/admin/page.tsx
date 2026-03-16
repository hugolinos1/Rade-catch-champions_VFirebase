
"use client"

import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Key, 
  Users, 
  Trash2, 
  Plus, 
  Loader2,
  ShieldCheck,
  Lock,
  Edit2,
  Camera,
  User as UserIcon,
  Trophy,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  Check,
  X,
  Fish,
  MapPin,
  Scale
} from 'lucide-react';
import { useState, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc, useStorage } from '@/firebase';
import { doc, collection, query, where, orderBy } from 'firebase/firestore';
import { addDocumentNonBlocking, deleteDocumentNonBlocking, updateDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { UserProfile, InvitationCode, Contest, Catch, FishSpecies } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Image from 'next/image';

export default function AdminPage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const storage = useStorage();
  const { user: authUser } = useUser();
  const [activeTab, setActiveTab] = useState('access');
  
  // States for generation & updates
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCreatingContest, setIsCreatingContest] = useState(false);
  
  // State for modals
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [editingCatch, setEditingCatch] = useState<Catch | null>(null);
  const [isUserUpdating, setIsUserUpdating] = useState(false);
  const [isCatchUpdating, setIsCatchUpdating] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isContestDialogOpen, setIsContestDialogOpen] = useState(false);
  
  // New Contest Form State
  const [newContest, setNewContest] = useState({
    name: '',
    startDate: '',
    endDate: '',
    status: 'draft' as const
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Fetch current user profile to check role
  const userDocRef = useMemoFirebase(() => 
    authUser ? doc(firestore, 'users', authUser.uid) : null, 
  [firestore, authUser]);
  const { data: profile, isLoading: loadingProfile } = useDoc<UserProfile>(userDocRef);

  const isAdmin = profile?.role === 'admin';

  // 2. Conditional queries for admin data
  const usersQuery = useMemoFirebase(() => 
    isAdmin ? collection(firestore, 'users') : null, 
  [firestore, isAdmin]);

  const activeCodesQuery = useMemoFirebase(() => 
    isAdmin ? query(collection(firestore, 'registration_codes'), where('isUsed', '==', false)) : null, 
  [firestore, isAdmin]);

  const competitionsQuery = useMemoFirebase(() => 
    isAdmin ? query(collection(firestore, 'competitions'), orderBy('createdAt', 'desc')) : null, 
  [firestore, isAdmin]);

  const catchesQuery = useMemoFirebase(() => 
    isAdmin ? query(collection(firestore, 'catches'), orderBy('date', 'desc')) : null, 
  [firestore, isAdmin]);

  const speciesQuery = useMemoFirebase(() => 
    collection(firestore, 'species'), 
  [firestore]);

  const { data: users, isLoading: loadingUsers } = useCollection<UserProfile>(usersQuery);
  const { data: activeCodes, isLoading: loadingCodes } = useCollection<InvitationCode>(activeCodesQuery);
  const { data: competitions, isLoading: loadingCompetitions } = useCollection<Contest>(competitionsQuery);
  const { data: catches, isLoading: loadingCatches } = useCollection<Catch>(catchesQuery);
  const { data: species } = useCollection<FishSpecies>(speciesQuery);

  const handleGenerateCode = () => {
    if (!isAdmin) return;
    setIsGenerating(true);
    const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    const codeData: Partial<InvitationCode> = {
      code: newCode,
      isUsed: false,
      createdAt: new Date().toISOString()
    };

    const codesCol = collection(firestore, 'registration_codes');
    addDocumentNonBlocking(codesCol, codeData);

    setTimeout(() => {
      setIsGenerating(false);
      toast({ title: "Code généré", description: `Le code ${newCode} est prêt.` });
    }, 500);
  };

  const handleDeleteCode = (id: string) => {
    if (!isAdmin) return;
    const docRef = doc(firestore, 'registration_codes', id);
    deleteDocumentNonBlocking(docRef);
    toast({ title: "Code supprimé" });
  };

  const handleEditUser = (u: UserProfile) => {
    setEditingUser({ ...u });
  };

  const handleSaveUser = () => {
    if (!editingUser || !isAdmin) return;
    setIsUserUpdating(true);
    
    const userRef = doc(firestore, 'users', editingUser.id);
    updateDocumentNonBlocking(userRef, {
      name: editingUser.name,
      avatarUrl: editingUser.avatarUrl || null
    });

    setTimeout(() => {
      setIsUserUpdating(false);
      setEditingUser(null);
      toast({ title: "Profil mis à jour", description: `Les modifications pour ${editingUser.name} ont été enregistrées.` });
    }, 500);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingUser) return;

    setIsUploadingAvatar(true);
    try {
      const storagePath = `avatars/${editingUser.id}_${Date.now()}`;
      const storageRef = ref(storage, storagePath);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      setEditingUser(prev => prev ? { ...prev, avatarUrl: downloadURL } : null);
      toast({ title: "Avatar chargé", description: "L'image a été mise à jour." });
    } catch (error) {
      toast({ variant: "destructive", title: "Erreur", description: "Échec du chargement de l'avatar." });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleCreateContest = () => {
    if (!isAdmin || !newContest.name || !newContest.startDate || !newContest.endDate) return;
    setIsCreatingContest(true);

    const contestData: Omit<Contest, 'id'> = {
      ...newContest,
      createdAt: new Date().toISOString(),
    };

    const contestsCol = collection(firestore, 'competitions');
    addDocumentNonBlocking(contestsCol, contestData);

    setTimeout(() => {
      setIsCreatingContest(false);
      setIsContestDialogOpen(false);
      setNewContest({ name: '', startDate: '', endDate: '', status: 'draft' });
      toast({ title: "Compétition créée", description: `${contestData.name} a été ajouté.` });
    }, 500);
  };

  const handleUpdateContestStatus = (id: string, status: Contest['status']) => {
    const contestRef = doc(firestore, 'competitions', id);
    updateDocumentNonBlocking(contestRef, { status });
    toast({ title: "Statut mis à jour" });
  };

  // --- CATCH MANAGEMENT HANDLERS ---
  const handleUpdateCatchStatus = (id: string, status: Catch['status']) => {
    const catchRef = doc(firestore, 'catches', id);
    updateDocumentNonBlocking(catchRef, { status });
    toast({ 
      title: status === 'approved' ? "Capture approuvée" : "Capture refusée",
      variant: status === 'approved' ? "default" : "destructive"
    });
  };

  const handleDeleteCatch = (id: string) => {
    if (!confirm("Supprimer définitivement cette capture ?")) return;
    const catchRef = doc(firestore, 'catches', id);
    deleteDocumentNonBlocking(catchRef);
    toast({ title: "Capture supprimée" });
  };

  const handleEditCatch = (c: Catch) => {
    setEditingCatch({ ...c });
  };

  const handleSaveCatch = () => {
    if (!editingCatch || !isAdmin) return;
    setIsCatchUpdating(true);

    // Recalculate points based on selected species and size
    const fish = species?.find(s => s.id === editingCatch.fishId);
    const updatedPoints = (fish?.pointsPerCm || 10) * editingCatch.size;

    const catchRef = doc(firestore, 'catches', editingCatch.id);
    updateDocumentNonBlocking(catchRef, {
      fishId: editingCatch.fishId,
      fishName: fish?.name || editingCatch.fishName,
      size: editingCatch.size,
      weight: editingCatch.weight,
      location: editingCatch.location,
      points: updatedPoints
    });

    setTimeout(() => {
      setIsCatchUpdating(false);
      setEditingCatch(null);
      toast({ title: "Capture mise à jour" });
    }, 500);
  };

  const tabs = [
    { id: 'access', label: 'Accès & Utilisateurs' },
    { id: 'competitions', label: 'Compétitions' },
    { id: 'captures', label: 'Gestion des Captures' },
    { id: 'guide', label: 'Guide des Poissons' },
  ];

  if (loadingProfile) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navigation />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navigation />
        <main className="container mx-auto px-4 py-20 max-w-2xl text-center">
          <div className="bg-white p-12 rounded-3xl shadow-sm border border-slate-200">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Lock className="h-10 w-10 text-red-500" />
            </div>
            <h1 className="text-3xl font-headline font-bold text-slate-900 mb-4">Accès Restreint</h1>
            <p className="text-slate-500 mb-8 leading-relaxed">
              Désolé, cette section est réservée aux administrateurs de la Rade Catch Champions. 
            </p>
            <Button asChild className="font-bold px-8">
              <a href="/">Retour à l'accueil</a>
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20 md:pb-0">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex flex-wrap gap-4 mb-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-all",
                activeTab === tab.id 
                  ? "bg-white border-2 border-slate-900 text-slate-900 shadow-sm" 
                  : "text-slate-500 hover:text-slate-900"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'access' && (
          <div className="grid lg:grid-cols-2 gap-8">
            {/* INVITATION CODES */}
            <Card className="border-none shadow-sm bg-white h-fit">
              <CardHeader className="pb-4">
                <CardTitle className="text-2xl font-headline flex items-center gap-2 text-slate-800">
                  <Key className="h-6 w-6 text-slate-900" />
                  Codes d'Inscription
                </CardTitle>
                <p className="text-slate-500 text-sm">Générez des codes uniques pour les nouveaux participants</p>
              </CardHeader>
              <CardContent className="space-y-8">
                <Button 
                  onClick={handleGenerateCode} 
                  disabled={isGenerating}
                  className="w-full bg-[#0a3d62] hover:bg-[#0a3d62]/90 h-12 text-lg font-bold"
                >
                  {isGenerating ? <Loader2 className="animate-spin mr-2" /> : <Plus className="mr-2 h-5 w-5" />}
                  Générer un nouveau code
                </Button>

                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
                    CODES EN ATTENTE ({activeCodes?.length || 0})
                  </h3>
                  <div className="space-y-3">
                    {loadingCodes ? <Loader2 className="animate-spin mx-auto text-slate-200" /> : activeCodes?.map((c) => (
                      <div key={c.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 group">
                        <div className="flex items-center gap-4">
                          <span className="font-headline text-xl font-bold text-[#0a3d62] tracking-wider">{c.code}</span>
                          <span className="text-[10px] text-slate-400 bg-white px-2 py-1 rounded-full border border-slate-100">
                            {new Date(c.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleDeleteCode(c.id)}
                          className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-destructive transition-all"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    {activeCodes?.length === 0 && !loadingCodes && (
                      <p className="text-center py-8 text-slate-300 italic text-sm">Aucun code actif.</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* USERS LIST PANEL */}
            <Card className="border-none shadow-xl bg-[#0f172a] text-white">
              <CardHeader className="pb-6">
                <CardTitle className="text-2xl font-headline flex items-center gap-2">
                  <Users className="h-6 w-6" />
                  Gestion des Utilisateurs
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                      <Key className="h-3 w-3" /> Codes Actifs
                    </div>
                    <div className="text-4xl font-headline font-bold">{activeCodes?.length || 0}</div>
                  </div>
                  <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                      <Users className="h-3 w-3" /> Inscrits
                    </div>
                    <div className="text-4xl font-headline font-bold">{users?.length || 0}</div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Users className="h-3 w-3" /> LISTE DES MEMBRES
                  </h3>
                  <div className="space-y-3">
                    {loadingUsers ? (
                      <div className="flex justify-center py-4"><Loader2 className="animate-spin text-slate-500" /></div>
                    ) : users?.map((u) => (
                      <div 
                        key={u.id} 
                        onClick={() => handleEditUser(u)}
                        className="p-4 bg-slate-800/30 rounded-xl border border-slate-700/30 hover:bg-slate-800/60 transition-all cursor-pointer group"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <Avatar className="h-10 w-10 border border-slate-700">
                              <AvatarImage src={u.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.name}`} />
                              <AvatarFallback><UserIcon className="h-5 w-5 text-slate-500" /></AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                <span className="text-slate-200 font-bold text-sm">
                                  {u.name || "Anonyme"}
                                </span>
                                {u.role === 'admin' && (
                                  <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-[9px] h-4 uppercase font-bold">
                                    Admin
                                  </Badge>
                                )}
                              </div>
                              <span className="text-slate-500 text-xs truncate max-w-[200px]">
                                {u.email}
                              </span>
                            </div>
                          </div>
                          <Edit2 className="h-4 w-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
                        </div>
                      </div>
                    ))}
                    {users?.length === 0 && !loadingUsers && (
                      <p className="text-center py-4 text-slate-500 italic text-sm">Aucun utilisateur inscrit.</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'competitions' && (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-3xl font-headline font-bold text-slate-900">Gestion des Compétitions</h2>
                <p className="text-slate-500">Créez et gérez les concours de pêche.</p>
              </div>
              <Button onClick={() => setIsContestDialogOpen(true)} className="bg-[#0a3d62] font-bold">
                <Plus className="mr-2 h-5 w-5" /> Nouveau Concours
              </Button>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {loadingCompetitions ? (
                <div className="col-span-full flex justify-center py-12"><Loader2 className="animate-spin text-slate-300 h-10 w-10" /></div>
              ) : competitions?.map((contest) => (
                <Card key={contest.id} className="border-none shadow-sm bg-white overflow-hidden group">
                  <div className={cn(
                    "h-2 w-full",
                    contest.status === 'active' ? "bg-green-500" : contest.status === 'draft' ? "bg-blue-400" : "bg-slate-300"
                  )} />
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="font-headline text-xl">{contest.name}</CardTitle>
                      <Badge variant={contest.status === 'active' ? 'default' : 'secondary'} className={cn(
                        "text-[10px] uppercase font-bold",
                        contest.status === 'active' && "bg-green-500 hover:bg-green-600"
                      )}>
                        {contest.status === 'active' ? 'En cours' : contest.status === 'draft' ? 'Brouillon' : 'Terminé'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-3 text-sm text-slate-500">
                      <Calendar className="h-4 w-4 text-slate-400" />
                      <span>{new Date(contest.startDate).toLocaleDateString()} - {new Date(contest.endDate).toLocaleDateString()}</span>
                    </div>
                    
                    <div className="pt-4 flex gap-2">
                      {contest.status !== 'active' && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1 text-xs"
                          onClick={() => handleUpdateContestStatus(contest.id, 'active')}
                        >
                          <CheckCircle2 className="h-3 w-3 mr-1 text-green-500" /> Activer
                        </Button>
                      )}
                      {contest.status === 'active' && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1 text-xs"
                          onClick={() => handleUpdateContestStatus(contest.id, 'completed')}
                        >
                          <Clock className="h-3 w-3 mr-1 text-slate-500" /> Clôturer
                        </Button>
                      )}
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-slate-400 hover:text-destructive"
                        onClick={() => {
                          if(confirm("Supprimer ce concours ?")) {
                            deleteDocumentNonBlocking(doc(firestore, 'competitions', contest.id));
                            toast({ title: "Concours supprimé" });
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {competitions?.length === 0 && !loadingCompetitions && (
                <div className="col-span-full py-20 bg-white rounded-3xl border border-dashed text-center">
                  <Trophy className="h-12 w-12 text-slate-100 mx-auto mb-4" />
                  <p className="text-slate-400">Aucune compétition enregistrée.</p>
                </div>
              )}
            </div>

            {/* NEW CONTEST DIALOG */}
            <Dialog open={isContestDialogOpen} onOpenChange={setIsContestDialogOpen}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold">Nouveau Concours</DialogTitle>
                  <DialogDescription>Définissez les dates et le nom de la compétition.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-1.5">
                    <Label>Nom du Concours</Label>
                    <Input 
                      placeholder="Ex: Rade Catch Été 2025" 
                      value={newContest.name}
                      onChange={e => setNewContest({ ...newContest, name: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Date de début</Label>
                      <Input 
                        type="datetime-local" 
                        value={newContest.startDate}
                        onChange={e => setNewContest({ ...newContest, startDate: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Date de fin</Label>
                      <Input 
                        type="datetime-local" 
                        value={newContest.endDate}
                        onChange={e => setNewContest({ ...newContest, endDate: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Statut initial</Label>
                    <Select 
                      value={newContest.status} 
                      onValueChange={(v: any) => setNewContest({ ...newContest, status: v })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Brouillon</SelectItem>
                        <SelectItem value="active">Actif immédiatement</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setIsContestDialogOpen(false)}>Annuler</Button>
                  <Button 
                    onClick={handleCreateContest} 
                    disabled={isCreatingContest}
                    className="bg-[#0a3d62] font-bold px-8"
                  >
                    {isCreatingContest ? <Loader2 className="animate-spin mr-2" /> : "Créer le concours"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}

        {activeTab === 'captures' && (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-3xl font-headline font-bold text-slate-900">Modération des Captures</h2>
                <p className="text-slate-500">Approuvez ou rejetez les prises envoyées par les membres.</p>
              </div>
            </div>

            <div className="grid gap-4">
              {loadingCatches ? (
                <div className="flex justify-center py-20"><Loader2 className="animate-spin text-slate-300 h-10 w-10" /></div>
              ) : catches?.map((c) => (
                <Card key={c.id} className="border-none shadow-sm bg-white overflow-hidden group">
                  <div className="flex flex-col md:flex-row h-full">
                    <div className="relative w-full md:w-64 h-48 md:h-auto shrink-0 bg-slate-100">
                      <Image 
                        src={c.imageUrl || 'https://picsum.photos/seed/catch/400/300'} 
                        alt={c.fishName} 
                        fill 
                        className="object-cover"
                      />
                      <div className="absolute top-2 left-2">
                        <Badge className={cn(
                          "text-[10px] uppercase font-bold",
                          c.status === 'approved' ? "bg-green-500" : c.status === 'pending' ? "bg-yellow-500" : "bg-red-500"
                        )}>
                          {c.status === 'approved' ? 'Approuvé' : c.status === 'pending' ? 'En attente' : 'Refusé'}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="flex-1 p-6 flex flex-col justify-between">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <div className="flex items-center gap-2 text-slate-400 text-xs uppercase font-bold mb-1">
                            <UserIcon className="h-3 w-3" /> Pêcheur
                          </div>
                          <p className="font-bold text-slate-900">{c.anglerName}</p>
                          <p className="text-xs text-slate-500">{new Date(c.date).toLocaleString()}</p>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 text-slate-400 text-xs uppercase font-bold mb-1">
                            <Fish className="h-3 w-3" /> Espèce & Taille
                          </div>
                          <p className="font-bold text-primary">{c.fishName}</p>
                          <p className="text-sm font-medium">{c.size} cm • {c.points} points</p>
                        </div>
                      </div>

                      <div className="mt-6 flex flex-wrap gap-2 pt-4 border-t border-slate-50">
                        {c.status !== 'approved' && (
                          <Button 
                            size="sm" 
                            className="bg-green-600 hover:bg-green-700 font-bold gap-2"
                            onClick={() => handleUpdateCatchStatus(c.id, 'approved')}
                          >
                            <Check className="h-4 w-4" /> Approuver
                          </Button>
                        )}
                        {c.status !== 'rejected' && (
                          <Button 
                            variant="outline"
                            size="sm" 
                            className="text-red-500 hover:text-red-600 border-red-100 hover:bg-red-50 font-bold gap-2"
                            onClick={() => handleUpdateCatchStatus(c.id, 'rejected')}
                          >
                            <X className="h-4 w-4" /> Refuser
                          </Button>
                        )}
                        <Button 
                          variant="secondary"
                          size="sm" 
                          className="font-bold gap-2"
                          onClick={() => handleEditCatch(c)}
                        >
                          <Edit2 className="h-4 w-4" /> Modifier
                        </Button>
                        <Button 
                          variant="ghost"
                          size="sm" 
                          className="text-slate-300 hover:text-destructive ml-auto"
                          onClick={() => handleDeleteCatch(c.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
              {catches?.length === 0 && !loadingCatches && (
                <div className="py-20 bg-white rounded-3xl border border-dashed text-center">
                  <Camera className="h-12 w-12 text-slate-100 mx-auto mb-4" />
                  <p className="text-slate-400">Aucune capture à modérer.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* MODAL EDIT USER */}
        <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">Modifier le Profil</DialogTitle>
              <DialogDescription>Mettez à jour les informations du pêcheur.</DialogDescription>
            </DialogHeader>
            {editingUser && (
              <div className="space-y-6 py-4">
                <div className="flex flex-col items-center gap-4">
                  <div className="relative group">
                    <Avatar className="h-24 w-24 border-2 border-slate-100 shadow-sm">
                      <AvatarImage src={editingUser.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${editingUser.name}`} />
                      <AvatarFallback><UserIcon className="h-10 w-10 text-slate-300" /></AvatarFallback>
                    </Avatar>
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingAvatar}
                      className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      {isUploadingAvatar ? <Loader2 className="animate-spin text-white" /> : <Camera className="text-white h-6 w-6" />}
                    </button>
                    <input type="file" ref={fileInputRef} className="hidden" onChange={handleAvatarUpload} accept="image/*" />
                  </div>
                  <p className="text-xs text-slate-400">Cliquez sur l'avatar pour le changer</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label>Nom du Pêcheur</Label>
                    <Input 
                      value={editingUser.name} 
                      onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })} 
                      placeholder="Nom complet"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Email (Non modifiable)</Label>
                    <Input value={editingUser.email} disabled className="bg-slate-50 text-slate-400" />
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="ghost" onClick={() => setEditingUser(null)}>Annuler</Button>
              <Button 
                onClick={handleSaveUser} 
                disabled={isUserUpdating}
                className="bg-[#0a3d62] font-bold px-8"
              >
                {isUserUpdating ? <Loader2 className="animate-spin mr-2" /> : "Enregistrer"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* MODAL EDIT CATCH */}
        <Dialog open={!!editingCatch} onOpenChange={(open) => !open && setEditingCatch(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">Modifier la Capture</DialogTitle>
              <DialogDescription>Corrigez les détails techniques de la prise.</DialogDescription>
            </DialogHeader>
            {editingCatch && (
              <div className="space-y-6 py-4">
                <div className="relative h-40 w-full rounded-xl overflow-hidden mb-4">
                   <Image src={editingCatch.imageUrl} alt="Fish" fill className="object-cover" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5 col-span-2">
                    <Label>Espèce</Label>
                    <Select 
                      value={editingCatch.fishId} 
                      onValueChange={(v) => setEditingCatch({ ...editingCatch, fishId: v })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {species?.map(s => (
                          <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-1.5">
                    <Label>Taille (cm)</Label>
                    <div className="relative">
                      <Scale className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input 
                        type="number" 
                        step="0.5" 
                        className="pl-10"
                        value={editingCatch.size}
                        onChange={e => setEditingCatch({ ...editingCatch, size: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label>Poids (kg)</Label>
                    <Input 
                      type="number" 
                      step="0.1" 
                      value={editingCatch.weight}
                      onChange={e => setEditingCatch({ ...editingCatch, weight: parseFloat(e.target.value) || 0 })}
                    />
                  </div>

                  <div className="space-y-1.5 col-span-2">
                    <Label>Lieu</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input 
                        className="pl-10"
                        value={editingCatch.location}
                        onChange={e => setEditingCatch({ ...editingCatch, location: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="ghost" onClick={() => setEditingCatch(null)}>Annuler</Button>
              <Button 
                onClick={handleSaveCatch} 
                disabled={isCatchUpdating}
                className="bg-[#0a3d62] font-bold px-8"
              >
                {isCatchUpdating ? <Loader2 className="animate-spin mr-2" /> : "Enregistrer"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {activeTab !== 'access' && activeTab !== 'competitions' && activeTab !== 'captures' && ( activeTab === 'guide' ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
            <ShieldCheck className="h-12 w-12 text-slate-200 mb-4" />
            <p className="text-slate-400 text-center px-4">Utilisez le module "Guide" dans la navigation pour gérer les poissons.</p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
            <ShieldCheck className="h-12 w-12 text-slate-200 mb-4" />
            <p className="text-slate-400">Le module {tabs.find(t => t.id === activeTab)?.label} est en cours de configuration.</p>
          </div>
        ))}
      </main>
    </div>
  );
}
