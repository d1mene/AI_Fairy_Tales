from openai import AsyncOpenAI

from app.config import settings
from app.models.user import User, Sex
from app.models.tale import Tale


# Клиент инициализируется один раз при старте приложения,
# аналогично тому, как это сделано в config.py старого бота:
# client = AsyncOpenAI(api_key=API_KEY, base_url="https://api.deepseek.com")
_client = AsyncOpenAI(
    api_key=settings.DEEPSEEK_API_KEY,
    base_url="https://api.deepseek.com",
)


def _build_first_user_prompt(user: User, tale: Tale, user_message: str) -> str:
    """
    Строит первый промпт с полным контекстом пользователя и параметрами сказки.

    Аналог get_prompt() из prompts.py старого бота — первое сообщение (p0),
    которое бот записывал в БД перед вызовом API.
    Именно здесь сосредоточен весь «профиль»: пол, возраст, хобби, тема, жанр.
    """
    sex_label = "Мужской" if user.sex == Sex.MALE else "Женский"
    name  = user.name  or "не указано"
    age   = str(user.age) if user.age else "не указано"
    hobby = user.hobby or "не указано"

    return (
        "Ты — дедушка Дрёма, добрый и мудрый сказочник. "
        "Ты рассказываешь интерактивную сказку, в которой пользователь сам влияет на сюжет. "
        "После каждой части задавай пользователю один короткий вопрос о том, "
        "что должно произойти дальше — чтобы он мог продолжить историю.\n\n"
        f"Информация о пользователе:\n"
        f"- Имя: {name}\n"
        f"- Пол: {sex_label}\n"
        f"- Возраст: {age}\n"
        f"- Увлечения: {hobby}\n\n"
        f"Параметры сказки:\n"
        f"- Тема/название: {tale.name}\n"
        f"- Жанр: {tale.genre}\n"
        f"- Всего частей: {tale.size}\n\n"
        f"Пользователь написал: {user_message}"
    )


def _build_continuation_prompt(user_message: str) -> str:
    return f"Пользователь написал: {user_message}"


def _build_messages(user: User, tale: Tale, user_message: str) -> list[dict]:
    """
    Строит список сообщений для DeepSeek API из истории сказки и нового сообщения.

    Воспроизводит логику get_user_context_tale() из dbtools.py старого бота:
    там история хранилась в виде полей p0, ans0, p1, ans1, … и читалась
    как чередующиеся роли user / assistant.

    В новом сервере история хранится в tale.content:
        [
          {"part_number": 1, "user_message": "...", "assistant_response": "..."},
          {"part_number": 2, "user_message": "...", "assistant_response": "..."},
          ...
        ]

    Результирующий список messages:
        [
          {"role": "user",      "content": <первый промпт с полным контекстом>},  # ← _build_first_user_prompt
          {"role": "assistant", "content": <ответ на часть 1>},
          {"role": "user",      "content": <продолжение пользователя для части 2>},  # ← _build_continuation_prompt
          {"role": "assistant", "content": <ответ на часть 2>},
          ...
          {"role": "user",      "content": <новый промпт для текущего хода>},
        ]
    """
    messages: list[dict] = []
    history: list[dict] = tale.content or []

    for i, part in enumerate(history):
        past_user_msg  = part.get("user_message", "")
        past_bot_reply = part.get("assistant_response", "")

        if i == 0:
            messages.append({
                "role": "user",
                "content": _build_first_user_prompt(user, tale, past_user_msg),
            })
        else:
            messages.append({
                "role": "user",
                "content": _build_continuation_prompt(past_user_msg),
            })

        messages.append({"role": "assistant", "content": past_bot_reply})

    if not history:
        messages.append({
            "role": "user",
            "content": _build_first_user_prompt(user, tale, user_message),
        })
    else:
        messages.append({
            "role": "user",
            "content": _build_continuation_prompt(user_message),
        })

    return messages


class AIService:
    """
    Сервис генерации текста сказки через DeepSeek.

    Переиспользует паттерн из старого бота:
        response = await client.chat.completions.create(
            model="deepseek-chat",
            messages=await get_user_context_tale(tale_num, size),
            stream=False,
            temperature=TEMPERATURE,
        )
        bot_response = response.choices[0].message.content
    """

    async def generate_response(self, user: User, tale: Tale, user_message: str) -> str:
        messages = _build_messages(user, tale, user_message)

        response = await _client.chat.completions.create(
            model="deepseek-chat",
            messages=messages,
            stream=False,
            temperature=settings.AI_TEMPERATURE,
        )

        return response.choices[0].message.content