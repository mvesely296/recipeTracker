import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useRecipe } from '../../hooks/use-recipes';
import { useCartStore } from '../../stores/cart-store';

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: recipe, isLoading, error } = useRecipe(id ?? null);
  const addRecipe = useCartStore((s) => s.addRecipe);
  const isInCart = useCartStore((s) => s.isRecipeInCart(id ?? ''));

  const handleAddToCart = () => {
    if (!recipe || isInCart) return;
    addRecipe({
      id: recipe.id,
      title: recipe.title,
      ingredients: recipe.ingredients.map((ing) => ({
        quantity: ing.quantity,
        unit: ing.unit,
        ingredient: ing.ingredient,
        displayText: ing.displayText,
        category: ing.category,
      })),
    });
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <Text style={styles.loadingText}>Loading recipe...</Text>
      </View>
    );
  }

  if (error || !recipe) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Recipe not found</Text>
      </View>
    );
  }

  const totalTime = (recipe.prepTimeMinutes ?? 0) + (recipe.cookTimeMinutes ?? 0);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>{recipe.title}</Text>

        {recipe.description && (
          <Text style={styles.description}>{recipe.description}</Text>
        )}

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Text style={styles.metaValue}>{recipe.servings}</Text>
            <Text style={styles.metaLabel}>Servings</Text>
          </View>
          {recipe.prepTimeMinutes != null && recipe.prepTimeMinutes > 0 && (
            <View style={styles.metaItem}>
              <Text style={styles.metaValue}>{recipe.prepTimeMinutes}</Text>
              <Text style={styles.metaLabel}>Prep (min)</Text>
            </View>
          )}
          {recipe.cookTimeMinutes != null && recipe.cookTimeMinutes > 0 && (
            <View style={styles.metaItem}>
              <Text style={styles.metaValue}>{recipe.cookTimeMinutes}</Text>
              <Text style={styles.metaLabel}>Cook (min)</Text>
            </View>
          )}
          {totalTime > 0 && (
            <View style={styles.metaItem}>
              <Text style={styles.metaValue}>{totalTime}</Text>
              <Text style={styles.metaLabel}>Total (min)</Text>
            </View>
          )}
        </View>

        {recipe.tags.length > 0 && (
          <View style={styles.tags}>
            {recipe.tags.map((tag) => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        )}

        <Text style={styles.sectionTitle}>Ingredients</Text>
        {recipe.ingredients.map((ing, i) => (
          <View key={ing.id || i} style={styles.ingredientRow}>
            <View style={styles.dot} />
            <Text style={styles.ingredientText}>{ing.displayText}</Text>
          </View>
        ))}

        <Text style={styles.sectionTitle}>Steps</Text>
        {recipe.steps.map((step, i) => (
          <View key={step.id || i} style={styles.stepRow}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>{step.stepNumber}</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepText}>{step.instruction}</Text>
              {step.durationMinutes != null && step.durationMinutes > 0 && (
                <Text style={styles.stepDuration}>{step.durationMinutes} min</Text>
              )}
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          onPress={handleAddToCart}
          style={[styles.addButton, isInCart && styles.addButtonDisabled]}
          disabled={isInCart}
        >
          <Text style={[styles.addButtonText, isInCart && styles.addButtonTextDisabled]}>
            {isInCart ? 'Already in Cart' : 'Add to Cart'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#999',
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#111',
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    color: '#666',
    marginBottom: 16,
    lineHeight: 22,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#f3f4f6',
  },
  metaItem: {
    alignItems: 'center',
  },
  metaValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#16a34a',
  },
  metaLabel: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 20,
  },
  tag: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 12,
    color: '#6b7280',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111',
    marginTop: 24,
    marginBottom: 12,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16a34a',
    marginTop: 7,
  },
  ingredientText: {
    fontSize: 15,
    color: '#374151',
    flex: 1,
  },
  stepRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#15803d',
  },
  stepContent: {
    flex: 1,
  },
  stepText: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
  },
  stepDuration: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 32,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  addButton: {
    backgroundColor: '#16a34a',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  addButtonDisabled: {
    backgroundColor: '#e5e7eb',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  addButtonTextDisabled: {
    color: '#9ca3af',
  },
});
