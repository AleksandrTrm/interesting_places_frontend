import { api } from "./api";
import type { AxiosResponse } from "axios";

export class AttractionsService {
  static async getAttractions(
    page: number,
    elementsOnPage: number
  ): Promise<AxiosResponse> {
    return api.post(`attractions`, {
      page: page,
      elementsOnPage: elementsOnPage,
    });
  }
}
