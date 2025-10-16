// App.js в папке frontend

import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, Button, ScrollView, ActivityIndicator, Alert, Platform } from 'react-native';

// --- ВАЖНО! ЗАМЕНИТЕ ЭТОТ АДРЕС НА ВАШ URL ОТ NGROK ---
const API_URL = 'https://tumulose-leora-unsynthetically.ngrok-free.dev' 

export default function App() {
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [goal, setGoal] = useState('');
  const [activityLevel, setActivityLevel] = useState('');
  const [recommendation, setRecommendation] = useState('');
  const [loading, setLoading] = useState(false);
  
  const handleGenerate = async () => {
    if (!age || !weight || !height || !goal || !activityLevel) {
      Alert.alert('Ошибка', 'Пожалуйста, заполните все поля');
      return;
    }

    setLoading(true);
    setRecommendation('');

    try {
      const response = await fetch(`${API_URL}/generate-recommendation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          age: parseInt(age),
          weight: parseFloat(weight),
          height: parseInt(height),
          goal: goal,
          activity_level: activityLevel,
        }),
      });

      const data = await response.json();

      if (response.ok && data.recommendation) {
        setRecommendation(data.recommendation);
      } else {
        Alert.alert('Ошибка сервера', data.error || 'Произошла неизвестная ошибка');
      }

    } catch (error) {
      console.error(error);
      Alert.alert('Ошибка сети', 'Не удалось подключиться к серверу. Убедитесь, что ngrok запущен и URL верный.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>🤖 AI Fitness Coach</Text>
      
      <TextInput placeholder="Возраст (лет)" style={styles.input} value={age} onChangeText={setAge} keyboardType="numeric" />
      <TextInput placeholder="Вес (кг)" style={styles.input} value={weight} onChangeText={setWeight} keyboardType="numeric" />
      <TextInput placeholder="Рост (см)" style={styles.input} value={height} onChangeText={setHeight} keyboardType="numeric" />
      <TextInput placeholder="Ваша цель (например, похудеть)" style={styles.input} value={goal} onChangeText={setGoal} />
      <TextInput placeholder="Уровень активности (сидячий, активный)" style={styles.input} value={activityLevel} onChangeText={setActivityLevel} />

      <Button title={loading ? "Генерация..." : "Получить рекомендацию"} onPress={handleGenerate} disabled={loading} />

      {loading && <ActivityIndicator size="large" color="#007AFF" style={styles.loader} />}
      
      {recommendation && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultTitle}>Ваш персональный план:</Text>
          <Text style={styles.resultText}>{recommendation}</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingTop: Platform.OS === 'android' ? 40 : 60,
    backgroundColor: '#f5f5f5',
    flexGrow: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#333',
  },
  input: {
    backgroundColor: 'white',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  loader: {
    marginTop: 20,
  },
  resultContainer: {
    marginTop: 30,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  resultText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#555',
  },
});