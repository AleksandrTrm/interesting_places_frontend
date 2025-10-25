import type { TypeOfActivity } from "./TypeOfActivity";

export type Person = {
  id: string;
  name: string;
  surname: string;
  patronymic: string;
  dateOfBirth: Date;
  typeOfActivity: TypeOfActivity;
  photoLink: string;
  shortInfo: string;
};
