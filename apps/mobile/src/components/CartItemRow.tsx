import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { CartItem } from '../stores/cart-store';

interface CartItemRowProps {
  item: CartItem;
  onRemove: () => void;
}

export function CartItemRow({ item, onRemove }: CartItemRowProps) {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.name}>{item.ingredientName}</Text>
        <Text style={styles.quantity}>
          {item.quantity} {item.unit}
        </Text>
        {item.sourceRecipeTitles.length > 0 && (
          <Text style={styles.source} numberOfLines={1}>
            From: {item.sourceRecipeTitles.join(', ')}
          </Text>
        )}
      </View>
      <TouchableOpacity onPress={onRemove} style={styles.removeButton}>
        <Text style={styles.removeText}>x</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  content: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: '500',
    color: '#111',
    textTransform: 'capitalize',
  },
  quantity: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  source: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 2,
  },
  removeButton: {
    padding: 8,
  },
  removeText: {
    color: '#ef4444',
    fontSize: 18,
    fontWeight: '600',
  },
});
