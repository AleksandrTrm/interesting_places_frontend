// src/pages/api/places.ts
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

  static async getPendingPlaces(
    page: number,
    elementsOnPage: number
  ): Promise<AxiosResponse> {
    return api.post(`places/pending`, {
      page: page,
      elementsOnPage: elementsOnPage,
    });
  }

  static async approvePlace(placeId: string): Promise<AxiosResponse> {
    return api.put(`places/${placeId}`);
  }

  static async deletePlace(placeId: string): Promise<AxiosResponse> {
    return api.delete(`places/${placeId}`);
  }

  static async getMyPlaces(
    page: number,
    elementsOnPage: number
  ): Promise<AxiosResponse> {
    return api.post(`places/my`, {
      page: page,
      elementsOnPage: elementsOnPage,
    });
  }

  static async createPlace(
    title: string,
    description: string
  ): Promise<AxiosResponse> {
    return api.post(`places/new`, {
      title: title,
      description: description,
    });
  }

  static async uploadPlacePhoto(
    placeId: string,
    file: File
  ): Promise<AxiosResponse> {
    const formData = new FormData();
    formData.append("file", file);
    return api.put(`files/places/${placeId}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  }
}
