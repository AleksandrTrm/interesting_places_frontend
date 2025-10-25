import type { TypeOfActivity } from "../models/TypeOfActivity";
import { api } from "./api";
import type { AxiosResponse } from "axios";

export class TypesOfActivityService {
  static getTypeOfActivityById = async (
    id: string
  ): Promise<TypeOfActivity> => {
    try {
      const response: AxiosResponse<TypeOfActivity> = await api.get(
        `/activities/${id}`
      );
      return response.data;
    } catch (error) {
      console.error(
        `Ошибка при получении типа деятельности с ID ${id}:`,
        error
      );
      throw error;
    }
  };

  static getTypesOfActivity() {
    return api.get("activities");
  }
}
