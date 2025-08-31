import express from "express";
import {
  getAllCategories,
  getCategoryById,
} from "../controllers/category.Controller.js";
import { getSubcategoriesByCategory } from "../controllers/subcategory.Controller.js";

const router = express.Router();

router.get("/", getAllCategories);
router.get("/:id", getCategoryById);
router.get("/:id/subcategories", getSubcategoriesByCategory);

export default router;