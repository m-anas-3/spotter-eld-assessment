"""URL routes for the trips application."""

from django.urls import path

from trips import views


app_name = "trips"

urlpatterns = [
    path("health/", views.health, name="health"),
    path("trips/calculate/", views.calculate_trip, name="calculate"),
]
