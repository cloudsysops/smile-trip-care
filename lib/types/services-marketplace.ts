export type ServiceCategory =
  | "lodging"
  | "transport"
  | "experience"
  | "therapy"
  | "accompaniment"
  | "other";

export type PublicServiceRow = {
  id: string;
  name: string;
  description: string | null;
  category: ServiceCategory;
  price_cents: number;
  price_per: string;
  city: string | null;
  duration_hours: number | null;
  host_name: string | null;
  host_city: string | null;
};
