import express from "express";
import {checkAnswer} from "../controllers/caches";
import {loadGame} from "../controllers/admin";
import {checkIn, onboard} from "../controllers/auth";

const router = express.Router();


router.post('/auth/onboard', onboard);
router.post('/auth/checkIn', checkIn);

router.post('/caches/checkAnswer', checkAnswer);

router.post('/admin/game', loadGame);

export default router;