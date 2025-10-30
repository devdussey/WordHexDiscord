import { supabase, handleCors } from '../_supabase.js';

export default async function handler(req, res) {
  // Handle CORS
  if (handleCors(req, res)) return;

  if (req.method === 'GET') {
    return handleGetServerRecord(req, res);
  } else if (req.method === 'POST') {
    return handleCreateOrUpdateServerRecord(req, res);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function handleGetServerRecord(req, res) {
  try {
    const { serverId } = req.query;

    if (!serverId) {
      return res.status(400).json({ error: 'serverId is required' });
    }

    const { data, error } = await supabase
      .from('server_records')
      .select('*')
      .eq('server_id', serverId)
      .maybeSingle();

    if (error) throw error;

    return res.status(200).json(data || null);
  } catch (error) {
    console.error('Server record error:', error);
    return res.status(500).json({
      error: 'Failed to fetch server record',
      details: error.message
    });
  }
}

async function handleCreateOrUpdateServerRecord(req, res) {
  try {
    const { serverId, userId, username, score, wordsFound, gemsCollected } = req.body;

    if (!serverId || !userId) {
      return res.status(400).json({ error: 'serverId and userId are required' });
    }

    // Check if a record exists for this server
    const { data: existingRecord, error: selectError } = await supabase
      .from('server_records')
      .select('*')
      .eq('server_id', serverId)
      .maybeSingle();

    if (selectError) throw selectError;

    // If no record exists, create one
    if (!existingRecord) {
      const { data: newRecord, error: insertError } = await supabase
        .from('server_records')
        .insert({
          server_id: serverId,
          user_id: userId,
          username: username,
          score: score,
          words_found: wordsFound || 0,
          gems_collected: gemsCollected || 0,
          achieved_at: new Date().toISOString()
        })
        .select()
        .single();

      if (insertError) throw insertError;

      return res.status(200).json({
        record: newRecord,
        isNewRecord: true
      });
    }

    // If existing record is lower, update it
    if (score > existingRecord.score) {
      const { data: updatedRecord, error: updateError } = await supabase
        .from('server_records')
        .update({
          user_id: userId,
          username: username,
          score: score,
          words_found: wordsFound || 0,
          gems_collected: gemsCollected || 0,
          achieved_at: new Date().toISOString()
        })
        .eq('server_id', serverId)
        .select()
        .single();

      if (updateError) throw updateError;

      return res.status(200).json({
        record: updatedRecord,
        isNewRecord: true
      });
    }

    // Score is not higher than existing record
    return res.status(200).json({
      record: existingRecord,
      isNewRecord: false
    });
  } catch (error) {
    console.error('Server record update error:', error);
    return res.status(500).json({
      error: 'Failed to update server record',
      details: error.message
    });
  }
}
