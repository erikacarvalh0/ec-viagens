"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus } from "lucide-react";

import { AppShell, sectionLabels, type Section } from "@/components/AppShell";
import { Button } from "@/design-system";
import { logout } from "@/features/auth/actions";

import { createTrip } from "./actions";
import { TripDetails } from "./TripDetails";
import { TripForm } from "./TripForm";
import { TripOverview } from "./TripOverview";
import type { Trip } from "./trip";
import { filterTripsByArchive } from "./history";
import { searchTrips } from "./search";

type DashboardProps = {
  initialTrips: Trip[];
};

export function Dashboard({ initialTrips }: DashboardProps) {
  const router = useRouter();
  const [section, setSection] = useState<Section>("overview");
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [search, setSearch] = useState("");
  const [trips, setTrips] = useState(initialTrips);
  const selectedTrip = trips.find((trip) => trip.id === selectedTripId);
  const showTrips = section === "overview" || section === "trips";
  // Keep all member trips in memory; archive status only changes the visible list.
  const visibleTrips = searchTrips(filterTripsByArchive(trips, showArchived), search);

  return (
    <AppShell currentSection={section} onNavigate={setSection}>
      <div className="heading">
        <div>
          <p className="eyebrow">BEM-VINDA DE VOLTA ✳</p>
          <h1>{showTrips ? "Nossas viagens" : sectionLabels[section]}</h1>
          <p>Cada encontro vira uma história para guardar. ♡</p>
        </div>

        <div className="dashboard-actions">
          <form action={logout}>
            <Button type="submit" variant="secondary">
              Sair
            </Button>
          </form>

          <Button onClick={() => setIsFormOpen(true)}>
            <Plus size={17} />
            Nova viagem
          </Button>
        </div>
      </div>

      {showTrips ? (
        <>
        <div className="dashboard-actions">
          <Button type="button" variant="secondary" onClick={() => setShowArchived((current) => !current)}>
            {showArchived ? "Ver viagens ativas" : "Histórico de viagens"}
          </Button>
        </div>
        <label className="trip-search">
          Buscar viagens
          <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nome ou destino" aria-label="Buscar viagens por nome ou destino" />
        </label>
        <TripOverview
          hydrated
          archived={showArchived}
          onCreate={() => setIsFormOpen(true)}
          onOpenTrip={(id) => {
            setSelectedTripId(id);
            setSection("details");
          }}
          trips={visibleTrips}
        />
        </>
      ) : section === "details" && selectedTrip ? (
        <TripDetails onBack={() => setSection("trips")} trip={selectedTrip} />
      ) : (
        <div className="placeholder">
          <h2>{sectionLabels[section]}</h2>
          <p>Esta área será implementada nas próximas etapas.</p>
        </div>
      )}

      {isFormOpen && (
        <TripForm
          onClose={() => setIsFormOpen(false)}
          onCreate={async (draft) => {
            const id = await createTrip(draft);

            setTrips((previous) => [
              {
                ...draft,
                id,
                createdAt: new Date().toISOString(),
              },
              ...previous,
            ]);
            setSection("trips");
            setIsFormOpen(false);
            router.refresh();
          }}
        />
      )}
    </AppShell>
  );
}
