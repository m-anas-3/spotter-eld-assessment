"""Root URL configuration for the trip planner API."""

from django.urls import include, path


urlpatterns = [
    path("api/", include("trips.urls")),
]
