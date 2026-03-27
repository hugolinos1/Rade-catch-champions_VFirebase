import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Fish, Trophy, Anchor, ArrowRight, CirclePlus } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navigation />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-24 md:py-32 overflow-hidden bg-[#0a3d62] text-white">
          <div className="container mx-auto px-4 relative z-20">
            <div className="max-w-2xl">
              <h1 className="font-headline text-5xl md:text-7xl font-bold mb-6 leading-tight tracking-tighter">
                Devenez le Champion de la Rade de Brest
              </h1>
              <p className="text-lg md:text-xl opacity-90 mb-10 font-body leading-relaxed">
                Participez au plus grand concours de pêche local. Enregistrez vos prises, gagnez des points et grimpez dans le classement en temps réel.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button asChild size="lg" variant="secondary" className="font-headline font-bold h-14 px-8 text-lg rounded-full">
                  <Link href="/concours">
                    Saisir une Prise <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="bg-transparent text-white border-white/40 hover:bg-white hover:text-[#0a3d62] font-headline font-bold h-14 px-8 text-lg rounded-full backdrop-blur-sm">
                  <Link href="/guide">Le Guide des Poissons</Link>
                </Button>
              </div>
            </div>
          </div>

          {/* Background Video */}
          <div className="absolute inset-0 z-10 opacity-40 pointer-events-none overflow-hidden">
             <video 
                autoPlay 
                muted 
                loop 
                playsInline 
                poster="https://picsum.photos/seed/fishing/1200/800"
                className="w-full h-full object-cover"
              >
                <source src="/hero-video.mp4" type="video/mp4" />
                {/* Fallback image est gérée par le poster et le fond de la section */}
              </video>
          </div>
          
          {/* Dégradé pour améliorer la lisibilité du texte */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a3d62] via-[#0a3d62]/60 to-transparent z-10" />
        </section>

        {/* Features */}
        <section className="py-24 container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-none shadow-xl bg-white transition-all hover:-translate-y-1">
              <CardHeader>
                <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
                  <Fish className="h-7 w-7 text-[#0a3d62]" />
                </div>
                <CardTitle className="font-headline text-2xl font-bold text-slate-900">Guide Exhaustif</CardTitle>
                <CardDescription className="text-slate-500 text-sm">Consultez les fiches détaillées de tous les poissons éligibles et leurs points.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="link" asChild className="p-0 text-[#0a3d62] font-bold">
                  <Link href="/guide" className="flex items-center gap-2">
                    Voir le guide <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="border-none shadow-xl bg-white transition-all hover:-translate-y-1">
              <CardHeader>
                <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
                  <CirclePlus className="h-7 w-7 text-[#0a3d62]" />
                </div>
                <CardTitle className="font-headline text-2xl font-bold text-slate-900">Capture & Points</CardTitle>
                <CardDescription className="text-slate-500 text-sm">Prenez une photo, saisissez la taille, et notre système calcule vos points instantanément.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="link" asChild className="p-0 text-[#0a3d62] font-bold">
                  <Link href="/concours" className="flex items-center gap-2">
                    Enregistrer une prise <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="border-none shadow-xl bg-white transition-all hover:-translate-y-1">
              <CardHeader>
                <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
                  <Trophy className="h-7 w-7 text-[#0a3d62]" />
                </div>
                <CardTitle className="font-headline text-2xl font-bold text-slate-900">Live Ranking</CardTitle>
                <CardDescription className="text-slate-500 text-sm">Suivez le classement général et tentez de décrocher le record du "Big Fish".</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="link" asChild className="p-0 text-[#0a3d62] font-bold">
                  <Link href="/classement" className="flex items-center gap-2">
                    Voir le classement <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <footer className="bg-white border-t py-12">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Anchor className="h-6 w-6 text-[#0a3d62]" />
            <span className="font-headline font-bold text-lg text-slate-900">Rade Catch Champions</span>
          </div>
          <p className="text-muted-foreground text-sm">© 2024 Rade Catch Champions - Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  );
}
