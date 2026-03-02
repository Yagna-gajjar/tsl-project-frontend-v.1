import type { Address } from '@/types/address'
import { request, toQueryString, type SortOrder } from './helper'
import type { Response } from '@/types/response'

export interface AddressesQuery {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: SortOrder
  search?: string

  line1?: string
  city?: string
  state?: string
  pinCode?: string
  country?: string
}

const ADDRESS_BASE = import.meta.env.VITE_APP_API_URL + '/address'

export function getAddresses(
  params: AddressesQuery = {}
): Promise<Response<Address[]>> {
  const qs = toQueryString({
    page: params.page ?? 1,
    limit: params.limit ?? 10,
    sortBy: params.sortBy ?? "addressId",
    sortOrder: params.sortOrder ?? "ASC",

    search: params.search,
    line1: params.line1,
    city: params.city,
    state: params.state,
    pinCode: params.pinCode,
    country: params.country,
  });

  return request<Response<Address[]>>(`${ADDRESS_BASE}${qs}`);
}

export function getAddressById(id: number): Promise<Response<Address>> {
  return request<Response<Address>>(`${ADDRESS_BASE}/${id}`);
}

export function createAddress(payload: Address): Promise<Response<Address>> {
  return request<Response<Address>>(ADDRESS_BASE, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateAddress(
  id: number,
  payload: Partial<Address>
): Promise<Response<Address>> {
  return request<Response<Address>>(`${ADDRESS_BASE}/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteAddress(id: number): Promise<Response<Address>> {
  return request<Response<Address>>(`${ADDRESS_BASE}/${id}`, {
    method: "DELETE",
  });
}
