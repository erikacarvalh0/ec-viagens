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

type DashboardProps = {
  initialTrips: Trip[];
};

export function Dashboard({ initialTrips }: DashboardProps) {
  const router = useRouter();
  const [section, setSection] = useState<Section>("overview");
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [trips, setTrips] = useState(initialTrips);
  const selectedTrip = trips.find((trip) => trip.id === selectedTripId);
  const showTrips = section === "overview" || section === "trips";

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
        <TripOverview
          hydrated
          onCreate={() => setIsFormOpen(true)}
          onOpenTrip={(id) => {
            setSelectedTripId(id);
            setSection("details");
          }}
          trips={trips}
        />
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
