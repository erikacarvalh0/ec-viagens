import type { Trip } from "./trip";

export function filterTripsByArchive(trips: Trip[], archived: boolean): Trip[] {
  return trips.filter((trip) => Boolean(trip.archivedAt) === archived);
}

export function getTripBackSection(_archived: boolean): "trips" {
  return "trips";
}

export function getTripBackLabel(archived: boolean): string {
  return archived ? "Voltar ao histórico" : "Voltar às viagens";
}

export function tripHistoryCopy(archived: boolean) {
  return archived
    ? {
        heading: "Histórico de viagens",
        emptyTitle: "Nenhuma viagem no histórico",
        emptyDescription: "Quando uma viagem for arquivada, ela continuará disponível aqui para todas as participantes.",
        allowCreation: false,
      }
    : {
        heading: "Viagens ativas",
        emptyTitle: "Sua próxima história começa aqui.",
        emptyDescription: "Crie uma viagem para começar a organizar o próximo encontrão.",
        allowCreation: true,
      };
}
