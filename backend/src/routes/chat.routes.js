import { Router } from 'express';
import { postChat } from '../controllers/chat.controller.js';

const router = Router();
router.get('/', (req, res) => {
  res.json({
    status: 'online',
    assistant: "Nandha Kumar's Personal Portfolio AI Assistant",
    version: '1.0.0'
  });
});
router.post('/', postChat);
export default router;
