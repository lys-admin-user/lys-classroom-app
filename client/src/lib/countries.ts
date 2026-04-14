export const COUNTRIES = [
  // Americas
  { code: "US", name: "United States", region: "Americas" },
  { code: "CA", name: "Canada", region: "Americas" },
  { code: "MX", name: "Mexico", region: "Americas" },
  { code: "BR", name: "Brazil", region: "Americas" },
  { code: "AR", name: "Argentina", region: "Americas" },
  { code: "CO", name: "Colombia", region: "Americas" },
  { code: "CL", name: "Chile", region: "Americas" },
  { code: "PE", name: "Peru", region: "Americas" },
  { code: "CR", name: "Costa Rica", region: "Americas" },
  { code: "PA", name: "Panama", region: "Americas" },
  { code: "DO", name: "Dominican Republic", region: "Americas" },
  { code: "JM", name: "Jamaica", region: "Americas" },
  { code: "TT", name: "Trinidad and Tobago", region: "Americas" },
  // Europe
  { code: "GB", name: "United Kingdom", region: "Europe" },
  { code: "DE", name: "Germany", region: "Europe" },
  { code: "FR", name: "France", region: "Europe" },
  { code: "ES", name: "Spain", region: "Europe" },
  { code: "IT", name: "Italy", region: "Europe" },
  { code: "NL", name: "Netherlands", region: "Europe" },
  { code: "BE", name: "Belgium", region: "Europe" },
  { code: "SE", name: "Sweden", region: "Europe" },
  { code: "NO", name: "Norway", region: "Europe" },
  { code: "DK", name: "Denmark", region: "Europe" },
  { code: "FI", name: "Finland", region: "Europe" },
  { code: "IE", name: "Ireland", region: "Europe" },
  { code: "PT", name: "Portugal", region: "Europe" },
  { code: "CH", name: "Switzerland", region: "Europe" },
  { code: "AT", name: "Austria", region: "Europe" },
  { code: "PL", name: "Poland", region: "Europe" },
  { code: "CZ", name: "Czech Republic", region: "Europe" },
  { code: "GR", name: "Greece", region: "Europe" },
  { code: "HU", name: "Hungary", region: "Europe" },
  { code: "RO", name: "Romania", region: "Europe" },
  // Asia-Pacific
  { code: "AU", name: "Australia", region: "Asia-Pacific" },
  { code: "NZ", name: "New Zealand", region: "Asia-Pacific" },
  { code: "JP", name: "Japan", region: "Asia-Pacific" },
  { code: "KR", name: "South Korea", region: "Asia-Pacific" },
  { code: "CN", name: "China", region: "Asia-Pacific" },
  { code: "IN", name: "India", region: "Asia-Pacific" },
  { code: "SG", name: "Singapore", region: "Asia-Pacific" },
  { code: "MY", name: "Malaysia", region: "Asia-Pacific" },
  { code: "TH", name: "Thailand", region: "Asia-Pacific" },
  { code: "PH", name: "Philippines", region: "Asia-Pacific" },
  { code: "ID", name: "Indonesia", region: "Asia-Pacific" },
  { code: "VN", name: "Vietnam", region: "Asia-Pacific" },
  { code: "PK", name: "Pakistan", region: "Asia-Pacific" },
  { code: "BD", name: "Bangladesh", region: "Asia-Pacific" },
  { code: "HK", name: "Hong Kong", region: "Asia-Pacific" },
  { code: "TW", name: "Taiwan", region: "Asia-Pacific" },
  // Middle East
  { code: "AE", name: "United Arab Emirates", region: "Middle East" },
  { code: "SA", name: "Saudi Arabia", region: "Middle East" },
  { code: "IL", name: "Israel", region: "Middle East" },
  { code: "TR", name: "Turkey", region: "Middle East" },
  { code: "EG", name: "Egypt", region: "Middle East" },
  { code: "JO", name: "Jordan", region: "Middle East" },
  { code: "QA", name: "Qatar", region: "Middle East" },
  { code: "KW", name: "Kuwait", region: "Middle East" },
  // Africa
  { code: "ZA", name: "South Africa", region: "Africa" },
  { code: "NG", name: "Nigeria", region: "Africa" },
  { code: "KE", name: "Kenya", region: "Africa" },
  { code: "GH", name: "Ghana", region: "Africa" },
  { code: "TZ", name: "Tanzania", region: "Africa" },
  { code: "UG", name: "Uganda", region: "Africa" },
  { code: "ET", name: "Ethiopia", region: "Africa" },
  { code: "RW", name: "Rwanda", region: "Africa" },
  { code: "MA", name: "Morocco", region: "Africa" },
  { code: "TN", name: "Tunisia", region: "Africa" },
] as const;

export type CountryEntry = { code: string; name: string; region: string };

export function codeToCountryName(code: string): string {
  return (COUNTRIES as readonly CountryEntry[]).find(c => c.code === code)?.name ?? code;
}

export function countryNameToCode(name: string): string | undefined {
  return (COUNTRIES as readonly CountryEntry[]).find(c => c.name === name)?.code;
}

export function resolveCountryName(value: string): string {
  if (value.length === 2) {
    return codeToCountryName(value);
  }
  return value;
}
