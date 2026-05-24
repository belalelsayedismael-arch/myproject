"""
instagram.py — Official Instagram Graph API client.

All calls use only the official Meta/Instagram Graph API.
No third-party automation libraries, no unofficial APIs.
"""
import os
import time
import logging
from typing import Optional
import httpx
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

GRAPH_API_BASE = "https://graph.facebook.com/v19.0"
MAX_RETRIES = 3
RETRY_BACKOFF_BASE = 2  # seconds


def _get_access_token() -> str:
    token = os.getenv("INSTAGRAM_ACCESS_TOKEN", "")
    if not token:
        raise ValueError("INSTAGRAM_ACCESS_TOKEN is not set in environment.")
    return token


def _make_request(method: str, url: str, **kwargs) -> dict:
    """
    Makes an HTTP request with automatic retry on rate-limit (429) errors.
    Logs all responses.
    """
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            with httpx.Client(timeout=15.0) as client:
                response = getattr(client, method)(url, **kwargs)
            data = response.json()
            logger.info(
                "Instagram API %s %s → %s | body=%s",
                method.upper(), url, response.status_code, data,
            )

            if response.status_code == 429 or (
                isinstance(data, dict) and data.get("error", {}).get("code") in (4, 17, 32, 613)
            ):
                wait = RETRY_BACKOFF_BASE ** attempt
                logger.warning("Rate limited. Retrying in %ss (attempt %d/%d)", wait, attempt, MAX_RETRIES)
                time.sleep(wait)
                continue

            return data

        except httpx.RequestError as exc:
            logger.error("Network error on attempt %d: %s", attempt, exc)
            if attempt == MAX_RETRIES:
                raise
            time.sleep(RETRY_BACKOFF_BASE ** attempt)

    return {"error": {"message": "Max retries exceeded"}}


def reply_to_comment(comment_id: str, message: str) -> dict:
    """
    Posts a public reply to an Instagram comment.
    Endpoint: POST /{comment-id}/replies
    """
    url = f"{GRAPH_API_BASE}/{comment_id}/replies"
    params = {
        "message": message,
        "access_token": _get_access_token(),
    }
    result = _make_request("post", url, params=params)
    if "error" in result:
        logger.error("reply_to_comment failed: %s", result["error"])
    return result


def send_dm(instagram_user_id: str, message: str) -> dict:
    """
    Sends a private Direct Message to an Instagram user.

    IMPORTANT: The Instagram Graph API only allows DMs to users who have
    previously messaged the business, OR if the business account has the
    instagram_manage_messages permission with an approved use case.
    See README for how to apply for this permission.

    Endpoint: POST /me/messages
    """
    ig_account_id = os.getenv("INSTAGRAM_BUSINESS_ACCOUNT_ID", "")
    if not ig_account_id:
        raise ValueError("INSTAGRAM_BUSINESS_ACCOUNT_ID is not set in environment.")

    url = f"{GRAPH_API_BASE}/{ig_account_id}/messages"
    payload = {
        "recipient": {"id": instagram_user_id},
        "message": {"text": message},
        "access_token": _get_access_token(),
    }
    result = _make_request("post", url, json=payload)
    if "error" in result:
        logger.error("send_dm failed: %s", result["error"])
    return result


def get_post_details(post_id: str) -> dict:
    """
    Fetches thumbnail URL and caption for a given Instagram media post ID.
    Used by the dashboard to preview posts when setting up a campaign.
    """
    url = f"{GRAPH_API_BASE}/{post_id}"
    params = {
        "fields": "id,caption,media_url,thumbnail_url,media_type,timestamp,permalink",
        "access_token": _get_access_token(),
    }
    result = _make_request("get", url, params=params)
    if "error" in result:
        logger.error("get_post_details failed: %s", result["error"])
    return result


def get_user_info(user_id: str) -> dict:
    """Fetches basic info about an Instagram user by their IGSID."""
    url = f"{GRAPH_API_BASE}/{user_id}"
    params = {
        "fields": "name,username",
        "access_token": _get_access_token(),
    }
    return _make_request("get", url, params=params)
