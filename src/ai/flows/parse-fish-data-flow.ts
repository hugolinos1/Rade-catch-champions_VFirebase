'use server';
/**
 * @fileOverview Ce flux Genkit permet soit d'extraire des données structurées d'un texte, 
 * soit de générer une fiche complète à partir du nom d'un poisson en utilisant les connaissances de l'IA.
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
  rarity: z.enum(['Commun', 'Rare', 'Très rare']).describe('Niveau de rareté.'),
  imageUrl: z.string().optional().describe('URL d\'une image (laisser vide si non trouvée).'),
  techniques: z.array(z.string()).describe('Liste des techniques de pêche (ex: Leurre, Appât naturel).'),
  spots: z.array(z.string()).describe('Liste de spots recommandés en Rade de Brest ou presqu\'île de Crozon.'),
  bonusPoints: z.array(z.object({
    threshold: z.number().describe('Seuil de taille en cm.'),
    points: z.number().describe('Points bonus accordés.')
  })).optional().describe('Paliers de bonus pour les spécimens exceptionnels.')
});

export type ParseFishDataOutput = z.infer<typeof FishSpeciesSchema>;

export async function parseFishData(input: string): Promise<ParseFishDataOutput> {
  const {output} = await parseFishPrompt(input);
  if (!output) throw new Error("Échec de la génération des données du poisson.");
  return output;
}

const parseFishPrompt = ai.definePrompt({
  name: 'parseFishPrompt',
  input: {schema: ParseFishDataInputSchema},
  output: {schema: FishSpeciesSchema},
  prompt: `Tu es un expert en ichthyologie et un guide de pêche spécialisé dans la Rade de Brest et la pointe de Bretagne.

Ton rôle est de fournir une fiche technique complète et structurée pour l'espèce demandée.

### DEUX SCÉNARIOS POSSIBLES :
1. **ENTRÉE = NOM DE POISSON** (ex: "Bar commun", "Dorade grise") : 
   Utilise tes connaissances encyclopédiques pour remplir TOUS les champs de la fiche. Sois précis sur la maille légale en France (Atlantique/Manche).
2. **ENTRÉE = TEXTE BRUT** : 
   Extrais les informations du texte pour remplir la fiche. Si des informations manquent, complète-les avec tes connaissances pour que la fiche soit exhaustive.

### INSTRUCTIONS SPÉCIFIQUES :
- **Points par cm** : Par défaut 10, sauf si l'espèce est noble/difficile (ex: Bar, Bar de ligne) où tu peux monter à 15 ou 20.
- **Taille légale** : Utilise la réglementation officielle actuelle.
- **Bonus** : Crée 2 ou 3 paliers de bonus cohérents pour la "grosse prise" (ex: pour un bar, bonus à 60cm, 70cm et 80cm).
- **Rareté** : 'Très rare' pour les espèces peu présentes en rade, 'Rare' pour les saisonniers, 'Commun' pour les résidents.
- **Localisation** : Cite des zones réelles de la Rade de Brest (ex: Goulet, Banc du Corbeau, Plougastel, Crozon).
- **Langue** : Réponds exclusivement en Français.

Texte ou Nom fourni :
{{{this}}}`,
});
