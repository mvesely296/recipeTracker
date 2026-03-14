import { View, Text, StyleSheet } from 'react-native';

export default function MealPlanScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Meal Plan</Text>
      <Text style={styles.subtitle}>Your weekly meal plan will appear here</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
});
