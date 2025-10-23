import os
from groq import Groq
from pydantic import BaseModel
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

# Добавляем CORS для работы с мобильным приложением
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = Groq(api_key=os.getenv("GROQ_API_KEY"))


class UserInput(BaseModel):
    age: int
    weight: float
    height: int
    goal: str
    activity_level: str


@app.post("/generate-recommendation")
def generate_recommendation(user_input: UserInput):
    """
    Генерирует персональные фитнес-рекомендации с помощью Groq.
    """
    
    # Улучшенный промпт для более структурированного ответа
    system_prompt = """
    Ты — элитный AI-фитнес тренер и диетолог с 10+ летним опытом.
    
    КРИТИЧЕСКИ ВАЖНО: Твой ответ ОБЯЗАТЕЛЬНО должен содержать ТРИ секции с заголовками:
    ### Питание
    ### Тренировки  
    ### Сон
    
    ФОРМАТ ОТВЕТА:
    
    ### Питание
    - Напиши конкретную суточную калорийность
    - Укажи соотношение БЖУ (белки/жиры/углеводы)
    - Дай 2-3 примера конкретных приемов пищи
    - Укажи количество приемов пищи в день
    
    ### Тренировки
    - Частота тренировок в неделю (например: 3-4 раза)
    - Конкретные упражнения с количеством подходов
    - Длительность одной тренировки
    - Что делать в дни отдыха
    
    ### Сон
    - Оптимальное количество часов сна
    - Рекомендуемое время отхода ко сну
    - Советы для качественного восстановления
    
    СТИЛЬ:
    - Говори дружелюбно, мотивирующе и конкретно
    - Избегай общих фраз типа "правильно питайтесь"
    - Давай измеримые рекомендации (цифры, время, количество)
    - Пиши короткими абзацами для легкого чтения
    - НЕ используй маркированные списки (•), пиши обычным текстом
    
    В конце ОБЯЗАТЕЛЬНО добавь:
    ### Важно
    Перед началом любой программы проконсультируйтесь с врачом.
    """

    user_prompt = f"""
    Создай персональный фитнес-план для меня:
    
    Возраст: {user_input.age} лет
    Вес: {user_input.weight} кг
    Рост: {user_input.height} см
    Цель: {user_input.goal}
    Уровень активности: {user_input.activity_level}
    
    Сделай план максимально конкретным и применимым на практике.
    """

    try:
        chat_completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.7,
            max_tokens=1500,  # Увеличили для более детального ответа
        )
        
        recommendation = chat_completion.choices[0].message.content
        return {"recommendation": recommendation}

    except Exception as e:
        return {"error": f"Произошла ошибка при обращении к Groq API: {e}"}