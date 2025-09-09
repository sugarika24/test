import express from "express";
import {
  getHelpers,
  getHelperById,
} from "../controllers/helperDiscovery.Controller.js";

const router = express.Router();

router.get("/", getHelpers);
router.get("/:helperId", getHelperById);

export default router;