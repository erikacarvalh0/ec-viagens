import {
  CalendarDays,
  CircleDollarSign,
  Plus,
  Users,
} from "lucide-react";

import { Button, Card } from "@/design-system";

import { TripCard } from "./TripCard";
import type { Trip } from "./trip";
import { tripHistoryCopy } from "./history";

type TripOverviewProps = {
  hydrated: boolean;
  archived?: boolean;
  trips: Trip[];
  onCreate: () => void;
  onOpenTrip: (id: string) => void;
};

export function TripOverview({
  hydrated,
  archived = false,
  trips,
  onCreate,
  onOpenTrip,
}: TripOverviewProps) {
  const copy = tripHistoryCopy(archived);
  if (!hydrated) {
    return <p className="muted">Carregando suas viagens...</p>;
  }

  return (
    <>
      <div className="stats">
        <Card>
          <CalendarDays aria-hidden="true" />
          <small>{archived ? "Viagens no histórico" : "Viagens ativas"}</small>
          <strong>{trips.length}</strong>
        </Card>

        <Card>
          <Users aria-hidden="true" />
          <small>Participantes</small>
          <strong>Em breve</strong>
        </Card>

        <Card>
          <CircleDollarSign aria-hidden="true" />
          <small>Pagamentos</small>
          <strong>Em breve</strong>
        </Card>
      </div>

      <div className="section-heading">
        <h2>{copy.heading}</h2>
        <p>
          {trips.length === 1 ? "1 viagem" : `${trips.length} viagens`} {archived ? "no histórico." : "ativa(s)."}
        </p>
      </div>

      {trips.length === 0 ? (
        <Card className="empty-state" padding="lg">
          <span aria-hidden="true" className="empty-state__icon">
            ♡
          </span>

          <h3>{copy.emptyTitle}</h3>
          <p>{copy.emptyDescription}</p>
          {copy.allowCreation && (
            <Button onClick={onCreate}>
              <Plus size={17} /> Criar primeira viagem
            </Button>
          )}
        </Card>
      ) : (
        <div className="trip-grid">
          {trips.map((trip) => (
            <TripCard key={trip.id} onOpen={onOpenTrip} trip={trip} />
          ))}

          {!archived && (
            <button className="new-trip-card" onClick={onCreate} type="button">
              <span aria-hidden="true">+</span>
              <strong>Criar nova viagem</strong>
              <small>O próximo encontro começa aqui!</small>
            </button>
          )}
        </div>
      )}
    </>
  );
}
