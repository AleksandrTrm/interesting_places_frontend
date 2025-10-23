import { api } from "./api";
import type { AxiosResponse } from "axios";

export class PlacesService {
  static async getPlaces(
    page: number,
    elementsOnPage: number
  ): Promise<AxiosResponse> {
    return api.post(`places`, {
      page: page,
      elementsOnPage: elementsOnPage,
    });
  }
}
