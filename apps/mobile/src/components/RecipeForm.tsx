import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useCreateRecipe } from '../hooks/use-recipes';

interface IngredientRow {
  quantity: string;
  unit: string;
  ingredient: string;
}

export function RecipeForm() {
  const router = useRouter();
  const createRecipe = useCreateRecipe();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [servings, setServings] = useState('4');
  const [prepTime, setPrepTime] = useState('');
  const [cookTime, setCookTime] = useState('');
  const [tags, setTags] = useState('');
  const [ingredients, setIngredients] = useState<IngredientRow[]>([
    { quantity: '', unit: '', ingredient: '' },
  ]);
  const [steps, setSteps] = useState(['']);

  const updateIngredient = (index: number, field: keyof IngredientRow, value: string) => {
    setIngredients((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    );
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Title is required');
      return;
    }

    const validIngredients = ingredients.filter((ing) => ing.ingredient.trim());
    const validSteps = steps.filter((s) => s.trim());

    if (validIngredients.length === 0) {
      Alert.alert('Error', 'At least one ingredient is required');
      return;
    }
    if (validSteps.length === 0) {
      Alert.alert('Error', 'At least one step is required');
      return;
    }

    try {
      await createRecipe.mutateAsync({
        title: title.trim(),
        description: description.trim() || undefined,
        servings: parseInt(servings) || 4,
        prepTimeMinutes: prepTime ? parseInt(prepTime) : undefined,
        cookTimeMinutes: cookTime ? parseInt(cookTime) : undefined,
        ingredients: validIngredients.map((ing) => ({
          quantity: parseFloat(ing.quantity) || 1,
          unit: ing.unit.trim() || 'piece',
          ingredient: ing.ingredient.trim(),
          displayText: `${ing.quantity} ${ing.unit} ${ing.ingredient}`.trim(),
          attributes: null,
          brandCandidate: null,
          category: null,
          ingredientCatalogId: null,
        })),
        steps: validSteps.map((instruction, i) => ({
          stepNumber: i + 1,
          instruction: instruction.trim(),
        })),
        tags: tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
      });
      router.back();
    } catch {
      Alert.alert('Error', 'Failed to create recipe');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.label}>Title</Text>
      <TextInput
        style={styles.input}
        value={title}
        onChangeText={setTitle}
        placeholder="e.g., Chicken Tikka Masala"
      />

      <Text style={styles.label}>Description</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={description}
        onChangeText={setDescription}
        placeholder="Optional description"
        multiline
      />

      <View style={styles.row}>
        <View style={styles.flex1}>
          <Text style={styles.label}>Servings</Text>
          <TextInput
            style={styles.input}
            value={servings}
            onChangeText={setServings}
            keyboardType="number-pad"
          />
        </View>
        <View style={styles.flex1}>
          <Text style={styles.label}>Prep (min)</Text>
          <TextInput
            style={styles.input}
            value={prepTime}
            onChangeText={setPrepTime}
            keyboardType="number-pad"
          />
        </View>
        <View style={styles.flex1}>
          <Text style={styles.label}>Cook (min)</Text>
          <TextInput
            style={styles.input}
            value={cookTime}
            onChangeText={setCookTime}
            keyboardType="number-pad"
          />
        </View>
      </View>

      <Text style={styles.sectionTitle}>Ingredients</Text>
      {ingredients.map((ing, i) => (
        <View key={i} style={styles.ingredientRow}>
          <TextInput
            style={[styles.input, styles.qtyInput]}
            value={ing.quantity}
            onChangeText={(v) => updateIngredient(i, 'quantity', v)}
            placeholder="Qty"
            keyboardType="decimal-pad"
          />
          <TextInput
            style={[styles.input, styles.unitInput]}
            value={ing.unit}
            onChangeText={(v) => updateIngredient(i, 'unit', v)}
            placeholder="Unit"
          />
          <TextInput
            style={[styles.input, styles.flex1]}
            value={ing.ingredient}
            onChangeText={(v) => updateIngredient(i, 'ingredient', v)}
            placeholder="Ingredient"
          />
          {ingredients.length > 1 && (
            <TouchableOpacity
              onPress={() => setIngredients((prev) => prev.filter((_, j) => j !== i))}
              style={styles.removeButton}
            >
              <Text style={styles.removeText}>x</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}
      <TouchableOpacity
        onPress={() => setIngredients((prev) => [...prev, { quantity: '', unit: '', ingredient: '' }])}
        style={styles.addRowButton}
      >
        <Text style={styles.addRowText}>+ Add Ingredient</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Steps</Text>
      {steps.map((step, i) => (
        <View key={i} style={styles.stepRow}>
          <View style={styles.stepNum}>
            <Text style={styles.stepNumText}>{i + 1}</Text>
          </View>
          <TextInput
            style={[styles.input, styles.textArea, styles.flex1]}
            value={step}
            onChangeText={(v) => setSteps((prev) => prev.map((s, j) => (j === i ? v : s)))}
            placeholder={`Step ${i + 1}`}
            multiline
          />
          {steps.length > 1 && (
            <TouchableOpacity
              onPress={() => setSteps((prev) => prev.filter((_, j) => j !== i))}
              style={styles.removeButton}
            >
              <Text style={styles.removeText}>x</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}
      <TouchableOpacity
        onPress={() => setSteps((prev) => [...prev, ''])}
        style={styles.addRowButton}
      >
        <Text style={styles.addRowText}>+ Add Step</Text>
      </TouchableOpacity>

      <Text style={styles.label}>Tags (comma-separated)</Text>
      <TextInput
        style={styles.input}
        value={tags}
        onChangeText={setTags}
        placeholder="e.g., dinner, chicken, indian"
      />

      <TouchableOpacity
        onPress={handleSubmit}
        style={styles.submitButton}
        disabled={createRecipe.isPending}
      >
        <Text style={styles.submitText}>
          {createRecipe.isPending ? 'Creating...' : 'Create Recipe'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 4,
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111',
    marginTop: 24,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#111',
    backgroundColor: '#fff',
  },
  textArea: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  flex1: {
    flex: 1,
  },
  ingredientRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 6,
    alignItems: 'center',
  },
  qtyInput: {
    width: 55,
  },
  unitInput: {
    width: 65,
  },
  stepRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  stepNum: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  stepNumText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#15803d',
  },
  removeButton: {
    padding: 8,
  },
  removeText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '600',
  },
  addRowButton: {
    paddingVertical: 8,
  },
  addRowText: {
    color: '#16a34a',
    fontSize: 14,
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: '#16a34a',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 32,
  },
  submitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
