import { supabase } from "../lib/supabase";

export default async function Home() {
  const { data: clientes, error } = await supabase.from("clientes").select("*");

  if (error) {
    return <p style={{ padding: 40, color: "red" }}>Error: {error.message}</p>;
  }

  return (
    <main style={{ padding: 40, fontFamily: "sans-serif" }}>
      <h1 style={{ color: "#00369C" }}>Clientes Electroingeniería</h1>
      <ul>
        {clientes.map((c) => (
          <li key={c.id}>
            {c.nombre} — <strong>{c.tipo}</strong>
          </li>
        ))}
      </ul>
    </main>
  );
}