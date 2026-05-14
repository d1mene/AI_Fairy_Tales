import re

def clean_text(text: str) -> str:
    pattern = re.compile(r'[^a-zA-Zа-яА-ЯёЁ0-9 .,;:\'\"\-?/]+')
    return pattern.sub('', text)

def validate_age(age: int) -> bool:
    return 0 <= age <= 120