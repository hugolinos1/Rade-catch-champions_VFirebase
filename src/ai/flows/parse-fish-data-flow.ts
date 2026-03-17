'use server';
/**
 * @fileOverview Ce flux Genkit permet d'extraire des données structurées d'un texte ou 
 * de générer une fiche complète à partir du nom d'un poisson.
 * 
 * Optimisé pour la rapidité et la fiabilité.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ParseFishDataInputSchema = z.object({
  query: z.string().describe('Le nom du poisson ou la description.')
});

const FishSpeciesSchema = z.object({
  name: z.string().describe('Le nom commun du poisson.'),
  scientificName: z.string().describe('Le nom scientifique (Latin).'),
  pointsPerCm: z.number().describe('Points par cm (défaut 10).'),
  minSize: z.number().describe('Taille légale en cm.'),
  description: z.string().describe('Description courte (2-3 phrases).'),
  habitat: z.string().describe('Habitat type.'),
  diet: z.string().describe('Régime alimentaire.'),
  averageSize: z.string().describe('Taille moyenne.'),
  keyFeatures: z.string().describe('Traits distinctifs.'),
  fishingTips: z.string().describe('Conseils de pêche.'),
  eligibilityCriteria: z.string().describe('Critères de validité.'),
  rarity: z.enum(['Commun', 'Rare', 'Très rare']).describe('Rareté.'),
  techniques: z.array(z.string()).describe('Techniques recommandées.'),
  spots: z.array(z.string()).describe('Spots réels en Rade de Brest.'),
  bonusPoints: z.array(z.object({
    threshold: z.number().describe('Taille en cm.'),
    points: z.number().describe('Points bonus.')
  })).describe('Paliers de bonus.')
});

export type ParseFishDataOutput = z.infer<typeof FishSpeciesSchema>;

/**
 * Recherche et analyse les données d'un poisson via l'IA.
 */
export async function parseFishData(input: string): Promise<ParseFishDataOutput> {
  // Vérification de sécurité pour la clé API
  if (!process.env.GOOGLE_GENAI_API_KEY && !process.env.GEMINI_API_KEY) {
    throw new Error("Clé API Google AI non configurée. Veuillez l'ajouter dans les variables d'environnement.");
  }

  try {
    const {output} = await parseFishPrompt({ query: input });
    if (!output) throw new Error("L'IA n'a pas retourné de résultat structuré.");
    return output;
  } catch (error: any) {
    console.error("Erreur parseFishData:", error);
    throw new Error(error.message || "Erreur lors de la génération des données.");
  }
}

const parseFishPrompt = ai.definePrompt({
  name: 'parseFishPrompt',
  input: {schema: ParseFishDataInputSchema},
  output: {schema: FishSpeciesSchema},
  prompt: `Tu es un expert en pêche bretonne.
Génère une fiche technique pour : {{{query}}}

RÈGLES STRICTES :
1. Si c'est un nom simple, utilise tes connaissances pour tout remplir.
2. Si c'est un texte, extrais et complète.
3. Sois concis pour éviter les timeouts.
4. Pour les spots, cite obligatoirement des lieux réels de la Rade de Brest (ex: Le Goulet, Plougastel, Roscanvel).
5. Réponds en Français exclusivement.`,
});
