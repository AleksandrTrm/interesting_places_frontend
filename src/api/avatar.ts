import type { AxiosResponse } from "axios";
import type { User } from "../models/User";
import { api } from "./api";

export class AvatarService {
  static async changeAvatar(
    user: User,
    avatarIndex: number
  ): Promise<AxiosResponse> {
    return api.put(`users/${user.id}/avatar/${avatarIndex}`);
  }
}
