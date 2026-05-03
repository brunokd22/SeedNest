export enum UserRole {
  MANAGER  = 'MANAGER',
  CUSTOMER = 'CUSTOMER',
  ADMIN    = 'ADMIN',
}

export type PublicUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  image: string | null;
  createdAt: Date;
};

export type AuthUser = PublicUser & {
  emailVerified: boolean;
};
