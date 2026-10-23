export interface Direccion {
  place_id: number | string;
  display_name: string;
  lat?: string;
  lon?: string;
  address: {
    street: string;
    house_number: string;
    state_district: string;
    state: string;
    iso3166_2?: string;
    postcode: string;
    city?: string;
    town?: string;
    suburb?: string;
  };
  manual?: boolean;
}