import { ArrowLeft, CalendarDays, ExternalLink, MapPin } from "lucide-react";

import { Button, Card } from "@/design-system";

import { formatTripDates, type Trip } from "./trip";

type TripDetailsProps = {
  trip: Trip;
  onBack: () => void;
};

export function TripDetails({ trip, onBack }: TripDetailsProps) {
  return (
    <div className="trip-details">
      <Button onClick={onBack} variant="ghost">
        <ArrowLeft size={16} /> Voltar às viagens
      </Button>

      <Card className="trip-details__card" padding="lg">
        <p className="eyebrow">DETALHES DA VIAGEM</p>
        <h2>{trip.name}</h2>

        <p>
          <CalendarDays size={17} />
          {formatTripDates(trip)}
        </p>

        <p>
          <MapPin size={17} />
          {trip.locationName || "Local a definir"}
        </p>

        {trip.mapUrl && (
          <a href={trip.mapUrl} rel="noopener noreferrer" target="_blank">
            Abrir mapa <ExternalLink size={15} />
          </a>
        )}

        <div className="trip-details__notice">
          Os convites, participantes, pagamentos e transporte serão
          habilitados após a autenticação e o banco de dados.
        </div>
      </Card>
    </div>
  );
}
