"use client";

import { useState } from "react";

export default function Home() {
  const [city, setCity] = useState("");
  const [interests, setInterests] = useState("");
  const [itinerary, setItinerary] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;

    setLoading(true);
    setError("");
    setItinerary("");

    try {
      const response = await fetch("/api/itinerary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ city, interests }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? "Could not generate an itinerary.");
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("Streaming is not supported in this browser.");
      }

      const decoder = new TextDecoder();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        const delta = decoder.decode(value, { stream: true });
        setItinerary((current) => current + delta);
      }
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Something went wrong.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="shell">
      <section className="card">
        <p className="eyebrow">Day trip generator</p>
        <h1>Travel Itinerary Planner</h1>
        <p className="lede">
          Enter a city and your interests to generate a personalised day trip
          itinerary.
        </p>

        <form onSubmit={handleSubmit} className="form">
          <label htmlFor="city">City</label>
          <input
            id="city"
            name="city"
            value={city}
            onChange={(event) => setCity(event.target.value)}
            placeholder="Lisbon"
            autoComplete="off"
            required
          />

          <label htmlFor="interests">Interests (comma-separated)</label>
          <input
            id="interests"
            name="interests"
            value={interests}
            onChange={(event) => setInterests(event.target.value)}
            placeholder="street food, architecture, live music"
            autoComplete="off"
            required
          />

          <button type="submit" disabled={loading}>
            {loading ? "Planning your day..." : "Generate itinerary"}
          </button>
        </form>

        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}

        {itinerary && (
          <article className="output" aria-live="polite">
            <pre>{itinerary}</pre>
          </article>
        )}
      </section>
    </main>
  );
}
