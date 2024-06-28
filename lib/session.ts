import { IronSessionOptions } from "iron-session";

export const enum UserType {
  Admin = 0,
  Teacher = 1,
  Student = 2,
}

export interface User {
  token: string;
  last_time_online: number;
  changed_password: boolean;
  phone_number: string;
  email: string;
  user_id: string;
  user_type: UserType;
  first_name: string;
  last_name: string;
}

declare module "iron-session" {
  interface IronSessionData {
    user?: User;
  }
}

export const iron_api_options: IronSessionOptions = {
  cookieName: "school_manager_session",
  password: process.env.COOKIE_PASSWORD ? process.env.COOKIE_PASSWORD : "admin",
  cookieOptions: {
    maxAge: 60 * 60 * 24 * 7,
    secure: process.env.NODE_ENV === "production",
  },
};
