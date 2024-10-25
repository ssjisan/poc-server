import express from "express";
const router = express.Router();
// import controller
import {
  createJournal,
  listOfJournal,
  readJournal,
  updateJournal,
  removeJournal,
} from "../controller/journalController.js";

// import middleware
import { requiredSignIn } from "../middlewares/authMiddleware.js";

router.post("/add_journal", requiredSignIn, createJournal);
router.get("/journals", listOfJournal);
router.get("/journal/:journalId", requiredSignIn, readJournal);
router.put("/journal/:journalId", requiredSignIn, updateJournal);
router.delete("/journal/:journalId", removeJournal);

export default router;
