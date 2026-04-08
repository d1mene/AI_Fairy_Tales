from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import Integer, String, Enum as SQLAlchemyEnum
from app.db.base import Base
import enum


class UserRole(str, enum.Enum):
    ADMIN = "admin"
    USER = "user"
    
class Sex(str, enum.Enum):
    MALE = "male"
    FEMALE = "female"

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    
    name: Mapped[str] = mapped_column(String(50))
    age: Mapped[int] = mapped_column(Integer)
    hobby: Mapped[str] = mapped_column(String(255))

    username: Mapped[str] = mapped_column(
        String(50), 
        unique=True,
        index=True,
        nullable=False
    )
    hashed_password: Mapped[str] = mapped_column(String(255))
    
    role: Mapped[UserRole] =  mapped_column(SQLAlchemyEnum(UserRole), default=UserRole.USER)
    sex: Mapped[Sex] = mapped_column(SQLAlchemyEnum(Sex))
    
    tale: Mapped['Tale'] = relationship(back_populates="user", uselist=False)