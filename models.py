"""
models.py — SQLAlchemy ORM models
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text
from database import Base


class Config(Base):
    """Stores Instagram / Facebook API credentials."""
    __tablename__ = "config"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(100), unique=True, nullable=False, index=True)
    value = Column(Text, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Campaign(Base):
    """
    A Campaign links one Instagram post to a set of trigger keywords.
    When any keyword is found in a comment on that post, the tool:
      1. Replies publicly to the comment
      2. Sends a private DM to the commenter
    """
    __tablename__ = "campaigns"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    post_id = Column(String(100), nullable=False)
    post_preview_url = Column(Text, nullable=True)   # cached thumbnail
    post_caption = Column(Text, nullable=True)        # cached caption snippet
    keywords = Column(Text, nullable=False)           # comma-separated, e.g. "free,info,link"
    comment_reply = Column(Text, nullable=False)      # public comment reply text
    dm_message = Column(Text, nullable=False)         # private DM text
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    @property
    def keyword_list(self):
        return [k.strip().lower() for k in self.keywords.split(",") if k.strip()]


class ProcessedComment(Base):
    """
    Deduplication table — stores every comment_id that has already been
    acted on so we never double-reply or double-DM.
    """
    __tablename__ = "processed_comments"

    id = Column(Integer, primary_key=True, index=True)
    comment_id = Column(String(100), unique=True, nullable=False, index=True)
    campaign_id = Column(Integer, nullable=True)
    processed_at = Column(DateTime, default=datetime.utcnow)
