import {
  ArrowRight,
  CalendarDays,
  MapPin,
} from "lucide-react";

import { Button, Card } from "@/design-system";

import { formatTripDates, type Trip } from "./trip";

type TripCardProps = {
  trip: Trip;
  onOpen: (id: string) => void;
};

export function TripCard({ trip, onOpen }: TripCardProps) {
  return (
    <Card className="trip-card" padding="sm">
      <div aria-hidden="true" className="trip-card__cover">
        <span>✳</span>
      </div>

      <div className="trip-card__content">
        <h3>{trip.name}</h3>

        <p className="trip-card__detail">
          <CalendarDays size={16} />
          {formatTripDates(trip)}
        </p>

        <p className="trip-card__detail">
          <MapPin size={16} />
          {trip.locationName || "Local a definir"}
        </p>

        <div className="trip-card__footer">
          <span>Planejamento</span>

          <Button
            aria-label={`Ver detalhes de ${trip.name}`}
            onClick={() => onOpen(trip.id)}
            size="sm"
            variant="ghost"
          >
            Ver viagem <ArrowRight size={16} />
          </Button>
        </div>
      </div>
    </Card>
  );
}
