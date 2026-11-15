import {
  CalendarDays,
  CircleDollarSign,
  Plus,
  Users,
} from "lucide-react";

import { Button, Card } from "@/design-system";

import { TripCard } from "./TripCard";
import type { Trip } from "./trip";

type TripOverviewProps = {
  hydrated: boolean;
  trips: Trip[];
  onCreate: () => void;
  onOpenTrip: (id: string) => void;
};

export function TripOverview({
  hydrated,
  trips,
  onCreate,
  onOpenTrip,
}: TripOverviewProps) {
  if (!hydrated) {
    return <p className="muted">Carregando suas viagens...</p>;
  }

  return (
    <>
      <div className="stats">
        <Card>
          <CalendarDays aria-hidden="true" />
          <small>Viagens cadastradas</small>
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
        <h2>Viagens</h2>
        <p>
          {trips.length === 1
            ? "1 viagem cadastrada neste navegador."
            : `${trips.length} viagens cadastradas neste navegador.`}
        </p>
      </div>

      {trips.length === 0 ? (
        <Card className="empty-state" padding="lg">
          <span aria-hidden="true" className="empty-state__icon">
            ♡
          </span>

          <h3>Sua próxima história começa aqui.</h3>
          <p>Crie uma viagem para começar a organizar o próximo encontrão.</p>

          <Button onClick={onCreate}>
            <Plus size={17} /> Criar primeira viagem
          </Button>
        </Card>
      ) : (
        <div className="trip-grid">
          {trips.map((trip) => (
            <TripCard key={trip.id} onOpen={onOpenTrip} trip={trip} />
          ))}

          <button className="new-trip-card" onClick={onCreate} type="button">
            <span aria-hidden="true">+</span>
            <strong>Criar nova viagem</strong>
            <small>O próximo encontro começa aqui!</small>
          </button>
        </div>
      )}
    </>
  );
}
