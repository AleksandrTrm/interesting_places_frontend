import type { User } from "./User";

export type Place = {
  id: string;
  title: string;
  description: string;
  photoLink: string;
  author: User;
};
