import { PetCategory } from "@/types/pet.types";
import React from "react";
import type { ToolComponent } from "../tool-component";
import { FoodPlantToxicityView } from "./FoodPlantToxicityTool";

/**
 * Cat "plants" quick-access — reuses the cross-species toxicity view,
 * pre-filtered to cats (picker hidden). No duplicated logic; the cat-specific
 * indoor-plant entries live in the care-knowledge toxicity dataset.
 */
const CatPlantToxicityTool: ToolComponent<"cat-plant-toxicity"> = () => (
  <FoodPlantToxicityView
    defaultCategory={PetCategory.MAMMAL_CAT}
    showCategoryPicker={false}
  />
);

export default CatPlantToxicityTool;
