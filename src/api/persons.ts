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

  static async createPerson(personData: {
    name: string;
    surname: string;
    patronymic: string;
    dateOfBirth: string;
    typeOfActivity: string;
    shortInfo: string;
  }): Promise<AxiosResponse> {
    return api.post(`persons/new`, personData);
  }
}
