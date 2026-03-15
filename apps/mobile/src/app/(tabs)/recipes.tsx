import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useRecipes } from '../../hooks/use-recipes';
import { useCartStore } from '../../stores/cart-store';
import { RecipeListItem } from '../../components/RecipeListItem';
import { FloatingActionButton } from '../../components/FloatingActionButton';
import { apiFetch } from '../../lib/api';

export default function RecipesScreen() {
  const router = useRouter();
  const { data, isLoading, error, refetch } = useRecipes();
  const addRecipe = useCartStore((s) => s.addRecipe);
  const isRecipeInCart = useCartStore((s) => s.isRecipeInCart);
  const cartCount = useCartStore((s) => s.items.length);

  const handleAddToCart = async (recipeId: string) => {
    try {
      const details = await apiFetch<{
        id: string;
        title: string;
        ingredients: Array<{
          quantity: number;
          unit: string;
          ingredient: string;
          displayText: string;
          category: string | null;
        }>;
      }>(`/recipes/${recipeId}`);

      addRecipe({
        id: details.id,
        title: details.title,
        ingredients: details.ingredients.map((ing) => ({
          ...ing,
          category: ing.category as any,
        })),
      });
    } catch {
      // Silently fail
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Recipes</Text>
        <TouchableOpacity
          onPress={() => router.push('/cart')}
          style={styles.cartButton}
        >
          <Text style={styles.cartIcon}>🛒</Text>
          {cartCount > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cartCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {isLoading && (
        <View style={styles.center}>
          <Text style={styles.loadingText}>Loading recipes...</Text>
        </View>
      )}

      {error && (
        <View style={styles.center}>
          <Text style={styles.errorText}>Failed to load recipes</Text>
          <TouchableOpacity onPress={() => refetch()} style={styles.retryButton}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {data && data.data.length === 0 && (
        <View style={styles.center}>
          <Text style={styles.emptyTitle}>No recipes yet</Text>
          <Text style={styles.emptySubtitle}>Tap + to add your first recipe</Text>
        </View>
      )}

      {data && data.data.length > 0 && (
        <FlatList
          data={data.data}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <RecipeListItem
              recipe={item}
              onPress={() => router.push(`/recipe/${item.id}`)}
              onAddToCart={() => handleAddToCart(item.id)}
              isInCart={isRecipeInCart(item.id)}
            />
          )}
          contentContainerStyle={styles.list}
        />
      )}

      <FloatingActionButton onPress={() => router.push('/recipe/new')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111',
  },
  cartButton: {
    padding: 8,
    position: 'relative',
  },
  cartIcon: {
    fontSize: 24,
  },
  cartBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#16a34a',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  cartBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#999',
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    marginBottom: 12,
  },
  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#16a34a',
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontWeight: '600',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#999',
  },
  list: {
    paddingVertical: 8,
  },
});
