import { useState } from "react";
import { toast } from "sonner";
import { type Rarity, type Role } from "@/lib/sorare-store";

export function useGalleriaForm() {
  const [rarity, setRarity] = useState<Rarity>("LIMITED");
  const [role, setRole] = useState<Role>("FW");
  const [season, setSeason] = useState<string>("2025/2026");
  const [search, setSearch] = useState<string>("");

  const handleReset = () => {
    setRarity("LIMITED");
    setRole("FW");
    setSeason("2025/2026");
    setSearch("");
    toast.info("Filtri resettati");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Ricerca applicata con successo!");
  };

  return {
    state: { rarity, role, season, search },
    actions: { setRarity, setRole, setSeason, setSearch, handleReset, handleSubmit },
  };
}
