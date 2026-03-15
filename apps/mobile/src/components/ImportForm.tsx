import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useImportRecipe, useIngestionJob } from '../hooks/use-recipes';

function detectSourceType(url: string): 'youtube' | 'url' {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace('www.', '');
    if (host === 'youtube.com' || host === 'youtu.be') return 'youtube';
  } catch {
    // Not a valid URL yet
  }
  return 'url';
}

export function ImportForm() {
  const router = useRouter();
  const importRecipe = useImportRecipe();
  const [url, setUrl] = useState('');
  const [jobId, setJobId] = useState<string | null>(null);

  const { data: job } = useIngestionJob(jobId);
  const sourceType = detectSourceType(url);

  useEffect(() => {
    if (job?.status === 'completed' && job.recipeId) {
      router.replace(`/recipe/${job.recipeId}`);
    }
    if (job?.status === 'failed') {
      Alert.alert('Import Failed', job.errorMessage || 'Could not import recipe');
      setJobId(null);
    }
  }, [job?.status, job?.recipeId, job?.errorMessage, router]);

  const handleSubmit = async () => {
    if (!url.trim()) {
      Alert.alert('Error', 'URL is required');
      return;
    }

    try {
      new URL(url);
    } catch {
      Alert.alert('Error', 'Please enter a valid URL');
      return;
    }

    try {
      const result = await importRecipe.mutateAsync({
        sourceType,
        sourceUrl: url.trim(),
      });
      setJobId(result.jobId);
    } catch {
      Alert.alert('Error', 'Failed to start import');
    }
  };

  if (jobId && job && (job.status === 'pending' || job.status === 'processing')) {
    return (
      <View style={styles.pollingContainer}>
        <ActivityIndicator size="large" color="#16a34a" />
        <Text style={styles.pollingText}>
          {job.status === 'pending' ? 'Queued for processing...' : 'Extracting recipe...'}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Recipe URL</Text>
      <TextInput
        style={styles.input}
        value={url}
        onChangeText={setUrl}
        placeholder="https://example.com/recipe or YouTube URL"
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="url"
      />
      {url.length > 0 && (
        <Text style={styles.detected}>
          Detected: {sourceType === 'youtube' ? 'YouTube Video' : 'Website'}
        </Text>
      )}

      <TouchableOpacity
        onPress={handleSubmit}
        style={styles.submitButton}
        disabled={importRecipe.isPending}
      >
        <Text style={styles.submitText}>
          {importRecipe.isPending ? 'Starting...' : 'Import Recipe'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#111',
  },
  detected: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  submitButton: {
    backgroundColor: '#16a34a',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 24,
  },
  submitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  pollingContainer: {
    padding: 40,
    alignItems: 'center',
    gap: 16,
  },
  pollingText: {
    fontSize: 15,
    color: '#6b7280',
  },
});
