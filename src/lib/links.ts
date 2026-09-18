// Plain constructed outbound links. A real retailer API integration is a later, separate setup.

export type Retailer = { id: string; name: string; note: string; url: (q: string) => string };

export const retailers: Retailer[] = [
  { id: "amazon", name: "Amazon", note: "Search results on amazon.com", url: (q) => `https://www.amazon.com/s?k=${encodeURIComponent(q)}` },
  { id: "homedepot", name: "The Home Depot", note: "Search results on homedepot.com", url: (q) => `https://www.homedepot.com/s/${encodeURIComponent(q)}` },
  { id: "google", name: "Google Shopping", note: "Compare sellers", url: (q) => `https://www.google.com/search?tbm=shop&q=${encodeURIComponent(q)}` },
];

export const findProfessionalUrl = (trade: string) =>
  `https://www.google.com/maps/search/${encodeURIComponent(`licensed ${trade} near me`)}`;
