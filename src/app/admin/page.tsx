
"use client"

import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Key, 
  Users, 
  RefreshCcw, 
  Trash2, 
  Plus, 
  Loader2,
  ShieldCheck,
  Lock
} from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc } from '@/firebase';
import { doc, collection, query, where } from 'firebase/firestore';
import { addDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { UserProfile, InvitationCode } from '@/lib/types';
import { cn } from '@/lib/utils';

export default function AdminPage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user: authUser } = useUser();
  const [activeTab, setActiveTab] = useState('access');
  const [isGenerating, setIsGenerating] = useState(false);

  // 1. Fetch current user profile to check role
  const userDocRef = useMemoFirebase(() => 
    authUser ? doc(firestore, 'users', authUser.uid) : null, 
  [firestore, authUser]);
  const { data: profile, isLoading: loadingProfile } = useDoc<UserProfile>(userDocRef);

  const isAdmin = profile?.role === 'admin';

  // 2. Conditional queries for admin data: only run if user is confirmed admin
  const usersQuery = useMemoFirebase(() => 
    isAdmin ? collection(firestore, 'users') : null, 
  [firestore, isAdmin]);

  const activeCodesQuery = useMemoFirebase(() => 
    isAdmin ? query(collection(firestore, 'registration_codes'), where('isUsed', '==', false)) : null, 
  [firestore, isAdmin]);

  const { data: users, isLoading: loadingUsers } = useCollection<UserProfile>(usersQuery);
  const { data: activeCodes, isLoading: loadingCodes } = useCollection<InvitationCode>(activeCodesQuery);

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
              Contactez l'organisation si vous pensez qu'il s'agit d'une erreur.
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
            <Card className="border-none shadow-sm bg-white">
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

            <Card className="border-none shadow-xl bg-[#0f172a] text-white">
              <CardHeader className="pb-6">
                <CardTitle className="text-2xl font-headline flex items-center gap-2">
                  <RefreshCcw className="h-6 w-6" />
                  État de la Plateforme
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
                    <Users className="h-3 w-3" /> UTILISATEURS
                  </h3>
                  <div className="space-y-3">
                    {loadingUsers ? (
                      <div className="flex justify-center py-4"><Loader2 className="animate-spin text-slate-500" /></div>
                    ) : users?.map((u) => (
                      <div key={u.id} className="p-4 bg-slate-800/30 rounded-xl border border-slate-700/30">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-200 font-medium text-sm">
                              {u.name || "Pêcheur Anonyme"}
                            </span>
                            {u.role === 'admin' && (
                              <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-[9px] h-4 uppercase font-bold">
                                Admin
                              </Badge>
                            )}
                          </div>
                          <span className="text-slate-500 text-xs truncate">
                            {u.email || `${u.id}@gmail.com`}
                          </span>
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

        {activeTab !== 'access' && ( activeTab === 'guide' ? (
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
