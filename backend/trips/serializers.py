"""Request validation for trip planning endpoints."""

from datetime import datetime

from django.utils import timezone
from django.utils.dateparse import parse_datetime
from rest_framework import serializers


class TimezoneAwareDateTimeField(serializers.DateTimeField):
    """Reject datetimes that do not explicitly contain timezone information."""

    default_error_messages = {
        **serializers.DateTimeField.default_error_messages,
        "timezone_required": "Datetime must include timezone information.",
    }

    def to_internal_value(self, value: object) -> datetime:
        parsed_value: datetime | None = None
        if isinstance(value, datetime):
            parsed_value = value
        elif isinstance(value, str):
            parsed_value = parse_datetime(value)

        if parsed_value is not None and timezone.is_naive(parsed_value):
            self.fail("timezone_required")

        result = super().to_internal_value(value)
        if timezone.is_naive(result):
            self.fail("timezone_required")
        return result


class TripCalculateRequestSerializer(serializers.Serializer):
    current_location = serializers.CharField(
        allow_blank=False,
        trim_whitespace=True,
    )
    pickup_location = serializers.CharField(
        allow_blank=False,
        trim_whitespace=True,
    )
    dropoff_location = serializers.CharField(
        allow_blank=False,
        trim_whitespace=True,
    )
    current_cycle_used_hours = serializers.FloatField(
        min_value=0,
        max_value=70,
    )
    start_time = TimezoneAwareDateTimeField(required=False)
