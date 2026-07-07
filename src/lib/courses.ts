export const formatLabels: Record<string, string> = {
  presentiel: "🏢 Présentiel",
  visio: "💻 Visio",
  elearning: "🎬 E-learning",
  webinaire: "📡 Webinaire",
};

export function priceLabel(cents: number): string {
  return cents === 0 ? "Gratuit" : `${(cents / 100).toFixed(0)} €`;
}
