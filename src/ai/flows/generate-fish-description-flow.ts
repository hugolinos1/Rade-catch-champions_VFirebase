'use server';
/**
 * @fileOverview This file implements a Genkit flow to assist administrators in generating or enriching fish descriptions for a fishing contest guide.
 *
 * - generateFishDescription - A function that handles the generation/enrichment of fish descriptions.
 * - GenerateFishDescriptionInput - The input type for the generateFishDescription function.
 * - GenerateFishDescriptionOutput - The return type for the generateFishDescription function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateFishDescriptionInputSchema = z.object({
  fishName: z.string().describe('The common name of the fish.'),
  scientificName: z.string().optional().describe('The scientific (Latin) name of the fish.'),
  habitat: z.string().optional().describe('Typical habitat of the fish (e.g., freshwater, saltwater, rivers, lakes, oceans, coral reefs).'),
  diet: z.string().optional().describe('What the fish typically eats.'),
  averageSize: z.string().optional().describe('Average size (length and weight) of the fish.'),
  keyFeatures: z.string().optional().describe('Any unique physical characteristics or behaviors.'),
  fishingTips: z.string().optional().describe('Tips for catching this fish, including bait, techniques, or best times.'),
  eligibilityCriteria: z.string().optional().describe('Criteria for this fish to be eligible in the fishing contest (e.g., minimum size).'),
  pointsAwarded: z.number().optional().describe('Number of points awarded for catching this fish in the contest.'),
  existingDescription: z.string().optional().describe('An existing description of the fish to be enriched. If provided, the AI should refine and expand upon it.'),
});
export type GenerateFishDescriptionInput = z.infer<typeof GenerateFishDescriptionInputSchema>;

const GenerateFishDescriptionOutputSchema = z.object({
  description: z.string().describe('A comprehensive and informative description of the fish, suitable for a fishing guide.'),
});
export type GenerateFishDescriptionOutput = z.infer<typeof GenerateFishDescriptionOutputSchema>;

export async function generateFishDescription(input: GenerateFishDescriptionInput): Promise<GenerateFishDescriptionOutput> {
  return generateFishDescriptionFlow(input);
}

const generateFishDescriptionPrompt = ai.definePrompt({
  name: 'generateFishDescriptionPrompt',
  input: {schema: GenerateFishDescriptionInputSchema},
  output: {schema: GenerateFishDescriptionOutputSchema},
  prompt: `You are an expert ichthyologist and a knowledgeable fishing guide. Your task is to generate or enrich a detailed and engaging description for a specific fish species, intended for a fishing contest guide.
The description should be informative, accurate, and helpful for participants.

Here are the details provided:

Fish Name: {{{fishName}}}
{{#if scientificName}}Scientific Name: {{{scientificName}}}
{{/if}}{{#if habitat}}Habitat: {{{habitat}}}
{{/if}}{{#if diet}}Diet: {{{diet}}}
{{/if}}{{#if averageSize}}Average Size: {{{averageSize}}}
{{/if}}{{#if keyFeatures}}Key Features: {{{keyFeatures}}}
{{/if}}{{#if fishingTips}}Fishing Tips: {{{fishingTips}}}
{{/if}}{{#if eligibilityCriteria}}Contest Eligibility Criteria: {{{eligibilityCriteria}}}
{{/if}}{{#if pointsAwarded}}Contest Points Awarded: {{{pointsAwarded}}}
{{/if}}

{{#if existingDescription}}
Existing Description to Enrich:
{{{existingDescription}}}

Your task is to enrich and refine the 'Existing Description' using the new details provided. Ensure the description is comprehensive, well-structured, and incorporates all relevant new information while maintaining a consistent tone.
{{else}}
Your task is to generate a comprehensive and engaging description for the "{{{fishName}}}" based on the details provided. The description should cover its characteristics, habitat, diet, and provide useful fishing tips. If contest-specific details (eligibility, points) are given, integrate them naturally into the description.
{{/if}}

The final output should be a single JSON object with a 'description' field.`,
});

const generateFishDescriptionFlow = ai.defineFlow(
  {
    name: 'generateFishDescriptionFlow',
    inputSchema: GenerateFishDescriptionInputSchema,
    outputSchema: GenerateFishDescriptionOutputSchema,
  },
  async input => {
    const {output} = await generateFishDescriptionPrompt(input);
    if (!output) {
      throw new Error("Failed to generate fish description.");
    }
    return output;
  }
);
