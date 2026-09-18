import { generateChatReply } from '../services/ai.service.js';

export async function postChat(req, res, next) {
  try {
    const message = String(req.body?.message || '').trim();
    const history = Array.isArray(req.body?.history) ? req.body.history : [];

    if (!message) {
      return res.status(400).json({ success: false, error: 'Message is required.' });
    }

    const result = await generateChatReply({ message, history });
    return res.json(result);
  } catch (error) {
    return next(error);
  }
}
