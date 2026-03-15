import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { RecipeForm } from '../../components/RecipeForm';
import { ImportForm } from '../../components/ImportForm';

export default function NewRecipeScreen() {
  const [tab, setTab] = useState<'manual' | 'import'>('manual');

  return (
    <View style={styles.container}>
      <View style={styles.tabs}>
        <TouchableOpacity
          onPress={() => setTab('manual')}
          style={[styles.tab, tab === 'manual' && styles.tabActive]}
        >
          <Text style={[styles.tabText, tab === 'manual' && styles.tabTextActive]}>
            Enter Manually
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setTab('import')}
          style={[styles.tab, tab === 'import' && styles.tabActive]}
        >
          <Text style={[styles.tabText, tab === 'import' && styles.tabTextActive]}>
            Import from URL
          </Text>
        </TouchableOpacity>
      </View>

      {tab === 'manual' ? <RecipeForm /> : <ImportForm />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#16a34a',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  tabTextActive: {
    color: '#16a34a',
  },
});
