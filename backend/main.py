# main.py в папке backend (версия с Groq)

import os
from groq import Groq
from pydantic import BaseModel
from fastapi import FastAPI
from dotenv import load_dotenv

# Загружаем переменные окружения из .env файла
load_dotenv()

# --- 1. Настройка FastAPI и клиента Groq ---

app = FastAPI()

# Создаем клиент Groq, который будет использовать ключ из .env файла
client = Groq(api_key=os.getenv("GROQ_API_KEY"))


# --- 2. Модель данных (остается без изменений) ---

class UserInput(BaseModel):
    age: int
    weight: float
    height: int
    goal: str
    activity_level: str


# --- 3. Создание API эндпоинта ---

@app.post("/generate-recommendation")
def generate_recommendation(user_input: UserInput):
    """
    Генерирует персональные фитнес-рекомендации с помощью Groq.
    """
    
    # --- 4. Формирование промпта (похож на OpenAI) ---

    system_prompt = """
    Ты — элитный AI-фитнес тренер и диетолог. 
    Твоя задача — создавать короткие, четкие и мотивирующие рекомендации.
    Говори дружелюбно, но авторитетно.
    Структурируй ответ на три обязательные части: "### Питание", "### Тренировки", "### Сон".
    В конце всегда добавляй короткий дисклеймер: "Важно: перед началом любой программы проконсультируйтесь с врачом."
    """

    user_prompt = f"""
    Сгенерируй для меня персональный план. Вот мои данные:
    - Возраст: {user_input.age} лет
    - Вес: {user_input.weight} кг
    - Рост: {user_input.height} см
    - Моя цель: {user_input.goal}
    - Уровень активности: {user_input.activity_level}
    """

    # --- 5. Вызов модели Llama 3 через Groq ---
    
    try:
        chat_completion = client.chat.completions.create(
            # Используем быструю и мощную модель Llama 3
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.7,
            max_tokens=1024,
        )
        
        recommendation = chat_completion.choices[0].message.content
        return {"recommendation": recommendation}

    except Exception as e:
        return {"error": f"Произошла ошибка при обращении к Groq API: {e}"}