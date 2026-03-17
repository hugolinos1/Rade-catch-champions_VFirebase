'use server';
/**
 * @fileOverview Ce flux Genkit permet d'extraire des données structurées d'un texte ou 
 * de générer une fiche complète à partir du nom d'un poisson en utilisant les connaissances de l'IA.
 *
 * - parseFishData - Fonction principale de recherche et d'analyse.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ParseFishDataInputSchema = z.string().describe('Le nom d\'un poisson ou un texte descriptif brut.');

const FishSpeciesSchema = z.object({
  name: z.string().describe('Le nom commun du poisson.'),
  scientificName: z.string().describe('Le nom scientifique (Latin) du poisson.'),
  pointsPerCm: z.number().describe('Points attribués par centimètre (par défaut 10).'),
  minSize: z.number().describe('Taille légale de capture en cm (maille).'),
  description: z.string().describe('Une description complète et engageante.'),
  habitat: z.string().describe('Détails sur l\'habitat (zones de la Rade de Brest, profondeurs).'),
  diet: z.string().describe('Régime alimentaire.'),
  averageSize: z.string().describe('Taille moyenne (ex: 30-50 cm).'),
  keyFeatures: z.string().describe('Caractéristiques physiques distinctives.'),
  fishingTips: z.string().describe('Conseils pour la capture (leurres, moments de marée).'),
  eligibilityCriteria: z.string().describe('Critères pour que la prise soit valide au concours.'),
  rarity: z.enum(['Commun', 'Rare', 'Très rare']).describe('Niveau de rareté.'),
  techniques: z.array(z.string()).describe('Liste des techniques de pêche recommandées.'),
  spots: z.array(z.string()).describe('Liste de spots réels en Rade de Brest.'),
  bonusPoints: z.array(z.object({
    threshold: z.number().describe('Seuil de taille en cm.'),
    points: z.number().describe('Points bonus accordés.')
  })).describe('Paliers de bonus pour les gros spécimens.')
});

export type ParseFishDataOutput = z.infer<typeof FishSpeciesSchema>;

export async function parseFishData(input: string): Promise<ParseFishDataOutput> {
  const {output} = await parseFishPrompt(input);
  if (!output) throw new Error("L'IA n'a pas pu générer les données du poisson.");
  return output;
}

const parseFishPrompt = ai.definePrompt({
  name: 'parseFishPrompt',
  input: {schema: ParseFishDataInputSchema},
  output: {schema: FishSpeciesSchema},
  prompt: `Tu es un expert en ichthyologie et un guide de pêche professionnel spécialisé dans la Rade de Brest et la Bretagne.

Ton rôle est de générer une fiche technique ultra-complète pour l'espèce de poisson indiquée.

### ANALYSE DE L'ENTRÉE :
Si l'entrée est un simple nom de poisson (ex: "Bar", "Lieu jaune"), utilise tes connaissances encyclopédiques pour remplir tous les champs.
Si l'entrée est un texte descriptif, extrais les données et complète les informations manquantes avec tes connaissances.

### RÈGLES DE GÉNÉRATION :
- **Points par cm** : Défini une valeur cohérente (10 par défaut, jusqu'à 20 pour les poissons nobles comme le Bar ou la Royale).
- **Taille légale** : Indique la maille légale actuelle en zone Atlantique/Manche.
- **Description** : Rédige un texte captivant de 3-4 phrases.
- **Bonus** : Crée 3 paliers de bonus logiques (ex: pour un bar, bonus à 60, 70 et 80cm).
- **Géographie** : Cite impérativement des lieux réels de la Rade de Brest (Le Goulet, l'Aulne, les ducs d'Albe, etc.).
- **Langue** : Réponds exclusivement en Français.

IMPORTANT : Ne génère aucune URL d'image. Laisse ce champ vide ou gère-le via l'upload utilisateur.

Entrée fournie :
{{{this}}}`,
});
