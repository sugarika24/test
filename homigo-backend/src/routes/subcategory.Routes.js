import express from "express";
import {
  getSubcategoryById,
  searchSubcategories,
  getPopularSubcategories,
} from "../controllers/subcategory.Controller.js";

const router = express.Router();

router.get("/search", searchSubcategories);
router.get("/popular", getPopularSubcategories);
router.get("/:id", getSubcategoryById);

export default router;