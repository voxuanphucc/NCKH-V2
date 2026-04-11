export interface Address {
  id: string;
  formattedAddress: string;
  addressLine: string;
  ward: string;
  district: string;
  city: string;
  province: string;
  country: string;
  latitude: number;
  longitude: number;
  addressType: string;
  addressTypeDescription: string;
  fromDate: string;
  toDate: string;
  isPrimary: boolean;
  description: string;
}

export interface CreateAddressRequest {
  formattedAddress: string;
  addressLine: string;
  ward: string;
  district: string;
  city: string;
  province: string;
  country: string;
  latitude?: number;
  longitude?: number;
  addressTypeId: string;
  fromDate?: string;
  toDate?: string;
  isPrimary?: boolean;
  description?: string;
}