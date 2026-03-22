import type { Metadata } from "next";
import ServicesMarketplace from "./ServicesMarketplace";

export const metadata: Metadata = {
  title: "Services marketplace | SmileTripCare",
  description: "Browse lodging, transport, experiences, and therapy for your dental trip.",
};

export default function ServicesPage() {
  return <ServicesMarketplace />;
}
