'use server';
/**
 * @fileOverview This file implements a Genkit flow to parse raw text into a structured FishSpecies object.
 *
 * - parseFishData - A function that parses raw text into a fish species structure.
 * - ParseFishDataInput - The input type for the parseFishData function.
 * - ParseFishDataOutput - The return type for the parseFishData function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ParseFishDataInputSchema = z.string().describe('The raw text containing information about a fish species.');

const FishSpeciesSchema = z.object({
  name: z.string().describe('The common name of the fish.'),
  scientificName: z.string().describe('The scientific (Latin) name of the fish.'),
  pointsPerCm: z.number().describe('Points awarded per centimeter (default 10).'),
  minSize: z.number().describe('Minimum legal size in cm.'),
  description: z.string().describe('A complete description.'),
  habitat: z.string().describe('Habitat details.'),
  diet: z.string().describe('Diet details.'),
  averageSize: z.string().describe('Average size range (e.g., 30-50 cm).'),
  keyFeatures: z.string().describe('Physical characteristics.'),
  fishingTips: z.string().describe('Tips for catching.'),
  rarity: z.enum(['Commun', 'Rare', 'Très rare']).describe('Rarity level.'),
  techniques: z.array(z.string()).describe('List of fishing techniques.'),
  spots: z.array(z.string()).describe('List of recommended spots.'),
  bonusPoints: z.array(z.object({
    threshold: z.number().describe('Size threshold in cm.'),
    points: z.number().describe('Bonus points awarded.')
  })).optional().describe('List of bonus point tiers.')
});

export type ParseFishDataOutput = z.infer<typeof FishSpeciesSchema>;

export async function parseFishData(input: string): Promise<ParseFishDataOutput> {
  const {output} = await parseFishPrompt(input);
  if (!output) throw new Error("Failed to parse fish data.");
  return output;
}

const parseFishPrompt = ai.definePrompt({
  name: 'parseFishPrompt',
  input: {schema: ParseFishDataInputSchema},
  output: {schema: FishSpeciesSchema},
  prompt: `You are an expert at extracting structured information from raw text.
Your task is to take the provided text about a fish species and convert it into a valid JSON object matching the requested schema.

Instructions:
1. Extract as much information as possible.
2. If a value is missing, provide a logical default or empty string/array.
3. For pointsPerCm, if not mentioned, use 10.
4. For rarity, choose the most appropriate value based on the text.
5. Ensure the description is engaging and informative.

Raw Text:
{{{this}}}`,
});
