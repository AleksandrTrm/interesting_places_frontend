import { api } from "./api";
import type { AxiosResponse } from "axios";

export class PersonsService {
  static async getPersons(
    page: number,
    elementsOnPage: number,
    queryWord: string
  ): Promise<AxiosResponse> {
    // src/api/persons.ts (предположительно)
    return api.post(`persons`, {
      page: page,
      elementsOnPage: elementsOnPage,
      queryWord: queryWord,
    });
  }
}

const imagePaths = [
  "/public/images/gallery/people.webp",
  "/public/images/gallery/teathre.webp",
  "/public/images/gallery/nature.jpg",
  "/public/images/gallery/city.webp",
];
