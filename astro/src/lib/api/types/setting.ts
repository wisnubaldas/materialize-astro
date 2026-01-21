export type User = {
  id: number;
  username: string;
  email: string;
};

export type UserCreatePayload = {
  username: string;
  email: string;
  password: string;
};

export type UserUpdatePayload = {
  username?: string;
  email?: string;
};

export type UserPasswordPayload = {
  current_password?: string;
  new_password: string;
};

export type Role = {
  id: number;
  role_name: string;
  created_at?: string;
};

export type RoleCreatePayload = {
  role_name: string;
};

export type RoleUpdatePayload = {
  role_name?: string;
};

export type Menu = {
  id: number;
  name: string;
  url: string;
  icon: string;
  parent: number;
  role_id?: number | null;
  created_at?: string;
};

export type MenuTree = Menu & {
  subItems?: MenuTree[];
};

export type MenuCreatePayload = {
  name: string;
  url: string;
  icon?: string;
  parent?: number;
  role_id?: number | null;
};

export type MenuUpdatePayload = {
  name?: string;
  url?: string;
  icon?: string;
  parent?: number;
  role_id?: number | null;
};
