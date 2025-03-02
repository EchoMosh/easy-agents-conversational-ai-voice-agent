
import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/integrations/supabase/client';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { text, voice_id } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    // Call our Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('text-to-speech', {
      body: { text, voice_id },
    });

    if (error) {
      console.error('Edge function error:', error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).send(data);
  } catch (error) {
    console.error('API route error:', error);
    return res.status(500).json({ error: 'Failed to generate speech' });
  }
}
