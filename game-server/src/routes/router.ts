import express from "express";
import {checkAnswer} from "../controllers/caches";

const router = express.Router();

router.post('/caches/checkAnswer', checkAnswer);

export default router;