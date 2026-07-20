"""API exception types and rendering helpers."""

import logging
from typing import Any

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import exception_handler


logger = logging.getLogger(__name__)


class ServiceError(Exception):
    """An expected service-layer error that is safe to expose to API clients."""

    def __init__(
        self,
        code: str,
        message: str,
        *,
        details: dict[str, Any] | None = None,
        status_code: int = 400,
    ) -> None:
        super().__init__(message)
        self.code = code
        self.message = message
        self.details = details or {}
        self.status_code = status_code


def api_exception_handler(
    exc: Exception,
    context: dict[str, Any],
) -> Response | None:
    """Render service errors consistently and defer DRF errors to DRF."""
    if isinstance(exc, ServiceError):
        if exc.status_code >= 500:
            logger.error(
                "Service error %s: %s",
                exc.code,
                exc.message,
            )
        return Response(
            {
                "error": {
                    "code": exc.code,
                    "message": exc.message,
                    "details": exc.details,
                }
            },
            status=exc.status_code,
        )

    response = exception_handler(exc, context)
    if response is not None:
        return response

    logger.exception("Unhandled API exception", exc_info=exc)
    return Response(
        {
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "An unexpected server error occurred.",
                "details": {},
            }
        },
        status=status.HTTP_500_INTERNAL_SERVER_ERROR,
    )
