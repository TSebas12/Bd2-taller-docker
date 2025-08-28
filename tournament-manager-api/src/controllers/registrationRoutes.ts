import express from 'express';
import { registerParticipant } from '../controllers/registrationController';

const router = express.Router();

router.post('/registrar', registerParticipant);

export default router;