import type { Place } from "../../../models/Place";

export type GetPlacesResponse = {
  places: Place[];
  pageCount: number;
  totalCount: number;
  dateOfRequest: Date;
};
