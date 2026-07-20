"""HTTP views for the trip planning API."""

from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.request import Request
from rest_framework.response import Response

from trips.serializers import TripCalculateRequestSerializer
from trips.services import calculate_trip as calculate_trip_service


@api_view(["GET"])
def health(request: Request) -> Response:
    return Response({"status": "ok"})


@api_view(["POST"])
def calculate_trip(request: Request) -> Response:
    serializer = TripCalculateRequestSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    result = calculate_trip_service(**serializer.validated_data)
    return Response(result, status=status.HTTP_200_OK)
