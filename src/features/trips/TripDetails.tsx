import Link from "next/link";
import { ArrowLeft, CalendarDays, ExternalLink, MapPin, Users, CarFront, Wallet, Images } from "lucide-react";

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

        <Link href={`/trips/${trip.id}/members`}>
          <Users size={16} /> Ver participantes e administradoras
        </Link>

        <Link href={`/trips/${trip.id}/travel`}>
          <CarFront size={16} /> Informações de viagem e caronas
        </Link>

        <Link href={`/trips/${trip.id}/payments`}>
          <Wallet size={16} /> Planos de pagamento
        </Link>

        <Link href={`/trips/${trip.id}/photos`}>
          <Images size={16} /> Galeria de fotos
        </Link>

        <div className="trip-details__notice">
          Compartilhe as fotos da viagem com as participantes.
        </div>
      </Card>
    </div>
  );
}
