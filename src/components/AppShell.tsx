import {
  CalendarDays,
  Camera,
  CarFront,
  Heart,
  LayoutDashboard,
  Users,
  Wallet,
} from "lucide-react";
import type { ReactNode } from "react";

export type Section =
  | "overview"
  | "trips"
  | "participants"
  | "payments"
  | "transport"
  | "gallery"
  | "details";

type AppShellProps = {
  currentSection: Section;
  galleryEnabled?: boolean;
  onNavigate: (section: Section) => void;
  children: ReactNode;
};

const navigation = [
  { id: "overview", label: "Visão geral", icon: LayoutDashboard },
  { id: "trips", label: "Viagens", icon: CalendarDays },
  { id: "participants", label: "Participantes", icon: Users },
  { id: "payments", label: "Pagamentos", icon: Wallet },
  { id: "transport", label: "Transporte", icon: CarFront },
  { id: "gallery", label: "Galeria", icon: Camera },
] as const;

export const sectionLabels: Record<Section, string> = {
  overview: "Visão geral",
  trips: "Viagens",
  participants: "Participantes",
  payments: "Pagamentos",
  transport: "Transporte",
  gallery: "Galeria",
  details: "Detalhes da viagem",
};

export function AppShell({
  currentSection,
  galleryEnabled = false,
  onNavigate,
  children,
}: AppShellProps) {
  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <Heart aria-hidden="true" size={24} />
          <span>
            ec<span className="brand__name">viagens</span>
          </span>
        </div>

        <p className="nav-label">MENU PRINCIPAL</p>

        <nav aria-label="Navegação principal">
          {navigation.filter(({ id }) => galleryEnabled || id !== "gallery").map(({ id, label, icon: Icon }) => (
            <button
              aria-current={currentSection === id ? "page" : undefined}
              className={currentSection === id ? "active" : ""}
              key={id}
              onClick={() => onNavigate(id)}
              type="button"
            >
              <Icon aria-hidden="true" size={18} />
              {label}
            </button>
          ))}
        </nav>

        <p className="sidebar-note">Planeje encontros inesquecíveis ♡</p>
      </aside>

      <main className="main">
        <header className="topbar">
          <span>Início / {sectionLabels[currentSection]}</span>
          <span className="topbar__preview">Modo de demonstração</span>
        </header>

        <div className="content">{children}</div>
      </main>
    </div>
  );
}
