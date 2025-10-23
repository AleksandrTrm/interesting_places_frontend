import { api, API_URL } from "./api";
import axios, { type AxiosResponse } from "axios";
import { type LoginResponse } from "../models/LoginResponse";

export class AccountService {
  static async login(
    email: string,
    password: string
  ): Promise<AxiosResponse<LoginResponse>> {
    return api.post<LoginResponse>("login", {
      email,
      password,
    });
  }

  static async register(
    username: string,
    email: string,
    password: string
  ): Promise<AxiosResponse<LoginResponse>> {
    return api.post<LoginResponse>("register", {
      username,
      email,
      password,
    });
  }

  static async refresh() {
    return axios.get<LoginResponse>(API_URL + "refresh", {
      withCredentials: true,
    });
  }
}
