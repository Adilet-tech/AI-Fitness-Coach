import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity,
  ScrollView, 
  ActivityIndicator, 
  Alert, 
  Platform,
  Animated,
  Modal
} from 'react-native';
import StorageService from '@/services/storage';

const API_URL = 'https://tumulose-leora-unsynthetically.ngrok-free.dev';

const GOALS = [
  { label: '🔥 Похудеть', value: 'похудеть' },
  { label: '💪 Набрать мышечную массу', value: 'набрать мышечную массу' },
  { label: '⚖️ Поддержать форму', value: 'поддержать форму' },
  { label: '🏃 Увеличить выносливость', value: 'увеличить выносливость' },
];

const ACTIVITY_LEVELS = [
  { label: '🛋️ Сидячий образ жизни', value: 'сидячий' },
  { label: '🚶 Легкая активность (1-2 раза в неделю)', value: 'легкая активность' },
  { label: '🏃 Средняя активность (3-4 раза в неделю)', value: 'средняя активность' },
  { label: '🏋️ Высокая активность (5-7 раз в неделю)', value: 'высокая активность' },
];

export default function App() {
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [goal, setGoal] = useState('');
  const [activityLevel, setActivityLevel] = useState('');
  const [recommendation, setRecommendation] = useState('');
  const [loading, setLoading] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  
  const [showGoalPicker, setShowGoalPicker] = useState(false);
  const [showActivityPicker, setShowActivityPicker] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  useEffect(() => {
    if (recommendation) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }
  }, [recommendation]);

  const loadProfile = async () => {
    const profile = await StorageService.loadProfile();
    if (profile) {
      setAge(profile.age.toString());
      setWeight(profile.weight.toString());
      setHeight(profile.height.toString());
      setGoal(profile.goal);
      setActivityLevel(profile.activityLevel);
      setProfileLoaded(true);
    }
  };

  const clearProfile = () => {
    Alert.alert(
      'Очистить профиль?',
      'Все сохраненные данные будут удалены',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Очистить',
          style: 'destructive',
          onPress: async () => {
            const success = await StorageService.deleteProfile();
            if (success) {
              setAge('');
              setWeight('');
              setHeight('');
              setGoal('');
              setActivityLevel('');
              setRecommendation('');
              setProfileLoaded(false);
              Alert.alert('Успех', 'Профиль очищен');
            }
          },
        },
      ]
    );
  };

  const handleGenerate = async () => {
    if (!age || !weight || !height || !goal || !activityLevel) {
      Alert.alert('Ошибка', 'Пожалуйста, заполните все поля');
      return;
    }

    const ageNum = parseInt(age);
    const weightNum = parseFloat(weight);
    const heightNum = parseInt(height);

    if (ageNum < 10 || ageNum > 120) {
      Alert.alert('Ошибка', 'Возраст должен быть от 10 до 120 лет');
      return;
    }

    if (weightNum < 30 || weightNum > 300) {
      Alert.alert('Ошибка', 'Вес должен быть от 30 до 300 кг');
      return;
    }

    if (heightNum < 100 || heightNum > 250) {
      Alert.alert('Ошибка', 'Рост должен быть от 100 до 250 см');
      return;
    }

    setLoading(true);
    setRecommendation('');
    fadeAnim.setValue(0);

    try {
      const response = await fetch(`${API_URL}/generate-recommendation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          age: ageNum,
          weight: weightNum,
          height: heightNum,
          goal: goal,
          activity_level: activityLevel,
        }),
      });

      const data = await response.json();

      if (response.ok && data.recommendation) {
        setRecommendation(data.recommendation);
        
        const profileData = {
          age: ageNum,
          weight: weightNum,
          height: heightNum,
          goal: goal,
          activityLevel: activityLevel,
        };

        const saved = await StorageService.saveProfile(profileData);
        await StorageService.saveRecommendation(data.recommendation, {
          ...profileData,
          lastUpdated: new Date().toISOString(),
        });
        
        if (saved && !profileLoaded) {
          setProfileLoaded(true);
        }
        
      } else {
        Alert.alert('Ошибка сервера', data.error || 'Произошла неизвестная ошибка');
      }

    } catch (error) {
      console.error(error);
      Alert.alert('Ошибка сети', 'Не удалось подключиться к серверу');
    } finally {
      setLoading(false);
    }
  };

  const parseRecommendation = (text: string) => {
    const sections = text.split('###').filter(s => s.trim());
    return sections.map(section => {
      const lines = section.trim().split('\n');
      const title = lines[0].trim();
      const content = lines.slice(1).join('\n').trim();
      
      let emoji = '📝';
      if (title.includes('Питание') || title.includes('питание')) emoji = '🍽️';
      if (title.includes('Тренировк') || title.includes('тренировк')) emoji = '💪';
      if (title.includes('Сон') || title.includes('сон')) emoji = '😴';
      if (title.includes('Важно') || title.includes('важно')) emoji = '⚠️';
      
      return { emoji, title, content };
    });
  };

  const getGoalLabel = (value: string) => {
    const goal = GOALS.find(g => g.value === value);
    return goal ? goal.label : value;
  };

  const getActivityLabel = (value: string) => {
    const activity = ACTIVITY_LEVELS.find(a => a.value === value);
    return activity ? activity.label : value;
  };

  const parsedSections = recommendation ? parseRecommendation(recommendation) : [];

  return (
    <ScrollView 
      style={styles.scrollView}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerEmoji}>🤖</Text>
        <Text style={styles.headerTitle}>AI Fitness Coach</Text>
        <Text style={styles.headerSubtitle}>Ваш персональный тренер</Text>
      </View>

      {/* Profile Badge */}
      {profileLoaded && (
        <View style={styles.savedBadge}>
          <Text style={styles.savedBadgeText}>✓ Профиль сохранен</Text>
        </View>
      )}

      {/* Form Card */}
      <View style={styles.formCard}>
        <Text style={styles.formTitle}>Ваши данные</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>👤 Возраст</Text>
          <TextInput 
            placeholder="Например: 25" 
            style={styles.input} 
            value={age} 
            onChangeText={setAge} 
            keyboardType="numeric"
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>⚖️ Вес (кг)</Text>
          <TextInput 
            placeholder="Например: 70" 
            style={styles.input} 
            value={weight} 
            onChangeText={setWeight} 
            keyboardType="numeric"
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>📏 Рост (см)</Text>
          <TextInput 
            placeholder="Например: 175" 
            style={styles.input} 
            value={height} 
            onChangeText={setHeight} 
            keyboardType="numeric"
            placeholderTextColor="#999"
          />
        </View>

        {/* Goal Picker */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>🎯 Цель</Text>
          <TouchableOpacity 
            style={styles.pickerButton}
            onPress={() => setShowGoalPicker(true)}
          >
            <Text style={[styles.pickerButtonText, !goal && styles.pickerPlaceholder]}>
              {goal ? getGoalLabel(goal) : 'Выберите цель'}
            </Text>
            <Text style={styles.pickerArrow}>▼</Text>
          </TouchableOpacity>
        </View>

        {/* Activity Level Picker */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>🏃 Уровень активности</Text>
          <TouchableOpacity 
            style={styles.pickerButton}
            onPress={() => setShowActivityPicker(true)}
          >
            <Text style={[styles.pickerButtonText, !activityLevel && styles.pickerPlaceholder]}>
              {activityLevel ? getActivityLabel(activityLevel) : 'Выберите уровень'}
            </Text>
            <Text style={styles.pickerArrow}>▼</Text>
          </TouchableOpacity>
        </View>

        {/* Generate Button */}
        <TouchableOpacity 
          style={[styles.generateButton, loading && styles.buttonDisabled]} 
          onPress={handleGenerate}
          disabled={loading}
          activeOpacity={0.8}
        >
          <Text style={styles.generateButtonText}>
            {loading ? "⏳ Генерация плана..." : "✨ Получить план"}
          </Text>
        </TouchableOpacity>

        {/* Clear Button */}
        {profileLoaded && (
          <TouchableOpacity 
            style={styles.clearButton} 
            onPress={clearProfile}
            activeOpacity={0.7}
          >
            <Text style={styles.clearButtonText}>🗑️ Очистить данные</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Loading */}
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>AI анализирует ваши данные...</Text>
        </View>
      )}

      {/* Results */}
      {recommendation && !loading && (
        <Animated.View style={[styles.resultsContainer, { opacity: fadeAnim }]}>
          <View style={styles.resultsHeader}>
            <Text style={styles.resultsTitle}>🎉 Ваш персональный план</Text>
            <Text style={styles.resultsSubtitle}>
              Создан специально для вас
            </Text>
          </View>

          {parsedSections.map((section, index) => (
            <View key={index} style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionEmoji}>{section.emoji}</Text>
                <Text style={styles.sectionTitle}>{section.title}</Text>
              </View>
              <Text style={styles.sectionContent}>{section.content}</Text>
            </View>
          ))}
        </Animated.View>
      )}

      {/* Goal Picker Modal */}
      <Modal
        visible={showGoalPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowGoalPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Выберите цель</Text>
              <TouchableOpacity onPress={() => setShowGoalPicker(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            
            {GOALS.map((item) => (
              <TouchableOpacity
                key={item.value}
                style={[
                  styles.modalOption,
                  goal === item.value && styles.modalOptionSelected
                ]}
                onPress={() => {
                  setGoal(item.value);
                  setShowGoalPicker(false);
                }}
              >
                <Text style={[
                  styles.modalOptionText,
                  goal === item.value && styles.modalOptionTextSelected
                ]}>
                  {item.label}
                </Text>
                {goal === item.value && (
                  <Text style={styles.modalCheckmark}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      {/* Activity Picker Modal */}
      <Modal
        visible={showActivityPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowActivityPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Выберите уровень активности</Text>
              <TouchableOpacity onPress={() => setShowActivityPicker(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            
            {ACTIVITY_LEVELS.map((item) => (
              <TouchableOpacity
                key={item.value}
                style={[
                  styles.modalOption,
                  activityLevel === item.value && styles.modalOptionSelected
                ]}
                onPress={() => {
                  setActivityLevel(item.value);
                  setShowActivityPicker(false);
                }}
              >
                <Text style={[
                  styles.modalOptionText,
                  activityLevel === item.value && styles.modalOptionTextSelected
                ]}>
                  {item.label}
                </Text>
                {activityLevel === item.value && (
                  <Text style={styles.modalCheckmark}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      {/* Bottom Spacing */}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  container: {
    padding: 20,
    paddingTop: Platform.OS === 'android' ? 50 : 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  headerEmoji: {
    fontSize: 60,
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
  },
  savedBadge: {
    backgroundColor: '#34C759',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignSelf: 'center',
    marginBottom: 20,
    shadowColor: '#34C759',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  savedBadgeText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  formCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 20,
  },
  formTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    fontSize: 16,
    color: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  pickerButton: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickerButtonText: {
    fontSize: 16,
    color: '#1A1A1A',
  },
  pickerPlaceholder: {
    color: '#999',
  },
  pickerArrow: {
    fontSize: 12,
    color: '#999',
  },
  generateButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    backgroundColor: '#CCC',
    shadowOpacity: 0,
  },
  generateButtonText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '700',
  },
  clearButton: {
    backgroundColor: '#FF3B30',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  clearButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '600',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  resultsContainer: {
    marginTop: 10,
  },
  resultsHeader: {
    alignItems: 'center',
    marginBottom: 25,
    paddingHorizontal: 20,
  },
  resultsTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 8,
    textAlign: 'center',
  },
  resultsSubtitle: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
  },
  sectionCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#F0F0F0',
  },
  sectionEmoji: {
    fontSize: 28,
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
    flex: 1,
  },
  sectionContent: {
    fontSize: 16,
    lineHeight: 26,
    color: '#333',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  modalClose: {
    fontSize: 24,
    color: '#999',
    paddingHorizontal: 10,
  },
  modalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalOptionSelected: {
    backgroundColor: '#F0F7FF',
  },
  modalOptionText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  modalOptionTextSelected: {
    color: '#007AFF',
    fontWeight: '600',
  },
  modalCheckmark: {
    fontSize: 18,
    color: '#007AFF',
    fontWeight: 'bold',
  },
});