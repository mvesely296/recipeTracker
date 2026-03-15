import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { RecipeListItem as RecipeListItemType } from '../hooks/use-recipes';

const SOURCE_LABELS: Record<string, string> = {
  manual: 'Manual',
  url: 'Web',
  image: 'Photo',
  youtube: 'YouTube',
  instagram: 'Instagram',
};

interface RecipeListItemProps {
  recipe: RecipeListItemType;
  onPress: () => void;
  onAddToCart: () => void;
  isInCart: boolean;
}

export function RecipeListItem({ recipe, onPress, onAddToCart, isInCart }: RecipeListItemProps) {
  const totalTime = (recipe.prepTimeMinutes ?? 0) + (recipe.cookTimeMinutes ?? 0);

  return (
    <TouchableOpacity onPress={onPress} style={styles.container} activeOpacity={0.7}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={2}>
            {recipe.title}
          </Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {SOURCE_LABELS[recipe.sourceType] || recipe.sourceType}
            </Text>
          </View>
        </View>

        {recipe.description && (
          <Text style={styles.description} numberOfLines={2}>
            {recipe.description}
          </Text>
        )}

        <View style={styles.meta}>
          {totalTime > 0 && <Text style={styles.metaText}>{totalTime} min</Text>}
          <Text style={styles.metaText}>{recipe.servings} servings</Text>
        </View>

        {recipe.tags.length > 0 && (
          <View style={styles.tags}>
            {recipe.tags.slice(0, 3).map((tag) => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        )}

        <TouchableOpacity
          onPress={(e) => {
            e.stopPropagation();
            onAddToCart();
          }}
          style={[styles.cartButton, isInCart && styles.cartButtonDisabled]}
          disabled={isInCart}
        >
          <Text style={[styles.cartButtonText, isInCart && styles.cartButtonTextDisabled]}>
            {isInCart ? 'In Cart' : 'Add to Cart'}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 4,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111',
    flex: 1,
  },
  badge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#15803d',
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  meta: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  metaText: {
    fontSize: 12,
    color: '#999',
  },
  tags: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
  },
  tag: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  tagText: {
    fontSize: 11,
    color: '#6b7280',
  },
  cartButton: {
    backgroundColor: '#16a34a',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  cartButtonDisabled: {
    backgroundColor: '#e5e7eb',
  },
  cartButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  cartButtonTextDisabled: {
    color: '#9ca3af',
  },
});
