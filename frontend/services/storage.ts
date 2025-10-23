import AsyncStorage from '@react-native-async-storage/async-storage';

// Ключи для хранения
const STORAGE_KEYS = {
  USER_PROFILE: '@fitness_user_profile',
  RECOMMENDATIONS_HISTORY: '@fitness_recommendations_history',
};

// Типы данных
export interface UserProfile {
  age: number;
  weight: number;
  height: number;
  goal: string;
  activityLevel: string;
  lastUpdated: string;
}

export interface RecommendationHistory {
  id: string;
  recommendation: string;
  profile: UserProfile;
  createdAt: string;
}

/**
 * Сервис для работы с локальным хранилищем
 */
class StorageService {
  
  /**
   * Сохранить профиль пользователя
   */
  async saveProfile(profile: Omit<UserProfile, 'lastUpdated'>): Promise<boolean> {
    try {
      const fullProfile: UserProfile = {
        ...profile,
        lastUpdated: new Date().toISOString(),
      };

      await AsyncStorage.setItem(
        STORAGE_KEYS.USER_PROFILE,
        JSON.stringify(fullProfile)
      );

      console.log('✅ Профиль сохранен:', fullProfile);
      return true;
    } catch (error) {
      console.error('❌ Ошибка сохранения профиля:', error);
      return false;
    }
  }

  /**
   * Загрузить профиль пользователя
   */
  async loadProfile(): Promise<UserProfile | null> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.USER_PROFILE);
      
      if (data !== null) {
        const profile = JSON.parse(data) as UserProfile;
        console.log('✅ Профиль загружен:', profile);
        return profile;
      }
      
      console.log('ℹ️ Профиль не найден');
      return null;
    } catch (error) {
      console.error('❌ Ошибка загрузки профиля:', error);
      return null;
    }
  }

  /**
   * Удалить профиль пользователя
   */
  async deleteProfile(): Promise<boolean> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.USER_PROFILE);
      console.log('✅ Профиль удален');
      return true;
    } catch (error) {
      console.error('❌ Ошибка удаления профиля:', error);
      return false;
    }
  }

  /**
   * Сохранить рекомендацию в историю
   */
  async saveRecommendation(
    recommendation: string,
    profile: UserProfile
  ): Promise<boolean> {
    try {
      // Загружаем текущую историю
      const history = await this.loadRecommendationsHistory();
      
      // Создаем новую запись
      const newRecord: RecommendationHistory = {
        id: Date.now().toString(),
        recommendation,
        profile,
        createdAt: new Date().toISOString(),
      };

      // Добавляем в начало массива (новые записи сверху)
      const updatedHistory = [newRecord, ...history];

      // Ограничиваем историю последними 20 записями
      const limitedHistory = updatedHistory.slice(0, 20);

      await AsyncStorage.setItem(
        STORAGE_KEYS.RECOMMENDATIONS_HISTORY,
        JSON.stringify(limitedHistory)
      );

      console.log('✅ Рекомендация сохранена в историю');
      return true;
    } catch (error) {
      console.error('❌ Ошибка сохранения рекомендации:', error);
      return false;
    }
  }

  /**
   * Загрузить историю рекомендаций
   */
  async loadRecommendationsHistory(): Promise<RecommendationHistory[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.RECOMMENDATIONS_HISTORY);
      
      if (data !== null) {
        const history = JSON.parse(data) as RecommendationHistory[];
        console.log(`✅ Загружено ${history.length} рекомендаций из истории`);
        return history;
      }
      
      return [];
    } catch (error) {
      console.error('❌ Ошибка загрузки истории:', error);
      return [];
    }
  }

  /**
   * Удалить одну рекомендацию из истории
   */
  async deleteRecommendation(id: string): Promise<boolean> {
    try {
      const history = await this.loadRecommendationsHistory();
      const updatedHistory = history.filter(item => item.id !== id);

      await AsyncStorage.setItem(
        STORAGE_KEYS.RECOMMENDATIONS_HISTORY,
        JSON.stringify(updatedHistory)
      );

      console.log('✅ Рекомендация удалена из истории');
      return true;
    } catch (error) {
      console.error('❌ Ошибка удаления рекомендации:', error);
      return false;
    }
  }

  /**
   * Очистить всю историю рекомендаций
   */
  async clearRecommendationsHistory(): Promise<boolean> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.RECOMMENDATIONS_HISTORY);
      console.log('✅ История рекомендаций очищена');
      return true;
    } catch (error) {
      console.error('❌ Ошибка очистки истории:', error);
      return false;
    }
  }

  /**
   * Очистить все данные приложения
   */
  async clearAll(): Promise<boolean> {
    try {
      await AsyncStorage.clear();
      console.log('✅ Все данные очищены');
      return true;
    } catch (error) {
      console.error('❌ Ошибка очистки всех данных:', error);
      return false;
    }
  }
}

// Экспортируем единственный экземпляр сервиса (синглтон)
export default new StorageService();