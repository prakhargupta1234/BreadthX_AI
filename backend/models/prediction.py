from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, func
from sqlalchemy.orm import relationship
from database import Base


class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    filename = Column(Text, nullable=False)
    result = Column(String(50), nullable=False)
    confidence = Column(Float, nullable=False)
    # Store all class scores as JSON string
    all_scores = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    owner = relationship("User", back_populates="predictions")
