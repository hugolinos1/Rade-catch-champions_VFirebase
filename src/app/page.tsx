import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Fish, Trophy, Anchor, ArrowRight, PlusCircle } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navigation />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-20 overflow-hidden bg-primary text-white">
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-2xl">
              <h1 className="font-headline text-5xl md:text-6xl font-bold mb-6 leading-tight">
                Devenez le Champion de la Rade de Brest
              </h1>
              <p className="text-xl opacity-90 mb-8 font-body">
                Participez au plus grand concours de pêche local. Enregistrez vos prises, gagnez des points et grimpez dans le classement en temps réel.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button asChild size="lg" variant="secondary" className="font-headline font-bold">
                  <Link href="/concours">
                    Saisir une Prise <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="bg-transparent text-white border-white hover:bg-white hover:text-primary font-headline font-bold">
                  <Link href="/guide">Le Guide des Poissons</Link>
                </Button>
              </div>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-full h-full opacity-20 pointer-events-none">
             <Image 
                src="https://picsum.photos/seed/fishing/1200/800" 
                alt="Fishing scene" 
                fill 
                className="object-cover"
                data-ai-hint="fishing landscape"
              />
          </div>
        </section>

        {/* Features */}
        <section className="py-20 container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-none shadow-lg bg-white/50 backdrop-blur">
              <CardHeader>
                <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center mb-4">
                  <Fish className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="font-headline">Guide Exhaustif</CardTitle>
                <CardDescription>Consultez les fiches détaillées de tous les poissons éligibles et leurs points.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="link" asChild className="p-0 text-primary">
                  <Link href="/guide">Voir le guide</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg bg-white/50 backdrop-blur">
              <CardHeader>
                <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center mb-4">
                  <PlusCircle className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="font-headline">Capture & Points</CardTitle>
                <CardDescription>Prenez une photo, saisissez la taille, et notre système calcule vos points instantanément.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="link" asChild className="p-0 text-primary">
                  <Link href="/concours">Enregistrer une prise</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg bg-white/50 backdrop-blur">
              <CardHeader>
                <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center mb-4">
                  <Trophy className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="font-headline">Live Ranking</CardTitle>
                <CardDescription>Suivez le classement général et tentez de décrocher le record du "Big Fish".</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="link" asChild className="p-0 text-primary">
                  <Link href="/classement">Voir le classement</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <footer className="bg-white border-t py-12">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Anchor className="h-6 w-6 text-primary" />
            <span className="font-headline font-bold text-lg">Rade Catch Champions</span>
          </div>
          <p className="text-muted-foreground text-sm">© 2024 Rade Catch Champions - Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  );
}