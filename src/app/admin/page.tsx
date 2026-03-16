
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
  ShieldCheck
} from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection, query, where } from 'firebase/firestore';
import { addDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { UserProfile, InvitationCode } from '@/lib/types';
import { cn } from '@/lib/utils';

export default function AdminPage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [activeTab, setActiveTab] = useState('access');
  const [isGenerating, setIsGenerating] = useState(false);

  // Queries
  const usersQuery = useMemoFirebase(() => collection(firestore, 'users'), [firestore]);
  const activeCodesQuery = useMemoFirebase(() => 
    query(collection(firestore, 'registration_codes'), where('isUsed', '==', false)), 
  [firestore]);

  const { data: users, isLoading: loadingUsers } = useCollection<UserProfile>(usersQuery);
  const { data: activeCodes, isLoading: loadingCodes } = useCollection<InvitationCode>(activeCodesQuery);

  const handleGenerateCode = () => {
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

  return (
    <div className="min-h-screen bg-slate-50 pb-20 md:pb-0">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Navigation Tabs Mockup Style */}
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
            {/* Left Panel: Registration Codes */}
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
                    {activeCodes?.length === 0 && (
                      <p className="text-center py-8 text-slate-300 italic text-sm">Aucun code actif.</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Right Panel: Platform State */}
            <Card className="border-none shadow-xl bg-[#0f172a] text-white">
              <CardHeader className="pb-6">
                <CardTitle className="text-2xl font-headline flex items-center gap-2">
                  <RefreshCcw className="h-6 w-6" />
                  État de la Plateforme
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-8">
                {/* Stats Row */}
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

                {/* Users List */}
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Users className="h-3 w-3" /> UTILISATEURS
                  </h3>
                  <div className="space-y-3">
                    {loadingUsers ? <Loader2 className="animate-spin mx-auto text-slate-700" /> : users?.map((u) => (
                      <div key={u.id} className="p-4 bg-slate-800/30 rounded-xl border border-slate-700/50 flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-lg">{u.name}</h4>
                            {u.role === 'admin' && (
                              <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-[9px] h-4">
                                ADMIN
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-slate-500">{u.id}@gmail.com</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab !== 'access' && (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
            <ShieldCheck className="h-12 w-12 text-slate-200 mb-4" />
            <p className="text-slate-400">Le module {tabs.find(t => t.id === activeTab)?.label} est en cours de configuration.</p>
          </div>
        )}
      </main>
    </div>
  );
}
