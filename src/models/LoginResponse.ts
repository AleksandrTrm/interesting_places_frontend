export type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  id: string;
  username: string;
  email: string;
  selectedAvatar: number;
  role: string;
};
