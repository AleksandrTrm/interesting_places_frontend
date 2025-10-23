import type { User } from "./User";

export type Place = {
  title: string;
  description: string;
  photoLink: string;
  author: User;
};
