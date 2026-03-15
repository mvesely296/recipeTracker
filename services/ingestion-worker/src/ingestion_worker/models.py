"""Pydantic models for recipe extraction pipeline."""

from enum import Enum

from pydantic import BaseModel, Field


class IngredientCategory(str, Enum):
    """Ingredient categories matching the database schema."""

    PRODUCE = "produce"
    MEAT = "meat"
    SEAFOOD = "seafood"
    DAIRY = "dairy"
    BAKERY = "bakery"
    FROZEN = "frozen"
    CANNED_GOODS = "canned_goods"
    DRY_GOODS = "dry_goods"
    SPICES = "spices"
    CONDIMENTS = "condiments"
    BEVERAGES = "beverages"
    SNACKS = "snacks"
    OTHER = "other"


class ExtractedIngredient(BaseModel):
    """A single ingredient extracted from a recipe."""

    quantity: float | None = Field(default=0, description="Numeric quantity, e.g. 1.5")
    unit: str | None = Field(default="to taste", description="Unit of measurement, e.g. 'cup', 'tbsp', 'whole'")
    ingredient: str = Field(description="Base ingredient name, e.g. 'tomatoes'")
    attributes: str | None = Field(
        default=None, description="Modifiers like 'diced', 'whole peeled'"
    )
    brand_candidate: str | None = Field(
        default=None, description="Brand if mentioned, e.g. 'San Marzano'"
    )
    category: IngredientCategory = Field(
        default=IngredientCategory.OTHER, description="Grocery aisle category"
    )
    display_text: str = Field(description="Original display text, e.g. '1 can San Marzano tomatoes'")


class ExtractedStep(BaseModel):
    """A single recipe step."""

    step_number: int = Field(description="1-based step number")
    instruction: str = Field(description="Step instruction text")
    duration_minutes: int | None = Field(
        default=None, description="Estimated duration in minutes"
    )


class ExtractedRecipe(BaseModel):
    """Complete extracted recipe ready for database insertion."""

    title: str = Field(description="Recipe title")
    description: str | None = Field(default=None, description="Short recipe description")
    servings: int = Field(default=4, description="Number of servings")
    prep_time_minutes: int | None = Field(default=None, description="Prep time in minutes")
    cook_time_minutes: int | None = Field(default=None, description="Cook time in minutes")
    ingredients: list[ExtractedIngredient] = Field(description="List of ingredients")
    steps: list[ExtractedStep] = Field(description="List of recipe steps")
    tags: list[str] = Field(
        default_factory=list,
        description="Tags: cuisine, meal type, dietary info, cooking method",
    )
    confidence_score: float = Field(
        default=0.5, description="Confidence in extraction accuracy (0.0-1.0)"
    )
