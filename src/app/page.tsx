"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { AppShell, sectionLabels, type Section } from "@/components/AppShell";
import { Button } from "@/design-system";
import { TripDetails } from "@/features/trips/TripDetails";
import { TripForm } from "@/features/trips/TripForm";
import { TripOverview } from "@/features/trips/TripOverview";
import { useLocalTrips } from "@/features/trips/use-local-trips";

export default function Home() {
  const [section, setSection] = useState<Section>("overview");
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const { trips, hydrated, createTrip } = useLocalTrips();
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

        <Button onClick={() => setIsFormOpen(true)}>
          <Plus size={17} />
          Nova viagem
        </Button>
      </div>

      <p className="preview-note">
        Prévia local: as viagens ficam apenas neste navegador. Convites e
        informações compartilhadas serão disponibilizados após a autenticação.
      </p>

      {showTrips ? (
        <TripOverview
          hydrated={hydrated}
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
          <p>
            Esta área será conectada a dados compartilhados na próxima etapa.
          </p>
        </div>
      )}

      {isFormOpen && (
        <TripForm
          onClose={() => setIsFormOpen(false)}
          onCreate={(draft) => {
            createTrip(draft);
            setSection("trips");
            setIsFormOpen(false);
          }}
        />
      )}
    </AppShell>
  );
}
