export interface LoginResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface MeResponse {
  id: number;
  name: string;
  roles: string[];
}
