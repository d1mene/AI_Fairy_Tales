from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import Integer, String, JSON, ForeignKey
from app.db.base import Base

class Tale(Base):
    __tablename__ = "tales"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    
    genre: Mapped[str] = mapped_column(String(100))
    name: Mapped[str] = mapped_column(String(100))
    size: Mapped[int] = mapped_column(Integer)
    content: Mapped[list] = mapped_column(JSON)
    
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), unique=True)
    user: Mapped['User'] = relationship(back_populates="tale")
    